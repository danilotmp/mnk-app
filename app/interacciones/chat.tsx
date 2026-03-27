/**
 * Pantalla principal de Chat IA
 * Interfaz administrativa para interactuar con clientes mediante Chat IA
 */

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { InputWithFocus } from "@/components/ui/input-with-focus";
import { Tooltip } from "@/components/ui/tooltip";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { CatalogService } from "@/src/domains/catalog/services/catalog.service";
import type { CatalogEntry } from "@/src/domains/catalog/types";
import { CommercialService } from "@/src/domains/commercial";
import type { Recommendation } from "@/src/domains/commercial/types";
import type {
  Contact,
  ContactWithLastMessage,
  Message,
  MessageAttachment,
  SerializedBuffer,
} from "@/src/domains/interacciones";
import {
  InteraccionesService,
  MessageDirection,
} from "@/src/domains/interacciones";
import { useCompany } from "@/src/domains/shared";
import { DynamicIcon } from "@/src/domains/shared/components";
import { ContactInfoPanel } from "@/src/features/interacciones/chat/components/contact-info-panel/contact-info-panel";
import { EmojiPickerPanel } from "@/src/features/interacciones/chat/components/emoji-picker-panel/emoji-picker-panel";
import { ImageWithToken } from "@/src/features/interacciones/chat/components/image-with-token/image-with-token";
import { MessageAttachmentItem } from "@/src/features/interacciones/chat/components/message-attachment-item/message-attachment-item";
import { MessageQuoteAttachmentThumbnail } from "@/src/features/interacciones/chat/components/message-quote-attachment-thumbnail/message-quote-attachment-thumbnail";
import { QuickMessagesPanel } from "@/src/features/interacciones/chat/components/quick-messages-panel/quick-messages-panel";
import { formatRelativeTime } from "@/src/features/interacciones/chat/utils/format-relative-time";
import { API_CONFIG } from "@/src/infrastructure/api/config";
import { getStorageAdapter } from "@/src/infrastructure/api/storage.adapter";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Image as ExpoImage } from "expo-image";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { Socket } from "socket.io-client";

const CHAT_BACKGROUND_URI =
  "https://static.whatsapp.net/rsrc.php/v4/y1/r/m5BEg2K4OR4.png";
const { io } = require("socket.io-client/dist/socket.io.js") as {
  io: (uri: string, opts?: Record<string, unknown>) => Socket;
};

interface WsMessageCreatedPayload {
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
}

interface WsContactUpdatedPayload {
  id: string;
  companyId: string;
  phoneNumber: string;
  name: string;
  botEnabled?: boolean;
  lastInteractionAt?: string;
  lastMessage?: {
    id: string;
    content: string;
    direction: "inbound" | "outbound";
    createdAt: string;
  };
}

