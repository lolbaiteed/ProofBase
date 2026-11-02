import {
  Entity,
  Property,
  OneToOne,
  ManyToOne,
} from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity.js";
import { Person } from "./Person.js";
import { Organization } from "./Organization.js";

@Entity({ tableName: "app_user" })
export class User extends BaseEntity {
  @Property({ type: "string", unique: true })
  email!: string;

  @Property({ type: "string" })
  passwordHash!: string;

  @OneToOne(() => Person)
  person!: Person;

  @ManyToOne(() => Organization)
  organization!: Organization;
}
