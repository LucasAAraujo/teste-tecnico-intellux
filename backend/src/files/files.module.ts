import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from '../database/entities/file.entity';
import { FileShare } from '../database/entities/file-share.entity';
import { User } from '../database/entities/user.entity';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { SharesService } from './shares.service';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity, FileShare, User])],
  controllers: [FilesController],
  providers: [FilesService, SharesService],
})
export class FilesModule {}