/** Convierte un buffer serializado del backend a data URL para mostrar imágenes inline */
function getMediaDataUrl(
  media: SerializedBuffer | Buffer | undefined,
  mediaType: string = "image/jpeg",
): string | null {
  if (!media) return null;
  let data: number[] | Uint8Array;
  if (Array.isArray((media as SerializedBuffer).data)) {
    data = (media as SerializedBuffer).data;
  } else if (media instanceof Uint8Array) {
    data = Array.from(media);
  } else if (typeof (media as Buffer).length === "number") {
    data = Array.from(media as Buffer);
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
        binary += String.fromCharCode(data[i]);
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

export default function ChatIAScreen() {
  const { colors, isDark } = useTheme();
  const { isMobile } = useResponsive();
  const { t } = useTranslation();
  const router = useRouter();
  const alert = useAlert();
  const { company } = useCompany();

  const [contacts, setContacts] = useState<ContactWithLastMessage[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [shouldScrollToEnd, setShouldScrollToEnd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isMessageInputFocused, setIsMessageInputFocused] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<
    Array<{
      name: string;
      size: number;
      type: string;
      uri?: string;
      file?: File;
    }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const messagesScrollRef = useRef<ScrollView>(null);
  const messageRefs = useRef<Record<string, View | null>>({});
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Estado para modal de visualización de imágenes
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerAttachments, setImageViewerAttachments] = useState<
    MessageAttachment[]
  >([]);
  const [imageViewerMessageId, setImageViewerMessageId] = useState<string>("");
  const [imageViewerCurrentIndex, setImageViewerCurrentIndex] = useState(0);
  const [imageViewerLocalFiles, setImageViewerLocalFiles] = useState<
    Array<{
      name: string;
      size: number;
      type: string;
      uri?: string;
      file?: File;
    }>
  >([]);
  const [isViewingLocalFiles, setIsViewingLocalFiles] = useState(false);

  // Estados para editar/eliminar mensajes
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null,
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Estados para menú contextual y responder
  const [messageMenuVisible, setMessageMenuVisible] = useState<string | null>(
    null,
  );
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(
    null,
  );
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Calcular número de líneas del texto
  const lineHeight = 20; // Altura de línea aproximada (fontSize 15 + lineHeight)
  const paddingVertical = 20; // paddingVertical total (10 arriba + 10 abajo)
  const minHeight = 40; // Altura mínima (1 línea)
  const maxLines = 8; // Máximo de líneas antes de scroll
  const maxHeight = lineHeight * maxLines + paddingVertical; // ~180px para 8 líneas

  // Función para calcular altura basada en saltos de línea
  const calculateInputHeight = useCallback(
    (text: string): number => {
      if (!text || text.trim().length === 0) {
        return minHeight;
      }

      // Contar saltos de línea (\n)
      const lineBreaks = (text.match(/\n/g) || []).length;
      // El número total de líneas es lineBreaks + 1 (la primera línea)
      const totalLines = Math.min(lineBreaks + 1, maxLines);

      // Calcular altura: minHeight + (líneas adicionales * lineHeight)
      // Si solo hay 1 línea, usamos minHeight
      const additionalLines = totalLines > 1 ? totalLines - 1 : 0;
      const calculatedHeight = minHeight + additionalLines * lineHeight;

      return Math.min(calculatedHeight, maxHeight);
    },
    [minHeight, lineHeight, maxLines, maxHeight],
  );

  const [messageInputHeight, setMessageInputHeight] = useState(minHeight);

  // Filtros de contactos
  const [contactFilter, setContactFilter] = useState<
    "all" | "unread" | "favorites"
  >("all");

  // Búsqueda en mensajes (con animación horizontal)
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const messageSearchWidthAnim = useRef(new Animated.Value(0)).current;

  // Panel de información del contacto - siempre visible cuando hay contacto seleccionado

  // Estado de actualización del toggle de bot por contacto
  const [updatingBotEnabled, setUpdatingBotEnabled] = useState(false);

  // Estado del selector de emojis
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Estado del selector de mensajes rápidos
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const activeContactIdRef = useRef<string | null>(null);
  const silentContactsSyncingRef = useRef(false);
  const silentMessagesSyncingRef = useRef(false);

  // Lista de mensajes rápidos desde catálogo (detalles completos)
  const [quickMessages, setQuickMessages] = useState<CatalogEntry[]>([]);
  const [loadingQuickMessages, setLoadingQuickMessages] = useState(false);
  const [quickMessagesCatalogId, setQuickMessagesCatalogId] = useState<
    string | null
  >(null);

  // Estado para recomendaciones
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const sortContactsByLastMessage = useCallback(
    (list: ContactWithLastMessage[]) => {
      return [...list].sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return (
          new Date(b.lastMessage.createdAt).getTime() -
          new Date(a.lastMessage.createdAt).getTime()
        );
      });
    },
    [],
  );

  const isViewVisible = useCallback(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return true;
    return document.visibilityState === "visible";
  }, []);

  // Lista de emojis populares con palabras clave para búsqueda
  const emojisWithKeywords: Array<{ emoji: string; keywords: string[] }> = [
    {
      emoji: "😀",
      keywords: ["happy", "feliz", "alegre", "sonrisa", "smile", "grinning"],
    },
    {
      emoji: "😃",
      keywords: [
        "happy",
        "feliz",
        "alegre",
        "sonrisa",
        "smile",
        "big",
        "grande",
      ],
    },
    {
      emoji: "😄",
      keywords: [
        "happy",
        "feliz",
        "alegre",
        "sonrisa",
        "smile",
        "laughing",
        "risa",
      ],
    },
    {
      emoji: "😁",
      keywords: [
        "happy",
        "feliz",
        "alegre",
        "sonrisa",
        "smile",
        "beaming",
        "radiante",
      ],
    },
    {
      emoji: "😆",
      keywords: ["happy", "feliz", "alegre", "laughing", "risa", "lol"],
    },
    {
      emoji: "😅",
      keywords: [
        "nervous",
        "nervioso",
        "sweat",
        "sudor",
        "awkward",
        "incómodo",
      ],
    },
    {
      emoji: "🤣",
      keywords: [
        "laughing",
        "risa",
        "rofl",
        "floor",
        "piso",
        "hilarious",
        "gracioso",
      ],
    },
    {
      emoji: "😂",
      keywords: ["laughing", "risa", "tears", "lágrimas", "crying", "llorando"],
    },
    {
      emoji: "🙂",
      keywords: [
        "smile",
        "sonrisa",
        "slightly",
        "ligeramente",
        "neutral",
        "neutro",
      ],
    },
    {
      emoji: "🙃",
      keywords: ["upside", "alrevés", "down", "abajo", "silly", "tonto"],
    },
    { emoji: "😉", keywords: ["wink", "guñar", "winking", "eye", "ojo"] },
    {
      emoji: "😊",
      keywords: ["happy", "feliz", "smile", "sonrisa", "blush", "sonrojo"],
    },
    {
      emoji: "😇",
      keywords: ["angel", "ángel", "halo", "innocent", "inocente"],
    },
    {
      emoji: "🥰",
      keywords: [
        "love",
        "amor",
        "heart",
        "corazón",
        "smile",
        "sonrisa",
        "cute",
        "lindo",
      ],
    },
    {
      emoji: "😍",
      keywords: [
        "love",
        "amor",
        "heart",
        "corazón",
        "eyes",
        "ojos",
        "infatuated",
        "enamorado",
      ],
    },
    {
      emoji: "🤩",
      keywords: ["star", "estrella", "struck", "golpeado", "eyes", "ojos"],
    },
    {
      emoji: "😘",
      keywords: ["kiss", "beso", "blow", "soplar", "kissing", "besando"],
    },
    { emoji: "😗", keywords: ["kiss", "beso", "kissing", "besando"] },
    {
      emoji: "😚",
      keywords: ["kiss", "beso", "kissing", "besando", "closed", "cerrado"],
    },
    {
      emoji: "😙",
      keywords: ["kiss", "beso", "kissing", "besando", "smile", "sonrisa"],
    },
    {
      emoji: "😋",
      keywords: ["yum", "delicious", "delicioso", "yummy", "sabroso"],
    },
    {
      emoji: "😛",
      keywords: ["tongue", "lengua", "silly", "tonto", "playful", "juguetón"],
    },
    {
      emoji: "😜",
      keywords: ["wink", "guñar", "tongue", "lengua", "silly", "tonto"],
    },
    {
      emoji: "🤪",
      keywords: ["zany", "loco", "crazy", "mad", "crazy", "loco"],
    },
    {
      emoji: "😝",
      keywords: [
        "tongue",
        "lengua",
        "silly",
        "tonto",
        "squinting",
        "entrecerrado",
      ],
    },
    {
      emoji: "🤑",
      keywords: ["money", "dinero", "mouth", "boca", "rich", "rico"],
    },
    {
      emoji: "🤗",
      keywords: ["hug", "abrazo", "hugging", "abrazando", "open", "abierto"],
    },
    {
      emoji: "🤭",
      keywords: ["hand", "mano", "mouth", "boca", "quiet", "silencio"],
    },
    {
      emoji: "🤫",
      keywords: ["shush", "shh", "quiet", "silencio", "finger", "dedo"],
    },
    {
      emoji: "🤔",
      keywords: [
        "thinking",
        "pensando",
        "think",
        "pensar",
        "thought",
        "pensamiento",
      ],
    },
    {
      emoji: "🤐",
      keywords: ["zip", "cierre", "mouth", "boca", "sealed", "sellado"],
    },
    {
      emoji: "🤨",
      keywords: [
        "raised",
        "levantada",
        "eyebrow",
        "ceja",
        "suspicious",
        "sospechoso",
      ],
    },
    {
      emoji: "😐",
      keywords: [
        "neutral",
        "neutro",
        "face",
        "cara",
        "expressionless",
        "sin expresión",
      ],
    },
    {
      emoji: "😑",
      keywords: ["expressionless", "sin expresión", "face", "cara"],
    },
    { emoji: "😶", keywords: ["face", "cara", "no", "mouth", "boca"] },
    {
      emoji: "😏",
      keywords: [
        "smirk",
        "sonrisa",
        "maliciosa",
        "smirking",
        "cunning",
        "astuto",
      ],
    },
    { emoji: "😒", keywords: ["unamused", "descontento", "face", "cara"] },
    {
      emoji: "🙄",
      keywords: ["eyes", "ojos", "rolling", "girando", "eyeroll", "girar ojos"],
    },
    {
      emoji: "😬",
      keywords: ["grimacing", "mueca", "face", "cara", "awkward", "incómodo"],
    },
    {
      emoji: "🤥",
      keywords: ["lying", "mintiendo", "liar", "mentiroso", "nose", "nariz"],
    },
    {
      emoji: "😌",
      keywords: ["relieved", "aliviado", "face", "cara", "relaxed", "relajado"],
    },
    {
      emoji: "😔",
      keywords: ["pensive", "pensativo", "sad", "triste", "face", "cara"],
    },
    {
      emoji: "😪",
      keywords: ["sleepy", "sueño", "tired", "cansado", "face", "cara"],
    },
    {
      emoji: "🤤",
      keywords: ["drooling", "babeando", "face", "cara", "drool", "baba"],
    },
    {
      emoji: "😴",
      keywords: [
        "sleeping",
        "durmiendo",
        "sleep",
        "sueño",
        "face",
        "cara",
        "zzz",
      ],
    },
    {
      emoji: "😷",
      keywords: ["mask", "máscara", "face", "cara", "medical", "médico"],
    },
    {
      emoji: "🤒",
      keywords: [
        "fever",
        "fiebre",
        "sick",
        "enfermo",
        "thermometer",
        "termómetro",
      ],
    },
    {
      emoji: "🤕",
      keywords: ["bandage", "vendaje", "head", "cabeza", "injured", "herido"],
    },
    {
      emoji: "🤢",
      keywords: ["nauseated", "náuseas", "sick", "enfermo", "vomit", "vómito"],
    },
    {
      emoji: "🤮",
      keywords: ["vomiting", "vomitando", "sick", "enfermo", "puke", "vomitar"],
    },
    {
      emoji: "🤧",
      keywords: [
        "sneezing",
        "estornudando",
        "sneeze",
        "estornudo",
        "sick",
        "enfermo",
      ],
    },
    {
      emoji: "🥵",
      keywords: ["hot", "caliente", "sweating", "sudando", "face", "cara"],
    },
    {
      emoji: "🥶",
      keywords: ["cold", "frío", "freezing", "congelado", "face", "cara"],
    },
    {
      emoji: "😵",
      keywords: ["dizzy", "mareado", "face", "cara", "spent", "gastado"],
    },
    {
      emoji: "🤯",
      keywords: [
        "exploding",
        "explotando",
        "head",
        "cabeza",
        "mind",
        "mente",
        "blown",
        "soplado",
      ],
    },
    {
      emoji: "🤠",
      keywords: ["cowboy", "vaquero", "hat", "sombrero", "face", "cara"],
    },
    {
      emoji: "🥳",
      keywords: [
        "party",
        "fiesta",
        "celebration",
        "celebración",
        "party",
        "fiesta",
      ],
    },
    {
      emoji: "😎",
      keywords: ["cool", "genial", "sunglasses", "gafas", "sun", "sol"],
    },
    {
      emoji: "🤓",
      keywords: ["nerd", "nerdo", "face", "cara", "geek", "friki"],
    },
    {
      emoji: "🧐",
      keywords: [
        "monocle",
        "monóculo",
        "face",
        "cara",
        "investigating",
        "investigando",
      ],
    },
    {
      emoji: "😕",
      keywords: [
        "confused",
        "confundido",
        "face",
        "cara",
        "uneasy",
        "incómodo",
      ],
    },
    {
      emoji: "😟",
      keywords: [
        "worried",
        "preocupado",
        "face",
        "cara",
        "concerned",
        "preocupado",
      ],
    },
    {
      emoji: "🙁",
      keywords: ["slightly", "ligeramente", "frown", "ceño", "sad", "triste"],
    },
    {
      emoji: "😮",
      keywords: ["open", "abierta", "mouth", "boca", "face", "cara"],
    },
    {
      emoji: "😯",
      keywords: [
        "hushed",
        "sorprendido",
        "face",
        "cara",
        "surprised",
        "sorprendido",
      ],
    },
    {
      emoji: "😲",
      keywords: [
        "astonished",
        "asombrado",
        "face",
        "cara",
        "shocked",
        "sorprendido",
      ],
    },
    {
      emoji: "😳",
      keywords: [
        "flushed",
        "sonrojado",
        "face",
        "cara",
        "embarrassed",
        "avergonzado",
      ],
    },
    {
      emoji: "🥺",
      keywords: ["pleading", "suplicante", "face", "cara", "puppy", "cachorro"],
    },
    {
      emoji: "😦",
      keywords: ["frown", "ceño", "open", "abierta", "mouth", "boca"],
    },
    {
      emoji: "😧",
      keywords: [
        "anguished",
        "angustiado",
        "face",
        "cara",
        "distressed",
        "angustiado",
      ],
    },
    {
      emoji: "😨",
      keywords: ["fearful", "temeroso", "face", "cara", "scared", "asustado"],
    },
    {
      emoji: "😰",
      keywords: [
        "anxious",
        "ansioso",
        "sweat",
        "sudor",
        "worried",
        "preocupado",
      ],
    },
    {
      emoji: "😥",
      keywords: [
        "sad",
        "triste",
        "relieved",
        "aliviado",
        "disappointed",
        "decepcionado",
      ],
    },
    {
      emoji: "😢",
      keywords: ["crying", "llorando", "tears", "lágrimas", "sad", "triste"],
    },
    {
      emoji: "😭",
      keywords: [
        "loudly",
        "fuertemente",
        "crying",
        "llorando",
        "sob",
        "sollozo",
      ],
    },
    {
      emoji: "😱",
      keywords: ["scream", "gritar", "fear", "miedo", "shocked", "sorprendido"],
    },
    {
      emoji: "😖",
      keywords: [
        "confounded",
        "confundido",
        "face",
        "cara",
        "frustrated",
        "frustrado",
      ],
    },
    {
      emoji: "😣",
      keywords: [
        "persevering",
        "perseverante",
        "face",
        "cara",
        "struggling",
        "luchando",
      ],
    },
    {
      emoji: "😞",
      keywords: [
        "disappointed",
        "decepcionado",
        "face",
        "cara",
        "sad",
        "triste",
      ],
    },
    {
      emoji: "😓",
      keywords: ["downcast", "abatido", "sweat", "sudor", "tired", "cansado"],
    },
    {
      emoji: "😩",
      keywords: ["weary", "cansado", "face", "cara", "tired", "cansado"],
    },
    {
      emoji: "😫",
      keywords: ["tired", "cansado", "face", "cara", "exhausted", "agotado"],
    },
    {
      emoji: "🥱",
      keywords: ["yawn", "bostezo", "tired", "cansado", "sleepy", "sueño"],
    },
    {
      emoji: "😤",
      keywords: ["triumph", "triunfo", "face", "cara", "proud", "orgulloso"],
    },
    {
      emoji: "😡",
      keywords: ["pouting", "enojado", "face", "cara", "angry", "enojado"],
    },
    {
      emoji: "😠",
      keywords: ["angry", "enojado", "face", "cara", "mad", "enojado"],
    },
    {
      emoji: "🤬",
      keywords: ["cursing", "maldiciendo", "face", "cara", "swear", "jurar"],
    },
    {
      emoji: "😈",
      keywords: ["smiling", "sonriendo", "devil", "diablo", "evil", "malvado"],
    },
    {
      emoji: "👿",
      keywords: ["angry", "enojado", "devil", "diablo", "evil", "malvado"],
    },
    {
      emoji: "💀",
      keywords: ["skull", "calavera", "death", "muerte", "dead", "muerto"],
    },
    {
      emoji: "☠️",
      keywords: [
        "skull",
        "calavera",
        "crossbones",
        "huesos",
        "death",
        "muerte",
      ],
    },
    {
      emoji: "💩",
      keywords: ["poop", "caca", "pile", "montón", "poo", "caca"],
    },
    {
      emoji: "🤡",
      keywords: ["clown", "payaso", "face", "cara", "circus", "circo"],
    },
    {
      emoji: "👹",
      keywords: ["ogre", "ogro", "monster", "monstruo", "japanese", "japonés"],
    },
    {
      emoji: "👺",
      keywords: [
        "goblin",
        "duende",
        "monster",
        "monstruo",
        "japanese",
        "japonés",
      ],
    },
    {
      emoji: "👻",
      keywords: [
        "ghost",
        "fantasma",
        "spooky",
        "escalofriante",
        "halloween",
        "halloween",
      ],
    },
    {
      emoji: "👽",
      keywords: [
        "alien",
        "alienígena",
        "ufo",
        "ovni",
        "extraterrestrial",
        "extraterrestre",
      ],
    },
    {
      emoji: "👾",
      keywords: [
        "alien",
        "alienígena",
        "monster",
        "monstruo",
        "space",
        "espacio",
      ],
    },
    {
      emoji: "🤖",
      keywords: ["robot", "robot", "face", "cara", "machine", "máquina"],
    },
    {
      emoji: "😺",
      keywords: ["grinning", "sonriente", "cat", "gato", "smile", "sonrisa"],
    },
    {
      emoji: "😸",
      keywords: ["grinning", "sonriente", "cat", "gato", "eyes", "ojos"],
    },
    {
      emoji: "😹",
      keywords: ["joy", "alegría", "cat", "gato", "tears", "lágrimas"],
    },
    {
      emoji: "😻",
      keywords: [
        "heart",
        "corazón",
        "eyes",
        "ojos",
        "cat",
        "gato",
        "love",
        "amor",
      ],
    },
    {
      emoji: "😼",
      keywords: ["smirk", "sonrisa", "cat", "gato", "wry", "irónico"],
    },
    {
      emoji: "😽",
      keywords: ["kissing", "besando", "cat", "gato", "kiss", "beso"],
    },
    {
      emoji: "🙀",
      keywords: ["scream", "grito", "cat", "gato", "weary", "cansado"],
    },
    {
      emoji: "😿",
      keywords: ["crying", "llorando", "cat", "gato", "tears", "lágrimas"],
    },
    {
      emoji: "😾",
      keywords: ["pouting", "enojado", "cat", "gato", "angry", "enojado"],
    },
    {
      emoji: "❤️",
      keywords: ["red", "rojo", "heart", "corazón", "love", "amor"],
    },
    {
      emoji: "🧡",
      keywords: ["orange", "naranja", "heart", "corazón", "love", "amor"],
    },
    {
      emoji: "💛",
      keywords: ["yellow", "amarillo", "heart", "corazón", "love", "amor"],
    },
    {
      emoji: "💚",
      keywords: ["green", "verde", "heart", "corazón", "love", "amor"],
    },
    {
      emoji: "💙",
      keywords: ["blue", "azul", "heart", "corazón", "love", "amor"],
    },
    {
      emoji: "💜",
      keywords: ["purple", "morado", "heart", "corazón", "love", "amor"],
    },
    {
      emoji: "🖤",
      keywords: ["black", "negro", "heart", "corazón", "dark", "oscuro"],
    },
    {
      emoji: "🤍",
      keywords: ["white", "blanco", "heart", "corazón", "light", "claro"],
    },
    {
      emoji: "🤎",
      keywords: ["brown", "marrón", "heart", "corazón", "tan", "bronceado"],
    },
    {
      emoji: "💔",
      keywords: ["broken", "roto", "heart", "corazón", "sad", "triste"],
    },
  ];

  // Extraer solo los emojis para compatibilidad
  const emojis = emojisWithKeywords.map((item) => item.emoji);

  // Función para manejar la selección de emoji
  const handleEmojiSelect = useCallback((emoji: string) => {
    setMessageText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  }, []);

  // Función para manejar la selección de mensaje rápido
  const handleQuickMessageSelect = useCallback((message: string) => {
    setMessageText(message);
    setShowQuickMessages(false);
  }, []);

  // Función para abrir el modal de visualización de imágenes
  const handleOpenImageViewer = useCallback(
    (
      attachments: MessageAttachment[],
      messageId: string,
      initialIndex: number = 0,
    ) => {
      setImageViewerAttachments(
        attachments.filter((a) => a.fileType.startsWith("image/")),
      );
      setImageViewerMessageId(messageId);
      setImageViewerCurrentIndex(initialIndex);
      setIsViewingLocalFiles(false);
      setImageViewerLocalFiles([]);
      setImageViewerVisible(true);
    },
    [],
  );

  const handleOpenLocalFilesViewer = useCallback(
    (
      files: Array<{
        name: string;
        size: number;
        type: string;
        uri?: string;
        file?: File;
      }>,
      initialIndex: number = 0,
    ) => {
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      setImageViewerLocalFiles(imageFiles);
      setImageViewerCurrentIndex(initialIndex);
      setIsViewingLocalFiles(true);
      setImageViewerAttachments([]);
      setImageViewerMessageId("");
      setImageViewerVisible(true);
    },
    [],
  );

  const handleCloseImageViewer = useCallback(() => {
    setImageViewerVisible(false);
    setImageViewerAttachments([]);
    setImageViewerMessageId("");
    setImageViewerCurrentIndex(0);
    setImageViewerLocalFiles([]);
    setIsViewingLocalFiles(false);
  }, []);

  const handleNextImage = useCallback(() => {
    const totalImages = isViewingLocalFiles
      ? imageViewerLocalFiles.length
      : imageViewerAttachments.length;
    setImageViewerCurrentIndex((prev) =>
      prev < totalImages - 1 ? prev + 1 : 0,
    );
  }, [
    isViewingLocalFiles,
    imageViewerAttachments.length,
    imageViewerLocalFiles.length,
  ]);

  const handlePrevImage = useCallback(() => {
    const totalImages = isViewingLocalFiles
      ? imageViewerLocalFiles.length
      : imageViewerAttachments.length;
    setImageViewerCurrentIndex((prev) =>
      prev > 0 ? prev - 1 : totalImages - 1,
    );
  }, [
    isViewingLocalFiles,
    imageViewerAttachments.length,
    imageViewerLocalFiles.length,
  ]);

  // Navegación con teclado (solo en web)
  useEffect(() => {
    if (!imageViewerVisible || Platform.OS !== "web") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        handlePrevImage();
      } else if (event.key === "ArrowRight") {
        handleNextImage();
      } else if (event.key === "Escape") {
        handleCloseImageViewer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    imageViewerVisible,
    handlePrevImage,
    handleNextImage,
    handleCloseImageViewer,
  ]);

  const handleDownloadImage = useCallback(
    async (attachment: MessageAttachment) => {
      try {
        const storage = getStorageAdapter();
        const token = await storage.getItem(
          API_CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
        );
        const url = InteraccionesService.getAttachmentUrl(
          imageViewerMessageId,
          attachment.id,
        );

        if (Platform.OS === "web") {
          const response = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const blob = await response.blob();
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = attachment.fileName;
          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(downloadUrl);
          document.body.removeChild(a);
        } else {
          // En React Native, usar expo-file-system o similar
          alert.showInfo("La descarga se iniciará pronto");
        }
      } catch (error) {
        console.error("Error al descargar imagen:", error);
        alert.showError("No se pudo descargar la imagen");
      }
    },
    [imageViewerMessageId, alert],
  );

  // Función para manejar la selección de recomendación
  const handleRecommendationSelect = useCallback(
    (recommendation: Recommendation) => {
      setMessageText(recommendation.message);
      setShowQuickMessages(false);
    },
    [],
  );

  // Ref para rastrear si ya se cargaron las recomendaciones
  const recommendationsLoadedRef = useRef(false);

  // Cargar recomendaciones
  const loadRecommendations = useCallback(async () => {
    if (
      !company?.id ||
      loadingRecommendations ||
      recommendationsLoadedRef.current
    )
      return;

    setLoadingRecommendations(true);
    try {
      const data = await CommercialService.getRecommendations(company.id);
      // Filtrar solo recomendaciones activas (status === 1)
      const activeRecommendations = data.filter((r) => r.status === 1);
      setRecommendations(activeRecommendations);
      recommendationsLoadedRef.current = true;
    } catch (error) {
      console.error("Error al cargar recomendaciones:", error);
      setRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
  }, [company?.id]);

  // Cargar mensajes rápidos desde catálogo
  const loadQuickMessages = useCallback(async () => {
    if (!company?.id || loadingQuickMessages) return;

    setLoadingQuickMessages(true);
    try {
      const catalog = await CatalogService.queryCatalog(
        "QUICK_MESSAGES",
        company.id,
        false,
      );
      // Guardar los detalles completos activos (status === 1)
      const messages = catalog.details.filter((detail) => detail.status === 1);
      setQuickMessages(messages);

      // Guardar el catalogId directamente de la respuesta (ya viene incluido)
      if (catalog.id) {
        setQuickMessagesCatalogId(catalog.id);
      }
    } catch (error) {
      console.error("Error al cargar mensajes rápidos:", error);
      setQuickMessages([]);
    } finally {
      setLoadingQuickMessages(false);
    }
  }, [company?.id]);

  // Cargar mensajes rápidos cuando hay companyId disponible o cuando se abre el panel
  useEffect(() => {
    if (company?.id && !loadingQuickMessages) {
      loadQuickMessages();
    }
  }, [company?.id]);

  // Recargar cuando se abre el panel de mensajes rápidos
  useEffect(() => {
    if (showQuickMessages && company?.id) {
      loadQuickMessages();
    }
  }, [showQuickMessages, company?.id]);

  // Cargar recomendaciones cuando se abre el panel por primera vez
  useEffect(() => {
    if (showQuickMessages && company?.id && !recommendationsLoadedRef.current) {
      loadRecommendations();
    }
  }, [showQuickMessages, company?.id, loadRecommendations]);

  // Estado del panel de información del contacto (oculto en móvil, visible en web por defecto)
  const [showContactInfoPanel, setShowContactInfoPanel] = useState(!isMobile);
  const contactInfoPanelAnim = useRef(
    new Animated.Value(isMobile ? 1 : 0),
  ).current; // 0 = visible, 1 = oculto

  // Etiquetas disponibles (mock)
  const availableTags = [
    { id: "1", label: "Los chillos", color: "#FF6B35" },
    { id: "2", label: "Ecografia", color: "#4ECDC4" },
    { id: "3", label: "Rayos X", color: "#45B7D1" },
    { id: "4", label: "TUMBACO", color: "#96CEB4" },
    { id: "5", label: "Resonancia Magnética", color: "#FFEAA7" },
  ];

  // Cargar contactos
  const loadContacts = useCallback(async () => {
    if (!company?.id || isLoadingContacts) return;

    try {
      setIsLoadingContacts(true);
      setLoading(true);
      const contactsList = await InteraccionesService.getContacts(company.id);

      // Para cada contacto, obtener solo el último mensaje (optimizado)
      const contactsWithMessages = await Promise.all(
        contactsList.map(async (contact) => {
          try {
            // Solo obtener el último mensaje, no todos los mensajes
            const contactMessages =
              await InteraccionesService.getMessagesByContact(contact.id, 1);
            const lastMessage = contactMessages[0] || undefined;

            // Contar mensajes no leídos solo si hay último mensaje y es inbound no leído
            // Para optimizar, solo contamos si el último mensaje es inbound y no leído
            // En una implementación real, el backend debería devolver el count de no leídos
            let unreadCount: number | undefined = undefined;
            if (
              lastMessage &&
              lastMessage.direction === "INBOUND" &&
              lastMessage.status !== "READ"
            ) {
              // Solo si el último mensaje es no leído, hacemos una llamada adicional para contar
              // En producción, esto debería venir del backend
              try {
                const allMessages =
                  await InteraccionesService.getMessagesByContact(contact.id);
                const count = allMessages.filter(
                  (m) => m.direction === "INBOUND" && m.status !== "READ",
                ).length;
                unreadCount = count > 0 ? count : undefined;
              } catch {
                // Si falla, no mostramos contador
                unreadCount = undefined;
              }
            }

            return {
              ...contact,
              lastMessage,
              unreadCount,
            } as ContactWithLastMessage;
          } catch (error) {
            return {
              ...contact,
              lastMessage: undefined,
              unreadCount: undefined,
            } as ContactWithLastMessage;
          }
        }),
      );

      setContacts(sortContactsByLastMessage(contactsWithMessages));
    } catch (error: any) {
      console.error("Error al cargar contactos:", error);
      alert.showError("Error al cargar contactos", error?.message);
    } finally {
      setLoading(false);
      setIsLoadingContacts(false);
    }
  }, [company?.id, sortContactsByLastMessage]);

  // Refresco silencioso e incremental para evitar parpadeos (polling fallback)
  const refreshContactsSilent = useCallback(async () => {
    if (!company?.id || silentContactsSyncingRef.current) return;

    try {
      silentContactsSyncingRef.current = true;
      const contactsList = await InteraccionesService.getContacts(company.id);

      setContacts((prev) => {
        const prevById = new Map(prev.map((c) => [c.id, c]));
        const merged = contactsList.map((contact) => {
          const existing = prevById.get(contact.id);
          if (!existing) {
            return {
              ...contact,
              lastMessage: undefined,
              unreadCount: undefined,
            } as ContactWithLastMessage;
          }
          return {
            ...existing,
            ...contact,
            // Mantener datos de preview para no resetear visualmente la lista
            lastMessage: existing.lastMessage,
            unreadCount: existing.unreadCount,
          } as ContactWithLastMessage;
        });

        const sorted = sortContactsByLastMessage(merged);
        const unchanged =
          prev.length === sorted.length &&
          prev.every((item, index) => {
            const next = sorted[index];
            return (
              item.id === next.id &&
              item.name === next.name &&
              item.phoneNumber === next.phoneNumber &&
              item.botEnabled === next.botEnabled &&
              item.unreadCount === next.unreadCount &&
              item.lastMessage?.id === next.lastMessage?.id &&
              item.lastMessage?.updatedAt === next.lastMessage?.updatedAt
            );
          });

        return unchanged ? prev : sorted;
      });
    } catch {
      // Silencioso por diseño (fallback de resiliencia)
    } finally {
      silentContactsSyncingRef.current = false;
    }
  }, [company?.id, sortContactsByLastMessage]);

  useEffect(() => {
    activeContactIdRef.current = selectedContact?.id ?? null;
  }, [selectedContact?.id]);

  // Ocultar scrollbar visual solo del input de mensaje en web (manteniendo scroll funcional)
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const styleId = "chat-message-input-scrollbar-hidden";
    if (document.getElementById(styleId)) return;

    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.textContent = `
      #chat-message-input {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      #chat-message-input::-webkit-scrollbar {
        width: 0px;
        height: 0px;
      }
    `;
    document.head.appendChild(styleElement);
  }, []);

  // Fallback resiliente: polling suave de contactos
  useEffect(() => {
    if (!company?.id) return;

    const intervalId = setInterval(() => {
      if (!isViewVisible()) return;
      refreshContactsSilent();
    }, 45000);

    return () => clearInterval(intervalId);
  }, [company?.id, isViewVisible, refreshContactsSilent]);

  useEffect(() => {
    let disposed = false;

    const connectSocket = async () => {
      if (!company?.id) return;

      const storage = getStorageAdapter();
      const rawToken = await storage.getItem(
        API_CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
      );
      if (disposed) return;

      const token = rawToken ? String(rawToken).replace(/^Bearer\s+/i, "") : "";
      const wsBaseUrl = API_CONFIG.BASE_URL.replace(/\/api\/?$/, "");

      const socket = io(`${wsBaseUrl}/ws/chat`, {
        transports: ["websocket"],
        reconnection: true,
        auth: token ? { token: `Bearer ${token}` } : undefined,
        extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join.company", { companyId: company.id });
        if (activeContactIdRef.current) {
          socket.emit("join.contact", {
            contactId: activeContactIdRef.current,
          });
        }
      });

      socket.on("message.created", (payload: WsMessageCreatedPayload) => {
        const mappedMessage: Message = {
          id: payload.id,
          contactId: payload.contactId,
          content: payload.content ?? "",
          direction:
            payload.direction?.toLowerCase() === "outbound"
              ? MessageDirection.OUTBOUND
              : MessageDirection.INBOUND,
          status: (payload.status || "SENT").toUpperCase() as any,
          parentMessageId: payload.parentMessageId ?? undefined,
          mediaType: payload.mediaType ?? undefined,
          mediaFilename: payload.mediaFilename ?? undefined,
          isEdited: Boolean(payload.isEdited),
          editedAt: payload.editedAt ?? undefined,
          createdAt: payload.createdAt,
          updatedAt: payload.updatedAt || payload.createdAt,
        };

        setContacts((prev) => {
          const merged = prev.map((contact) => {
            if (contact.id !== payload.contactId) return contact;
            const unreadDelta =
              payload.direction === "inbound" &&
              activeContactIdRef.current !== payload.contactId
                ? 1
                : 0;

            return {
              ...contact,
              unreadCount: Math.max(
                0,
                (contact.unreadCount || 0) + unreadDelta,
              ),
              lastMessage: mappedMessage,
            };
          });
          return sortContactsByLastMessage(merged);
        });

        if (activeContactIdRef.current === payload.contactId) {
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === mappedMessage.id)) return prev;
            const merged = [...prev, mappedMessage];
            merged.sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
            );
            return merged;
          });
          setShouldScrollToEnd(true);
        }
      });

      socket.on("contact.updated", (payload: WsContactUpdatedPayload) => {
        setContacts((prev) => {
          const merged = prev.map((contact) => {
            if (contact.id !== payload.id) return contact;
            return {
              ...contact,
              name: payload.name ?? contact.name,
              phoneNumber: payload.phoneNumber ?? contact.phoneNumber,
              botEnabled:
                typeof payload.botEnabled === "boolean"
                  ? payload.botEnabled
                  : contact.botEnabled,
              lastMessage: payload.lastMessage
                ? {
                    ...contact.lastMessage,
                    id: payload.lastMessage.id,
                    contactId: payload.id,
                    content: payload.lastMessage.content,
                    direction:
                      payload.lastMessage.direction === "outbound"
                        ? MessageDirection.OUTBOUND
                        : MessageDirection.INBOUND,
                    status: contact.lastMessage?.status || "SENT",
                    createdAt: payload.lastMessage.createdAt,
                    updatedAt: payload.lastMessage.createdAt,
                  }
                : contact.lastMessage,
            } as ContactWithLastMessage;
          });
          return sortContactsByLastMessage(merged);
        });

        setSelectedContact((prev) => {
          if (!prev || prev.id !== payload.id) return prev;
          return {
            ...prev,
            name: payload.name ?? prev.name,
            phoneNumber: payload.phoneNumber ?? prev.phoneNumber,
            botEnabled:
              typeof payload.botEnabled === "boolean"
                ? payload.botEnabled
                : prev.botEnabled,
          };
        });
      });
    };

    connectSocket();

    return () => {
      disposed = true;
      const socket = socketRef.current;
      if (socket) {
        if (activeContactIdRef.current) {
          socket.emit("leave.contact", {
            contactId: activeContactIdRef.current,
          });
        }
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [company?.id, sortContactsByLastMessage]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const previousContactId = activeContactIdRef.current;
    const currentContactId = selectedContact?.id ?? null;

    if (
      socket.connected &&
      previousContactId &&
      previousContactId !== currentContactId
    ) {
      socket.emit("leave.contact", { contactId: previousContactId });
    }
    if (
      socket.connected &&
      currentContactId &&
      previousContactId !== currentContactId
    ) {
      socket.emit("join.contact", { contactId: currentContactId });
    }

    activeContactIdRef.current = currentContactId;
  }, [selectedContact?.id]);

  // Obtener userId del contexto
  useEffect(() => {
    const getUserId = async () => {
      try {
        const { ApiConfig } = await import("@/src/infrastructure/api/config");
        const apiConfig = ApiConfig.getInstance();
        const userContext = apiConfig.getUserContext();
        if (userContext?.userId) {
          setCurrentUserId(userContext.userId);
        }
      } catch (error) {
        console.error("Error al obtener userId:", error);
      }
    };
    getUserId();
  }, []);

  // Cargar mensajes de un contacto
  const loadMessages = useCallback(async (contactId: string) => {
    if (loadingMessages) return; // Evitar llamadas duplicadas

    try {
      setLoadingMessages(true);
      const messagesList =
        await InteraccionesService.getMessagesByContact(contactId);
      // Ordenar por fecha (más antiguo primero)
      messagesList.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      setMessages(messagesList);
      setShouldScrollToEnd(true);
    } catch (error: any) {
      console.error("Error al cargar mensajes:", error);
      alert.showError("Error al cargar mensajes", error?.message);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Refresco silencioso del chat activo (merge incremental, sin loaders)
  const refreshMessagesSilent = useCallback(async (contactId: string) => {
    if (silentMessagesSyncingRef.current) return;

    try {
      silentMessagesSyncingRef.current = true;
      const messagesList =
        await InteraccionesService.getMessagesByContact(contactId);

      messagesList.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      let hasNewMessages = false;
      setMessages((prev) => {
        const prevById = new Map(prev.map((m) => [m.id, m]));
        hasNewMessages = messagesList.some((m) => !prevById.has(m.id));

        const unchanged =
          prev.length === messagesList.length &&
          prev.every((item, index) => {
            const next = messagesList[index];
            return (
              item.id === next.id &&
              item.updatedAt === next.updatedAt &&
              item.content === next.content &&
              item.status === next.status
            );
          });

        return unchanged ? prev : messagesList;
      });

      if (hasNewMessages) {
        setShouldScrollToEnd(true);
      }
    } catch {
      // Silencioso por diseño (fallback de resiliencia)
    } finally {
      silentMessagesSyncingRef.current = false;
    }
  }, []);

  // Fallback resiliente: polling del chat activo
  useEffect(() => {
    if (!selectedContact?.id) return;

    const intervalId = setInterval(() => {
      if (!isViewVisible()) return;
      refreshMessagesSilent(selectedContact.id);
    }, 12000);

    return () => clearInterval(intervalId);
  }, [isViewVisible, refreshMessagesSilent, selectedContact?.id]);

  // Editar mensaje
  const handleEditMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!newContent.trim()) {
        alert.showError("El mensaje no puede estar vacío");
        return;
      }

      try {
        const updatedMessage = await InteraccionesService.updateMessage(
          messageId,
          newContent.trim(),
        );

        // Actualizar el mensaje en la lista
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? updatedMessage : msg)),
        );

        setEditingMessageId(null);
        setEditingContent("");
        alert.showSuccess("Mensaje editado correctamente");
      } catch (error: any) {
        console.error("Error al editar mensaje:", error);
        const errorMessage =
          error?.response?.data?.result?.description ||
          error?.message ||
          "No se pudo editar el mensaje";
        alert.showError("Error al editar mensaje", errorMessage);
      }
    },
    [alert],
  );

  // Eliminar mensaje
  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      try {
        await InteraccionesService.deleteMessage(messageId);

        // Remover el mensaje de la lista
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

        setDeletingMessageId(null);
        alert.showSuccess("Mensaje eliminado correctamente");
      } catch (error: any) {
        console.error("Error al eliminar mensaje:", error);
        const errorMessage =
          error?.response?.data?.result?.description ||
          error?.message ||
          "No se pudo eliminar el mensaje";
        alert.showError("Error al eliminar mensaje", errorMessage);
      }
    },
    [alert],
  );

  // Iniciar edición de mensaje (abrir modal)
  const startEditingMessage = useCallback((message: Message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
    setEditModalVisible(true);
    setMessageMenuVisible(null);
  }, []);

  // Cancelar edición
  const cancelEditing = useCallback(() => {
    setEditingMessageId(null);
    setEditingContent("");
    setEditModalVisible(false);
  }, []);

  // Guardar edición desde modal
  const saveEditFromModal = useCallback(async () => {
    if (editingMessageId && editingContent.trim()) {
      await handleEditMessage(editingMessageId, editingContent);
      setEditModalVisible(false);
    }
  }, [editingMessageId, editingContent, handleEditMessage]);

  // Confirmar eliminación
  const confirmDeleteMessage = useCallback(
    (messageId: string) => {
      setMessageMenuVisible(null);
      // Mostrar confirmación
      alert.showConfirm(
        "Eliminar mensaje",
        "¿Estás seguro de que deseas eliminar este mensaje? Esta acción no se puede deshacer.",
        () => {
          handleDeleteMessage(messageId);
        },
        () => {
          // Cancelar
        },
      );
    },
    [handleDeleteMessage, alert],
  );

  // Copiar mensaje al portapapeles
  const handleCopyMessage = useCallback(
    async (content: string) => {
      try {
        await Clipboard.setStringAsync(content);
        alert.showSuccess("Mensaje copiado al portapapeles");
        setMessageMenuVisible(null);
      } catch (error) {
        console.error("Error al copiar:", error);
        alert.showError("Error al copiar mensaje");
      }
    },
    [alert],
  );

  // Responder a un mensaje
  const handleReplyToMessage = useCallback((message: Message) => {
    setReplyingToMessage(message);
    setMessageMenuVisible(null);
  }, []);

  // Cancelar respuesta
  const cancelReply = useCallback(() => {
    setReplyingToMessage(null);
  }, []);

  // Toggle menú contextual
  const toggleMessageMenu = useCallback((messageId: string) => {
    setMessageMenuVisible((prev) => (prev === messageId ? null : messageId));
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    if (!messageMenuVisible) return;

    const handleClickOutside = (event: any) => {
      // En web, verificar si el clic fue fuera del menú
      if (Platform.OS === "web") {
        const target = event.target as HTMLElement;
        if (target) {
          // Verificar si el clic fue en el menú o en el botón de la flecha
          const isClickInMenu = target.closest("[data-message-menu]");
          const isClickInButton = target.closest("[data-message-menu-button]");

          if (!isClickInMenu && !isClickInButton) {
            setMessageMenuVisible(null);
          }
        }
      }
    };

    // En web, usar addEventListener
    if (Platform.OS === "web" && typeof document !== "undefined") {
      // Usar setTimeout para evitar que el clic que abre el menú también lo cierre
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 0);

      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }

    // En móvil, no hay una forma directa de detectar clics fuera sin un overlay
    // Por ahora, el menú se cerrará al seleccionar una opción
  }, [messageMenuVisible]);

  // Cerrar menú de adjuntos al hacer clic fuera
  useEffect(() => {
    if (!showAttachmentMenu) return;

    const handleClickOutsideAttachmentMenu = (event: any) => {
      if (Platform.OS === "web") {
        const target = event.target as HTMLElement;
        if (target) {
          const isClickInMenu = target.closest("[data-attachment-menu]");
          const isClickInButton = target.closest(
            "[data-attachment-menu-button]",
          );

          if (!isClickInMenu && !isClickInButton) {
            setShowAttachmentMenu(false);
          }
        }
      }
    };

    if (Platform.OS === "web" && typeof document !== "undefined") {
      setTimeout(() => {
        document.addEventListener("click", handleClickOutsideAttachmentMenu);
      }, 0);

      return () => {
        document.removeEventListener("click", handleClickOutsideAttachmentMenu);
      };
    }
  }, [showAttachmentMenu]);

  // Seleccionar contacto
  const handleSelectContact = useCallback(
    async (contact: Contact) => {
      setSelectedContact(contact);
      // En móvil, el panel NO se abre automáticamente. En web, sí se abre.
      // En móvil, el panel solo se abre manualmente con el icono
      if (isMobile) {
        setShowContactInfoPanel(false);
      } else {
        setShowContactInfoPanel(true);
      }
      // Cargar mensajes directamente sin depender del callback
      try {
        setLoadingMessages(true);
        const messagesList = await InteraccionesService.getMessagesByContact(
          contact.id,
        );
        messagesList.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        setMessages(messagesList);
        setShouldScrollToEnd(true);
      } catch (error: any) {
        console.error("Error al cargar mensajes:", error);
        alert.showError("Error al cargar mensajes", error?.message);
      } finally {
        setLoadingMessages(false);
      }
    },
    [isMobile],
  );

  const handleToggleBotEnabled = useCallback(async () => {
    if (!selectedContact?.id || updatingBotEnabled) return;

    const currentValue = selectedContact.botEnabled ?? true;
    const nextValue = !currentValue;
    const contactId = selectedContact.id;

    // Optimistic UI en contacto seleccionado
    setSelectedContact((prev) =>
      prev && prev.id === contactId ? { ...prev, botEnabled: nextValue } : prev,
    );
    // Optimistic UI en listado de contactos
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === contactId
          ? { ...contact, botEnabled: nextValue }
          : contact,
      ),
    );

    try {
      setUpdatingBotEnabled(true);
      const updatedContact = await InteraccionesService.updateContact(
        contactId,
        {
          botEnabled: nextValue,
        },
      );

      // Sincronizar con respuesta real del backend
      setSelectedContact((prev) =>
        prev && prev.id === contactId
          ? {
              ...prev,
              ...updatedContact,
              botEnabled: updatedContact.botEnabled ?? nextValue,
            }
          : prev,
      );
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === contactId
            ? {
                ...contact,
                ...updatedContact,
                botEnabled: updatedContact.botEnabled ?? nextValue,
              }
            : contact,
        ),
      );
    } catch (error: any) {
      // Rollback si falla la persistencia
      setSelectedContact((prev) =>
        prev && prev.id === contactId
          ? { ...prev, botEnabled: currentValue }
          : prev,
      );
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === contactId
            ? { ...contact, botEnabled: currentValue }
            : contact,
        ),
      );
      alert.showError(
        "No se pudo actualizar el estado del bot",
        error?.message,
      );
    } finally {
      setUpdatingBotEnabled(false);
    }
  }, [alert, selectedContact, updatingBotEnabled]);

  // Solicitar permisos para expo-image-picker
  useEffect(() => {
    if (Platform.OS !== "web") {
      (async () => {
        try {
          const ImagePicker = await import("expo-image-picker");
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            console.warn("Permisos de galería no otorgados");
          }
        } catch (error) {
          console.error("Error al solicitar permisos:", error);
        }
      })();
    }
  }, []);

  // Comprimir imagen en web usando canvas
  const compressImageWeb = useCallback(
    (file: File, maxWidth = 1920, quality = 0.8): Promise<File> => {
      return new Promise((resolve) => {
        if (!file.type.startsWith("image/") || Platform.OS !== "web") {
          resolve(file); // No comprimir si no es imagen o no es web
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const img = document.createElement("img");
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;

            // Redimensionar si es necesario
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(file); // Si falla, devolver original
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  resolve(file); // Si falla, devolver original
                  return;
                }
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                });
                resolve(compressedFile);
              },
              file.type,
              quality,
            );
          };
          img.onerror = () => resolve(file); // Si falla, devolver original
          if (e.target?.result) {
            img.src = e.target.result as string;
          }
        };
        reader.onerror = () => resolve(file); // Si falla, devolver original
        reader.readAsDataURL(file);
      });
    },
    [],
  );

  // Seleccionar archivos con expo-image-picker (React Native)
  const pickImagesRN = useCallback(async () => {
    if (Platform.OS === "web") {
      // En web, usar input HTML
      if (mediaInputRef.current) {
        mediaInputRef.current.click();
      }
      return;
    }

    try {
      const ImagePicker = await import("expo-image-picker");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8, // Comprimir al seleccionar
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map((asset: any) => {
          const fileExtension = asset.uri.split(".").pop() || "jpg";
          const fileName =
            asset.fileName ||
            `file_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;

          return {
            name: fileName,
            size: asset.fileSize || 0,
            type: asset.mimeType || "image/jpeg",
            uri: asset.uri,
          };
        });

        setAttachedFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error("Error al seleccionar archivos:", error);
      alert.showError("Error al seleccionar archivos");
    }
  }, [alert]);

  // Enviar mensaje con progreso usando XMLHttpRequest
  const sendMessageWithProgress = useCallback(
    async (
      payload: any,
      files: Array<File | { uri: string; type: string; name: string }>,
      onProgress: (progress: number) => void,
    ): Promise<Message> => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();

        // Agregar campos del mensaje
        formData.append("contactId", payload.contactId);
        formData.append("content", payload.content || "");
        formData.append("direction", payload.direction);
        if (payload.status) {
          formData.append("status", payload.status);
        }

        // Agregar archivos según la plataforma
        files.forEach((file) => {
          if (Platform.OS === "web") {
            const webFile = file as File;
            formData.append("files", webFile);
          } else {
            const rnFile = file as { uri: string; type: string; name: string };
            formData.append("files", {
              uri:
                Platform.OS === "ios"
                  ? rnFile.uri.replace("file://", "")
                  : rnFile.uri,
              type: rnFile.type,
              name: rnFile.name,
            } as any);
          }
        });

        const xhr = new XMLHttpRequest();

        // Obtener configuración y token
        Promise.all([
          import("@/src/infrastructure/api/config").then((m) =>
            m.ApiConfig.getInstance(),
          ),
          getStorageAdapter().getItem(API_CONFIG.STORAGE_KEYS.ACCESS_TOKEN),
        ])
          .then(([apiConfig, token]) => {
            const baseUrl = apiConfig.getBaseUrl();
            const url = `${baseUrl}/interacciones/messages`;

            xhr.upload.addEventListener("progress", (event) => {
              if (event.lengthComputable) {
                const progress = (event.loaded / event.total) * 100;
                onProgress(progress);
              }
            });

            xhr.addEventListener("load", () => {
              if (xhr.status === 201 || xhr.status === 200) {
                try {
                  const response = JSON.parse(xhr.responseText);
                  if (response.result?.statusCode === 200) {
                    resolve(response.data);
                  } else {
                    reject(
                      new Error(
                        response.result?.description ||
                          "Error al enviar mensaje",
                      ),
                    );
                  }
                } catch (error) {
                  reject(new Error("Error al parsear respuesta"));
                }
              } else {
                reject(new Error(`Error HTTP: ${xhr.status}`));
              }
            });

            xhr.addEventListener("error", () => {
              reject(new Error("Error de red"));
            });

            xhr.open("POST", url);
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);

            // Agregar otros headers necesarios
            const userContext = apiConfig.getUserContext();
            if (userContext?.companyCode) {
              xhr.setRequestHeader("company-code", userContext.companyCode);
            }
            if (userContext?.userId) {
              xhr.setRequestHeader("user-id", userContext.userId);
            }
            xhr.setRequestHeader("app-source", "mobile");
            xhr.setRequestHeader("Accept-Language", "es");

            xhr.send(formData);
          })
          .catch(reject);
      });
    },
    [],
  );

  // Mapeo de iconos locales de archivos
  // IMPORTANTE: Coloca los archivos PNG en assets/images/file-icons/
  // Si los archivos no existen, comenta las líneas de require() correspondientes
  // Archivos requeridos: pdf.png, word.png, excel.png, powerpoint.png
  // Puedes descargarlos desde: https://www.flaticon.com/, https://icons8.com/, etc.
  const fileIcons: Record<string, any> = {};

  // Descomenta estas líneas cuando agregues los archivos PNG correspondientes:
  // fileIcons.pdf = require('@/assets/images/file-icons/pdf.png');
  // fileIcons.word = require('@/assets/images/file-icons/word.png');
  // fileIcons.excel = require('@/assets/images/file-icons/excel.png');
  // fileIcons.powerpoint = require('@/assets/images/file-icons/powerpoint.png');

  // Obtener icono y color según el tipo de archivo
  const getFileIcon = useCallback(
    (
      fileName: string,
      fileType: string,
    ): { iconSource?: any; icon?: string; color: string } => {
      const extension = fileName.split(".").pop()?.toLowerCase() || "";

      // PDF - Rojo - Usar icono local de PDF
      if (extension === "pdf" || fileType === "application/pdf") {
        return fileIcons.pdf
          ? { iconSource: fileIcons.pdf, color: "#DC143C" }
          : { icon: "document-text", color: "#DC143C" };
      }

      // Word (DOC, DOCX) - Azul Microsoft - Usar icono local de Word
      if (
        extension === "doc" ||
        extension === "docx" ||
        fileType.includes("msword") ||
        fileType.includes("wordprocessingml")
      ) {
        return fileIcons.word
          ? { iconSource: fileIcons.word, color: "#2B579A" }
          : { icon: "document-text", color: "#2B579A" };
      }

      // Excel (XLS, XLSX) - Verde - Usar icono local de Excel
      if (
        extension === "xls" ||
        extension === "xlsx" ||
        fileType.includes("spreadsheetml") ||
        fileType.includes("excel")
      ) {
        return fileIcons.excel
          ? { iconSource: fileIcons.excel, color: "#217346" }
          : { icon: "grid", color: "#217346" };
      }

      // PowerPoint (PPT, PPTX) - Naranja - Usar icono local de PowerPoint
      if (
        extension === "ppt" ||
        extension === "pptx" ||
        fileType.includes("presentationml")
      ) {
        return fileIcons.powerpoint
          ? { iconSource: fileIcons.powerpoint, color: "#D04423" }
          : { icon: "easel", color: "#D04423" };
      }

      // Imágenes (aunque no debería llegar aquí para archivos no-imagen)
      if (fileType.startsWith("image/")) {
        return { icon: "image-outline", color: "#4CAF50" };
      }

      // Videos
      if (fileType.startsWith("video/")) {
        return { icon: "videocam-outline", color: "#9C27B0" };
      }

      // Audio
      if (fileType.startsWith("audio/")) {
        return { icon: "musical-notes-outline", color: "#FF9800" };
      }

      // Archivos de texto
      if (extension === "txt" || fileType.includes("text/")) {
        return { icon: "document-text-outline", color: "#607D8B" };
      }

      // Archivos comprimidos
      if (
        extension === "zip" ||
        extension === "rar" ||
        extension === "7z" ||
        fileType.includes("zip") ||
        fileType.includes("rar")
      ) {
        return { icon: "archive-outline", color: "#795548" };
      }

      // Por defecto: documento genérico
      return { icon: "document-outline", color: "#757575" };
    },
    [],
  );

  // Validar archivos antes de enviar
  const validateFiles = useCallback((): boolean => {
    const MAX_FILES = 10;
    const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB

    if (attachedFiles.length > MAX_FILES) {
      alert.showError(`Máximo ${MAX_FILES} archivos por mensaje`);
      return false;
    }

    const totalSize = attachedFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      alert.showError(
        `El tamaño total de los archivos (${(totalSize / 1024 / 1024).toFixed(2)}MB) excede el límite de 50MB`,
      );
      return false;
    }

    return true;
  }, [attachedFiles, alert]);

  // Enviar mensaje con FormData (nuevo sistema)
  const handleSendMessage = useCallback(async () => {
    // Permitir enviar si hay texto O archivos adjuntos
    if (
      !selectedContact ||
      (!messageText.trim() && attachedFiles.length === 0) ||
      !company?.id ||
      sendingMessage
    ) {
      return;
    }

    // Validar archivos si hay
    if (attachedFiles.length > 0 && !validateFiles()) {
      return;
    }

    try {
      setSendingMessage(true);
      setIsUploading(attachedFiles.length > 0);
      setUploadProgress(0);

      // Preparar archivos para enviar (comprimir imágenes en web)
      const filesToSend: Array<
        File | { uri: string; type: string; name: string }
      > = [];

      if (attachedFiles.length > 0) {
        if (Platform.OS === "web") {
          // Web: comprimir imágenes y usar File
          for (const attachedFile of attachedFiles) {
            if (attachedFile.file) {
              if (attachedFile.file.type.startsWith("image/")) {
                const compressed = await compressImageWeb(attachedFile.file);
                filesToSend.push(compressed);
              } else {
                filesToSend.push(attachedFile.file);
              }
            }
          }
        } else {
          // React Native: usar formato específico (ya comprimido por expo-image-picker con quality: 0.8)
          attachedFiles.forEach((attachedFile) => {
            filesToSend.push({
              uri: attachedFile.uri || "",
              type: attachedFile.type,
              name: attachedFile.name,
            });
          });
        }
      }

      // Verificar que si hay archivos adjuntos, se hayan procesado correctamente
      if (attachedFiles.length > 0 && filesToSend.length === 0) {
        alert.showError(
          "Error al procesar archivos adjuntos. Por favor, inténtalo de nuevo.",
        );
        setSendingMessage(false);
        setIsUploading(false);
        return;
      }

      // Enviar con progreso si hay archivos, sino usar método normal
      if (filesToSend.length > 0) {
        await sendMessageWithProgress(
          {
            contactId: selectedContact.id,
            direction: MessageDirection.OUTBOUND,
            content: messageText.trim() || "",
            status: "SENT" as any,
            parentMessageId: replyingToMessage?.id,
          },
          filesToSend,
          (progress) => {
            setUploadProgress(progress);
          },
        );
      } else if (messageText.trim()) {
        // Sin archivos pero con texto: usar método normal
        await InteraccionesService.createMessage({
          contactId: selectedContact.id,
          direction: MessageDirection.OUTBOUND,
          content: messageText.trim(),
          status: "SENT" as any,
          parentMessageId: replyingToMessage?.id,
        });
      } else {
        // Sin archivos ni texto: no debería llegar aquí, pero por seguridad
        alert.showError("No hay contenido para enviar");
        setSendingMessage(false);
        return;
      }

      // Limpiar después de enviar
      setMessageText("");
      setMessageInputHeight(minHeight);
      setAttachedFiles([]);
      setReplyingToMessage(null); // Limpiar respuesta

      // Recargar mensajes del contacto actual directamente
      if (selectedContact.id) {
        try {
          setLoadingMessages(true);
          const messagesList = await InteraccionesService.getMessagesByContact(
            selectedContact.id,
          );
          messagesList.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
          setMessages(messagesList);
          setShouldScrollToEnd(true);
        } catch (error) {
          console.error("Error al recargar mensajes:", error);
        } finally {
          setLoadingMessages(false);
        }
      }

      // Recargar contactos para actualizar último mensaje (solo si no está cargando)
      if (!isLoadingContacts && company?.id) {
        // Llamar directamente sin usar el callback para evitar dependencias
        try {
          setIsLoadingContacts(true);
          const contactsList = await InteraccionesService.getContacts(
            company.id,
          );
          const contactsWithMessages = await Promise.all(
            contactsList.map(async (contact) => {
              try {
                const contactMessages =
                  await InteraccionesService.getMessagesByContact(
                    contact.id,
                    1,
                  );
                const lastMessage = contactMessages[0] || undefined;
                return {
                  ...contact,
                  lastMessage,
                  unreadCount: undefined, // Simplificado para evitar llamadas adicionales
                } as ContactWithLastMessage;
              } catch {
                return {
                  ...contact,
                  lastMessage: undefined,
                  unreadCount: undefined,
                } as ContactWithLastMessage;
              }
            }),
          );
          contactsWithMessages.sort((a, b) => {
            if (!a.lastMessage && !b.lastMessage) return 0;
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return (
              new Date(b.lastMessage.createdAt).getTime() -
              new Date(a.lastMessage.createdAt).getTime()
            );
          });
          setContacts(contactsWithMessages);
        } catch (error) {
          console.error("Error al recargar contactos:", error);
        } finally {
          setIsLoadingContacts(false);
        }
      }
    } catch (error: any) {
      console.error("Error al enviar mensaje:", error);
      alert.showError("Error al enviar mensaje", error?.message);
    } finally {
      setSendingMessage(false);
    }
  }, [
    selectedContact,
    messageText,
    attachedFiles,
    company?.id,
    sendingMessage,
    isLoadingContacts,
    validateFiles,
    compressImageWeb,
    sendMessageWithProgress,
    minHeight,
    alert,
  ]);

  // Efecto inicial - solo cargar una vez cuando se monta el componente
  useEffect(() => {
    if (company?.id && !isLoadingContacts && contacts.length === 0) {
      loadContacts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  // Filtrar contactos por búsqueda y filtros
  const filteredContacts = contacts.filter((contact) => {
    // Filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        contact.name.toLowerCase().includes(query) ||
        contact.phoneNumber.includes(query) ||
        (contact.email && contact.email.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Filtros específicos
    switch (contactFilter) {
      case "unread":
        return (contact.unreadCount && contact.unreadCount > 0) || false;
      case "favorites":
        // Mock: asumimos que favoritos tienen un tag especial
        return contact.tags?.includes("favorite") || false;
      case "all":
      default:
        return true;
    }
  });

  // Filtrar mensajes por búsqueda
  const filteredMessages = messageSearchQuery.trim()
    ? messages.filter((msg) =>
        msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase()),
      )
    : messages;

  // Animación del buscador de mensajes
  useEffect(() => {
    Animated.timing(messageSearchWidthAnim, {
      toValue: showMessageSearch ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [showMessageSearch, messageSearchWidthAnim]);

  // Animación del panel de información del contacto
  useEffect(() => {
    Animated.timing(contactInfoPanelAnim, {
      toValue: showContactInfoPanel ? 0 : 1, // 0 = visible, 1 = oculto
      duration: 300,
      useNativeDriver: false, // Necesario para animar width
    }).start();
  }, [showContactInfoPanel, contactInfoPanelAnim]);

  // Navegación con teclado en el modal de imágenes (solo en web)
  useEffect(() => {
    if (!imageViewerVisible || Platform.OS !== "web") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        handlePrevImage();
      } else if (event.key === "ArrowRight") {
        handleNextImage();
      } else if (event.key === "Escape") {
        handleCloseImageViewer();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [
    imageViewerVisible,
    handlePrevImage,
    handleNextImage,
    handleCloseImageViewer,
  ]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerShown: false,
        }}
      />
      <ThemedView style={styles.container}>
        <View
          style={[
            styles.layout,
            {
              backgroundColor: colors.background,
              flexDirection: isMobile ? "column" : "row",
            },
          ]}
        >
          {/* Panel izquierdo: Lista de contactos */}
          {(!isMobile || !selectedContact) && (
            <View
              style={[
                styles.contactsPanel,
                { backgroundColor: colors.filterInputBackground },
                isMobile && { width: "100%", borderRightWidth: 0 },
              ]}
            >
              {/* Barra de búsqueda */}
              <View style={[styles.searchBar]}>
                <View style={{ position: "relative" }}>
                  <Ionicons
                    name="search"
                    size={18}
                    color={colors.textSecondary}
                    style={{
                      position: "absolute",
                      left: 10,
                      top: 10,
                      zIndex: 1,
                    }}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery("")}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: 8,
                        zIndex: 1,
                        padding: 4,
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  )}
                  <InputWithFocus
                    containerStyle={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 6,
                      backgroundColor: colors.background,
                      paddingLeft: 36,
                      paddingRight: searchQuery.length > 0 ? 36 : 10,
                      height: 36,
                    }}
                    primaryColor={colors.primary}
                  >
                    <TextInput
                      placeholder="Buscar..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      style={{
                        padding: 8,
                        color: colors.text,
                        fontSize: 14,
                      }}
                      placeholderTextColor={colors.textSecondary}
                    />
                  </InputWithFocus>
                </View>
              </View>

              {/* Filtros de contactos */}
              <View style={[styles.filtersContainer]}>
                <View style={styles.filtersScroll}>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      {
                        backgroundColor:
                          contactFilter === "all"
                            ? colors.primary
                            : colors.filterInputBackground,
                        borderColor:
                          contactFilter === "all"
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                    onPress={() => setContactFilter("all")}
                  >
                    <ThemedText
                      type="caption"
                      style={{
                        color:
                          contactFilter === "all" ? "#FFFFFF" : colors.text,
                        fontWeight: contactFilter === "all" ? "600" : "400",
                      }}
                    >
                      Todos
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      {
                        backgroundColor:
                          contactFilter === "unread"
                            ? colors.primary
                            : colors.filterInputBackground,
                        borderColor:
                          contactFilter === "unread"
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                    onPress={() => setContactFilter("unread")}
                  >
                    <ThemedText
                      type="caption"
                      style={{
                        color:
                          contactFilter === "unread" ? "#FFFFFF" : colors.text,
                        fontWeight: contactFilter === "unread" ? "600" : "400",
                      }}
                    >
                      No leídos
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      {
                        backgroundColor:
                          contactFilter === "favorites"
                            ? colors.primary
                            : colors.filterInputBackground,
                        borderColor:
                          contactFilter === "favorites"
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                    onPress={() => setContactFilter("favorites")}
                  >
                    <ThemedText
                      type="caption"
                      style={{
                        color:
                          contactFilter === "favorites"
                            ? "#FFFFFF"
                            : colors.text,
                        fontWeight:
                          contactFilter === "favorites" ? "600" : "400",
                      }}
                    >
                      Favoritos
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Lista de contactos */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <ThemedText
                    type="body2"
                    style={{ marginTop: 16, color: colors.textSecondary }}
                  >
                    Cargando contactos...
                  </ThemedText>
                </View>
              ) : filteredContacts.length === 0 ? (
                <View
                  style={[
                    styles.emptyContainer,
                    { backgroundColor: "transparent" },
                  ]}
                >
                  <Ionicons
                    name="chatbubbles-outline"
                    size={48}
                    color={colors.textSecondary}
                  />
                  <ThemedText
                    type="body2"
                    style={{
                      marginTop: 16,
                      color: colors.textSecondary,
                      textAlign: "center",
                    }}
                  >
                    {searchQuery
                      ? "No se encontraron contactos"
                      : "No hay contactos aún"}
                  </ThemedText>
                </View>
              ) : (
                <ScrollView
                  style={styles.contactsList}
                  showsVerticalScrollIndicator={false}
                >
                  {filteredContacts.map((contact) => {
                    const isSelected = selectedContact?.id === contact.id;
                    const isLastInbound =
                      String(
                        contact.lastMessage?.direction || "",
                      ).toUpperCase() === "INBOUND";
                    const showBotStatusDot = isLastInbound;
                    const botStatusDotColor =
                      contact.botEnabled === false
                        ? colors.secondary
                        : isDark
                          ? colors.textSecondary
                          : colors.chatOutboundBackground;
                    return (
                      <TouchableOpacity
                        key={contact.id}
                        style={[
                          styles.contactItem,
                          {
                            backgroundColor: isSelected
                              ? colors.primary + "20"
                              : "transparent",
                            borderLeftColor: isSelected
                              ? colors.primary
                              : "transparent",
                          },
                        ]}
                        onPress={() => handleSelectContact(contact)}
                      >
                        <View
                          style={[
                            styles.contactAvatar,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <ThemedText type="h4" style={{ color: "#FFFFFF" }}>
                            {contact.name.charAt(0).toUpperCase()}
                          </ThemedText>
                        </View>
                        <View style={styles.contactInfo}>
                          <View style={styles.contactHeader}>
                            <View style={styles.contactNameRow}>
                              <ThemedText
                                type="body2"
                                style={{
                                  fontWeight: "600",
                                  color: colors.text,
                                }}
                                numberOfLines={1}
                              >
                                {contact.name}
                              </ThemedText>
                            </View>
                            <View style={styles.contactHeaderRight}>
                              <View style={styles.contactRobotSlot}>
                                {contact.botEnabled === true && (
                                  <DynamicIcon
                                    name="FontAwesome5:robot"
                                    size={12}
                                    color={colors.textSecondary}
                                  />
                                )}
                              </View>
                              {contact.lastMessage && (
                                <ThemedText
                                  type="caption"
                                  style={[
                                    styles.contactTimeText,
                                    { color: colors.textSecondary },
                                  ]}
                                >
                                  {formatRelativeTime(
                                    contact.lastMessage.createdAt,
                                  )}
                                </ThemedText>
                              )}
                            </View>
                          </View>
                          <View style={styles.contactFooter}>
                            <ThemedText
                              type="caption"
                              style={{ color: colors.textSecondary, flex: 1 }}
                              numberOfLines={1}
                            >
                              {contact.lastMessage?.content ||
                                contact.phoneNumber}
                            </ThemedText>
                            {showBotStatusDot && (
                              <View
                                style={[
                                  styles.botStatusDot,
                                  { backgroundColor: botStatusDotColor },
                                ]}
                              />
                            )}
                            {contact.unreadCount && contact.unreadCount > 0 && (
                              <View
                                style={[
                                  styles.unreadBadge,
                                  { backgroundColor: colors.primary },
                                ]}
                              >
                                <ThemedText
                                  type="caption"
                                  style={{
                                    color: "#FFFFFF",
                                    fontWeight: "600",
                                  }}
                                >
                                  {contact.unreadCount > 99
                                    ? "99+"
                                    : contact.unreadCount}
                                </ThemedText>
                              </View>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          )}

          {/* Panel derecho: Chat */}
          {(!isMobile || selectedContact) &&
            (selectedContact ? (
              <View
                style={[
                  styles.chatPanel,
                  { backgroundColor: colors.background },
                ]}
              >
                {/* Header del chat */}
                <View
                  style={[
                    styles.chatHeader,
                    {
                      backgroundColor: colors.filterInputBackground,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.chatHeaderInfo}>
                    {/* Botón de regresar - Solo en móvil */}
                    {isMobile && (
                      <TouchableOpacity
                        onPress={() => setSelectedContact(null)}
                        style={styles.backButton}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="arrow-back"
                          size={24}
                          color={colors.text}
                        />
                      </TouchableOpacity>
                    )}
                    <View
                      style={[
                        styles.chatAvatar,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <ThemedText type="h4" style={{ color: "#FFFFFF" }}>
                        {selectedContact.name.charAt(0).toUpperCase()}
                      </ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText
                        type="body2"
                        style={{ fontWeight: "600", color: colors.text }}
                      >
                        {selectedContact.name}
                      </ThemedText>
                      <ThemedText
                        type="caption"
                        style={{ color: colors.textSecondary }}
                      >
                        {selectedContact.phoneNumber}
                      </ThemedText>
                      {/* Etiquetas del contacto */}
                      {selectedContact.tags &&
                        selectedContact.tags.length > 0 && (
                          <View style={styles.contactTagsRow}>
                            {selectedContact.tags.map((tagId) => {
                              const tag = availableTags.find(
                                (t) => t.id === tagId,
                              );
                              if (!tag) return null;
                              return (
                                <View
                                  key={tagId}
                                  style={[
                                    styles.contactTag,
                                    { backgroundColor: tag.color },
                                  ]}
                                >
                                  <ThemedText
                                    type="caption"
                                    style={{ color: "#FFFFFF", fontSize: 10 }}
                                  >
                                    {tag.label}
                                  </ThemedText>
                                </View>
                              );
                            })}
                          </View>
                        )}
                    </View>
                  </View>
                  <View style={styles.chatHeaderActions}>
                    {/* Botón de activar/desactivar Chat IA */}
                    <Tooltip
                      text={
                        (selectedContact?.botEnabled ?? true)
                          ? "Desactivar Chat IA"
                          : "Activar Chat IA"
                      }
                      position="bottom"
                    >
                      <TouchableOpacity
                        onPress={handleToggleBotEnabled}
                        style={styles.chatIAToggle}
                        disabled={updatingBotEnabled}
                      >
                        <DynamicIcon
                          name="FontAwesome5:robot"
                          size={24}
                          color={
                            (selectedContact?.botEnabled ?? true)
                              ? colors.primary
                              : colors.textSecondary
                          }
                        />
                      </TouchableOpacity>
                    </Tooltip>
                    {/* Búsqueda en mensajes (expandible horizontalmente en web, solo icono en móvil) */}
                    {!isMobile ? (
                      <Animated.View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          height: 40,
                          marginLeft: 8,
                          overflow: "hidden",
                          width: messageSearchWidthAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [40, 250],
                          }),
                        }}
                      >
                        {showMessageSearch ? (
                          <View
                            style={{
                              flex: 1,
                              flexDirection: "row",
                              alignItems: "center",
                              position: "relative",
                            }}
                          >
                            <Ionicons
                              name="search"
                              size={18}
                              color={colors.textSecondary}
                              style={{
                                position: "absolute",
                                left: 10,
                                top: 11,
                                zIndex: 1,
                              }}
                            />
                            {messageSearchQuery.length > 0 && (
                              <TouchableOpacity
                                onPress={() => setMessageSearchQuery("")}
                                style={{
                                  position: "absolute",
                                  right: 10,
                                  top: 9,
                                  zIndex: 1,
                                  padding: 4,
                                }}
                                activeOpacity={0.7}
                              >
                                <Ionicons
                                  name="close-circle"
                                  size={18}
                                  color={colors.textSecondary}
                                />
                              </TouchableOpacity>
                            )}
                            <InputWithFocus
                              containerStyle={{
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 6,
                                backgroundColor: colors.background,
                                paddingLeft: 36,
                                paddingRight:
                                  messageSearchQuery.length > 0 ? 36 : 10,
                                height: 36,
                                flex: 1,
                              }}
                              primaryColor={colors.primary}
                            >
                              <TextInput
                                placeholder="Buscar en mensajes..."
                                value={messageSearchQuery}
                                onChangeText={setMessageSearchQuery}
                                style={{
                                  padding: 8,
                                  color: colors.text,
                                  fontSize: 14,
                                }}
                                placeholderTextColor={colors.textSecondary}
                                autoFocus
                              />
                            </InputWithFocus>
                            <TouchableOpacity
                              onPress={() => {
                                setShowMessageSearch(false);
                                setMessageSearchQuery("");
                              }}
                              style={{
                                marginLeft: 8,
                                width: 40,
                                height: 40,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Ionicons
                                name="close"
                                size={20}
                                color={colors.textSecondary}
                              />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => setShowMessageSearch(true)}
                            style={{
                              width: 40,
                              height: 40,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Ionicons
                              name="search"
                              size={20}
                              color={colors.textSecondary}
                            />
                          </TouchableOpacity>
                        )}
                      </Animated.View>
                    ) : (
                      // En móvil, solo mostrar el icono de búsqueda
                      <TouchableOpacity
                        onPress={() => {
                          if (showMessageSearch) {
                            setShowMessageSearch(false);
                            setMessageSearchQuery("");
                          } else {
                            setShowMessageSearch(true);
                          }
                        }}
                        style={{
                          width: 40,
                          height: 40,
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: 8,
                        }}
                      >
                        <Ionicons
                          name="search"
                          size={20}
                          color={
                            showMessageSearch
                              ? colors.primary
                              : colors.textSecondary
                          }
                        />
                      </TouchableOpacity>
                    )}
                    {/* Botón de información del cliente - Solo visible cuando el panel está cerrado */}
                    {!showContactInfoPanel && (
                      <Tooltip text="Información del cliente" position="bottom">
                        <TouchableOpacity
                          onPress={() => setShowContactInfoPanel(true)}
                          style={styles.chatIAToggle}
                        >
                          <Ionicons
                            name="person-outline"
                            size={24}
                            color={colors.textSecondary}
                          />
                        </TouchableOpacity>
                      </Tooltip>
                    )}
                  </View>
                </View>

                {/* Barra de búsqueda debajo del header - Solo en móvil */}
                {isMobile && showMessageSearch && (
                  <Animated.View
                    style={[
                      styles.mobileSearchBar,
                      {
                        backgroundColor: colors.filterInputBackground,
                        borderBottomColor: colors.border,
                        opacity: messageSearchWidthAnim,
                        maxHeight: messageSearchWidthAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 60],
                        }),
                      },
                    ]}
                  >
                    <View
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        position: "relative",
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                      }}
                    >
                      <Ionicons
                        name="search"
                        size={18}
                        color={colors.textSecondary}
                        style={{
                          position: "absolute",
                          left: 26,
                          top: 20,
                          zIndex: 1,
                        }}
                      />
                      {messageSearchQuery.length > 0 && (
                        <TouchableOpacity
                          onPress={() => setMessageSearchQuery("")}
                          style={{
                            position: "absolute",
                            right: 26,
                            top: 18,
                            zIndex: 1,
                            padding: 4,
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="close-circle"
                            size={18}
                            color={colors.textSecondary}
                          />
                        </TouchableOpacity>
                      )}
                      <InputWithFocus
                        containerStyle={{
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 6,
                          backgroundColor: colors.filterInputBackground,
                          paddingLeft: 36,
                          paddingRight: messageSearchQuery.length > 0 ? 36 : 10,
                          height: 36,
                          flex: 1,
                        }}
                        primaryColor={colors.primary}
                      >
                        <TextInput
                          placeholder="Buscar en mensajes..."
                          value={messageSearchQuery}
                          onChangeText={setMessageSearchQuery}
                          style={{
                            padding: 8,
                            color: colors.text,
                            fontSize: 14,
                          }}
                          placeholderTextColor={colors.textSecondary}
                          autoFocus
                        />
                      </InputWithFocus>
                      <TouchableOpacity
                        onPress={() => {
                          setShowMessageSearch(false);
                          setMessageSearchQuery("");
                        }}
                        style={{
                          marginLeft: 8,
                          width: 40,
                          height: 40,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons
                          name="close"
                          size={20}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                )}

                {/* Área de mensajes con fondo de chat */}
                <ImageBackground
                  source={{ uri: CHAT_BACKGROUND_URI }}
                  style={styles.messagesAreaBackground}
                  imageStyle={styles.messagesAreaBackgroundImage}
                  resizeMode="repeat"
                >
                  {loadingMessages ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                  ) : (
                    <ScrollView
                      ref={messagesScrollRef}
                      style={styles.messagesArea}
                      contentContainerStyle={styles.messagesContent}
                      showsVerticalScrollIndicator={false}
                      onContentSizeChange={() => {
                        // Hacer scroll al final solo cuando se debe (al cargar o enviar mensaje)
                        if (shouldScrollToEnd && messagesScrollRef.current) {
                          messagesScrollRef.current.scrollToEnd({
                            animated: false,
                          });
                          setShouldScrollToEnd(false);
                        }
                      }}
                      onScrollBeginDrag={() => {
                        // Cerrar menú al hacer scroll
                        if (messageMenuVisible) {
                          setMessageMenuVisible(null);
                        }
                      }}
                    >
                      {messages.length === 0 ? (
                        <View
                          style={[
                            styles.emptyMessages,
                            { backgroundColor: "transparent" },
                          ]}
                        >
                          <Ionicons
                            name="chatbubble-outline"
                            size={48}
                            color={colors.textSecondary}
                          />
                          <ThemedText
                            type="body2"
                            style={{
                              marginTop: 16,
                              color: colors.textSecondary,
                              textAlign: "center",
                            }}
                          >
                            No hay mensajes aún
                          </ThemedText>
                        </View>
                      ) : (
                        <>
                          {filteredMessages.map((message) => {
                            // El backend devuelve direction en minúsculas: "inbound" o "outbound"
                            const directionStr = String(
                              message.direction,
                            ).toLowerCase();
                            const isOutbound = directionStr === "outbound";
                            const isLastMessage =
                              message ===
                              filteredMessages[filteredMessages.length - 1];
                            const canEdit =
                              isOutbound &&
                              currentUserId &&
                              message.createdBy === currentUserId;
                            const canDelete =
                              isOutbound &&
                              currentUserId &&
                              message.createdBy === currentUserId;
                            const showMenu = messageMenuVisible === message.id;

                            return (
                              <View
                                key={message.id}
                                id={
                                  Platform.OS === "web"
                                    ? `message-${message.id}`
                                    : undefined
                                }
                                ref={(ref) => {
                                  messageRefs.current[message.id] = ref;
                                }}
                                style={[
                                  styles.messageContainer,
                                  isOutbound
                                    ? styles.messageOutbound
                                    : styles.messageInbound,
                                  showMenu && { zIndex: 1000 },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.messageBubble,
                                    {
                                      backgroundColor: isOutbound
                                        ? colors.chatOutboundBackground
                                        : colors.chatInboundBackground,
                                      borderColor: colors.border,
                                      shadowColor: colors.shadow,
                                      shadowOffset: { width: 0, height: 1 },
                                      shadowOpacity: 0.14,
                                      shadowRadius: 3,
                                      elevation: 2,
                                    },
                                  ]}
                                >
                                  {/* Botón de menú (flecha) - dentro del bubble, parte superior derecha */}
                                  <TouchableOpacity
                                    style={styles.messageMenuButtonInside}
                                    onPress={() =>
                                      toggleMessageMenu(message.id)
                                    }
                                    activeOpacity={0.7}
                                    data-message-menu-button={
                                      Platform.OS === "web" ? true : undefined
                                    }
                                  >
                                    <Ionicons
                                      name={
                                        showMenu ? "chevron-up" : "chevron-down"
                                      }
                                      size={16}
                                      color={colors.textSecondary}
                                    />
                                  </TouchableOpacity>

                                  {/* Cita del mensaje original (si es una respuesta) */}
                                  {message.parentMessage &&
                                    (() => {
                                      // Buscar el mensaje padre completo en la lista de mensajes para obtener attachments
                                      const fullParentMessage =
                                        message.parentMessageId
                                          ? messages.find(
                                              (m) =>
                                                m.id ===
                                                message.parentMessageId,
                                            )
                                          : null;

                                      // Usar el mensaje completo si está disponible, sino usar el parentMessage básico
                                      const parentMessageToUse =
                                        fullParentMessage ||
                                        message.parentMessage;

                                      return (
                                        <TouchableOpacity
                                          style={[
                                            styles.messageQuote,
                                            {
                                              backgroundColor: isOutbound
                                                ? colors.chatOutboundBackground
                                                : colors.chatInboundBackground,
                                              borderLeftColor: colors.primary,
                                            },
                                          ]}
                                          activeOpacity={0.7}
                                          onPress={() => {
                                            // Hacer scroll al mensaje padre usando su ID como sección (anchor link)
                                            if (
                                              message.parentMessageId &&
                                              messagesScrollRef.current
                                            ) {
                                              const parentRef =
                                                messageRefs.current[
                                                  message.parentMessageId
                                                ];
                                              if (parentRef) {
                                                // En web, usar scrollIntoView (funcionalidad de secciones/anchor links)
                                                if (Platform.OS === "web") {
                                                  const element =
                                                    document.getElementById(
                                                      `message-${message.parentMessageId}`,
                                                    );
                                                  if (element) {
                                                    element.scrollIntoView({
                                                      behavior: "smooth",
                                                      block: "start",
                                                    });
                                                  }
                                                } else {
                                                  // En móvil, usar measureLayout para obtener posición relativa al ScrollView
                                                  parentRef.measureLayout(
                                                    messagesScrollRef.current as any,
                                                    (x: number, y: number) => {
                                                      messagesScrollRef.current?.scrollTo(
                                                        {
                                                          y: Math.max(
                                                            0,
                                                            y - 20,
                                                          ), // 20px de margen superior
                                                          animated: true,
                                                        },
                                                      );
                                                    },
                                                    () => {
                                                      // Fallback si measureLayout falla
                                                    },
                                                  );
                                                }
                                              }
                                            }
                                          }}
                                        >
                                          <View
                                            style={styles.messageQuoteHeader}
                                          >
                                            <ThemedText
                                              type="caption"
                                              style={{
                                                color: colors.primary,
                                                fontWeight: "600",
                                                fontSize: 11,
                                              }}
                                            >
                                              {parentMessageToUse.direction.toLowerCase() ===
                                              "outbound"
                                                ? "Tú"
                                                : selectedContact?.name ||
                                                  "Contacto"}
                                            </ThemedText>
                                          </View>
                                          <View
                                            style={{
                                              flexDirection: "row",
                                              alignItems: "center",
                                              justifyContent: "space-between",
                                              marginTop: 2,
                                            }}
                                          >
                                            <View
                                              style={{
                                                flex: 1,
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: 4,
                                                marginRight: 8,
                                              }}
                                            >
                                              {/* Mostrar icono de adjunto si tiene attachments */}
                                              {parentMessageToUse.attachments &&
                                                parentMessageToUse.attachments
                                                  .length > 0 && (
                                                  <Ionicons
                                                    name={
                                                      parentMessageToUse.attachments.some(
                                                        (
                                                          a: MessageAttachment,
                                                        ) =>
                                                          a.fileType.startsWith(
                                                            "image/",
                                                          ),
                                                      )
                                                        ? "image-outline"
                                                        : "document-outline"
                                                    }
                                                    size={12}
                                                    color={colors.textSecondary}
                                                  />
                                                )}
                                              <ThemedText
                                                type="caption"
                                                style={{
                                                  color: colors.textSecondary,
                                                  fontSize: 12,
                                                }}
                                                numberOfLines={1}
                                              >
                                                {/* Mostrar contenido si existe, si no mostrar "Archivo adjunto" */}
                                                {parentMessageToUse.content ||
                                                  "Archivo adjunto"}
                                              </ThemedText>
                                            </View>
                                            {/* Mostrar miniatura de adjunto a la derecha si hay attachments */}
                                            {(() => {
                                              const firstAttachment =
                                                parentMessageToUse
                                                  .attachments?.[0];
                                              if (firstAttachment) {
                                                const isImage =
                                                  firstAttachment.fileType.startsWith(
                                                    "image/",
                                                  );
                                                return (
                                                  <MessageQuoteAttachmentThumbnail
                                                    attachment={firstAttachment}
                                                    messageId={
                                                      parentMessageToUse.id
                                                    }
                                                    getFileIcon={getFileIcon}
                                                    onPress={() => {
                                                      if (parentMessageToUse) {
                                                        if (isImage) {
                                                          const imageAttachments =
                                                            parentMessageToUse.attachments?.filter(
                                                              (
                                                                a: MessageAttachment,
                                                              ) =>
                                                                a.fileType.startsWith(
                                                                  "image/",
                                                                ),
                                                            ) || [];
                                                          const clickedIndex =
                                                            imageAttachments.findIndex(
                                                              (a) =>
                                                                a.id ===
                                                                firstAttachment.id,
                                                            );
                                                          handleOpenImageViewer(
                                                            imageAttachments,
                                                            parentMessageToUse.id,
                                                            clickedIndex >= 0
                                                              ? clickedIndex
                                                              : 0,
                                                          );
                                                        } else {
                                                          // Para otros tipos de archivo, abrir el visor de imágenes con el adjunto
                                                          // o implementar lógica específica según el tipo
                                                          const attachmentUrl =
                                                            InteraccionesService.getAttachmentUrl(
                                                              parentMessageToUse.id,
                                                              firstAttachment.id,
                                                              firstAttachment.filePath,
                                                            );
                                                          // Por ahora, solo mostrar el archivo (puedes implementar descarga o preview)
                                                        }
                                                      }
                                                    }}
                                                  />
                                                );
                                              }
                                              return null;
                                            })()}
                                          </View>
                                        </TouchableOpacity>
                                      );
                                    })()}

                                  {/* Imagen inline (media buffer del backend, ej. WhatsApp) */}
                                  {(() => {
                                    const media =
                                      message.media ??
                                      (message as any).metadata?.media;
                                    const mediaType =
                                      message.mediaType ??
                                      (message as any).metadata?.mediaType ??
                                      "image/jpeg";
                                    const dataUrl = getMediaDataUrl(
                                      media as SerializedBuffer | undefined,
                                      mediaType,
                                    );
                                    if (!dataUrl) return null;
                                    return (
                                      <TouchableOpacity
                                        style={[
                                          styles.messageAttachment,
                                          {
                                            borderColor: colors.border,
                                          },
                                          isMobile &&
                                            styles.messageAttachmentMobile,
                                        ]}
                                        onPress={() => {
                                          handleOpenLocalFilesViewer(
                                            [
                                              {
                                                name:
                                                  message.mediaFilename ??
                                                  "imagen",
                                                size: 0,
                                                type: mediaType,
                                                uri: dataUrl,
                                              },
                                            ],
                                            0,
                                          );
                                        }}
                                        activeOpacity={0.8}
                                      >
                                        {Platform.OS === "web" ? (
                                          <Image
                                            source={{ uri: dataUrl }}
                                            style={
                                              styles.messageAttachmentImage
                                            }
                                            resizeMode="cover"
                                          />
                                        ) : (
                                          <ExpoImage
                                            source={{ uri: dataUrl }}
                                            style={
                                              styles.messageAttachmentImage
                                            }
                                            contentFit="cover"
                                            cachePolicy="memory-disk"
                                            transition={200}
                                          />
                                        )}
                                      </TouchableOpacity>
                                    );
                                  })()}

                                  {/* Contenido del mensaje (no mostrar "[Imagen]" cuando hay media) */}
                                  {message.content &&
                                  !(
                                    (message.content === "[Imagen]" ||
                                      message.content === "[imagen]") &&
                                    (message.media ??
                                      (message as any).metadata?.media)
                                  ) ? (
                                    <View
                                      style={
                                        (message.media ??
                                        (message as any).metadata?.media)
                                          ? { marginTop: 8 }
                                          : undefined
                                      }
                                    >
                                      <ThemedText
                                        type="body2"
                                        style={{
                                          color: colors.text,
                                          paddingRight: 12
                                        }}
                                      >
                                        {message.content}
                                      </ThemedText>
                                    </View>
                                  ) : null}

                                  {/* Archivos adjuntos */}
                                  {message.attachments &&
                                    message.attachments.length > 0 && (
                                      <View style={styles.messageAttachments}>
                                        {message.attachments.map(
                                          (attachment, index) => {
                                            const imageAttachments =
                                              message.attachments?.filter((a) =>
                                                a.fileType.startsWith("image/"),
                                              ) || [];
                                            const imageIndex =
                                              imageAttachments.findIndex(
                                                (a) => a.id === attachment.id,
                                              );
                                            return (
                                              <MessageAttachmentItem
                                                key={attachment.id}
                                                attachment={attachment}
                                                messageId={message.id}
                                                colors={colors}
                                                isMobile={isMobile}
                                                onPress={() => {
                                                  if (
                                                    attachment.fileType.startsWith(
                                                      "image/",
                                                    )
                                                  ) {
                                                    handleOpenImageViewer(
                                                      imageAttachments,
                                                      message.id,
                                                      imageIndex >= 0
                                                        ? imageIndex
                                                        : 0,
                                                    );
                                                  }
                                                }}
                                              />
                                            );
                                          },
                                        )}
                                      </View>
                                    )}

                                  <View style={styles.messageFooter}>
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 4,
                                      }}
                                    >
                                      <ThemedText
                                        type="caption"
                                        style={{
                                          color: colors.textSecondary,
                                          fontSize: 10,
                                        }}
                                      >
                                        {new Date(
                                          message.createdAt,
                                        ).toLocaleTimeString("es-ES", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </ThemedText>
                                      {message.isEdited && (
                                        <ThemedText
                                          type="caption"
                                          style={{
                                            color: colors.textSecondary,
                                            fontSize: 9,
                                            fontStyle: "italic",
                                          }}
                                        >
                                          (editado)
                                        </ThemedText>
                                      )}
                                    </View>

                                    {/* Indicador de progreso de carga dentro del mensaje */}
                                    {isOutbound &&
                                      isLastMessage &&
                                      isUploading &&
                                      uploadProgress > 0 && (
                                        <View
                                          style={styles.uploadProgressInline}
                                        >
                                          <View
                                            style={
                                              styles.uploadProgressBarInline
                                            }
                                          >
                                            <View
                                              style={[
                                                styles.uploadProgressFill,
                                                {
                                                  width: `${uploadProgress}%`,
                                                  backgroundColor:
                                                    colors.primary,
                                                },
                                              ]}
                                            />
                                          </View>
                                          <ThemedText
                                            type="caption"
                                            style={{
                                              color: colors.textSecondary,
                                              marginLeft: 6,
                                              fontSize: 10,
                                            }}
                                          >
                                            {Math.round(uploadProgress)}%
                                          </ThemedText>
                                        </View>
                                      )}
                                  </View>

                                  {/* Menú contextual - dentro del bubble para posicionamiento relativo a la flecha */}
                                  {showMenu && (
                                    <Animated.View
                                      style={[
                                        styles.messageContextMenu,
                                        {
                                          backgroundColor: isDark
                                            ? colors.surfaceVariant
                                            : colors.filterInputBackground,
                                          borderColor: colors.border,
                                          shadowColor: colors.shadow,
                                        },
                                      ]}
                                      data-message-menu={
                                        Platform.OS === "web" ? true : undefined
                                      }
                                    >
                                      {/* Responder */}
                                      <TouchableOpacity
                                        style={styles.messageContextMenuItem}
                                        onPress={() =>
                                          handleReplyToMessage(message)
                                        }
                                        activeOpacity={0.7}
                                      >
                                        <Ionicons
                                          name="arrow-undo-outline"
                                          size={20}
                                          color={colors.text}
                                        />
                                        <ThemedText
                                          type="body2"
                                          style={{
                                            color: colors.text,
                                            marginLeft: 12,
                                          }}
                                        >
                                          Responder
                                        </ThemedText>
                                      </TouchableOpacity>

                                      {/* Copiar */}
                                      {message.content && (
                                        <TouchableOpacity
                                          style={styles.messageContextMenuItem}
                                          onPress={() =>
                                            handleCopyMessage(message.content)
                                          }
                                          activeOpacity={0.7}
                                        >
                                          <Ionicons
                                            name="copy-outline"
                                            size={20}
                                            color={colors.text}
                                          />
                                          <ThemedText
                                            type="body2"
                                            style={{
                                              color: colors.text,
                                              marginLeft: 12,
                                            }}
                                          >
                                            Copiar
                                          </ThemedText>
                                        </TouchableOpacity>
                                      )}

                                      {/* Editar (solo outbound) */}
                                      {isOutbound && (
                                        <TouchableOpacity
                                          style={styles.messageContextMenuItem}
                                          onPress={() =>
                                            startEditingMessage(message)
                                          }
                                          activeOpacity={0.7}
                                        >
                                          <Ionicons
                                            name="create-outline"
                                            size={20}
                                            color={colors.text}
                                          />
                                          <ThemedText
                                            type="body2"
                                            style={{
                                              color: colors.text,
                                              marginLeft: 12,
                                            }}
                                          >
                                            Editar
                                          </ThemedText>
                                        </TouchableOpacity>
                                      )}

                                      {/* Eliminar (solo outbound) */}
                                      {isOutbound && (
                                        <TouchableOpacity
                                          style={styles.messageContextMenuItem}
                                          onPress={() =>
                                            confirmDeleteMessage(message.id)
                                          }
                                          activeOpacity={0.7}
                                          disabled={
                                            deletingMessageId === message.id
                                          }
                                        >
                                          {deletingMessageId === message.id ? (
                                            <ActivityIndicator
                                              size="small"
                                              color={colors.error}
                                            />
                                          ) : (
                                            <Ionicons
                                              name="trash-outline"
                                              size={20}
                                              color={colors.error}
                                            />
                                          )}
                                          <ThemedText
                                            type="body2"
                                            style={{
                                              color:
                                                deletingMessageId === message.id
                                                  ? colors.textSecondary
                                                  : colors.error,
                                              marginLeft: 12,
                                            }}
                                          >
                                            Eliminar
                                          </ThemedText>
                                        </TouchableOpacity>
                                      )}
                                    </Animated.View>
                                  )}
                                </View>
                              </View>
                            );
                          })}

                          {/* Indicador de progreso para mensajes sin contenido aún (solo archivos) */}
                          {isUploading &&
                            uploadProgress > 0 &&
                            filteredMessages.length === 0 && (
                              <View
                                style={[
                                  styles.messageContainer,
                                  styles.messageOutbound,
                                ]}
                              >
                                <View
                                  style={[
                                    styles.messageBubble,
                                    {
                                      backgroundColor:
                                        colors.chatOutboundBackground,
                                      borderColor: colors.border,
                                    },
                                  ]}
                                >
                                  <ThemedText
                                    type="body2"
                                    style={{ color: colors.textSecondary }}
                                  >
                                    Enviando...
                                  </ThemedText>
                                </View>
                                <View
                                  style={[
                                    styles.uploadProgressContainerMessage,
                                    {
                                      backgroundColor:
                                        colors.chatOutboundBackground,
                                    },
                                  ]}
                                >
                                  <View style={styles.uploadProgressBar}>
                                    <View
                                      style={[
                                        styles.uploadProgressFill,
                                        {
                                          width: `${uploadProgress}%`,
                                          backgroundColor: colors.primary,
                                        },
                                      ]}
                                    />
                                  </View>
                                  <ThemedText
                                    type="caption"
                                    style={{
                                      color: colors.textSecondary,
                                      marginTop: 4,
                                      fontSize: 10,
                                    }}
                                  >
                                    {Math.round(uploadProgress)}%
                                  </ThemedText>
                                </View>
                              </View>
                            )}
                        </>
                      )}
                    </ScrollView>
                  )}
                </ImageBackground>

                {/* Archivos adjuntos - Thumbnails (fuera del contenedor del input) */}
                {attachedFiles.length > 0 && (
                  <View
                    style={[
                      styles.attachedFilesContainer,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    {/* Header con botón cerrar */}
                    <View
                      style={[
                        styles.attachedFilesHeader,
                        { borderBottomColor: colors.border },
                      ]}
                    >
                      <ThemedText
                        type="body2"
                        style={{ color: colors.text, fontWeight: "600" }}
                      >
                        Archivos adjuntos ({attachedFiles.length})
                      </ThemedText>
                      <TouchableOpacity
                        style={styles.attachedFilesCloseButton}
                        onPress={() => setAttachedFiles([])}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="close"
                          size={24}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={[
                        styles.attachedFilesScrollContent,
                        attachedFiles.length <= 3 && {
                          justifyContent: "center",
                        },
                      ]}
                    >
                      {attachedFiles.map((file, index) => {
                        const isImage = file.type.startsWith("image/");
                        const fileIconInfo = getFileIcon(file.name, file.type);
                        return (
                          <View
                            key={`file-${index}`}
                            style={[
                              styles.attachedFileThumbnail,
                              { borderColor: colors.border },
                              !isImage && styles.attachedFileThumbnailDocument,
                            ]}
                          >
                            {isImage && file.uri ? (
                              <TouchableOpacity
                                onPress={() => {
                                  handleOpenLocalFilesViewer(
                                    attachedFiles,
                                    index,
                                  );
                                }}
                                activeOpacity={0.8}
                                style={{ width: "100%", height: "100%" }}
                              >
                                <Image
                                  source={{ uri: file.uri }}
                                  style={styles.attachedFileThumbnailImage}
                                  resizeMode="cover"
                                />
                              </TouchableOpacity>
                            ) : (
                              <View
                                style={[
                                  styles.attachedFileThumbnailIcon,
                                  {
                                    backgroundColor: fileIconInfo.color + "15",
                                  },
                                ]}
                              >
                                {fileIconInfo.iconSource ? (
                                  <Image
                                    source={fileIconInfo.iconSource}
                                    style={styles.attachedFileIconImage}
                                    resizeMode="contain"
                                  />
                                ) : (
                                  <Ionicons
                                    name={fileIconInfo.icon as any}
                                    size={32}
                                    color={fileIconInfo.color}
                                  />
                                )}
                              </View>
                            )}
                            {!isImage && (
                              <ThemedText
                                type="caption"
                                style={[
                                  styles.attachedFileName,
                                  { color: colors.textSecondary },
                                ]}
                                numberOfLines={2}
                              >
                                {file.name}
                              </ThemedText>
                            )}
                            <TouchableOpacity
                              onPress={() => {
                                setAttachedFiles((prev) =>
                                  prev.filter((_, i) => i !== index),
                                );
                              }}
                              style={[
                                styles.attachedFileRemoveButton,
                                { backgroundColor: colors.error + "E6" },
                              ]}
                              activeOpacity={0.7}
                            >
                              <Ionicons
                                name="close"
                                size={16}
                                color="#FFFFFF"
                              />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Vista de responder mensaje */}
                {replyingToMessage && (
                  <View
                    style={[
                      styles.replyMessageContainer,
                      {
                        backgroundColor: colors.filterInputBackground,
                        borderTopColor: colors.border,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.replyMessageIndicator,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                    <View style={styles.replyMessageContent}>
                      <ThemedText
                        type="caption"
                        style={{
                          color: colors.primary,
                          fontWeight: "600",
                          fontSize: 12,
                        }}
                      >
                        {replyingToMessage.direction.toLowerCase() ===
                        "outbound"
                          ? "Tú"
                          : selectedContact?.name || "Contacto"}
                      </ThemedText>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {/* Mostrar icono de foto si tiene attachments de imagen */}
                        {replyingToMessage.attachments &&
                          replyingToMessage.attachments.some((a) =>
                            a.fileType.startsWith("image/"),
                          ) && (
                            <Ionicons
                              name="image-outline"
                              size={14}
                              color={colors.textSecondary}
                            />
                          )}
                        <ThemedText
                          type="body2"
                          style={{ color: colors.textSecondary, fontSize: 13 }}
                          numberOfLines={1}
                        >
                          {replyingToMessage.content
                            ? replyingToMessage.content
                            : replyingToMessage.attachments &&
                                replyingToMessage.attachments.length > 0
                              ? replyingToMessage.attachments[0].fileName ||
                                "Archivo adjunto"
                              : "Archivo adjunto"}
                        </ThemedText>
                      </View>
                    </View>
                    {/* Thumbnail del adjunto al lado derecho */}
                    {replyingToMessage.attachments &&
                      replyingToMessage.attachments.length > 0 && (
                        <View style={styles.replyMessageThumbnail}>
                          <MessageQuoteAttachmentThumbnail
                            attachment={replyingToMessage.attachments[0]}
                            messageId={replyingToMessage.id}
                            getFileIcon={getFileIcon}
                            onPress={() => {
                              // Al hacer clic en el thumbnail, abrir el visor de imágenes si es imagen
                              const isImage =
                                replyingToMessage.attachments?.[0]?.fileType.startsWith(
                                  "image/",
                                );
                              if (isImage && replyingToMessage.attachments) {
                                const imageAttachments =
                                  replyingToMessage.attachments.filter(
                                    (a: MessageAttachment) =>
                                      a.fileType.startsWith("image/"),
                                  );
                                const imageIndex = imageAttachments.findIndex(
                                  (a) =>
                                    a.id ===
                                    replyingToMessage.attachments?.[0]?.id,
                                );
                                handleOpenImageViewer(
                                  imageAttachments,
                                  replyingToMessage.id,
                                  Math.max(0, imageIndex),
                                );
                              }
                            }}
                          />
                        </View>
                      )}
                    <TouchableOpacity
                      onPress={cancelReply}
                      style={styles.replyMessageClose}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="close"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Input de mensaje */}
                <View
                  style={[
                    styles.messageInputContainer,
                    {
                      backgroundColor: colors.filterInputBackground,
                      borderTopColor: colors.border,
                    },
                    { position: "relative" },
                  ]}
                >
                  {/* Inputs de archivo ocultos (solo web) */}
                  {Platform.OS === "web" && (
                    <>
                      {/* Input para documentos (todos los archivos) */}
                      <input
                        ref={documentInputRef}
                        type="file"
                        multiple
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const validFiles: Array<{
                            name: string;
                            size: number;
                            type: string;
                            uri?: string;
                            file?: File;
                          }> = [];
                          const maxSize = 10 * 1024 * 1024; // 10MB

                          files.forEach((file) => {
                            if (file.size > maxSize) {
                              alert.showError(
                                `El archivo "${file.name}" es demasiado grande. El tamaño máximo es 10MB.`,
                              );
                              return;
                            }

                            validFiles.push({
                              name: file.name,
                              size: file.size,
                              type: file.type,
                              uri: URL.createObjectURL(file),
                              file: file, // Guardar el File original para poder convertirlo a base64
                            });
                          });

                          if (validFiles.length > 0) {
                            setAttachedFiles((prev) => [
                              ...prev,
                              ...validFiles,
                            ]);
                          }

                          if (documentInputRef.current) {
                            documentInputRef.current.value = "";
                          }
                          setShowAttachmentMenu(false);
                        }}
                      />

                      {/* Input para fotos y videos */}
                      <input
                        ref={mediaInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const validFiles: Array<{
                            name: string;
                            size: number;
                            type: string;
                            uri?: string;
                            file?: File;
                          }> = [];
                          const maxSize = 10 * 1024 * 1024; // 10MB

                          files.forEach((file) => {
                            const isMedia =
                              file.type.startsWith("image/") ||
                              file.type.startsWith("video/");

                            if (!isMedia) {
                              alert.showError(
                                `El archivo "${file.name}" no es un tipo de medio válido.`,
                              );
                              return;
                            }

                            if (file.size > maxSize) {
                              alert.showError(
                                `El archivo "${file.name}" es demasiado grande. El tamaño máximo es 10MB.`,
                              );
                              return;
                            }

                            validFiles.push({
                              name: file.name,
                              size: file.size,
                              type: file.type,
                              uri: URL.createObjectURL(file),
                              file: file, // Guardar el File original para poder convertirlo a base64
                            });
                          });

                          if (validFiles.length > 0) {
                            setAttachedFiles((prev) => [
                              ...prev,
                              ...validFiles,
                            ]);
                          }

                          if (mediaInputRef.current) {
                            mediaInputRef.current.value = "";
                          }
                          setShowAttachmentMenu(false);
                        }}
                      />
                    </>
                  )}

                  {/* Botón adjuntar */}
                  <Tooltip text="Adjuntar" position="top">
                    <TouchableOpacity
                      style={[
                        styles.inputActionButton,
                        { backgroundColor: colors.surface },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setShowAttachmentMenu(!showAttachmentMenu);
                      }}
                      data-attachment-menu-button={
                        Platform.OS === "web" ? true : undefined
                      }
                    >
                      <Ionicons
                        name="add"
                        size={22}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </Tooltip>

                  {/* Menú de adjuntar */}
                  {showAttachmentMenu && (
                    <Animated.View
                      style={[
                        styles.attachmentMenu,
                        {
                          backgroundColor: isDark
                            ? colors.surfaceVariant
                            : colors.filterInputBackground,
                          borderColor: colors.border,
                          shadowColor: colors.shadow,
                        },
                      ]}
                      data-attachment-menu={
                        Platform.OS === "web" ? true : undefined
                      }
                    >
                      <ScrollView
                        style={styles.attachmentMenuScroll}
                        showsVerticalScrollIndicator={false}
                      >
                        {/* Documento */}
                        <TouchableOpacity
                          style={styles.attachmentMenuItem}
                          activeOpacity={0.7}
                          onPress={() => {
                            if (
                              Platform.OS === "web" &&
                              documentInputRef.current
                            ) {
                              documentInputRef.current.click();
                            } else {
                              alert.showError(
                                "La funcionalidad de adjuntar documentos en móvil requiere expo-document-picker.",
                              );
                            }
                          }}
                        >
                          <View
                            style={[
                              styles.attachmentMenuIcon,
                              { backgroundColor: "#9C27B0" + "20" },
                            ]}
                          >
                            <Ionicons
                              name="document"
                              size={24}
                              color="#9C27B0"
                            />
                          </View>
                          <View style={styles.attachmentMenuText}>
                            <ThemedText
                              type="body2"
                              style={{ color: colors.text, fontWeight: "500" }}
                            >
                              Documento
                            </ThemedText>
                            <ThemedText
                              type="caption"
                              style={{ color: colors.textSecondary }}
                            >
                              Todos los archivos
                            </ThemedText>
                          </View>
                        </TouchableOpacity>

                        {/* Fotos y Videos */}
                        <TouchableOpacity
                          style={styles.attachmentMenuItem}
                          activeOpacity={0.7}
                          onPress={async () => {
                            if (
                              Platform.OS === "web" &&
                              mediaInputRef.current
                            ) {
                              mediaInputRef.current.click();
                            } else {
                              await pickImagesRN();
                              setShowAttachmentMenu(false);
                            }
                          }}
                        >
                          <View
                            style={[
                              styles.attachmentMenuIcon,
                              { backgroundColor: colors.primary + "20" },
                            ]}
                          >
                            <Ionicons
                              name="images"
                              size={24}
                              color={colors.primary}
                            />
                          </View>
                          <View style={styles.attachmentMenuText}>
                            <ThemedText
                              type="body2"
                              style={{ color: colors.text, fontWeight: "500" }}
                            >
                              Fotos y Videos
                            </ThemedText>
                            <ThemedText
                              type="caption"
                              style={{ color: colors.textSecondary }}
                            >
                              Archivos Multimedia
                            </ThemedText>
                          </View>
                        </TouchableOpacity>

                        {/* Cámara - Solo en versión responsive móvil de web, no en dispositivos móviles físicos */}
                        {Platform.OS === "web" && isMobile && (
                          <TouchableOpacity
                            style={styles.attachmentMenuItem}
                            activeOpacity={0.7}
                            onPress={() => {
                              // En web móvil, usar input de tipo file con capture
                              if (mediaInputRef.current) {
                                // Crear un input temporal con capture para cámara
                                const cameraInput =
                                  document.createElement("input");
                                cameraInput.type = "file";
                                cameraInput.accept = "image/*";
                                cameraInput.capture = "environment"; // Cámara trasera por defecto
                                cameraInput.style.display = "none";
                                cameraInput.onchange = (e) => {
                                  const files = Array.from(
                                    (e.target as HTMLInputElement).files || [],
                                  );
                                  const validFiles: Array<{
                                    name: string;
                                    size: number;
                                    type: string;
                                    uri?: string;
                                    file?: File;
                                  }> = [];
                                  const maxSize = 10 * 1024 * 1024; // 10MB

                                  files.forEach((file) => {
                                    if (file.size > maxSize) {
                                      alert.showError(
                                        `El archivo "${file.name}" es demasiado grande. El tamaño máximo es 10MB.`,
                                      );
                                      return;
                                    }

                                    validFiles.push({
                                      name: file.name,
                                      size: file.size,
                                      type: file.type,
                                      uri: URL.createObjectURL(file),
                                      file: file,
                                    });
                                  });

                                  if (validFiles.length > 0) {
                                    setAttachedFiles((prev) => [
                                      ...prev,
                                      ...validFiles,
                                    ]);
                                  }

                                  document.body.removeChild(cameraInput);
                                };
                                document.body.appendChild(cameraInput);
                                cameraInput.click();
                              }
                              setShowAttachmentMenu(false);
                            }}
                          >
                            <View
                              style={[
                                styles.attachmentMenuIcon,
                                { backgroundColor: "#E91E63" + "20" },
                              ]}
                            >
                              <Ionicons
                                name="camera"
                                size={24}
                                color="#E91E63"
                              />
                            </View>
                            <View style={styles.attachmentMenuText}>
                              <ThemedText
                                type="body2"
                                style={{
                                  color: colors.text,
                                  fontWeight: "500",
                                }}
                              >
                                Cámara
                              </ThemedText>
                              <ThemedText
                                type="caption"
                                style={{ color: colors.textSecondary }}
                              >
                                Tomar foto
                              </ThemedText>
                            </View>
                          </TouchableOpacity>
                        )}

                        {/* Calendario */}
                        <TouchableOpacity
                          style={styles.attachmentMenuItem}
                          activeOpacity={0.7}
                          onPress={() => {
                            alert.showInfo(
                              "Funcionalidad de calendario en desarrollo",
                            );
                            setShowAttachmentMenu(false);
                          }}
                        >
                          <View
                            style={[
                              styles.attachmentMenuIcon,
                              { backgroundColor: "#FF9800" + "20" },
                            ]}
                          >
                            <Ionicons
                              name="calendar"
                              size={24}
                              color="#FF9800"
                            />
                          </View>
                          <View style={styles.attachmentMenuText}>
                            <ThemedText
                              type="body2"
                              style={{ color: colors.text, fontWeight: "500" }}
                            >
                              Calendario
                            </ThemedText>
                            <ThemedText
                              type="caption"
                              style={{ color: colors.textSecondary }}
                            >
                              Agendar evento
                            </ThemedText>
                          </View>
                        </TouchableOpacity>

                        {/* Catálogo */}
                        <TouchableOpacity
                          style={styles.attachmentMenuItem}
                          activeOpacity={0.7}
                          onPress={() => {
                            alert.showInfo(
                              "Funcionalidad de catálogo en desarrollo",
                            );
                            setShowAttachmentMenu(false);
                          }}
                        >
                          <View
                            style={[
                              styles.attachmentMenuIcon,
                              { backgroundColor: "#757575" + "20" },
                            ]}
                          >
                            <Ionicons name="grid" size={24} color="#757575" />
                          </View>
                          <View style={styles.attachmentMenuText}>
                            <ThemedText
                              type="body2"
                              style={{ color: colors.text, fontWeight: "500" }}
                            >
                              Catálogo
                            </ThemedText>
                            <ThemedText
                              type="caption"
                              style={{ color: colors.textSecondary }}
                            >
                              Ver productos
                            </ThemedText>
                          </View>
                        </TouchableOpacity>
                      </ScrollView>
                    </Animated.View>
                  )}

                  {/* Botón emoji */}
                  <Tooltip text="Emoticones" position="top">
                    <TouchableOpacity
                      style={[
                        styles.inputActionButton,
                        {
                          backgroundColor: showEmojiPicker
                            ? colors.primary + "20"
                            : colors.filterInputBackground,
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setShowEmojiPicker(!showEmojiPicker);
                        if (showQuickMessages) setShowQuickMessages(false);
                      }}
                    >
                      <Ionicons
                        name={showEmojiPicker ? "happy" : "happy-outline"}
                        size={22}
                        color={
                          showEmojiPicker
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                    </TouchableOpacity>
                  </Tooltip>

                  {/* Botón mensajes rápidos - se oculta en smartphone cuando hay texto */}
                  {(!isMobile || messageText.trim().length === 0) && (
                    <Tooltip text="Mensajes rápidos" position="top">
                      <TouchableOpacity
                        style={[
                          styles.inputActionButton,
                          {
                            backgroundColor: showQuickMessages
                              ? colors.primary + "20"
                              : colors.filterInputBackground,
                          },
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                          setShowQuickMessages(!showQuickMessages);
                          if (showEmojiPicker) setShowEmojiPicker(false);
                        }}
                      >
                        <Ionicons
                          name={
                            showQuickMessages
                              ? "chatbubbles"
                              : "chatbubbles-outline"
                          }
                          size={22}
                          color={
                            showQuickMessages
                              ? colors.primary
                              : colors.textSecondary
                          }
                        />
                      </TouchableOpacity>
                    </Tooltip>
                  )}

                  {/* Contenedor del input con crecimiento dinámico */}
                  <View
                    style={[
                      styles.messageInputWrapper,
                      {
                        backgroundColor: isDark
                          ? colors.chatInboundBackground
                          : "#FFFFFF",
                        borderColor: isMessageInputFocused
                          ? colors.primary
                          : "transparent",
                        height: Math.min(
                          Math.max(messageInputHeight, minHeight),
                          maxHeight,
                        ),
                      },
                    ]}
                  >
                    <TextInput
                      nativeID={
                        Platform.OS === "web" ? "chat-message-input" : undefined
                      }
                      style={[
                        styles.messageInput,
                        {
                          color: colors.text,
                          height: "100%",
                          borderWidth: 0,
                          borderColor: "transparent",
                        },
                      ]}
                      placeholder="Escribe un mensaje..."
                      placeholderTextColor={colors.textSecondary}
                      value={messageText}
                      onChangeText={(text) => {
                        setMessageText(text);
                        // Calcular altura basada en saltos de línea
                        const newHeight = calculateInputHeight(text);
                        setMessageInputHeight(newHeight);
                      }}
                      onFocus={() => setIsMessageInputFocused(true)}
                      onBlur={() => setIsMessageInputFocused(false)}
                      multiline
                      maxLength={1000}
                      editable={!sendingMessage}
                      scrollEnabled={
                        messageInputHeight >= maxHeight ||
                        (messageText.match(/\n/g) || []).length + 1 >= maxLines
                      }
                      textAlignVertical="top"
                      underlineColorAndroid="transparent"
                    />
                  </View>

                  {/* Botón enviar */}
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      {
                        backgroundColor:
                          messageText.trim() || attachedFiles.length > 0
                            ? colors.primary
                            : colors.filterInputBackground,
                        shadowColor: colors.shadow,
                      },
                      ((!messageText.trim() && attachedFiles.length === 0) ||
                        sendingMessage) &&
                        styles.sendButtonDisabled,
                    ]}
                    onPress={handleSendMessage}
                    disabled={
                      (!messageText.trim() && attachedFiles.length === 0) ||
                      sendingMessage
                    }
                    activeOpacity={0.8}
                  >
                    {sendingMessage ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={
                          messageText.trim() || attachedFiles.length > 0
                            ? "#FFFFFF"
                            : colors.textSecondary
                        }
                      />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Panel de emojis - Renderizado después del input */}
                {showEmojiPicker && (
                  <EmojiPickerPanel
                    emojisWithKeywords={emojisWithKeywords}
                    onEmojiSelect={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                    isMobile={isMobile}
                    colors={colors}
                  />
                )}

                {/* Panel de mensajes rápidos - Renderizado después del input */}
                {showQuickMessages && (
                  <QuickMessagesPanel
                    quickMessages={quickMessages}
                    recommendations={recommendations}
                    loadingRecommendations={loadingRecommendations}
                    onQuickMessageSelect={handleQuickMessageSelect}
                    onRecommendationSelect={handleRecommendationSelect}
                    onClose={() => setShowQuickMessages(false)}
                    onRefresh={loadQuickMessages}
                    catalogId={quickMessagesCatalogId}
                    companyId={company?.id || null}
                    companyCode={company?.code || null}
                    isMobile={isMobile}
                    colors={colors}
                  />
                )}
              </View>
            ) : (
              <View
                style={[
                  styles.emptyChat,
                  { backgroundColor: colors.background },
                ]}
              >
                <Ionicons
                  name="chatbubbles-outline"
                  size={64}
                  color={colors.textSecondary}
                />
                <ThemedText
                  type="h4"
                  style={{
                    marginTop: 16,
                    color: colors.text,
                    textAlign: "center",
                  }}
                >
                  Selecciona un contacto para comenzar
                </ThemedText>
                <ThemedText
                  type="body2"
                  style={{
                    marginTop: 8,
                    color: colors.textSecondary,
                    textAlign: "center",
                  }}
                >
                  Elige una conversación de la lista para ver y enviar mensajes
                </ThemedText>
              </View>
            ))}

          {/* Panel de información del contacto */}
          {selectedContact && showContactInfoPanel && (
            <ContactInfoPanel
              contact={selectedContact}
              availableTags={availableTags}
              isMobile={isMobile}
              panelAnim={contactInfoPanelAnim}
              onClose={() => setShowContactInfoPanel(false)}
              colors={colors}
            />
          )}
        </View>
      </ThemedView>

      {/* Modal para editar mensaje */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelEditing}
      >
        <View style={styles.editModalOverlay}>
          <View
            style={[
              styles.editModalContainer,
              { backgroundColor: colors.filterInputBackground },
            ]}
          >
            {/* Header del modal */}
            <View
              style={[
                styles.editModalHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <ThemedText
                type="body1"
                style={{ color: colors.text, fontWeight: "600" }}
              >
                Edita el mensaje
              </ThemedText>
              <TouchableOpacity
                onPress={cancelEditing}
                style={styles.editModalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Contenido del modal */}
            <View style={styles.editModalContent}>
              <TextInput
                style={[
                  styles.editModalInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.filterInputBackground,
                  },
                ]}
                value={editingContent}
                onChangeText={setEditingContent}
                multiline
                autoFocus
                placeholder="Editar mensaje..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Footer del modal */}
            <View
              style={[
                styles.editModalFooter,
                { borderTopColor: colors.border },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.editModalButton,
                  { backgroundColor: colors.filterInputBackground },
                ]}
                onPress={cancelEditing}
                activeOpacity={0.7}
              >
                <ThemedText
                  type="body2"
                  style={{ color: colors.textSecondary }}
                >
                  Cancelar
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.editModalButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={saveEditFromModal}
                activeOpacity={0.7}
                disabled={!editingContent.trim()}
              >
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de visualización de imágenes */}
      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseImageViewer}
      >
        <View
          style={[
            styles.imageViewerOverlay,
            { backgroundColor: "rgba(0, 0, 0, 0.95)" },
          ]}
        >
          {/* Header con botones */}
          <View
            style={[
              styles.imageViewerHeader,
              { backgroundColor: "rgba(0, 0, 0, 0.5)" },
            ]}
          >
            <ThemedText
              type="body1"
              style={{ color: "#FFFFFF", marginLeft: 16 }}
            >
              {imageViewerCurrentIndex + 1} de{" "}
              {isViewingLocalFiles
                ? imageViewerLocalFiles.length
                : imageViewerAttachments.length}
            </ThemedText>
            <View style={{ flex: 1 }} />
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              {!isViewingLocalFiles && (
                <Tooltip text="Descargar imagen" position="bottom">
                  <TouchableOpacity
                    onPress={() =>
                      handleDownloadImage(
                        imageViewerAttachments[imageViewerCurrentIndex],
                      )
                    }
                    style={styles.imageViewerDownloadButton}
                  >
                    <Ionicons
                      name="download-outline"
                      size={24}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </Tooltip>
              )}
              <TouchableOpacity
                onPress={handleCloseImageViewer}
                style={styles.imageViewerCloseButton}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Imagen principal */}
          <View style={styles.imageViewerContent}>
            {((isViewingLocalFiles &&
              imageViewerLocalFiles.length > 0 &&
              imageViewerLocalFiles[imageViewerCurrentIndex]) ||
              (!isViewingLocalFiles &&
                imageViewerAttachments.length > 0 &&
                imageViewerAttachments[imageViewerCurrentIndex])) && (
              <>
                {imageViewerCurrentIndex > 0 && (
                  <TouchableOpacity
                    style={styles.imageViewerNavButton}
                    onPress={handlePrevImage}
                  >
                    <Ionicons name="chevron-back" size={32} color="#FFFFFF" />
                  </TouchableOpacity>
                )}

                <View style={styles.imageViewerImageContainer}>
                  {(() => {
                    if (isViewingLocalFiles) {
                      const currentFile =
                        imageViewerLocalFiles[imageViewerCurrentIndex];
                      if (!currentFile || !currentFile.uri) return null;

                      return (
                        <Image
                          source={{ uri: currentFile.uri }}
                          style={styles.imageViewerImage}
                          resizeMode="contain"
                        />
                      );
                    } else {
                      const currentAttachment =
                        imageViewerAttachments[imageViewerCurrentIndex];
                      if (!currentAttachment) return null;

                      const imageUrl = InteraccionesService.getAttachmentUrl(
                        imageViewerMessageId,
                        currentAttachment.id,
                      );

                      if (Platform.OS === "web") {
                        return (
                          <Image
                            source={{ uri: imageUrl }}
                            style={styles.imageViewerImage}
                            resizeMode="contain"
                          />
                        );
                      } else {
                        return (
                          <ImageWithToken
                            uri={imageUrl}
                            style={styles.imageViewerImage}
                          />
                        );
                      }
                    }
                  })()}
                </View>

                {imageViewerCurrentIndex <
                  (isViewingLocalFiles
                    ? imageViewerLocalFiles.length
                    : imageViewerAttachments.length) -
                    1 && (
                  <TouchableOpacity
                    style={[
                      styles.imageViewerNavButton,
                      styles.imageViewerNavButtonRight,
                    ]}
                    onPress={handleNextImage}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={32}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Miniaturas en la parte inferior */}
          {(isViewingLocalFiles
            ? imageViewerLocalFiles.length
            : imageViewerAttachments.length) > 1 && (
            <View
              style={[
                styles.imageViewerThumbnails,
                { backgroundColor: "rgba(0, 0, 0, 0.5)" },
              ]}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageViewerThumbnailsContent}
              >
                {isViewingLocalFiles
                  ? imageViewerLocalFiles.map((file, index) => (
                      <TouchableOpacity
                        key={`local-${index}`}
                        onPress={() => setImageViewerCurrentIndex(index)}
                        style={[
                          styles.imageViewerThumbnail,
                          index === imageViewerCurrentIndex &&
                            styles.imageViewerThumbnailActive,
                        ]}
                      >
                        {file.uri && (
                          <Image
                            source={{ uri: file.uri }}
                            style={styles.imageViewerThumbnailImage}
                            resizeMode="cover"
                          />
                        )}
                      </TouchableOpacity>
                    ))
                  : imageViewerAttachments.map((attachment, index) => (
                      <TouchableOpacity
                        key={attachment.id}
                        onPress={() => setImageViewerCurrentIndex(index)}
                        style={[
                          styles.imageViewerThumbnail,
                          index === imageViewerCurrentIndex &&
                            styles.imageViewerThumbnailActive,
                        ]}
                      >
                        {Platform.OS === "web" ? (
                          <Image
                            source={{
                              uri: InteraccionesService.getAttachmentUrl(
                                imageViewerMessageId,
                                attachment.id,
                              ),
                            }}
                            style={styles.imageViewerThumbnailImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <ExpoImage
                            source={{
                              uri: InteraccionesService.getAttachmentUrl(
                                imageViewerMessageId,
                                attachment.id,
                              ),
                            }}
                            style={styles.imageViewerThumbnailImage}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  layout: {
    flex: 1,
    flexDirection: "row",
  },
  contactsPanel: {
    width: 350,
    flexDirection: "column",
  },
  searchBar: {
    padding: 13,
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: "row",
    padding: 12,
    borderLeftWidth: 3,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
    justifyContent: "center",
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  contactNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
    marginRight: 8,
  },
  contactHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 78,
    justifyContent: "flex-end",
    flexShrink: 0,
  },
  contactRobotSlot: {
    width: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2,
    elevation: 2,
  },
  contactTimeText: {
    minWidth: 56,
    textAlign: "right",
  },
  contactFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  botStatusDot: {
    width: 13,
    height: 13,
    borderRadius: 99,
    marginLeft: 8,
    marginRight: 2,
  },
  chatPanel: {
    flex: 1,
    flexDirection: "column",
    minWidth: 0,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    position: "relative",
    overflow: "visible",
    zIndex: 2000,
    elevation: 20,
  },
  mobileSearchBar: {
    borderBottomWidth: 1,
    overflow: "hidden",
  },
  chatHeaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  messagesAreaBackground: {
    flex: 1,
  },
  messagesAreaBackgroundImage: {
    opacity: 0.1,
  },
  messagesArea: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: "100%",
  },
  messageContainer: {
    marginBottom: 12,
    width: "100%",
    flexDirection: "row",
    position: "relative",
  },
  messageOutbound: {
    justifyContent: "flex-end",
  },
  messageInbound: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    minWidth: 0,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "column",
    position: "relative",
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  messageActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  messageActionButton: {
    padding: 4,
    borderRadius: 4,
  },
  messageEditContainer: {
    width: "100%",
  },
  messageEditInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
    maxHeight: 150,
    fontSize: 14,
    textAlignVertical: "top",
  },
  messageEditActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    gap: 8,
  },
  messageEditButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  messageAttachments: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  messageAttachment: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    width: 150,
    height: 150,
    marginBottom: 0,
  },
  messageAttachmentMobile: {
    width: 100,
    height: 100,
  },
  messageAttachmentImage: {
    width: "100%",
    height: "100%",
  },
  messageAttachmentPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  messageInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 20,
    borderTopWidth: 1,
    gap: 8,
    overflow: "visible",
  },
  messageInputWrapper: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  messageInput: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    includeFontPadding: false,
    lineHeight: 20,
    width: "100%",
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "transparent",
    outlineWidth: 0,
    outlineColor: "transparent",
  },
  inputActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    marginBottom: 0,
  },
  uploadProgressContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 80,
    alignItems: "center",
  },
  uploadProgressContainerMessage: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "flex-end",
    maxWidth: 200,
  },
  uploadProgressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  uploadProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  uploadProgressInline: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  uploadProgressBarInline: {
    width: 60,
    height: 3,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    marginBottom: 0,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sendButtonDisabled: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyMessages: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  filtersContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  filtersScroll: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 80,
    alignItems: "center",
  },
  chatHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    position: "relative",
    zIndex: 2100,
  },
  chatIAToggle: {
    padding: 8,
  },
  searchMessageButton: {
    padding: 8,
  },
  messageSearchBar: {
    padding: 12,
    borderBottomWidth: 1,
  },
  contactTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  contactTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  toolsContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  toolsScroll: {
    gap: 8,
    paddingRight: 12,
  },
  toolButton: {
    minWidth: 60,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginRight: 8,
  },
  contactInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  contactInfoAvatarContainer: {
    alignItems: "center",
    padding: 24,
  },
  contactInfoAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInfoActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  contactInfoActionButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  contactInfoCollapsibleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
    width: 20,
  },
  accordionContent: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  contactInfoDetails: {
    gap: 12,
    width: "100%",
  },
  contactInfoDetailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  infoTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  contactInfoModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  attachedFilesContainer: {
    padding: 0,
    marginBottom: 0,
    borderRadius: 0,
    width: "100%",
    borderBottomWidth: 1,
  },
  attachedFilesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  attachedFilesCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  attachedFilesScrollContent: {
    padding: 8,
    paddingTop: 12,
    gap: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  attachedFileThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    overflow: "hidden",
    position: "relative",
  },
  attachedFileThumbnailDocument: {
    height: "auto",
    minHeight: 80,
    paddingBottom: 8,
    overflow: "visible",
  },
  attachedFileThumbnailImage: {
    width: "100%",
    height: "100%",
  },
  attachedFileThumbnailIcon: {
    width: "100%",
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  attachedFileIconImage: {
    width: 40,
    height: 40,
  },
  attachedFileName: {
    fontSize: 9,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 4,
    maxWidth: 80,
    lineHeight: 11,
  },
  attachedFileRemoveButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  attachmentMenu: {
    position: "absolute",
    left: 0,
    bottom: "100%",
    width: 280,
    maxHeight: 400,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 8,
    zIndex: 1000,
  },
  attachmentMenuScroll: {
    maxHeight: 400,
  },
  attachmentMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  attachmentMenuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  attachmentMenuText: {
    flex: 1,
  },
  // Estilos para modal de visualización de imágenes
  imageViewerOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  imageViewerCloseButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  imageViewerCloseButtonTopRight: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  imageViewerDownloadButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  imageViewerContent: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  imageViewerNavButton: {
    position: "absolute",
    left: 16,
    top: "50%",
    transform: [{ translateY: -16 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  imageViewerNavButtonRight: {
    left: "auto",
    right: 16,
  },
  imageViewerImageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerImage: {
    width: "100%",
    height: "100%",
  },
  imageViewerThumbnails: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    paddingVertical: 8,
  },
  imageViewerThumbnailsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  imageViewerThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  imageViewerThumbnailActive: {
    borderColor: "#FFFFFF",
  },
  imageViewerThumbnailImage: {
    width: "100%",
    height: "100%",
  },
  // Estilos para menú contextual
  messageMenuButton: {
    padding: 4,
    marginLeft: 4,
    alignSelf: "flex-end",
  },
  messageMenuButtonInside: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
    zIndex: 10,
  },
  messageContextMenu: {
    position: "absolute",
    top: 28, // Justo debajo de la flecha (top: 8 + icono ~16px + padding)
    right: 8, // Alineado con la flecha (mismo right que el botón)
    minWidth: 180,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 4,
    zIndex: 10000,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 20,
  },
  messageContextMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  // Estilos para responder mensaje
  replyMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  replyMessageIndicator: {
    width: 4,
    height: "100%",
    marginRight: 12,
    borderRadius: 2,
  },
  replyMessageContent: {
    flex: 1,
  },
  replyMessageThumbnail: {
    marginRight: 8,
    marginLeft: 8,
  },
  replyMessageClose: {
    padding: 4,
    marginLeft: 8,
  },
  // Estilos para modal de edición
  editModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  editModalContainer: {
    width: "90%",
    maxWidth: 500,
    borderRadius: 12,
    overflow: "hidden",
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  editModalCloseButton: {
    padding: 4,
  },
  editModalContent: {
    padding: 16,
  },
  editModalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    maxHeight: 200,
    fontSize: 15,
    textAlignVertical: "top",
  },
  editModalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  editModalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  // Estilos para cita de mensaje
  messageQuote: {
    marginBottom: 8,
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    overflow: "hidden",
  },
  messageQuoteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  messageQuoteChevron: {
    padding: 2,
  },
  messageQuoteImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  messageQuoteImageTouchable: {
    width: "100%",
    height: "100%",
  },
  messageQuoteImageContent: {
    width: "100%",
    height: "100%",
  },
  messageQuoteFileIcon: {
    width: 24,
    height: 24,
  },
});
