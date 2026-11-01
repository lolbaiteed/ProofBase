import { BaseEntity, Collection } from "@mikro-orm/core";
import {
  Entity,
  Property,
  Enum,
  ManyToOne,
  OneToMany,
} from "@mikro-orm/decorators/legacy";
import { User } from "./User.js";
import { CorrectiveAction } from "./CorrectiveAction.js";
import { Assessment } from "./Assessment.js";

export enum FindingSeverity {
  Low = "low",
  Medium = "medium",
  High = "high",
  Critical = "critical",
}

export enum FindingStatus {
  Open = "open",
  InProgress = "in_progress",
  Resolved = "resolved",
  Accepted = "accepted",
}

@Entity()
export class Finding extends BaseEntity {
  @Enum(() => FindingSeverity)
  severity!: FindingSeverity;

  @Enum(() => FindingStatus)
  status!: FindingStatus;

  @Property({ type: "date" })
  identifiedAt!: Date;

  @Property({ type: "date" })
  closedAt?: Date;

  @ManyToOne(() => User)
  assignedTo?: User;

  @OneToMany(() => CorrectiveAction, (action) => action.finding)
  correctiveActions = new Collection<CorrectiveAction>(this);

  @ManyToOne(() => Assessment)
  assessment!: Assessment;

  @Property({ type: "string" })
  title!: string;

  @Property({ type: "text" })
  description?: string;
}
