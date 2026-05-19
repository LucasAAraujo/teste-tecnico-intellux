import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvites1747612800003 implements MigrationInterface {
  name = 'CreateInvites1747612800003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE invites (
        id              CHAR(36)             NOT NULL,
        organization_id CHAR(36)             NULL,
        email           VARCHAR(255)         NOT NULL,
        role            ENUM('OWNER','USER') NOT NULL,
        token           CHAR(36)             NOT NULL,
        expires_at      DATETIME             NOT NULL,
        accepted_at     DATETIME             NULL,
        created_by      CHAR(36)             NOT NULL,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_invites_token (token),
        INDEX idx_invites_token (token),
        INDEX idx_invites_org   (organization_id),
        CONSTRAINT fk_invites_org  FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_invites_user FOREIGN KEY (created_by)
          REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE invites`);
  }
}
