import { Entity, Property, OneToMany } from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity.js";
import { User } from "./User.js";
import { Collection } from "@mikro-orm/core";
import { Membership } from "./Membership.js";

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

  @OneToMany(() => Membership, (membership) => membership.organization)
  memberships = new Collection<Membership>(this);
}
