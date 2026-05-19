import 'dotenv/config';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { User } from './entities/user.entity';
import { Invite } from './entities/invite.entity';
import { FileEntity } from './entities/file.entity';
import { FileShare } from './entities/file-share.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'intellux',
  entities: [Organization, User, Invite, FileEntity, FileShare],
  migrations: [path.join(__dirname, 'migrations', '**', '*{.ts,.js}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
