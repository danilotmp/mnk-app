import { apiClient } from '@/src/infrastructure/api/api.client';
import type { NotificationLog, NotificationSendPayload, NotificationTemplate, SystemParam } from './types';

/**
 * Servicio de Notificaciones (Fase 1 Email)
 * Usa los endpoints provistos por el backend:
 * - CRUD Plantillas: /notifications/templates
 * - Envío: /notifications/send
 * - Retry: /notifications/retry/:id (supuesto)
 * - Parámetros: /system-params
 */

const BASE_NOTIF = '/notifications';
const BASE_PARAMS = '/system-params';

// Helper para construir querystring manual (apiClient.request no soporta params)
const buildQuery = (base: string, params?: Record<string, any>): string => {
  if (!params) return base;
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${base}?${qs}` : base;
};

export const NotificationsService = {
  // Plantillas
  async getTemplates(): Promise<NotificationTemplate[]> {
    const res = await apiClient.request<NotificationTemplate[]>({
      endpoint: `${BASE_NOTIF}/templates`,
      method: 'GET',
    });
    return res.data || [];
  },

  async createTemplate(payload: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const res = await apiClient.request<NotificationTemplate>({
      endpoint: `${BASE_NOTIF}/templates`,
      method: 'POST',
      body: payload,
    });
    return res.data;
  },

  async updateTemplate(id: string, payload: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const res = await apiClient.request<NotificationTemplate>({
      endpoint: `${BASE_NOTIF}/templates/${id}`,
      method: 'PUT',
      body: payload,
    });
    return res.data;
  },

  async deleteTemplate(id: string): Promise<void> {
    await apiClient.request({
      endpoint: `${BASE_NOTIF}/templates/${id}`,
      method: 'DELETE',
    });
  },

  // Envíos
  async sendNotification(payload: NotificationSendPayload): Promise<{ id: string }> {
    const res = await apiClient.request<{ id: string }>({
      endpoint: `${BASE_NOTIF}/send`,
      method: 'POST',
      body: payload,
    });
    return res.data;
  },

  async retryNotification(id: string): Promise<void> {
    await apiClient.request({
      endpoint: `${BASE_NOTIF}/retry/${id}`,
      method: 'POST',
      body: {},
    });
  },

  async listNotifications(params?: { status?: string; code?: string; companyId?: string; lang?: string }): Promise<NotificationLog[]> {
    const endpoint = buildQuery(BASE_NOTIF, params);
    const res = await apiClient.request<NotificationLog[]>({
      endpoint,
      method: 'GET',
    });
    return res.data || [];
  },

  // Parámetros (system_params)
  async listParams(params?: { scope?: string; companyId?: string | null }): Promise<SystemParam[]> {
    const endpoint = buildQuery(BASE_PARAMS, params);
    const res = await apiClient.request<SystemParam[]>({
      endpoint,
      method: 'GET',
    });
    return res.data || [];
  },

  async upsertParam(payload: SystemParam): Promise<SystemParam> {
    const res = await apiClient.request<SystemParam>({
      endpoint: BASE_PARAMS,
      method: 'POST',
      body: payload,
    });
    return res.data;
  },
};
