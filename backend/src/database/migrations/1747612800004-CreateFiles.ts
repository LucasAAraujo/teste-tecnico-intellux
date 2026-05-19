import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFiles1747612800004 implements MigrationInterface {
  name = 'CreateFiles1747612800004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE files (
        id              CHAR(36)             NOT NULL,
        organization_id CHAR(36)             NOT NULL,
        created_by      CHAR(36)             NOT NULL,
        name            VARCHAR(255)         NOT NULL,
        type            ENUM('TEXT','IMAGE') NOT NULL,
        mime_type       VARCHAR(100)         NOT NULL,
        storage_path    VARCHAR(1024)        NOT NULL,
        size_bytes      BIGINT               NOT NULL,
        uploaded_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_files_org         (organization_id),
        INDEX idx_files_created_by  (created_by),
        INDEX idx_files_uploaded_at (uploaded_at),
        FULLTEXT INDEX idx_files_name (name),
        CONSTRAINT fk_files_org  FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_files_user FOREIGN KEY (created_by)
          REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE files`);
  }
}
