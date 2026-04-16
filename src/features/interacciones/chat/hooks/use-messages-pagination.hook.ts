/**
 * Hook para carga paginada de mensajes (scroll infinito hacia arriba)
 * Carga los mensajes más recientes primero, y al hacer scroll arriba carga los anteriores.
 */

import { InteraccionesService } from "@/src/domains/interacciones";
import type { Message } from "@/src/domains/interacciones/types";
import { useCallback, useRef, useState } from "react";
import { sortMessagesChronologically } from "../utils/chat-message-order.utils";

const PAGE_SIZE = 20;

export interface UseMessagesPaginationReturn {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  loadingMessages: boolean;
  loadingOlderMessages: boolean;
  hasOlderMessages: boolean;
  /** Carga inicial: últimos mensajes (page 1) */
  loadInitialMessages: (contactId: string, channelInstance: string) => Promise<void>;
  /** Carga mensajes más antiguos (siguiente página) */
  loadOlderMessages: () => Promise<void>;
  /** Agrega un mensaje nuevo al final (desde WS o envío) */
  appendMessage: (msg: Message) => void;
  /** Actualiza un mensaje existente en la lista */
  updateMessage: (msgId: string, updater: (msg: Message) => Message) => void;
  /** Elimina un mensaje de la lista */
  removeMessage: (msgId: string) => void;
  /** Refresco silencioso: recarga page 1 y mergea mensajes nuevos sin perder los antiguos */
  refreshSilent: (contactId: string, channelInstance: string) => Promise<void>;
  /** Limpia todo el estado */
  reset: () => void;
}

export function useMessagesPagination(): UseMessagesPaginationReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);

  const currentPageRef = useRef(1);
  const contactIdRef = useRef<string>("");
  const channelInstanceRef = useRef<string>("");
  const loadingRef = useRef(false);

  const loadInitialMessages = useCallback(
    async (contactId: string, channelInstance: string) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      contactIdRef.current = contactId;
      channelInstanceRef.current = channelInstance;
      currentPageRef.current = 1;
      setLoadingMessages(true);

      try {
        const result = await InteraccionesService.getMessagesByContact(
          contactId,
          PAGE_SIZE,
          channelInstance,
          1,
        );
        const sorted = sortMessagesChronologically(result.data);
        setMessages(sorted);
        setHasOlderMessages(result.meta?.hasNext ?? false);
        currentPageRef.current = 1;
      } catch (error) {
        console.error("Error al cargar mensajes:", error);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
        loadingRef.current = false;
      }
    },
    [],
  );

  const loadOlderMessages = useCallback(async () => {
    if (loadingRef.current || !hasOlderMessages || !contactIdRef.current) return;
    loadingRef.current = true;
    setLoadingOlderMessages(true);

    const nextPage = currentPageRef.current + 1;

    try {
      const result = await InteraccionesService.getMessagesByContact(
        contactIdRef.current,
        PAGE_SIZE,
        channelInstanceRef.current,
        nextPage,
      );
      const olderSorted = sortMessagesChronologically(result.data);

      setMessages((prev) => {
        // Evitar duplicados por ID
        const existingIds = new Set(prev.map((m) => m.id));
        const newMsgs = olderSorted.filter((m) => !existingIds.has(m.id));
        // Los mensajes antiguos van al inicio
        return [...newMsgs, ...prev];
      });

      setHasOlderMessages(result.meta?.hasNext ?? false);
      currentPageRef.current = nextPage;
    } catch (error) {
      console.error("Error al cargar mensajes anteriores:", error);
    } finally {
      setLoadingOlderMessages(false);
      loadingRef.current = false;
    }
  }, [hasOlderMessages]);

  const appendMessage = useCallback((msg: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  const updateMessage = useCallback(
    (msgId: string, updater: (msg: Message) => Message) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? updater(m) : m)),
      );
    },
    [],
  );

  const removeMessage = useCallback((msgId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  }, []);

  const refreshSilent = useCallback(
    async (contactId: string, channelInstance: string) => {
      if (loadingRef.current) return;
      try {
        const result = await InteraccionesService.getMessagesByContact(
          contactId,
          PAGE_SIZE,
          channelInstance,
          1,
        );
        const freshSorted = sortMessagesChronologically(result.data);

        setMessages((prev) => {
          // Mergear: mantener mensajes antiguos ya cargados, actualizar/agregar los recientes
          const oldIds = new Set(freshSorted.map((m) => m.id));
          const olderMessages = prev.filter((m) => !oldIds.has(m.id));
          return sortMessagesChronologically([...olderMessages, ...freshSorted]);
        });
      } catch {
        // Silencioso: no mostrar error
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setLoadingMessages(false);
    setLoadingOlderMessages(false);
    setHasOlderMessages(false);
    currentPageRef.current = 1;
    contactIdRef.current = "";
    channelInstanceRef.current = "";
    loadingRef.current = false;
  }, []);

  return {
    messages,
    setMessages,
    loadingMessages,
    loadingOlderMessages,
    hasOlderMessages,
    loadInitialMessages,
    loadOlderMessages,
    appendMessage,
    updateMessage,
    removeMessage,
    refreshSilent,
    reset,
  };
}
