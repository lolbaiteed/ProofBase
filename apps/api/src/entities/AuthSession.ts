import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { User } from "./User.js";

@Entity()
export class AuthSession {
  @PrimaryKey({ type: "uuid" })
  id = crypto.randomUUID();

  @ManyToOne(() => User, { nullable: true })
  user?: User;

  @Property({ type: "string", unique: true, nullable: true })
  tokenHash?: string;

  @Property({ type: "timestamptz", nullable: true })
  expiresAt?: Date;

  @Property({ type: "timestamptz", nullable: true })
  revokedAt?: Date;
}
