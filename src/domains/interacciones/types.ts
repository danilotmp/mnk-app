/**
 * Tipos para el dominio de Interacciones
 */

export enum ContactType {
  NEW = 'NEW',
  CLIENT = 'CLIENT',
  PARTNER = 'PARTNER',
  PROSPECT = 'PROSPECT',
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export enum MessageDirection {
  INBOUND = 'INBOUND', // Mensaje recibido del cliente
  OUTBOUND = 'OUTBOUND', // Mensaje enviado al cliente
}

export interface Contact {
  id: string;
  companyId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  type: ContactType;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactPayload {
  companyId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  type?: ContactType;
  notes?: string;
  tags?: string[];
}

export interface Message {
  id: string;
  contactId: string;
  direction: MessageDirection;
  content: string;
  status: MessageStatus;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface MessagePayload {
  contactId: string;
  direction: MessageDirection;
  content: string;
  status?: MessageStatus;
  metadata?: Record<string, any>;
}

export interface ContextSummary {
  id: string;
  contactId: string;
  summary: string;
  keyPoints?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ContextSummaryPayload {
  contactId: string;
  summary: string;
  keyPoints?: string[];
  metadata?: Record<string, any>;
}

export interface ContactWithLastMessage extends Contact {
  lastMessage?: Message;
  unreadCount?: number;
}

