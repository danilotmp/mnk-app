/**
 * Servicio para CRUD de Condiciones comerciales
 */

import { apiClient } from "@/src/infrastructure/api";
import { SUCCESS_STATUS_CODE } from "@/src/infrastructure/api/constants";
import type { Condition, ConditionPayload } from "./conditions-modal.types";

const BASE = "/commercial/conditions";

export class ConditionsService {
  static async getAll(companyId: string, scope?: string): Promise<Condition[]> {
    let url = `${BASE}?companyId=${encodeURIComponent(companyId)}&admin=true`;
    if (scope) url += `&scope=${encodeURIComponent(scope)}`;
    const res = await apiClient.get<any>(url);
    if (res.result?.statusCode === SUCCESS_STATUS_CODE) {
      const raw = res.data;
      return Array.isArray(raw) ? raw : raw?.data || raw?.items || [];
    }
    throw new Error(res.result?.description || "Error al obtener condiciones");
  }

  static async getById(id: string): Promise<Condition> {
    const res = await apiClient.get<any>(`${BASE}/${id}`);
    if (res.result?.statusCode === SUCCESS_STATUS_CODE && res.data) return res.data;
    throw new Error(res.result?.description || "Error al obtener condición");
  }

  static async create(payload: ConditionPayload): Promise<Condition> {
    const res = await apiClient.post<any>(BASE, payload);
    if (res.result?.statusCode === SUCCESS_STATUS_CODE && res.data) return res.data;
    throw new Error(res.result?.description || "Error al crear condición");
  }

  static async update(id: string, payload: Partial<ConditionPayload>): Promise<Condition> {
    const res = await apiClient.put<any>(`${BASE}/${id}`, payload);
    if (res.result?.statusCode === SUCCESS_STATUS_CODE && res.data) return res.data;
    throw new Error(res.result?.description || "Error al actualizar condición");
  }

  static async remove(id: string): Promise<void> {
    const res = await apiClient.delete<any>(`${BASE}/${id}`);
    if (res.result?.statusCode !== SUCCESS_STATUS_CODE) {
      throw new Error(res.result?.description || "Error al eliminar condición");
    }
  }
}
