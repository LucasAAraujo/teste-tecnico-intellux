import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1747612800002 implements MigrationInterface {
  name = 'CreateUsers1747612800002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id              CHAR(36)                           NOT NULL,
        organization_id CHAR(36)                           NULL,
        name            VARCHAR(255)                       NOT NULL,
        email           VARCHAR(255)                       NOT NULL,
        password_hash   VARCHAR(255)                       NOT NULL,
        role            ENUM('SUPER_ADMIN','OWNER','USER')  NOT NULL,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_users_email (email),
        INDEX idx_users_org   (organization_id),
        INDEX idx_users_email (email),
        CONSTRAINT fk_users_org FOREIGN KEY (organization_id)
          REFERENCES organizations(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE users`);
  }
}
