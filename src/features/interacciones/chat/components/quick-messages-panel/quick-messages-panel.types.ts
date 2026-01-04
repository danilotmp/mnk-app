import type { Recommendation } from '@/src/domains/commercial/types';

export interface QuickMessagesPanelProps {
  quickMessages: string[];
  recommendations: Recommendation[];
  loadingRecommendations: boolean;
  onQuickMessageSelect: (message: string) => void;
  onRecommendationSelect: (recommendation: Recommendation) => void;
  onClose: () => void;
  isMobile: boolean;
  colors: {
    surface: string;
    border: string;
    background: string;
    surfaceVariant: string;
    text: string;
    textSecondary: string;
    primary: string;
    error: string;
  };
}
