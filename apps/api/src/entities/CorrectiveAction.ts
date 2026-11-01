import { BaseEntity } from "@mikro-orm/core";
import {
  Entity,
  ManyToOne,
  Property,
  Enum,
} from "@mikro-orm/decorators/legacy";
import { Finding } from "./Finding.js";
import { User } from "./User.js";

export enum CorrectiveActionStatus {
  Open = "open",
  InProgress = "in_progress",
  Completed = "completed",
  Cancelled = "cancelled",
}

@Entity()
export class CorrectiveAction extends BaseEntity {
  @ManyToOne(() => Finding)
  finding!: Finding;

  @Property({ type: "text" })
  description!: string;

  @ManyToOne(() => User)
  owner?: User;

  @Property({ type: "date", nullable: true })
  dueDate?: Date;

  @Enum(() => CorrectiveActionStatus)
  status!: CorrectiveActionStatus;

  @Property({ type: "date" })
  completedAt?: Date;

  @Property({ type: "text" })
  resolutionNotes?: string;
}
