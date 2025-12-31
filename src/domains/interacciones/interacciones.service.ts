/**
 * Servicio de Interacciones para Chat IA
 * Gestiona contactos, mensajes y resúmenes de contexto
 */

import { apiClient } from '@/src/infrastructure/api/api.client';
import type {
  Contact,
  ContactPayload,
  ContactWithLastMessage,
  ContextSummary,
  ContextSummaryPayload,
  Message,
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

  async createMessage(payload: MessagePayload): Promise<Message> {
    const res = await apiClient.post<Message>(`${BASE_INTERACCIONES}/messages`, payload);
    return res.data;
  },

  async updateMessageStatus(id: string, status: string): Promise<Message> {
    const res = await apiClient.put<Message>(`${BASE_INTERACCIONES}/messages/${id}/status`, { status });
    return res.data;
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

