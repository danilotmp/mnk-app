export interface NotificationTemplate {
  id: string;
  companyId?: string | null;
  code: string;
  channel: 'email';
  lang: string;
  subject: string;
  body: string; // HTML
  requiredVars?: string[];
  metadata?: {
    priority?: string;
    retries?: number;
    [key: string]: any;
  } | null;
  replyTo?: string | null;
  status?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationSendPayload {
  code: string;
  companyId?: string | null;
  recipients: string[];
  variables?: Record<string, string | number | boolean>;
  lang?: string;
  channel?: 'email';
  replyTo?: string | null;
}

export interface NotificationLog {
  id: string;
  templateCode: string;
  companyId?: string | null;
  recipientsMasked: string[];
  status: string;
  error?: string | null;
  retries?: number;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, any> | null;
}

export interface SystemParam {
  key: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'bool' | 'duration';
  scope: string;
  companyId?: string | null;
  description?: string | null;
  status?: number;
  statusDescription?: string;
}
