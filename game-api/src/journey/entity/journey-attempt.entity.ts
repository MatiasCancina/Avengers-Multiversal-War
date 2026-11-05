import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('journey_attempts')
@Index('idx_journey_attempts_team_status_completed', ['teamId', 'status', 'completedAt'])
export class JourneyAttemptEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  teamId!: string;

  @Column({ type: 'varchar', length: 64 })
  themeId!: string;

  @Column({ type: 'varchar', length: 32 })
  status!: string;

  @Column({ type: 'integer', default: 0 })
  revision!: number;

  @Column({ type: 'simple-json' })
  metadata!: Record<string, unknown>;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt!: Date | null;
}
