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
  botEnabled?: boolean;
  /** true: mensaje entrante pendiente de lectura humana (bot desactivado) */
  lastMessagePendingRead?: boolean;
  /** true: asignación a especialista (p. ej. desde n8n); badge / aviso en UI */
  specialistAssignment?: boolean;
  /** Última interacción en el hilo (p. ej. desde WebSocket); útil para ordenar la lista */
  lastInteractionAt?: string;
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
  botEnabled?: boolean;
  lastMessagePendingRead?: boolean;
  specialistAssignment?: boolean;
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

/** Buffer serializado que devuelve el backend (ej. mensajes con imagen inline de WhatsApp) */
export interface SerializedBuffer {
  type: "Buffer";
  data: number[];
}

export interface Message {
  id: string;
  contactId: string;
  direction: MessageDirection;
  content: string;
  status: MessageStatus;
  isFromBot?: boolean;
  metadata?: Record<string, any>;
  /** Imagen inline en buffer (viene del backend para mensajes tipo imagen sin attachment) */
  media?: SerializedBuffer | Buffer;
  mediaType?: string;
  mediaFilename?: string;
  mediaIdentifier?: string | null;
  mediaContextDetails?: Record<string, any> | null;
  aiContext?: Record<string, any> | null;
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
  /** Nombre del contacto en el canal (ej. pushName de WhatsApp). Opcional; el backend lo documenta en Swagger. */
  contactName?: string;
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

