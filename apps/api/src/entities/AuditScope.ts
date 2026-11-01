import { Entity, Property, ManyToOne } from "@mikro-orm/decorators/legacy";
import { Audit } from "./Audit.js";
import { BaseEntity } from "./BaseEntity.js";

@Entity()
export class AuditScope extends BaseEntity {
  @ManyToOne(() => Audit)
  audit!: Audit;

  @Property({ type: "string" })
  boundary!: string;

  @Property({ type: "array" })
  includedUnits!: string[];

  @Property({ type: "json" })
  exclusions?: string[];

  @Property({ type: "string", nullable: true })
  exclusionJustification?: string;
}
