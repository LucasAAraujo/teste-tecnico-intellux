import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Organization } from './database/entities/organization.entity';
import { User } from './database/entities/user.entity';
import { Invite } from './database/entities/invite.entity';
import { FileEntity } from './database/entities/file.entity';
import { FileShare } from './database/entities/file-share.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME ?? 'intellux',
      entities: [Organization, User, Invite, FileEntity, FileShare],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
