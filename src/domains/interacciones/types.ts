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
  /** Instancia Evolution / canal WhatsApp (mismo valor que en perfil comercial) */
  channelInstance?: string;
  email?: string;
  type: ContactType;
  botEnabled?: boolean;
  /** true: mensaje entrante pendiente de lectura humana (bot desactivado) */
  lastMessagePendingRead?: boolean;
  /** true: asignación a especialista (p. ej. desde n8n); badge / aviso en UI */
  specialistAssignment?: boolean;
  /** Última interacción en el hilo (p. ej. desde WebSocket); útil para ordenar la lista */
  lastInteractionAt?: string;
  /** Fecha del último mensaje (viene del GET /contacts) */
  lastMessageDate?: string;
  /** Contenido del último mensaje (viene del GET /contacts) */
  lastMessageContent?: string;
  /** Dirección del último mensaje: inbound/outbound (viene del GET /contacts) */
  lastMessageDirection?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactPayload {
  companyId: string;
  name: string;
  phoneNumber: string;
  /** Obligatorio en POST/PUT según API de interacciones */
  channelInstance: string;
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
  /** Instancia WhatsApp del mensaje */
  channelInstance?: string;
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
  /** Obligatorio: valor `whatsapp` de la instancia activa (máx. 50 en API) */
  channelInstance: string;
  status?: MessageStatus;
  /** Nombre del contacto en el canal (ej. pushName de WhatsApp). Opcional; el backend lo documenta en Swagger. */
  contactName?: string;
  metadata?: Record<string, any>;
  parentMessageId?: string;
  /** false = humano (p. ej. limpia specialistAssignment en servidor) */
  isFromBot?: boolean;
  aiContext?: Record<string, any>;
  // NOTA: Los campos media, mediaType, mediaFilename ya no se usan
  // Se envían archivos mediante FormData con el campo 'files[]'
}

/**
 * Instancia WhatsApp en respuestas de contexto (perfil comercial o contexto por código).
 * GET /interacciones/context/:companyCode devuelve además `id` e `isActive`.
 */
export interface InteraccionesWhatsappInstance {
  id?: string;
  whatsapp: string;
  name?: string;
  label?: string;
  phoneNumber?: string;
  phone?: string;
  isActive?: boolean;
  /** ID del template de flujo asignado a esta instancia */
  flowTemplateId?: string | null;
}

/**
 * Normalizado en front a partir de:
 * - GET /interacciones/context/profile/:commercialProfileId?admin= (wizard / admin)
 * - GET /interacciones/context/:companyCode (contexto institucional simplificado para IA)
 */
export interface InteraccionesContextProfile {
  whatsapp_instances?: InteraccionesWhatsappInstance[];
  whatsappInstances?: InteraccionesWhatsappInstance[];
  [key: string]: unknown;
}

/** Cuerpo `data` de GET /interacciones/context/:companyCode (getFullContextSimplified) */
export interface InteraccionesInstitutionalContextBody {
  institutional?: {
    available?: boolean;
    data?: {
      commercial?: {
        whatsappInstances?: InteraccionesWhatsappInstance[];
        whatsapp_instances?: InteraccionesWhatsappInstance[];
      };
    };
  };
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

/** Query GET /interacciones/dashboard/period */
export interface InteraccionesDashboardPeriodParams {
  companyId: string;
  /**
   * Opcional: sin enviar → el backend devuelve todas las instancias con datos en el mes.
   * Con valor → `data.instances` suele tener un solo elemento (misma forma).
   */
  channelInstance?: string;
  /** Si se usa uno, deben enviarse juntos (mes 1–12 UTC). Sin ambos → mes actual UTC. */
  year?: number;
  month?: number;
  /**
   * Solo afecta transacciones/documentos (mensajes). Por defecto en backend: true (solo outbound).
   */
  onlyOutbound?: boolean;
}

/** Una fila de `data.instances` (agrupación por channel_instance). */
export interface InteraccionesDashboardPeriodInstanceRow {
  channelInstance: string;
  /** Mensajes del mes que cumplen messageCountCriteria */
  transactionsCount: number;
  countDocuments: number;
  /** Órdenes del mes (chat_order_records vinculadas al mensaje) */
  operationsCount: number;
  paymentsCount: number;
  /** Alineado con ejecuciones en backend; suele coincidir con paymentsCount */
  executionsCount: number;
}

/**
 * Payload `data` de GET /interacciones/dashboard/period (envelope estándar con `data`).
 */
export interface InteraccionesDashboardPeriodData {
  companyId?: string;
  product?: string;
  periodYear?: number;
  periodMonth?: number;
  timezoneNote?: string;
  /** null = se listaron todas las instancias */
  channelInstanceFilter?: string | null;
  /** Textos en español para tooltips / ayuda */
  metricDefinitions?: Record<string, unknown>;
  messageCountCriteria?: Record<string, unknown>;
  instances: InteraccionesDashboardPeriodInstanceRow[];
}

