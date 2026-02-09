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

export interface MessageAttachment {
  id: string;
  messageId?: string; // ID del mensaje (puede venir del backend)
  filePath?: string; // Ruta relativa del archivo en el servidor (ej: "temp/messages/...")
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface Message {
  id: string;
  contactId: string;
  direction: MessageDirection;
  content: string;
  status: MessageStatus;
  metadata?: Record<string, any>;
  attachments?: MessageAttachment[]; // Nuevo sistema de archivos adjuntos
  isEdited?: boolean; // Indica si el mensaje fue editado
  editedAt?: string; // Fecha de edición
  createdBy?: string | null; // ID del usuario que creó el mensaje
  parentMessageId?: string; // ID del mensaje al que se responde
  parentMessage?: Message; // Mensaje original al que se responde (incluido en la respuesta del backend)
  createdAt: string;
  updatedAt: string;
}

export interface MessagePayload {
  contactId: string;
  direction: MessageDirection;
  content: string;
  status?: MessageStatus;
  metadata?: Record<string, any>;
  parentMessageId?: string;
  isFromBot?: boolean;
  aiContext?: Record<string, any>;
  // NOTA: Los campos media, mediaType, mediaFilename ya no se usan
  // Se envían archivos mediante FormData con el campo 'files[]'
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

