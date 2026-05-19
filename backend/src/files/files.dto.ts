import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { FileType } from '../database/entities/file.entity';

export class FileFilterDto {
  @IsOptional()
  @IsEnum(FileType)
  type?: FileType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class ShareFileDto {
  @IsUUID()
  recipientId: string;
}
