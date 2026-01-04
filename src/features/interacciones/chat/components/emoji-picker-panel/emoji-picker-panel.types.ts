export interface EmojiWithKeywords {
  emoji: string;
  keywords: string[];
}

export interface EmojiPickerPanelProps {
  emojisWithKeywords: EmojiWithKeywords[];
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  isMobile: boolean;
  colors: {
    surface: string;
    border: string;
    background: string;
    primary: string;
    text: string;
    textSecondary: string;
    error: string;
  };
}
