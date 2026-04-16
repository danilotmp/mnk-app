/**
 * Servicio de Interacciones para Chat IA
 * Gestiona contactos, mensajes y resúmenes de contexto
 */

import { apiClient } from '@/src/infrastructure/api/api.client';
import { ApiConfig } from '@/src/infrastructure/api/config';
import { Platform } from 'react-native';
import type {
    Contact,
    ContactPayload,
    ContextSummary,
    ContextSummaryPayload,
    InteraccionesContextProfile,
    InteraccionesDashboardPeriodData,
    InteraccionesDashboardPeriodInstanceRow,
    InteraccionesDashboardPeriodParams,
    InteraccionesInstitutionalContextBody,
    InteraccionesWhatsappInstance,
    Message,
    MessagePayload
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

function parseNonNegativeInt(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return Math.max(0, Math.floor(n));
  }
  return 0;
}

function normalizeDashboardPeriodInstanceRow(
  raw: Record<string, any>,
): InteraccionesDashboardPeriodInstanceRow {
  const operationsRaw =
    raw.operationsCount ??
    raw.operations_count ??
    raw.executionsCount ??
    raw.executions_count;
  const paymentsRaw = raw.paymentsCount ?? raw.payments_count;
  const execRaw = raw.executionsCount ?? raw.executions_count ?? paymentsRaw;
  return {
    channelInstance: String(
      raw.channelInstance ?? raw.channel_instance ?? "",
    ).trim(),
    transactionsCount: parseNonNegativeInt(
      raw.transactionsCount ?? raw.transactions_count,
    ),
    countDocuments: parseNonNegativeInt(
      raw.countDocuments ?? raw.count_documents,
    ),
    operationsCount: parseNonNegativeInt(operationsRaw),
    paymentsCount: parseNonNegativeInt(paymentsRaw),
    executionsCount: parseNonNegativeInt(execRaw),
  };
}

function emptyDashboardPeriodData(): InteraccionesDashboardPeriodData {
  return { instances: [] };
}

function normalizeDashboardPeriodPayload(
  raw: Record<string, any> | null | undefined,
): InteraccionesDashboardPeriodData {
  if (!raw || typeof raw !== "object") {
    return emptyDashboardPeriodData();
  }
  const listRaw = raw.instances ?? raw.instance_rows;
  const list = Array.isArray(listRaw) ? listRaw : [];
  const instances = list
    .filter((row) => row && typeof row === "object")
    .map((row) => normalizeDashboardPeriodInstanceRow(row as Record<string, any>));
  return {
    companyId: raw.companyId ?? raw.company_id,
    product: raw.product,
    periodYear: raw.periodYear ?? raw.period_year,
    periodMonth: raw.periodMonth ?? raw.period_month,
    timezoneNote: raw.timezoneNote ?? raw.timezone_note,
    channelInstanceFilter:
      raw.channelInstanceFilter ?? raw.channel_instance_filter ?? null,
    metricDefinitions:
      raw.metricDefinitions ?? raw.metric_definitions ?? undefined,
    messageCountCriteria:
      raw.messageCountCriteria ?? raw.message_count_criteria,
    instances,
  };
}

