import {
  Entity,
  Property,
  OneToMany,
  ManyToOne,
  Enum,
} from "@mikro-orm/decorators/legacy";
import { Organization } from "./Organization.js";
import { FrameworkVersion } from "./FrameworkVersion.js";
import { User } from "./User.js";
import { BaseEntity } from "./BaseEntity.js";
import { AuditScope } from "./AuditScope.js";
import { Assessment } from "./Assessment.js";
import { Collection } from "@mikro-orm/core";

export enum AuditStatus {
  Draft = "draft",
  InProgress = "in_progress",
  UnderReview = "under_review",
  Completed = "completed",
}

export enum AuditType {
  Internal = "internal",
  External = "external",
  Other = "other",
}

@Entity()
export class Audit extends BaseEntity {
  @ManyToOne(() => Organization)
  organization!: Organization;

  @ManyToOne(() => FrameworkVersion)
  frameworkVersion!: FrameworkVersion;

  @Property({ type: "string" })
  name!: string;

  @Enum(() => AuditStatus)
  status!: AuditStatus;

  @Property({ type: "string", nullable: true })
  notes?: string;

  @Enum(() => AuditType)
  auditType!: AuditType;

  @Property({ type: "date" })
  startDate!: Date;

  @Property({ type: "date" })
  dueDate!: Date;

  @ManyToOne(() => User)
  leadAuditor!: User;

  @OneToMany(() => AuditScope, (auditScope) => auditScope.audit)
  scopes = new Collection<AuditScope>(this);

  @OneToMany(() => Assessment, (assessment) => assessment.audit)
  assessment = new Collection<Assessment>(this);
}
