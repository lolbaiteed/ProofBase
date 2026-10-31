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
export class Audit {
  @ManyToOne(() => Organization)
  organization!: Organization;

  @ManyToOne(() => FrameworkVersion)
  frameworkVersion!: FrameworkVersion;

  @Property({ type: "string" })
  name!: string;

  @Enum(() => AuditStatus)
  status!: AuditStatus.Draft;

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

  @OneToMany(() => AuditScope, (auditScope) => auditScope)
  scopes!: AuditScope;

  @OneToMany(() => Asessment, (assessment) => assessment)
  assessment!: Assessment;
}
