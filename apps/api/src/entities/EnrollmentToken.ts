import { Entity, ManyToOne, Property } from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity.js";
import { User } from "./User.js";

@Entity()
export class EnrollmentToken extends BaseEntity {
  @ManyToOne(() => User)
  user!: User;

  @Property({ type: "string", unique: true })
  tokenHash!: string;

  @Property({ type: "timestamptz" })
  expiresAt!: Date;

  @Property({ type: "timestamptz", nullable: true })
  usedAt?: Date;
}
