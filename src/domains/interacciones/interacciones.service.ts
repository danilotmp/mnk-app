/**
 * Servicio de Interacciones para Chat IA
 * Gestiona contactos, mensajes y resúmenes de contexto
 */

import { Platform } from 'react-native';
import { apiClient } from '@/src/infrastructure/api/api.client';
import { ApiConfig } from '@/src/infrastructure/api/config';
import type {
  Contact,
  ContactPayload,
  ContactWithLastMessage,
  ContextSummary,
  ContextSummaryPayload,
  Message,
  MessageAttachment,
  MessagePayload,
} from './types';

const BASE_INTERACCIONES = '/interacciones';

// Helper para construir querystring
const buildQuery = (base: string, params?: Record<string, any>): string => {
  if (!params) return base;
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${base}?${qs}` : base;
};

export const InteraccionesService = {
  // ===== Contacts =====
  async getContacts(companyId: string): Promise<Contact[]> {
    const endpoint = buildQuery(`${BASE_INTERACCIONES}/contacts`, { companyId });
    const res = await apiClient.get<Contact[]>(endpoint);
    return res.data || [];
  },

  async getContactByPhone(phoneNumber: string, companyId: string): Promise<Contact | null> {
    const endpoint = buildQuery(`${BASE_INTERACCIONES}/contacts/phone/${phoneNumber}`, { companyId });
    try {
      const res = await apiClient.get<Contact>(endpoint);
      return res.data || null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getContactById(id: string): Promise<Contact> {
    const endpoint = `${BASE_INTERACCIONES}/contacts/${id}`;
    const res = await apiClient.get<Contact>(endpoint);
    return res.data;
  },

  async createContact(payload: ContactPayload): Promise<Contact> {
    const res = await apiClient.post<Contact>(`${BASE_INTERACCIONES}/contacts`, payload);
    return res.data;
  },

  async updateContact(id: string, payload: Partial<ContactPayload>): Promise<Contact> {
    const res = await apiClient.put<Contact>(`${BASE_INTERACCIONES}/contacts/${id}`, payload);
    return res.data;
  },

  // ===== Messages =====
  async getMessagesByContact(contactId: string, limit?: number): Promise<Message[]> {
    const endpoint = buildQuery(`${BASE_INTERACCIONES}/messages/contact/${contactId}`, { limit });
    const res = await apiClient.get<Message[]>(endpoint);
    return res.data || [];
  },

  async getMessageById(id: string): Promise<Message> {
    const endpoint = `${BASE_INTERACCIONES}/messages/${id}`;
    const res = await apiClient.get<Message>(endpoint);
    return res.data;
  },

  /**
   * Crea un mensaje con o sin archivos adjuntos
   * @param payload - Datos del mensaje
   * @param files - Archivos opcionales (File[] para web, ImagePickerAsset[] para RN)
   * @returns Mensaje creado con attachments si hay archivos
   */
  async createMessage(
    payload: MessagePayload,
    files?: Array<File | { uri: string; type: string; name: string }>
  ): Promise<Message> {
    // Si hay archivos, usar FormData
    if (files && files.length > 0) {
      const formData = new FormData();

      // Agregar campos del mensaje
      formData.append('contactId', payload.contactId);
      formData.append('content', payload.content || '');
      formData.append('direction', payload.direction);
      if (payload.status) {
        formData.append('status', payload.status);
      }
      if (payload.parentMessageId) {
        formData.append('parentMessageId', payload.parentMessageId);
      }
      if (payload.isFromBot !== undefined) {
        formData.append('isFromBot', String(payload.isFromBot));
      }
      if (payload.aiContext) {
        formData.append('aiContext', JSON.stringify(payload.aiContext));
      }

      // Agregar archivos según la plataforma
      files.forEach((file) => {
        if (Platform.OS === 'web') {
          // Web: usar File directamente
          const webFile = file as File;
          formData.append('files', webFile);
        } else {
          // React Native: usar formato específico
          const rnFile = file as { uri: string; type: string; name: string };
          formData.append('files', {
            uri: Platform.OS === 'ios' ? rnFile.uri.replace('file://', '') : rnFile.uri,
            type: rnFile.type,
            name: rnFile.name,
          } as any);
        }
      });

      const res = await apiClient.post<Message>(`${BASE_INTERACCIONES}/messages`, formData);
      return res.data;
    } else {
      // Sin archivos: usar JSON normal
      const res = await apiClient.post<Message>(`${BASE_INTERACCIONES}/messages`, payload);
      return res.data;
    }
  },

  /**
   * Obtiene la URL completa para descargar/visualizar un archivo adjunto
   * @param messageId - ID del mensaje
   * @param attachmentId - ID del attachment
   * @param filePath - Ruta relativa del archivo (opcional, para construir URL alternativa)
   * @returns URL completa del archivo
   */
  getAttachmentUrl(messageId: string, attachmentId: string, filePath?: string): string {
    const apiConfig = ApiConfig.getInstance();
    const baseUrl = apiConfig.getBaseUrl();
    
    // Construir URL usando el endpoint de la API: /api/interacciones/messages/:messageId/attachments/:attachmentId
    // Este endpoint requiere autenticación JWT y sirve el archivo desde uploads/{filePath}
    return `${baseUrl}${BASE_INTERACCIONES}/messages/${messageId}/attachments/${attachmentId}`;
  },

  async updateMessageStatus(id: string, status: string): Promise<Message> {
    const res = await apiClient.put<Message>(`${BASE_INTERACCIONES}/messages/${id}/status`, { status });
    return res.data;
  },

  /**
   * Edita el contenido de un mensaje
   * @param messageId - ID del mensaje a editar
   * @param content - Nuevo contenido del mensaje
   * @returns Mensaje actualizado
   */
  async updateMessage(messageId: string, content: string): Promise<Message> {
    const res = await apiClient.put<Message>(`${BASE_INTERACCIONES}/messages/${messageId}`, { content });
    return res.data;
  },

  /**
   * Elimina un mensaje y sus archivos adjuntos
   * @param messageId - ID del mensaje a eliminar
   * @returns Respuesta de eliminación
   */
  async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete(`${BASE_INTERACCIONES}/messages/${messageId}`);
  },

  // ===== Context Summaries =====
  async getContextSummariesByContact(contactId: string): Promise<ContextSummary[]> {
    const endpoint = `${BASE_INTERACCIONES}/context-summaries/contact/${contactId}`;
    const res = await apiClient.get<ContextSummary[]>(endpoint);
    return res.data || [];
  },

  async getLatestContextSummary(contactId: string): Promise<ContextSummary | null> {
    const endpoint = `${BASE_INTERACCIONES}/context-summaries/contact/${contactId}/latest`;
    try {
      const res = await apiClient.get<ContextSummary>(endpoint);
      return res.data || null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async createContextSummary(payload: ContextSummaryPayload): Promise<ContextSummary> {
    const res = await apiClient.post<ContextSummary>(`${BASE_INTERACCIONES}/context-summaries`, payload);
    return res.data;
  },
};

