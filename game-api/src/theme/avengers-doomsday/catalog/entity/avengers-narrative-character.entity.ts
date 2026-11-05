import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('avengers_narrative_characters')
export class AvengersNarrativeCharacterEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id!: string;

  @Column({ type: 'varchar', length: 64 }) themeId!: string;

  @Column({ type: 'varchar' }) displayName!: string;

  @Column({ type: 'text' }) portrait!: string;

  @Column({ type: 'varchar', length: 64 }) contentVersion!: string;

  @Column({ type: 'simple-json' }) metadata!: Record<string, unknown>;
}
