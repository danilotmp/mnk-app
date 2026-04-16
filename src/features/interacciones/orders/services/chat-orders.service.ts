/**
 * Servicio para Órdenes de Chat IA
 * Dominio: interacciones — endpoint GET /interacciones/dashboard/chat-order-records
 */

import { apiClient } from "@/src/infrastructure/api";
import { ApiConfig } from "@/src/infrastructure/api/config";
import { SUCCESS_STATUS_CODE } from "@/src/infrastructure/api/constants";
import type { ChatOrderFilters, ChatOrderPaginatedResponse } from "../types";

export class ChatOrdersService {
  private static readonly BASE = "/interacciones/dashboard/chat-order-records";

  /**
   * Obtiene el listado paginado de órdenes de Chat IA.
   */
  static async getOrders(
    filters: ChatOrderFilters,
  ): Promise<ChatOrderPaginatedResponse> {
    const params = new URLSearchParams();
    params.append("companyId", filters.companyId);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search?.trim()) params.append("search", filters.search.trim());
    if (typeof filters.status === "number")
      params.append("status", filters.status.toString());

    const qs = params.toString();
    const endpoint = qs ? `${this.BASE}?${qs}` : this.BASE;
    const response = await apiClient.get<any>(endpoint);

    if (response.result?.statusCode === SUCCESS_STATUS_CODE && response.data) {
      const raw = response.data;
      const data = Array.isArray(raw)
        ? raw
        : raw?.data || raw?.items || [];
      const meta = raw?.meta || response.meta || {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total: data.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };
      return { data, meta };
    }
    throw new Error(
      response.result?.description || "Error al obtener órdenes",
    );
  }

  /**
   * Descarga el archivo Excel de órdenes.
   * GET /interacciones/dashboard/chat-order-records/export?companyId=xxx
   */
  /**
   * Descarga el archivo Excel de órdenes.
   * GET /interacciones/dashboard/chat-order-records/export?companyId=xxx
   * El backend devuelve el binario .xlsx directamente.
   */
  static async exportToExcel(companyId: string): Promise<void> {
    const baseUrl = ApiConfig.getInstance().getBaseUrl();
    const tokens = await apiClient.getTokens();
    const url = `${baseUrl}${this.BASE}/export?companyId=${encodeURIComponent(companyId)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokens?.accessToken || ""}`,
      },
    });

    if (!response.ok) throw new Error("Export failed");

    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition") || "";
    const match = disposition.match(/filename="?([^";\n]+)"?/);
    const filename = match?.[1] || `ordenes_chat_${new Date().toISOString().slice(0, 10)}.xlsx`;

    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(downloadUrl);
  }
}
