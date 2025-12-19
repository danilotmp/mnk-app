import { NotificationTemplate } from '../../types';

export interface TemplateEditFormProps {
  templateId?: string;
  initialData?: NotificationTemplate | null;
  onSuccess?: (template: NotificationTemplate) => void;
  onCancel?: () => void;
  showHeader?: boolean;
  showFooter?: boolean;
  onFormReady?: (actions: {
    isLoading: boolean;
    handleSubmit: () => void;
    handleCancel: () => void;
    generalError?: { message: string; detail?: string } | null;
  }) => void;
}

export interface TemplateFormData {
  code: string;
  lang: string;
  subject: string;
  body: string;
  channel: 'email';
  companyId?: string | null;
  status: number | string;
  replyTo?: string | null;
  requiredVars?: string[];
}
