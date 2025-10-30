/**
 * Contexto para manejar notificaciones Toast
 * Permite mostrar mensajes visuales en la aplicación
 */

import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

/**
 * Tipos de notificación
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Interfaz de una notificación Toast
 */
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
  detail?: string;
  noAutoClose?: boolean;
}

/**
 * Interfaz del contexto de Toast
 */
interface ToastContextType {
  showToast: (type: ToastType, message: string, title?: string, duration?: number, detail?: string, noAutoClose?: boolean) => void;
  showSuccess: (message: string, title?: string, duration?: number) => void;
  showError: (message: string, title?: string, duration?: number, detail?: string) => void;
  showInfo: (message: string, title?: string, duration?: number) => void;
  showWarning: (message: string, title?: string, duration?: number) => void;
  hideToast: (id: string) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Props del provider de Toast
 */
interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Provider de Toast
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (
      type: ToastType,
      message: string,
      title?: string,
      duration: number = 4000,
      detail?: string,
      noAutoClose?: boolean
    ) => {
      const id = `${Date.now()}-${Math.random()}`;
      const toast: Toast = {
        id,
        type,
        message,
        title,
        duration: noAutoClose ? 0 : duration,
        detail,
        noAutoClose: !!noAutoClose
      };
      setToasts((prev) => [...prev, toast]);
      if (!noAutoClose && duration > 0) {
        setTimeout(() => hideToast(id), duration);
      }
    },
    [hideToast]
  );

  const showSuccess = useCallback(
    (message: string, title?: string, duration?: number) => {
      showToast('success', message, title, duration);
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, title?: string, duration?: number, detail?: string) => {
      showToast('error', message, title, detail ? 0 : (duration || 5000), detail, !!detail);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, title?: string, duration?: number) => {
      showToast('info', message, title, duration);
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, title?: string, duration?: number) => {
      showToast('warning', message, title, duration);
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        hideToast,
        toasts,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

/**
 * Hook para usar el contexto de Toast
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser usado dentro de ToastProvider');
  }
  return context;
}

