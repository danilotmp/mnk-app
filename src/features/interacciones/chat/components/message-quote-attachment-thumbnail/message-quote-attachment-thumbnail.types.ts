import type { MessageAttachment } from '@/src/domains/interacciones';

export interface MessageQuoteAttachmentThumbnailProps {
  attachment: MessageAttachment;
  messageId: string;
  onPress: () => void;
  getFileIcon: (fileName: string, fileType: string) => { iconSource?: any; icon?: string; color: string };
}
