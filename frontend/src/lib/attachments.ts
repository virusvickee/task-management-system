export const MAX_COMMENT_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_BYTES = 512 * 1024; // 512 KB per file

export function validateAttachmentFiles(files: File[]): string | null {
  if (files.length > MAX_COMMENT_ATTACHMENTS) {
    return `You can attach up to ${MAX_COMMENT_ATTACHMENTS} files per comment.`;
  }
  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return `"${file.name}" exceeds the 512 KB limit.`;
    }
  }
  return null;
}

export function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  return Math.ceil((base64.length * 3) / 4);
}
