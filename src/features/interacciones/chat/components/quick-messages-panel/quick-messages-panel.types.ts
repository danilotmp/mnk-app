import type { Recommendation } from '@/src/domains/commercial/types';
import type { CatalogEntry } from '@/src/domains/catalog/types';

export interface QuickMessagesPanelProps {
  quickMessages: CatalogEntry[];
  recommendations: Recommendation[];
  loadingRecommendations: boolean;
  onQuickMessageSelect: (message: string) => void;
  onRecommendationSelect: (recommendation: Recommendation) => void;
  onClose: () => void;
  onRefresh: () => void;
  catalogId: string | null;
  companyId: string | null;
  companyCode: string | null;
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
