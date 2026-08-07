import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GuestLoginDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  name?: string;
}
