import type { Message } from "@/src/domains/interacciones";

/**
 * Chat: antiguos arriba, recientes abajo (scroll al final).
 * Comparador estable si hay fechas iguales o no parseables.
 */
export function compareMessagesByCreatedAtAsc(
  a: Pick<Message, "id" | "createdAt">,
  b: Pick<Message, "id" | "createdAt">,
): number {
  const ta = Date.parse(a.createdAt);
  const tb = Date.parse(b.createdAt);
  const na = Number.isFinite(ta) ? ta : 0;
  const nb = Number.isFinite(tb) ? tb : 0;
  if (na !== nb) return na - nb;
  return String(a.id).localeCompare(String(b.id));
}

export function sortMessagesChronologically(messages: Message[]): Message[] {
  return [...messages].sort(compareMessagesByCreatedAtAsc);
}
