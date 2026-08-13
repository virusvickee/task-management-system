import { BadRequestException } from '@nestjs/common';

export const MAX_COMMENT_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_BYTES = 512 * 1024;
export const MAX_COMMENT_TEXT_LENGTH = 5000;

export type CommentAttachment = { name: string; dataUrl: string; type: string };

export function validateCommentAttachments(
  attachments: CommentAttachment[] = [],
): void {
  if (attachments.length > MAX_COMMENT_ATTACHMENTS) {
    throw new BadRequestException(`Maximum ${MAX_COMMENT_ATTACHMENTS} attachments allowed`);
  }

  for (const attachment of attachments) {
    const bytes = estimateDataUrlBytes(attachment.dataUrl);
    if (bytes > MAX_ATTACHMENT_BYTES) {
      throw new BadRequestException(`Attachment "${attachment.name}" exceeds 512 KB limit`);
    }
  }
}

function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  return Math.ceil((base64.length * 3) / 4);
}
