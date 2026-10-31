import { Entity, Property, OneToMany } from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntitiy.js";
import { User } from "./User.js";

@Entity()
export class Organization extends BaseEntity {
  @Property({ type: "string", length: 200 })
  name!: string;

  @Property({ type: "string", unique: true, length: 50 })
  code!: string;

  @Property({ type: "bool", default: true })
  isActive = true;

  @OneToMany(() => User, (user) => user.organization)
  users = new Collection<User>(this);
}
