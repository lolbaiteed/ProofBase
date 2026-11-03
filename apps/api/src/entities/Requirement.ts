import {
  Entity,
  Property,
  ManyToOne,
  Enum,
  OneToMany,
} from "@mikro-orm/decorators/legacy";
import { FrameworkVersion } from "./FrameworkVersion.js";
import { Collection } from "@mikro-orm/core";
import { Assessment } from "./Assessment.js";
import { BaseEntity } from "./BaseEntity.js";
import { RequirementType } from "@ProofBase/shared/enums.js";

@Entity()
export class Requirement extends BaseEntity {
  @ManyToOne(() => FrameworkVersion)
  frameworkVersion!: FrameworkVersion;

  @Property({ type: "string" })
  code!: string;

  @Property({ type: "string" })
  title!: string;

  @Property({ type: "string", nullable: true })
  description?: string;

  @Enum(() => RequirementType)
  type!: RequirementType;

  @ManyToOne(() => Requirement, { nullable: true })
  parent?: Requirement;

  @OneToMany(() => Requirement, (requirement) => requirement.parent)
  children = new Collection<Requirement>(this);

  @OneToMany(() => Assessment, (assessment) => assessment.requirement)
  assessment = new Collection<Assessment>(this);
}
