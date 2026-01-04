import type { Contact } from '@/src/domains/interacciones';

export interface Tag {
  id: string;
  label: string;
  color: string;
}

export interface ContactInfoPanelProps {
  contact: Contact;
  availableTags: Tag[];
  isMobile: boolean;
  panelAnim: any; // Animated.Value
  onClose: () => void;
  colors: {
    surfaceVariant: string;
    border: string;
    primary: string;
    text: string;
    textSecondary: string;
  };
}
