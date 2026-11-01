import { BaseEntity } from "@mikro-orm/core";
import {
  Entity,
  Enum,
  ManyToOne,
  Property,
} from "@mikro-orm/decorators/legacy";
import { Organization } from "./Organization.js";
import { User } from "./User.js";

export enum MembershipRole {
  Owner = "owner",
  Admin = "admin",
  Auditor = "auditor",
  Contributor = "contributor",
  Viewer = "viewer",
}

export enum MembershipStatus {
  Active = "active",
  Invited = "invited",
}

@Entity()
export class Membership extends BaseEntity {
  @ManyToOne(() => Organization)
  organization!: Organization;

  @ManyToOne(() => User)
  user!: User;

  @Enum(() => MembershipRole)
  role!: MembershipRole;

  @Enum(() => MembershipStatus)
  status!: MembershipStatus;

  @Property({ type: "date" })
  joinedAt?: Date;
}
