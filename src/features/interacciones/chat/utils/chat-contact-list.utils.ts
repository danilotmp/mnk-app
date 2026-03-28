import type { ContactWithLastMessage } from "@/src/domains/interacciones";
import type { MessageDirection } from "@/src/domains/interacciones";

/** API / WS pueden enviar "inbound" o el enum INBOUND; unificar antes de comparar */
export function isInboundDirection(
  direction: MessageDirection | string | undefined,
): boolean {
  return String(direction ?? "").toLowerCase() === "inbound";
}

/** Orden de lista: contacto con actividad más reciente primero (preview + WS). */
export function getContactListActivityTimestamp(
  c: ContactWithLastMessage,
): number {
  let t = 0;
  if (c.lastMessage) {
    const ca = Date.parse(c.lastMessage.createdAt);
    if (Number.isFinite(ca)) t = Math.max(t, ca);
    if (c.lastMessage.updatedAt) {
      const ua = Date.parse(c.lastMessage.updatedAt);
      if (Number.isFinite(ua)) t = Math.max(t, ua);
    }
  }
  if (c.lastInteractionAt) {
    const li = Date.parse(c.lastInteractionAt);
    if (Number.isFinite(li)) t = Math.max(t, li);
  }
  if (c.updatedAt) {
    const u = Date.parse(c.updatedAt);
    if (Number.isFinite(u)) t = Math.max(t, u);
  }
  return t;
}

/** Evita re-render si el refresco silencioso no cambió datos visibles (incl. orden e ids). */
export function contactRowListDataEqual(
  a: ContactWithLastMessage,
  b: ContactWithLastMessage,
): boolean {
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.phoneNumber === b.phoneNumber &&
    a.botEnabled === b.botEnabled &&
    a.lastMessagePendingRead === b.lastMessagePendingRead &&
    a.specialistAssignment === b.specialistAssignment &&
    a.unreadCount === b.unreadCount &&
    a.updatedAt === b.updatedAt &&
    a.lastInteractionAt === b.lastInteractionAt &&
    a.lastMessage?.id === b.lastMessage?.id &&
    a.lastMessage?.updatedAt === b.lastMessage?.updatedAt &&
    a.lastMessage?.createdAt === b.lastMessage?.createdAt &&
    a.lastMessage?.content === b.lastMessage?.content
  );
}

export function contactsListsVisuallyEquivalent(
  prev: ContactWithLastMessage[],
  next: ContactWithLastMessage[],
): boolean {
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    if (!contactRowListDataEqual(prev[i], next[i])) return false;
  }
  return true;
}
