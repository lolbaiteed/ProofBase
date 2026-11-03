import { Collection } from "@mikro-orm/core";
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
import { BaseEntity } from "./BaseEntity.js";
import { FindingSeverity, FindingStatus } from "@ProofBase/shared/enums.js";

@Entity()
export class Finding extends BaseEntity {
  @Enum(() => FindingSeverity)
  severity!: FindingSeverity;

  @Enum(() => FindingStatus)
  status!: FindingStatus;

  @Property({ type: "date" })
  identifiedAt!: Date;

  @Property({ type: "date", nullable: true })
  closedAt?: Date;

  @ManyToOne(() => User, { nullable: true })
  assignedTo?: User;

  @OneToMany(() => CorrectiveAction, (action) => action.finding)
  correctiveActions = new Collection<CorrectiveAction>(this);

  @ManyToOne(() => Assessment)
  assessment!: Assessment;

  @Property({ type: "string" })
  title!: string;

  @Property({ type: "text", nullable: true })
  description?: string;
}
