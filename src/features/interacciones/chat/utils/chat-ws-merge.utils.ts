import type {
  ContactWithLastMessage,
  Message,
} from "@/src/domains/interacciones";
import { MessageDirection } from "@/src/domains/interacciones";
import type { WsContactUpdatedPayload } from "../chat-ia.screen.types";

export function mergeContactWithWsUpdatePayload(
  contact: ContactWithLastMessage,
  payload: WsContactUpdatedPayload,
): ContactWithLastMessage {
  return {
    ...contact,
    name: payload.name ?? contact.name,
    phoneNumber: payload.phoneNumber ?? contact.phoneNumber,
    botEnabled:
      typeof payload.botEnabled === "boolean"
        ? payload.botEnabled
        : contact.botEnabled,
    lastMessagePendingRead:
      typeof payload.lastMessagePendingRead === "boolean"
        ? payload.lastMessagePendingRead
        : contact.lastMessagePendingRead,
    specialistAssignment:
      typeof payload.specialistAssignment === "boolean"
        ? payload.specialistAssignment
        : contact.specialistAssignment,
    lastInteractionAt:
      payload.lastInteractionAt != null && payload.lastInteractionAt !== ""
        ? payload.lastInteractionAt
        : contact.lastInteractionAt,
    updatedAt:
      payload.updatedAt != null && payload.updatedAt !== ""
        ? payload.updatedAt
        : payload.lastMessage
          ? payload.lastMessage.createdAt
          : contact.updatedAt,
    lastMessage: payload.lastMessage
      ? ({
          ...(contact.lastMessage ?? {}),
          id: payload.lastMessage.id,
          contactId: payload.id,
          content: payload.lastMessage.content,
          direction:
            String(payload.lastMessage.direction).toLowerCase() === "outbound"
              ? MessageDirection.OUTBOUND
              : MessageDirection.INBOUND,
          status: contact.lastMessage?.status || ("SENT" as Message["status"]),
          createdAt: payload.lastMessage.createdAt,
          updatedAt: payload.lastMessage.createdAt,
        } as Message)
      : contact.lastMessage,
  } as ContactWithLastMessage;
}
