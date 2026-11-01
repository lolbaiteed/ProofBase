import { BaseEntity, JsonType } from "@mikro-orm/core";
import {
  Entity,
  Enum,
  ManyToOne,
  Property,
} from "@mikro-orm/decorators/legacy";
import { Organization } from "./Organization.js";
import { Audit } from "./Audit.js";
import { User } from "./User.js";
import { UUID } from "crypto";

export enum ActivityAction {
  EvidanceUploaded = "evidance_uploaded",
  AssessmentUpdated = "assessment_updated",
  FindindCreated = "finding_created",
}

@Entity()
export class Activity extends BaseEntity {
  @ManyToOne(() => Organization)
  organization!: Organization;

  @ManyToOne(() => Audit)
  audit?: Audit;

  @ManyToOne(() => User)
  actor?: User;

  @Enum(() => ActivityAction)
  action!: ActivityAction;

  @Property({ type: "string" })
  entityType!: string;

  @Property({ type: "uuid" })
  entityId!: UUID;

  @Property({ type: "json", nullable: true })
  metadata?: JsonType;
}
