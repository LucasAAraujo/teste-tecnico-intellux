import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateInviteDto {
  @IsEmail()
  email: string;
}

export class ActivateInviteDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  orgName?: string;
}
