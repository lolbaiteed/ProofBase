import {
  Entity,
  Enum,
  ManyToOne,
  Property,
} from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity.js";
import { Requirement } from "./Requirement.js";
import { User } from "./User.js";
import { Organization } from "./Organization.js";
import { ImplementationStatus } from "@ProofBase/shared/enums.js";

@Entity()
export class SoAEntry extends BaseEntity {
  @ManyToOne(() => Requirement)
  requirement!: Requirement;

  @Property({ type: "boolean" })
  isApplicable!: boolean;

  @Property({ type: "text" })
  justification!: string;

  @Enum(() => ImplementationStatus)
  implementationStatus!: ImplementationStatus;

  @ManyToOne(() => User, { nullable: true })
  controlOwner?: User;

  @Property({ type: "date", nullable: true })
  reviewedAt?: Date;

  @ManyToOne(() => Organization)
  organization!: Organization;
}
