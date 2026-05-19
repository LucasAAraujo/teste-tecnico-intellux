import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { CurrentUser } from '../common/decorators/auth.decorators';
import type { JwtPayload } from '../auth/auth.service';
import { FileFilterDto, ShareFileDto } from './dto/files.dto';
import { FilesService } from './files.service';
import { SharesService } from './shares.service';

const multerOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      mkdirSync('./uploads', { recursive: true });
      cb(null, './uploads');
    },
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
  }),
  fileFilter: (_req, file: Express.Multer.File, cb: (err: Error | null, accept: boolean) => void) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'text/csv', 'application/pdf'];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new BadRequestException('Tipo de arquivo não suportado'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
};

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly sharesService: SharesService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', multerOptions))
  upload(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: JwtPayload) {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    return this.filesService.upload(file, user);
  }

  @Get()
  findAll(@Query() query: FileFilterDto, @CurrentUser() user: JwtPayload) {
    return this.filesService.findAll(query, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.filesService.findOne(id, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.filesService.remove(id, user);
  }

  @Post(':id/share')
  @HttpCode(HttpStatus.CREATED)
  share(@Param('id') id: string, @Body() dto: ShareFileDto, @CurrentUser() user: JwtPayload) {
    return this.sharesService.share(id, dto, user);
  }
}
