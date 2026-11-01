import {
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
  ManyToOne,
} from "@mikro-orm/decorators/legacy";
import { Framework } from "./Framework.js";
import { Requirement } from "./Requirement.js";
import { Collection } from "@mikro-orm/core";

@Entity()
export class FrameworkVersion {
  @PrimaryKey({ type: "integer" })
  id!: number;

  @Property({ type: "string" })
  version!: string;

  @ManyToOne(() => Framework)
  framework!: Framework;

  @Property({ type: "date" })
  publishedAt!: Date;

  @OneToMany(() => Requirement, (requirement) => requirement.frameworkVersion)
  requirenments = new Collection<Requirement>(this);
}
