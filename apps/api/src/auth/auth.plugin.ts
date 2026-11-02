import rateLimit from "@fastify/rate-limit";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticatorTransport,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { createHash, randomBytes } from "node:crypto";
import { LockMode } from "@mikro-orm/core";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { AuthChallenge, AuthChallengeType } from "../entities/AuthChallenge.js";
import { AuthSession } from "../entities/AuthSession.js";
import { AuthenticatorCredential } from "../entities/AuthenticatorCredential.js";
import { EnrollmentToken } from "../entities/EnrollmentToken.js";
import { Membership, MembershipStatus } from "../entities/Membership.js";
import { User } from "../entities/User.js";
import { getAuthConfig } from "./auth.config.js";
import { hashPassword, verifyPassword } from "./password.js";
import { orm } from "../utils/database.js";

const emailSchema = z.email();
const passwordSchema = z.string().min(12).max(128);
const responseSchema = z.object({
  id: z.string().min(1),
  rawId: z.string().min(1),
  type: z.literal("public-key"),
  response: z.record(z.string(), z.unknown()),
  clientExtensionResults: z.record(z.string(), z.unknown()).optional(),
  authenticatorAttachment: z.string().nullable().optional(),
});
const setupOptionsSchema = z.object({
  email: emailSchema,
  token: z.string().min(32).max(256),
  password: passwordSchema,
});
const setupVerifySchema = z.object({
  challengeId: z.uuid(),
  response: responseSchema,
});
const loginOptionsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
const loginVerifySchema = z.object({
  challengeId: z.uuid(),
  response: responseSchema,
});

const challengeLifetimeMs = 5 * 60 * 1000;
const dummyPasswordHash = hashPassword(randomBytes(32).toString("base64url"));
type AuthenticatedSession = AuthSession & { user: User };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function challengeExpiry(): Date {
  return new Date(Date.now() + challengeLifetimeMs);
}

