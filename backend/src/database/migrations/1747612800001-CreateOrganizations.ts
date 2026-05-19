import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizations1747612800001 implements MigrationInterface {
  name = 'CreateOrganizations1747612800001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE organizations (
        id         CHAR(36)     NOT NULL,
        name       VARCHAR(255) NOT NULL,
        created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE organizations`);
  }
}
