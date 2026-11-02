import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { BaseEntity } from './BaseEntity.js';

@Entity()
export class Person extends BaseEntity {
  @Property({ type: 'string' })
  firstName!: string;

  @Property({ type: 'string' })
  lastName!: string;
}