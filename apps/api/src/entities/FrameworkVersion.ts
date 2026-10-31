import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  ManyToMany,
} from "@mikro-orm/decorators/legacy";
import { Framework } from "./Framework.js";

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

  @ManyToMany(() => Requirenments)
  requirenments!: Requirenments;
}
