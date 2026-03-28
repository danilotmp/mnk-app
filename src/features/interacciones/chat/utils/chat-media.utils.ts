import type {
  Message,
  SerializedBuffer,
} from "@/src/domains/interacciones";
import type { ImageViewerDocumentContext } from "../chat-ia.screen.types";

export function formatMediaContextKey(rawKey: string): string {
  if (!rawKey) return "";
  return rawKey
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (s) => s.toUpperCase());
}

export interface BuildImageViewerDocumentLabels {
  documentFallbackTitle: string;
  mediaContextFieldPrefix: string;
}

export function buildImageViewerDocumentContext(
  message: Message | null | undefined,
  labels: BuildImageViewerDocumentLabels,
): ImageViewerDocumentContext | null {
  if (!message) return null;
  if (String(message.direction ?? "").toLowerCase() !== "inbound") {
    return null;
  }
  const mediaContextDetails =
    message.mediaContextDetails &&
    typeof message.mediaContextDetails === "object"
      ? message.mediaContextDetails
      : null;
  const hasContextDetails =
    Boolean(mediaContextDetails) &&
    Object.keys(mediaContextDetails || {}).length > 0;
  const hasIdentifier = Boolean(message.mediaIdentifier);
  if (!hasIdentifier && !hasContextDetails) return null;

  const contextEntries = hasContextDetails
    ? Object.entries(mediaContextDetails || {})
    : [];
  const tipoObjetivoEntry = contextEntries.find(
    ([key]) => key.replace(/[_-]/g, "").toLowerCase() === "tipoobjetivo",
  );
  const detailEntries = contextEntries.filter(
    ([key]) => key.replace(/[_-]/g, "").toLowerCase() !== "tipoobjetivo",
  );

  const title =
    typeof tipoObjetivoEntry?.[1] === "string" &&
    tipoObjetivoEntry[1].trim().length > 0
      ? tipoObjetivoEntry[1].trim().toUpperCase()
      : message.mediaIdentifier?.trim() || labels.documentFallbackTitle;

  const tooltipTitle = tipoObjetivoEntry
    ? `${labels.mediaContextFieldPrefix}${formatMediaContextKey(tipoObjetivoEntry[0])}`
    : undefined;

  const entries: Array<{ label: string; value: string }> = [];
  for (const [key, value] of detailEntries) {
    const rawValue =
      value == null
        ? ""
        : typeof value === "string"
          ? value
          : JSON.stringify(value, null, 2);
    if (!rawValue) continue;
    entries.push({ label: formatMediaContextKey(key), value: rawValue });
  }

  return { title, tooltipTitle, entries };
}

/** Convierte un buffer serializado del backend a data URL para mostrar imágenes inline */
export function getMediaDataUrl(
  media: SerializedBuffer | Buffer | undefined,
  mediaType: string = "image/jpeg",
): string | null {
  if (!media) return null;
  let data: number[] | Uint8Array;
  if (Array.isArray((media as SerializedBuffer).data)) {
    data = (media as SerializedBuffer).data;
  } else if (media instanceof Uint8Array) {
    data = Array.from(media);
  } else if (typeof (media as unknown as Buffer).length === "number") {
    data = Array.from(media as unknown as Buffer);
  } else {
    return null;
  }
  if (data.length === 0) return null;
  let base64: string;
  try {
    if (typeof Buffer !== "undefined") {
      base64 = Buffer.from(data).toString("base64");
    } else if (typeof btoa !== "undefined") {
      let binary = "";
      for (let i = 0; i < data.length; i++) {
        binary += String.fromCharCode(data[i]!);
      }
      base64 = btoa(binary);
    } else {
      return null;
    }
  } catch {
    return null;
  }
  const mime = mediaType?.startsWith("image/") ? mediaType : "image/jpeg";
  return `data:${mime};base64,${base64}`;
}
