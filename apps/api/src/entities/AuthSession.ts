import { Entity, PrimaryKey } from "@mikro-orm/decorators/legacy";

@Entity()
export class AuthSession {
  @PrimaryKey({ type: "uuid" })
  id = crypto.randomUUID();
}
