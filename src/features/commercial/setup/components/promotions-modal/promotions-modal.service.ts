/**
 * Servicio para CRUD de Promociones comerciales
 */

import { apiClient } from "@/src/infrastructure/api";
import { SUCCESS_STATUS_CODE } from "@/src/infrastructure/api/constants";
import type { Promotion, PromotionPayload } from "./promotions-modal.types";

const BASE = "/commercial/promotions";

export class PromotionsService {
  static async getAll(companyId: string, scope?: string): Promise<Promotion[]> {
    let url = `${BASE}?companyId=${encodeURIComponent(companyId)}&admin=true`;
    if (scope) url += `&scope=${encodeURIComponent(scope)}`;
    const res = await apiClient.get<any>(url);
    if (res.result?.statusCode === SUCCESS_STATUS_CODE) {
      const raw = res.data;
      return Array.isArray(raw) ? raw : raw?.data || raw?.items || [];
    }
    throw new Error(res.result?.description || "Error al obtener promociones");
  }

  static async create(payload: PromotionPayload): Promise<Promotion> {
    const res = await apiClient.post<any>(BASE, payload);
    if (res.result?.statusCode === SUCCESS_STATUS_CODE && res.data) return res.data;
    throw new Error(res.result?.description || "Error al crear promoción");
  }

  static async update(id: string, payload: Partial<PromotionPayload>): Promise<Promotion> {
    const res = await apiClient.put<any>(`${BASE}/${id}`, payload);
    if (res.result?.statusCode === SUCCESS_STATUS_CODE && res.data) return res.data;
    throw new Error(res.result?.description || "Error al actualizar promoción");
  }

  static async remove(id: string): Promise<void> {
    const res = await apiClient.delete<any>(`${BASE}/${id}`);
    if (res.result?.statusCode !== SUCCESS_STATUS_CODE) {
      throw new Error(res.result?.description || "Error al eliminar promoción");
    }
  }
}
