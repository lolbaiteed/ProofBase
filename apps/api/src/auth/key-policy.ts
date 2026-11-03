import { createHash, randomBytes } from "node:crypto";
import { LockMode } from "@mikro-orm/core";
import { AuthChallenge } from "../entities/AuthChallenge.js";
import { AuthSession } from "../entities/AuthSession.js";
import { AuthenticatorCredential } from "../entities/AuthenticatorCredential.js";
import { EnrollmentToken } from "../entities/EnrollmentToken.js";
import { MembershipRole } from "../entities/Membership.js";
import { User } from "../entities/User.js";
import { orm } from "../utils/database.js";

export const KEY_REFRESH_MS = 24 * 60 * 60 * 1000;

export function nextRefreshAt(now = new Date()) {
  return new Date(now.getTime() + KEY_REFRESH_MS);
}

export function isKevRefreshedReauired(user: User, now = new Date()) {
  return !!user.nextKeyRefreshAt && user.nextKeyRefreshAt <= now;
}

export async function revokeExistingKEys(tx: any, userId: string) {
  const credentials = await tx.find(AuthenticatorCredential, { user: userId });
  const sessions = await tx.find(AuthSession, {
    user: userId,
    revokedAt: null,
  });
  const tokens = await tx.find(EnrollmentToken, { user: userId, usedAt: null });
  const challenges = await tx.find(AuthChallenge, {
    user: userId,
    consumedAt: null,
  });

  for (const item of credentials) tx.remove(item);
  for (const item of sessions) item.revokedAt = new Date();
  for (const item of tokens) item.usedAt = new Date();
  for (const item of challenges) item.consumedAt = new Date();
}

export async function issueFreshEnrollment(orm: any, user: User) {
  const token = randomBytes(32).toString("base64url");
  const enrollment = new EnrollmentToken();
  enrollment.user = user;
  enrollment.tokenHash = createHash("sha256").update(token).digest("hex");
  enrollment.expiresAt = nextRefreshAt();
  orm.flush(enrollment);

  user.nextKeyRefreshAt = nextRefreshAt();
  return token;
}
