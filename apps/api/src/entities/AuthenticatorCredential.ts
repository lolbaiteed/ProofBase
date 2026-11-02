import { Entity, ManyToOne, Property } from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity.js";
import { User } from "./User.js";

@Entity()
export class AuthenticatorCredential extends BaseEntity {
  @ManyToOne(() => User)
  user!: User;

  @Property({ type: "string", unique: true })
  credentialId!: string;

  @Property({ type: "text" })
  publicKey!: string;

  @Property({ type: "number" })
  counter = 0;

  @Property({ type: "json", nullable: true })
  transports?: string[];
}
