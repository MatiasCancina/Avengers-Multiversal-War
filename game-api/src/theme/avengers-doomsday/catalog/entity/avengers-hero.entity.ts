import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('avengers_heroes')
@Index('idx_avengers_heroes_theme_eligibility', ['themeId', 'eligibility'])
export class AvengersHeroEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id!: string;

  @Column({ type: 'varchar', length: 64 }) themeId!: string;

  @Column({ type: 'varchar' }) displayName!: string;

  @Column({ type: 'varchar', length: 32 }) eligibility!: string;

  @Column({ type: 'varchar', length: 32 }) archetype!: string;

  @Column({ type: 'text' }) portrait!: string;

  @Column({ type: 'varchar', length: 64 }) contentVersion!: string;

  @Column({ type: 'simple-json' }) metadata!: Record<string, unknown>;
}
