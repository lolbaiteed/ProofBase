import { Entity, Property, ManyToOne } from "@mikro-orm/decorators/legacy";
import { Audit } from "./Audit.js";

@Entity()
export class AuditScope {
  @ManyToOne(() => Audit)
  audit!: Audit;
}
