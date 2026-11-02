import { randomBytes, createHash } from "node:crypto";
import { EnrollmentToken } from "../entities/EnrollmentToken.js";
import { Membership, MembershipRole, MembershipStatus } from "../entities/Membership.js";
import { Organization } from "../entities/Organization.js";
import { Person } from "../entities/Person.js";
import { User } from "../entities/User.js";
import { orm } from "../utils/database.js";

const [emailArg, firstName, lastName, organizationName, organizationCode] = process.argv.slice(2);

if (!emailArg || !firstName || !lastName || !organizationName || !organizationCode) {
  console.error("Usage: npm run auth:provision -w @ProofBase/api -- <email> <first-name> <last-name> <organization-name> <organization-code>");
  process.exitCode = 1;
} else {
  const em = orm.em.fork();
  try {
    const email = emailArg.trim().toLowerCase();
    const existingUser = await em.findOne(User, { email });
    const existingOrganization = await em.findOne(Organization, { code: organizationCode });
    if (existingUser || existingOrganization) {
      throw new Error("Email or organization code already exists");
    }

    const organization = new Organization();
    organization.name = organizationName;
    organization.code = organizationCode;

    const person = new Person();
    person.firstName = firstName;
    person.lastName = lastName;

    const user = new User();
    user.email = email;
    user.passwordHash = "!setup-required!";
    user.person = person;
    user.organization = organization;

    const membership = new Membership();
    membership.organization = organization;
    membership.user = user;
    membership.role = MembershipRole.Owner;
    membership.status = MembershipStatus.Active;

    const token = randomBytes(32).toString("base64url");
    const enrollment = new EnrollmentToken();
    enrollment.user = user;
    enrollment.tokenHash = createHash("sha256").update(token).digest("hex");
    enrollment.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await em.transactional(async (tx) => {
      tx.persist([organization, person, user, membership, enrollment]);
    });

    console.log(`Provisioned ${email} for ${organization.name}.`);
    console.log(`One-time enrollment token (expires in 24 hours): ${token}`);
    console.log("Deliver this token securely. The user must enroll a USB FIDO2 security key before login.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Account provisioning failed");
    process.exitCode = 1;
  } finally {
    await orm.close(true);
  }
}
