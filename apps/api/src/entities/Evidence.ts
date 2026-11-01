import { Entity, ManyToOne, Property } from "@mikro-orm/decorators/legacy";
import { BaseEntity } from "./BaseEntity.js";
import { Assessment } from "./Assessment.js";
import { User } from "./User.js";

@Entity()
export class Evidence extends BaseEntity {
  @ManyToOne(() => Assessment)
  assessment!: Assessment;

  @ManyToOne(() => User)
  uploadedBy!: User;

  @Property({ type: "string" })
  title!: string;

  @Property({ type: "text", nullable: true })
  description?: string;

  @Property({ type: "string", nullable: true })
  storageKey?: string;

  @Property({ type: "string", length: 150 })
  mimeType?: string;

  @Property({ type: "numeric" })
  fileSize?: number;

  @Property({ type: "date" })
  capturedAt?: Date;

  @Property({ type: "date" })
  expiresAt?: Date;
}