export const InteraccionesService = {
  /**
   * Perfil comercial por UUID de perfil (no confundir con companyId).
   * GET /interacciones/context/profile/:commercialProfileId
   */
  async getContextProfile(
    commercialProfileId: string,
    admin = true,
  ): Promise<InteraccionesContextProfile> {
    const endpoint = buildQuery(
      `${BASE_INTERACCIONES}/context/profile/${commercialProfileId}`,
      { admin: admin ? "true" : undefined },
    );
    const res = await apiClient.get<InteraccionesContextProfile>(endpoint);
    return (res.data as InteraccionesContextProfile) ?? {};
  },

  /**
   * Contexto institucional simplificado por código de empresa (AIB-COMPANY-CODE).
   * GET /interacciones/context/:companyCode — incluye `commercial.whatsappInstances`.
   */
  async getInstitutionalContextByCompanyCode(
    companyCode: string,
  ): Promise<InteraccionesContextProfile> {
    const code = companyCode.trim();
    if (!code) {
      return {};
    }
    const res = await apiClient.get<InteraccionesInstitutionalContextBody>(
      `${BASE_INTERACCIONES}/context/${encodeURIComponent(code)}`,
    );
    const payload = res.data as InteraccionesInstitutionalContextBody | undefined;
    const commercial = payload?.institutional?.data?.commercial;
    const raw =
      commercial?.whatsappInstances ?? commercial?.whatsapp_instances ?? [];
    const list = Array.isArray(raw) ? raw : [];
    const whatsappInstances: InteraccionesWhatsappInstance[] = list
      .filter((row) => row?.isActive !== false)
      .map((x) => ({
        id: x.id,
        whatsapp: String(x.whatsapp ?? "").trim(),
        isActive: x.isActive,
        name: x.name,
        label: x.label,
        phoneNumber: x.phoneNumber,
        phone: x.phone,
      }))
      .filter((i) => i.whatsapp.length > 0);
    return { whatsappInstances };
  },

  /**
   * Dashboard por mes e instancias (mes calendario UTC si no se envían year/month).
   * GET /interacciones/dashboard/period?companyId=… [&channelInstance=…] [&year=&month=] [&onlyOutbound=]
   * Sin `channelInstance` → todas las instancias con datos en el mes (`data.instances`).
   */
  async getDashboardPeriod(
    params: InteraccionesDashboardPeriodParams,
  ): Promise<InteraccionesDashboardPeriodData> {
    const { companyId, channelInstance, year, month, onlyOutbound } = params;
    const cid = companyId.trim();
    if (!cid) {
      return emptyDashboardPeriodData();
    }
    const q: Record<string, string | number | boolean> = { companyId: cid };
    const ch = channelInstance?.trim();
    if (ch) {
      q.channelInstance = ch;
    }
    if (year !== undefined && month !== undefined) {
      q.year = year;
      q.month = month;
    }
    if (onlyOutbound !== undefined) {
      q.onlyOutbound = onlyOutbound;
    }
    const endpoint = buildQuery(
      `${BASE_INTERACCIONES}/dashboard/period`,
      q,
    );
    const res = await apiClient.get<Record<string, any>>(endpoint);
    const root = res.data as Record<string, any> | undefined;
    const payload =
      root?.data !== undefined && typeof root.data === "object"
        ? (root.data as Record<string, any>)
        : root;
    return normalizeDashboardPeriodPayload(payload);
  },

  // ===== Contacts =====
  async getContacts(
    companyId: string,
    channelInstance?: string,
  ): Promise<Contact[]> {
    const endpoint = buildQuery(`${BASE_INTERACCIONES}/contacts`, {
      companyId,
      channelInstance,
    });
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

  /**
   * PUT contacto: `channelInstance` es obligatorio en API (se envía siempre en body).
   */
  async updateContact(
    id: string,
    payload: Partial<Omit<ContactPayload, "channelInstance">>,
    channelInstance: string,
  ): Promise<Contact> {
    const body = { ...payload, channelInstance };
    const res = await apiClient.put<Contact>(
      `${BASE_INTERACCIONES}/contacts/${id}`,
      body,
    );
    return res.data;
  },

  // ===== Messages =====
  async getMessagesByContact(
    contactId: string,
    limit?: number,
    channelInstance?: string,
    page?: number,
  ): Promise<{ data: Message[]; meta?: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }> {
    const endpoint = buildQuery(
      `${BASE_INTERACCIONES}/messages/contact/${contactId}`,
      { limit, channelInstance, page },
    );
    const res = await apiClient.get<any>(endpoint);
    // Soportar respuesta paginada { data: [...], meta: {...} } o array directo
    const raw = res.data;
    if (raw && typeof raw === "object" && !Array.isArray(raw) && raw.data) {
      return { data: raw.data || [], meta: raw.meta };
    }
    return { data: Array.isArray(raw) ? raw : [], meta: undefined };
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
      formData.append('channelInstance', payload.channelInstance);
      if (payload.status) {
        formData.append('status', payload.status);
      }
      if (payload.parentMessageId) {
        formData.append('parentMessageId', payload.parentMessageId);
      }
      formData.append('isFromBot', String(payload.isFromBot ?? false));
      if (payload.aiContext) {
        formData.append('aiContext', JSON.stringify(payload.aiContext));
      }
      if (payload.contactName != null && payload.contactName !== '') {
        formData.append('contactName', payload.contactName);
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
      // Sin archivos: usar JSON normal (contactName opcional, documentado en el back)
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
  async updateMessage(
    messageId: string,
    content: string,
    channelInstance: string,
  ): Promise<Message> {
    const res = await apiClient.put<Message>(
      `${BASE_INTERACCIONES}/messages/${messageId}`,
      { content, channelInstance },
    );
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

