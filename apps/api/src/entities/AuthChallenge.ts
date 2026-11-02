import { Entity, Enum, ManyToOne, Property } from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity.js";
import { User } from "./User.js";
import { EnrollmentToken } from "./EnrollmentToken.js";

export enum AuthChallengeType {
  Login = "login",
  Enrollment = "enrollment",
}

@Entity()
export class AuthChallenge extends BaseEntity {
  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => EnrollmentToken, { nullable: true })
  enrollmentToken?: EnrollmentToken;

  @Enum(() => AuthChallengeType)
  type!: AuthChallengeType;

  @Property({ type: "string" })
  challenge!: string;

  @Property({ type: "text", nullable: true })
  pendingPasswordHash?: string;

  @Property({ type: "timestamptz" })
  expiresAt!: Date;

  @Property({ type: "timestamptz", nullable: true })
  consumedAt?: Date;
}
