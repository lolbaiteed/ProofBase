import {
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
} from "@mikro-orm/decorators/legacy";
import { FrameworkVersion } from "./FrameworkVersion.js";

@Entity()
export class Framework {
  @PrimaryKey({ type: "integer" })
  id!: number;

  @Property({ type: "string" })
  code!: string;

  @Property({ type: "string" })
  name!: string;

  @Property({ type: "string", nullable: true })
  description?: string;

  @OneToMany(
    () => FrameworkVersion,
    (frameworkVersion) => frameworkVersion.version,
  )
  version!: FrameworkVersion;
}
