import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(
  __dirname,
  "../src/features/interacciones/chat/chat-ia.screen.tsx",
);

let text = fs.readFileSync(file, "utf8");
let lines = text.split(/\r?\n/);

// Quitar helpers locales + tipos WS + merge + getMedia (líneas 65–400, 1-based)
lines.splice(64, 336);

text = lines.join("\n");

const socketMarker = 'import type { Socket } from "socket.io-client";';
const insertAfterSocket = `${socketMarker}
import type { ImageViewerDocumentContext } from "./chat-ia.screen.types";
import { CHAT_BACKGROUND_URI } from "./chat-ia.constants";
import { ContactSpecialistAvatarRing } from "./components/contact-specialist-avatar-ring/contact-specialist-avatar-ring";
import {
  createChatIaScreenStyles,
  SPECIALIST_RING_RADIUS,
} from "./chat-ia.screen.styles";
import type {
  WsContactUpdatedPayload,
  WsMessageCreatedPayload,
} from "./chat-ia.screen.types";
import {
  buildImageViewerDocumentContext,
  formatMediaContextKey,
  getMediaDataUrl,
} from "./utils/chat-media.utils";
import {
  contactRowListDataEqual,
  contactsListsVisuallyEquivalent,
  getContactListActivityTimestamp,
  isInboundDirection,
} from "./utils/chat-contact-list.utils";
import { mergeContactWithWsUpdatePayload } from "./utils/chat-ws-merge.utils";

const { io } = require("socket.io-client/dist/socket.io.js") as {
  io: (uri: string, opts?: Record<string, unknown>) => Socket;
};
`;

if (!text.includes(socketMarker)) {
  throw new Error("Socket import marker not found");
}
text = text.replace(socketMarker, insertAfterSocket);

text = text.replace(
  "import React, { useCallback, useEffect, useRef, useState } from \"react\";",
  "import React, { useCallback, useEffect, useMemo, useRef, useState } from \"react\";",
);

text = text.replace(
  "  StyleSheet,\n",
  "",
);

const themeHook = "  const { colors, isDark } = useTheme();";
const stylesBlock = `${themeHook}
  const styles = useMemo(
    () => createChatIaScreenStyles(colors, isDark),
    [colors, isDark],
  );
  const imageViewerDocLabels = useMemo(
    () => ({
      documentFallbackTitle: t("pages.chatIa.documentDetailFallback"),
      mediaContextFieldPrefix: t("pages.chatIa.mediaContextFieldPrefix"),
    }),
    [t],
  );
`;

if (!text.includes(themeHook)) {
  throw new Error("useTheme hook line not found");
}
text = text.replace(themeHook, stylesBlock);

// Quitar StyleSheet.create al final
const stylesStart = text.indexOf("\nconst styles = StyleSheet.create({");
if (stylesStart === -1) {
  throw new Error("StyleSheet.create block not found");
}
text = text.slice(0, stylesStart);

// buildImageViewerDocumentContext(msg) -> + labels
text = text.replace(
  /buildImageViewerDocumentContext\(\s*([a-zA-Z0-9_]+)\s*\)/g,
  "buildImageViewerDocumentContext($1, imageViewerDocLabels)",
);

// ContactSpecialistAvatarRing: nuevas props
text = text.replace(
  `<ContactSpecialistAvatarRing
                            borderColor={colors.secondary}
                          >`,
  `<ContactSpecialistAvatarRing
                            wrapStyle={styles.contactAvatarSpecialistWrap}
                            ringAnimatedBaseStyle={
                              styles.contactAvatarSpecialistRingAnimated
                            }
                            borderColor={colors.secondary}
                            borderRadius={SPECIALIST_RING_RADIUS}
                          >`,
);

fs.writeFileSync(file, text.trimEnd() + "\n");
console.log("Updated chat-ia.screen.tsx");
