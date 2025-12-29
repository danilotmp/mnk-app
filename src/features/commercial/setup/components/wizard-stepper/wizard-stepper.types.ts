export interface WizardStep {
  id: string;
  label: string;
  layer: 'institutional' | 'offerings' | 'interactionGuidelines' | 'payments' | 'recommendations';
  completed: boolean;
  enabled: boolean;
  completionPercentage: number;
  skipped?: boolean; // true si la capa fue omitida sin datos
}