function setSessionCookie(
  reply: FastifyReply,
  token: string,
  secure: boolean,
  maxAge: number,
): void {
  const auth = getAuthConfig();
  reply.setCookie(auth.cookieName, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

function isAllowedOrigin(request: FastifyRequest): boolean {
  return request.headers.origin === getAuthConfig().origin;
}

function originGuard(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (error?: Error) => void,
): void {
  if (!isAllowedOrigin(request)) {
    void reply.code(403).send({ error: "Forbidden" });
    return;
  }
  done();
}

async function getSession(
  request: FastifyRequest,
): Promise<AuthenticatedSession | null> {
  const auth = getAuthConfig();
  const token = request.cookies?.[auth.cookieName];
  if (!token) return null;

  const session = await orm.em.findOne(
    AuthSession,
    {
      tokenHash: hashToken(token),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { populate: ["user", "user.person", "user.organization"] },
  );
  if (!session?.user || !session.user.person || !session.user.organization)
    return null;
  return session as AuthenticatedSession;
}

export async function getAuthenticatedUser(
  request: FastifyRequest,
): Promise<User | null> {
  const session = await getSession(request);
  return session?.user ?? null;
}

export const authPlugin: FastifyPluginAsync = async (app) => {
  const auth = getAuthConfig();
  const secureCookie = process.env.NODE_ENV === "production";

  await app.register(rateLimit, { global: false });

  app.post(
    "/auth/setup/options",
    {
      preHandler: originGuard,
      config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
    },
    async (request, reply) => {
      const parsed = setupOptionsSchema.safeParse(request.body);
      if (!parsed.success)
        return reply.code(400).send({ error: "Invalid setup request" });

      const em = orm.em;
      const email = parsed.data.email.trim().toLowerCase();
      const enrollment = await em.findOne(
        EnrollmentToken,
        {
          tokenHash: hashToken(parsed.data.token),
          usedAt: null,
          expiresAt: { $gt: new Date() },
        },
        { populate: ["user", "user.person"] },
      );
      if (!enrollment || enrollment.user.email !== email) {
        return reply
          .code(401)
          .send({ error: "Enrollment could not be verified" });
      }

      const existing = await em.find(AuthenticatorCredential, {
        user: enrollment.user.id,
      });
      const options = await generateRegistrationOptions({
        rpName: "ProofBase",
        rpID: auth.rpId,
        userID: Buffer.from(enrollment.user.id, "utf8"),
        userName: enrollment.user.email,
        userDisplayName: `${enrollment.user.person.firstName} ${enrollment.user.person.lastName}`,
        attestationType: "none",
        preferredAuthenticatorType: "securityKey",
        authenticatorSelection: {
          authenticatorAttachment: "cross-platform",
          residentKey: "discouraged",
          userVerification: "required",
        },
        excludeCredentials: existing.map((credential) => ({
          id: credential.credentialId,
        })),
        timeout: 60_000,
      });

      const challenge = new AuthChallenge();
      challenge.user = enrollment.user;
      challenge.enrollmentToken = enrollment;
      challenge.type = AuthChallengeType.Enrollment;
      challenge.challenge = options.challenge;
      challenge.expiresAt = challengeExpiry();
      challenge.pendingPasswordHash = await hashPassword(parsed.data.password);
      em.persist(challenge);
      await em.flush();

      return reply.send({ challengeId: challenge.id, options });
    },
  );

  app.post(
    "/auth/setup/verify",
    {
      preHandler: originGuard,
      config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
    },
    async (request, reply) => {
      const parsed = setupVerifySchema.safeParse(request.body);
      if (!parsed.success)
        return reply.code(400).send({ error: "Invalid setup response" });
      if (parsed.data.response.authenticatorAttachment !== "cross-platform") {
        return reply
          .code(400)
          .send({ error: "A USB security key is required" });
      }

      const em = orm.em;
      const challenge = await em.findOne(
        AuthChallenge,
        {
          id: parsed.data.challengeId as AuthChallenge["id"],
          type: AuthChallengeType.Enrollment,
          consumedAt: null,
          expiresAt: { $gt: new Date() },
        },
        { populate: ["user", "enrollmentToken"] },
      );
      if (
        !challenge ||
        !challenge.enrollmentToken ||
        !challenge.pendingPasswordHash
      ) {
        return reply
          .code(401)
          .send({ error: "Enrollment could not be verified" });
      }

      try {
        const verification = await verifyRegistrationResponse({
          response: parsed.data.response as unknown as RegistrationResponseJSON,
          expectedChallenge: challenge.challenge,
          expectedOrigin: auth.origin,
          expectedRPID: auth.rpId,
          requireUserVerification: true,
        });
        if (!verification.verified || !verification.registrationInfo) {
          return reply
            .code(401)
            .send({ error: "Security key verification failed" });
        }

        const { credential } = verification.registrationInfo;
        await em.transactional(async (tx) => {
          const lockedChallenge = await tx.findOne(
            AuthChallenge,
            {
              id: challenge.id,
              type: AuthChallengeType.Enrollment,
              consumedAt: null,
              expiresAt: { $gt: new Date() },
            },
            {
              lockMode: LockMode.PESSIMISTIC_WRITE,
              populate: ["user", "enrollmentToken"],
            },
          );
          if (
            !lockedChallenge?.enrollmentToken ||
            !lockedChallenge.pendingPasswordHash
          ) {
            throw new Error("Enrollment already consumed");
          }
          const lockedToken = await tx.findOne(
            EnrollmentToken,
            {
              id: lockedChallenge.enrollmentToken.id,
              usedAt: null,
              expiresAt: { $gt: new Date() },
            },
            { lockMode: LockMode.PESSIMISTIC_WRITE },
          );
          if (!lockedToken || lockedToken.user.id !== lockedChallenge.user.id) {
            throw new Error("Enrollment token already consumed or expired");
          }

          const existingCredential = await tx.findOne(AuthenticatorCredential, {
            credentialId: credential.id,
          });
          if (existingCredential)
            throw new Error("Security key already registered");

          const storedCredential = new AuthenticatorCredential();
          storedCredential.user = lockedChallenge.user;
          storedCredential.credentialId = credential.id;
          storedCredential.publicKey = Buffer.from(
            credential.publicKey,
          ).toString("base64url");
          storedCredential.counter = credential.counter;
          storedCredential.transports = credential.transports;
          lockedChallenge.user.passwordHash =
            lockedChallenge.pendingPasswordHash;
          lockedChallenge.consumedAt = new Date();
          lockedToken.usedAt = new Date();
          tx.persist(storedCredential);
        });

        return reply.send({ status: "ok" });
      } catch (error) {
        request.log.warn({ err: error }, "Security key enrollment failed");
        return reply
          .code(401)
          .send({ error: "Security key verification failed" });
      }
    },
  );

  app.post(
    "/auth/login/options",
    {
      preHandler: originGuard,
      config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
    },
    async (request, reply) => {
      const parsed = loginOptionsSchema.safeParse(request.body);
      if (!parsed.success)
        return reply.code(400).send({ error: "Invalid login request" });

      const email = parsed.data.email.trim().toLowerCase();
      const user = await orm.em.findOne(User, { email });
      const passwordHash = user?.passwordHash ?? (await dummyPasswordHash);
      const passwordValid = await verifyPassword(
        parsed.data.password,
        passwordHash,
      );
      const credentials = user
        ? await orm.em.find(AuthenticatorCredential, { user: user.id })
        : [];

      if (!user || !passwordValid || credentials.length === 0) {
        return reply.code(401).send({
          error: "Invalid email or password, or no security key is enrolled",
        });
      }

      const options = await generateAuthenticationOptions({
        rpID: auth.rpId,
        allowCredentials: credentials.map((credential) => ({
          id: credential.credentialId,
          transports: credential.transports as
            AuthenticatorTransport[] | undefined,
        })),
        userVerification: "required",
        timeout: 60_000,
      });
      const challenge = new AuthChallenge();
      challenge.user = user;
      challenge.type = AuthChallengeType.Login;
      challenge.challenge = options.challenge;
      challenge.expiresAt = challengeExpiry();
      orm.em.persist(challenge);
      await orm.em.flush();

      return reply.send({ challengeId: challenge.id, options });
    },
  );

  app.post(
    "/auth/login/verify",
    {
      preHandler: originGuard,
      config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
    },
    async (request, reply) => {
      const parsed = loginVerifySchema.safeParse(request.body);
      if (!parsed.success)
        return reply.code(400).send({ error: "Invalid login response" });

      const em = orm.em;
      const challenge = await em.findOne(
        AuthChallenge,
        {
          id: parsed.data.challengeId as AuthChallenge["id"],
          type: AuthChallengeType.Login,
          consumedAt: null,
          expiresAt: { $gt: new Date() },
        },
        { populate: ["user"] },
      );
      if (!challenge)
        return reply
          .code(401)
          .send({ error: "Security key verification failed" });

      const credential = await em.findOne(AuthenticatorCredential, {
        credentialId: parsed.data.response.id,
        user: challenge.user.id,
      });
      if (!credential)
        return reply
          .code(401)
          .send({ error: "Security key verification failed" });

      const token = randomBytes(32).toString("base64url");
      const expiresAt = new Date(
        Date.now() + auth.sessionDays * 24 * 60 * 60 * 1000,
      );

      try {
        await em.transactional(async (tx) => {
          const lockedChallenge = await tx.findOne(
            AuthChallenge,
            {
              id: challenge.id,
              type: AuthChallengeType.Login,
              consumedAt: null,
              expiresAt: { $gt: new Date() },
            },
            { lockMode: LockMode.PESSIMISTIC_WRITE, populate: ["user"] },
          );
          const lockedCredential = await tx.findOne(
            AuthenticatorCredential,
            {
              id: credential.id,
              user: challenge.user.id,
            },
            { lockMode: LockMode.PESSIMISTIC_WRITE },
          );
          if (!lockedChallenge || !lockedCredential)
            throw new Error("Challenge expired or consumed");

          const verification = await verifyAuthenticationResponse({
            response: parsed.data
              .response as unknown as AuthenticationResponseJSON,
            expectedChallenge: lockedChallenge.challenge,
            expectedOrigin: auth.origin,
            expectedRPID: auth.rpId,
            credential: {
              id: lockedCredential.credentialId,
              publicKey: Buffer.from(lockedCredential.publicKey, "base64url"),
              counter: lockedCredential.counter,
              transports: lockedCredential.transports as
                AuthenticatorTransport[] | undefined,
            },
            requireUserVerification: true,
          });
          if (!verification.verified)
            throw new Error("Assertion verification failed");

          lockedCredential.counter = verification.authenticationInfo.newCounter;
          lockedChallenge.consumedAt = new Date();
          const session = new AuthSession();
          session.user = lockedChallenge.user;
          session.tokenHash = hashToken(token);
          session.expiresAt = expiresAt;
          tx.persist(session);
        });
      } catch (error) {
        request.log.warn({ err: error }, "Security key login failed");
        return reply
          .code(401)
          .send({ error: "Security key verification failed" });
      }

      setSessionCookie(
        reply,
        token,
        secureCookie,
        auth.sessionDays * 24 * 60 * 60,
      );
      return reply.send({ status: "ok" });
    },
  );

  app.get("/auth/me", async (request, reply) => {
    const session = await getSession(request);
    if (!session) return reply.code(401).send({ error: "Unauthenticated" });

    const membership = await orm.em.findOne(Membership, {
      user: session.user.id,
      organization: session.user.organization.id,
      status: MembershipStatus.Active,
    });

    return reply.send({
      user: {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.person.firstName,
        lastName: session.user.person.lastName,
        organizationId: session.user.organization.id,
        role: membership?.role ?? null,
      },
    });
  });

  app.post(
    "/auth/logout",
    { preHandler: originGuard },
    async (request, reply) => {
      const session = await getSession(request);
      if (session && !session.revokedAt) {
        session.revokedAt = new Date();
        await orm.em.flush();
      }
      reply.clearCookie(auth.cookieName, {
        path: "/",
        sameSite: "lax",
        secure: secureCookie,
        httpOnly: true,
      });
      return reply.send({ status: "ok" });
    },
  );
};
