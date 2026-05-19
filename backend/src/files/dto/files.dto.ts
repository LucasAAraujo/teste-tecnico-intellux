import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { FileType } from '../../database/entities/file.entity';

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

export class UpdateFileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}

export class ShareFileDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  recipientIds!: string[];
}
