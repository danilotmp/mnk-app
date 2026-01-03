import type { MessageAttachment } from '@/src/domains/interacciones';

export interface MessageAttachmentItemProps {
  attachment: MessageAttachment;
  messageId: string;
  colors: any;
  onPress?: () => void;
  isMobile?: boolean;
}
