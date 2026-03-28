/** Payload WebSocket: mensaje creado */
export interface WsMessageCreatedPayload {
  id: string;
  contactId: string;
  parentMessageId?: string | null;
  content: string;
  direction: "inbound" | "outbound";
  isFromBot?: boolean;
  status?: string;
  mediaType?: string | null;
  mediaFilename?: string | null;
  hasMedia?: boolean;
  createdAt: string;
  updatedAt?: string | null;
  editedAt?: string | null;
  isEdited?: boolean;
  /** Instancia WhatsApp; si no coincide con el canal seleccionado en UI, se ignora el evento */
  channelInstance?: string;
}

/** Payload WebSocket: contacto actualizado */
export interface WsContactUpdatedPayload {
  id: string;
  companyId: string;
  phoneNumber: string;
  name: string;
  botEnabled?: boolean;
  lastMessagePendingRead?: boolean;
  specialistAssignment?: boolean;
  lastInteractionAt?: string;
  updatedAt?: string;
  lastMessage?: {
    id: string;
    content: string;
    direction: "inbound" | "outbound";
    createdAt: string;
    channelInstance?: string;
  };
}

/** Contexto documental para el modal de zoom (imagen + detalle) */
export interface ImageViewerDocumentContext {
  title: string;
  tooltipTitle?: string;
  entries: Array<{ label: string; value: string }>;
}
