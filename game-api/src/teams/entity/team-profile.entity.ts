import { Column, Entity, PrimaryColumn } from 'typeorm';
import { TeamProfile } from '../model/team-profile.interface';

@Entity('team_profiles')
export class TeamProfileEntity implements TeamProfile {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 64 })
  themeId!: string;

  @Column({ type: 'integer', default: 0 })
  configurationRevision!: number;

  @Column({ type: 'integer', default: 0 })
  contextRevision!: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  currentAttemptId!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
