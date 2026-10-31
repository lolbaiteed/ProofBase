import { PrimaryKey, Property } from "@mikro-orm/decorators/legacy";

export abstract class BaseEntity {
  @PrimaryKey({ type: "uuid" })
  id = crypto.randomUUID();

  @Property({ type: "date" })
  createdAt = new Date();

  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt = new Date();
}
