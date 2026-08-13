import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength, ArrayMaxSize } from 'class-validator';
import { MAX_COMMENT_ATTACHMENTS, MAX_COMMENT_TEXT_LENGTH } from '../../common/constants/attachments';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_COMMENT_TEXT_LENGTH)
  text: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_COMMENT_ATTACHMENTS)
  @IsObject({ each: true })
  attachments?: { name: string; dataUrl: string; type: string }[];
}
