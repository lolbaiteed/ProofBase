import {
  Entity,
  Property,
  Enum,
  ManyToOne,
  OneToMany,
} from "@mikro-orm/decorators/legacy";
import { User } from "./User.js";
import { BaseEntity } from "./BaseEntity.js";
import { Audit } from "./Audit.js";
import { Requirement } from "./Requirement.js";
import { Finding } from "./Finding.js";
import { Collection } from "@mikro-orm/core";
import { AssessmentStatus } from "@ProofBase/shared/enums.js";

@Entity()
export class Assessment extends BaseEntity {
  @Enum(() => AssessmentStatus)
  status!: AssessmentStatus;

  @Property({ type: "text", nullable: true })
  notes?: string;

  @ManyToOne(() => User, { nullable: true })
  accessor?: User;

  @ManyToOne(() => User, { nullable: true })
  reviewer?: User;

  @Property({ type: "date", nullable: true })
  reviewedAt?: Date;

  @ManyToOne(() => Audit)
  audit!: Audit;

  @ManyToOne(() => Requirement)
  requirement!: Requirement;

  @OneToMany(() => Finding, (finding) => finding.assessment)
  findings = new Collection<Finding>(this);
}
