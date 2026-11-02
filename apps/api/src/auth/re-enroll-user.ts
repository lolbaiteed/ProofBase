import { createHash, randomBytes } from "node:crypto";
import { LockMode } from "@mikro-orm/core";
import { AuthChallenge } from "../entities/AuthChallenge.js";
import { AuthSession } from "../entities/AuthSession.js";
import { AuthenticatorCredential } from "../entities/AuthenticatorCredential.js";
import { EnrollmentToken } from "../entities/EnrollmentToken.js";
import { User } from "../entities/User.js";
import { orm } from "../utils/database.js";

const emailArg = process.argv[2];
if (!emailArg) {
  console.error("Usage: npm run auth:re-enroll -w @ProofBase/api -- <email>");
  process.exitCode = 1;
} else {
  const em = orm.em.fork();
  try {
    const user = await em.findOne(User, { email: emailArg.trim().toLowerCase() });
    if (!user) throw new Error("User not found");

    const token = randomBytes(32).toString("base64url");
    await em.transactional(async (tx) => {
      const lockedUser = await tx.findOne(User, { id: user.id }, { lockMode: LockMode.PESSIMISTIC_WRITE });
      if (!lockedUser) throw new Error("User not found");

      const credentials = await tx.find(AuthenticatorCredential, { user: lockedUser.id });
      const sessions = await tx.find(AuthSession, { user: lockedUser.id, revokedAt: null });
      const tokens = await tx.find(EnrollmentToken, { user: lockedUser.id, usedAt: null });
      const challenges = await tx.find(AuthChallenge, { user: lockedUser.id, consumedAt: null });
      const now = new Date();

      tx.remove(credentials);
      for (const session of sessions) session.revokedAt = now;
      for (const enrollment of tokens) enrollment.usedAt = now;
      for (const challenge of challenges) challenge.consumedAt = now;

      const replacement = new EnrollmentToken();
      replacement.user = lockedUser;
      replacement.tokenHash = createHash("sha256").update(token).digest("hex");
      replacement.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      tx.persist(replacement);
    });

    console.log(`Revoked existing credentials and sessions for ${user.email}.`);
    console.log(`One-time enrollment token (expires in 24 hours): ${token}`);
    console.log("Deliver this token securely. The user must set a new password and register a USB FIDO2 security key.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Account recovery failed");
    process.exitCode = 1;
  } finally {
    await orm.close(true);
  }
}
