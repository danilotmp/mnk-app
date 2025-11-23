/**
 * Hook personalizado para gestión de usuarios
 * Proporciona estado y funciones para operaciones CRUD de usuarios
 */

import { useCallback, useState } from 'react';
import { PaginatedResponse } from '@/src/domains/shared/types';
import { UsersService } from '../services';
import { User, UserFilters, UserUpdatePayload } from '../types/domain';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { useTranslation } from '@/src/infrastructure/i18n';

interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  loadUsers: (filters: UserFilters) => Promise<void>;
  getUserById: (id: string) => Promise<User | null>;
  createUser: (userData: Partial<User>) => Promise<User | null>;
  updateUser: (id: string, userData: Partial<User>) => Promise<User | null>;
  updateUserComplete: (id: string, userData: UserUpdatePayload) => Promise<User | null>;
  deleteUser: (id: string) => Promise<boolean>;
  toggleUserStatus: (id: string, isActive: boolean) => Promise<User | null>;
  refresh: () => Promise<void>;
}

export function useUsers(initialFilters?: UserFilters): UseUsersReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [currentFilters, setCurrentFilters] = useState<UserFilters>(initialFilters || {
    page: 1,
    limit: 10,
  });
  
  const alert = useAlert();
  const { t } = useTranslation();

  const loadUsers = useCallback(async (filters: UserFilters) => {
    setLoading(true);
    setError(null);
    setCurrentFilters(filters);
    
    try {
      const response: PaginatedResponse<User> = await UsersService.getUsers(filters);
      setUsers(response.data);
      setPagination(response.meta);
    } catch (err: any) {
      const errorMessage = err?.message || err?.result?.description || 'Error al cargar usuarios';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserById = useCallback(async (id: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await UsersService.getUserById(id);
      return user;
    } catch (err: any) {
      const errorMessage = err?.message || err?.result?.description || 'Error al obtener usuario';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userData: Partial<User>): Promise<User | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const newUser = await UsersService.createUser(userData);
      alert.showSuccess(t.security?.users?.createSuccess || 'Usuario creado exitosamente');
      // Recargar lista después de crear
      await loadUsers(currentFilters);
      return newUser;
    } catch (err: any) {
      const errorMessage = err?.message || err?.result?.description || 'Error al crear usuario';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [alert, t, loadUsers, currentFilters]);

  const updateUser = useCallback(async (
    id: string,
    userData: Partial<User>
  ): Promise<User | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedUser = await UsersService.updateUser(id, userData);
      alert.showSuccess(t.security?.users?.updateSuccess || 'Usuario actualizado exitosamente');
      // Recargar lista después de actualizar
      await loadUsers(currentFilters);
      return updatedUser;
    } catch (err: any) {
      const errorMessage = err?.message || err?.result?.description || 'Error al actualizar usuario';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [alert, t, loadUsers, currentFilters]);

  const updateUserComplete = useCallback(async (
    id: string,
    userData: UserUpdatePayload
  ): Promise<User | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedUser = await UsersService.updateUserComplete(id, userData);
      alert.showSuccess(t.security?.users?.updateSuccess || 'Usuario actualizado exitosamente');
      // Recargar lista después de actualizar
      await loadUsers(currentFilters);
      return updatedUser;
    } catch (err: any) {
      const errorMessage = err?.message || err?.result?.description || 'Error al actualizar usuario';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [alert, t, loadUsers, currentFilters]);

  const deleteUser = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await UsersService.deleteUser(id);
      alert.showSuccess(t.security?.users?.deleteSuccess || 'Usuario eliminado exitosamente');
      // Recargar lista después de eliminar
      await loadUsers(currentFilters);
      return true;
    } catch (err: any) {
      const errorMessage = err?.message || err?.result?.description || 'Error al eliminar usuario';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [alert, t, loadUsers, currentFilters]);

  const toggleUserStatus = useCallback(async (
    id: string,
    isActive: boolean
  ): Promise<User | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedUser = await UsersService.toggleUserStatus(id, isActive);
      alert.showSuccess(
        isActive 
          ? (t.security?.users?.activateSuccess || 'Usuario activado exitosamente')
          : (t.security?.users?.deactivateSuccess || 'Usuario desactivado exitosamente')
      );
      // Recargar lista después de cambiar estado
      await loadUsers(currentFilters);
      return updatedUser;
    } catch (err: any) {
      const errorMessage = err?.message || err?.result?.description || 'Error al cambiar estado del usuario';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [alert, t, loadUsers, currentFilters]);

  const refresh = useCallback(async () => {
    await loadUsers(currentFilters);
  }, [loadUsers, currentFilters]);

  return {
    users,
    loading,
    error,
    pagination,
    loadUsers,
    getUserById,
    createUser,
    updateUser,
    updateUserComplete,
    deleteUser,
    toggleUserStatus,
    refresh,
  };
}

