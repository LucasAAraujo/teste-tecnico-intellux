import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFileShares1747612800005 implements MigrationInterface {
  name = 'CreateFileShares1747612800005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE file_shares (
        id           CHAR(36) NOT NULL,
        file_id      CHAR(36) NOT NULL,
        owner_id     CHAR(36) NOT NULL,
        recipient_id CHAR(36) NOT NULL,
        shared_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_share (file_id, recipient_id),
        INDEX idx_shares_recipient (recipient_id),
        INDEX idx_shares_file      (file_id),
        CONSTRAINT fk_shares_file      FOREIGN KEY (file_id)
          REFERENCES files(id) ON DELETE CASCADE,
        CONSTRAINT fk_shares_owner     FOREIGN KEY (owner_id)
          REFERENCES users(id),
        CONSTRAINT fk_shares_recipient FOREIGN KEY (recipient_id)
          REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE file_shares`);
  }
}
