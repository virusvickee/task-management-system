import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { MAX_COMMENT_TEXT_LENGTH } from '../../common/constants/attachments';

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_COMMENT_TEXT_LENGTH)
  text: string;
}
