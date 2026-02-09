/**
 * Servicio centralizado para mostrar alertas y mensajes
 * Integrado con i18n para mostrar mensajes según el idioma activo
 * Ahora también soporta notificaciones Toast visuales
 */

import { Alert, Platform } from "react-native";
import { useTranslation } from "../i18n";
import { extractErrorDetail, extractErrorMessage } from "./error-utils";
import { useToast } from "./toast.context";

/**
 * Opciones para mostrar alertas
 */
interface AlertOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

/**
 * Servicio para mostrar alertas localizadas
 */
class AlertService {
  /**
   * Muestra una alerta simple (solo OK)
   */
  showAlert(title: string, message: string, onPress?: () => void) {
    Alert.alert(title, message, [{ text: "OK", onPress }]);
  }

  /**
   * Muestra una alerta de confirmación (OK y Cancelar)
   */
  showConfirm(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string,
  ) {
    Alert.alert(title, message, [
      {
        text: cancelText || "Cancel",
        style: "cancel",
        onPress: onCancel,
      },
      {
        text: confirmText || "OK",
        onPress: onConfirm,
      },
    ]);
  }

  /**
   * Muestra un mensaje de éxito
   */
  showSuccess(message: string, onPress?: () => void) {
    Alert.alert("Éxito", message, [{ text: "OK", onPress }]);
  }

  /**
   * Muestra un mensaje de error
   */
  showError(message: string, onPress?: () => void) {
    Alert.alert("Error", message, [{ text: "OK", onPress }]);
  }
}

export const alertService = new AlertService();

/** Mensajes ante los cuales no se muestra toast ni modal (comportamiento silencioso). */
const SILENT_ERROR_MESSAGES = new Set([
  "Credenciales inválidas",
  "Invalid credentials",
]);

/**
 * Hook para usar alertas con traducciones y notificaciones Toast
 */
export function useAlert() {
  const { t } = useTranslation();

  // Usar toast si está disponible (debe estar dentro de ToastProvider)
  const toast = useToast();

  /**
   * Obtiene el texto de una clave de traducción de forma segura
   */
  const getTranslation = (keyPath: string): string => {
    const keys = keyPath.split(".");
    let value: any = t;

    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) {
        return keyPath; // Devolver la clave si no se encuentra
      }
    }

    return typeof value === "string" ? value : keyPath;
  };

  return {
    /**
     * Muestra una alerta modal (diálogo nativo)
     */
    showAlert: (titleKey: string, messageKey: string, onPress?: () => void) => {
      const title = getTranslation(titleKey);
      const message = getTranslation(messageKey);
      alertService.showAlert(title, message, onPress);
    },

    /**
     * Muestra un mensaje de éxito como Toast (notificación visual)
     * También muestra el diálogo modal como fallback en móvil si se necesita
     */
    showSuccess: (
      messageKey: string,
      showModal: boolean = false,
      onPress?: () => void,
    ) => {
      const message = getTranslation(messageKey);
      if (toast) {
        toast.showSuccess(message);
      }
      if (showModal || !toast) {
        alertService.showSuccess(message, onPress);
      }
    },

    /**
     * Muestra un mensaje de error como Toast (notificación visual)
     * También muestra el diálogo modal como fallback en móvil si se necesita
     *
     * @param messageKey - Clave de traducción o mensaje directo
     * @param showModal - Si true, también muestra un modal (default: false)
     * @param onPress - Callback cuando se presiona OK
     * @param detail - Detalle opcional del error. Si no se proporciona, se intentará extraer del error si se pasa un objeto
     * @param error - Objeto de error opcional del cual extraer el detalle automáticamente
     */
    showError: (
      messageKey: string | any,
      showModal: boolean = false,
      onPress?: () => void,
      detail?: string,
      error?: any,
    ) => {
      // Si messageKey es un objeto de error, extraer el mensaje y el detalle
      let message: string;
      let errorDetail: string | undefined = detail;

      if (typeof messageKey === "object" && messageKey !== null) {
        // Es un objeto de error, extraer mensaje y detalle
        message = extractErrorMessage(messageKey);
        errorDetail = errorDetail || extractErrorDetail(messageKey);
      } else {
        // Es una clave de traducción o mensaje directo
        message = getTranslation(messageKey);
        // Si se proporciona un objeto error, extraer el detalle
        if (error) {
          errorDetail = errorDetail || extractErrorDetail(error);
        }
      }

      if (SILENT_ERROR_MESSAGES.has(message.trim())) {
        return;
      }

      if (toast) {
        // Si hay detalle, el toast no se auto-cerrará
        toast.showError(message, undefined, undefined, errorDetail);
      }
      if (showModal || !toast) {
        alertService.showError(message, onPress);
      }
    },

    /**
     * Muestra un mensaje informativo como Toast
     */
    showInfo: (messageKey: string) => {
      const message = getTranslation(messageKey);
      if (toast) {
        toast.showInfo(message);
      } else {
        alertService.showAlert("Información", message);
      }
    },

    /**
     * Muestra un mensaje de advertencia como Toast
     */
    showWarning: (messageKey: string) => {
      const message = getTranslation(messageKey);
      if (toast) {
        toast.showWarning(message);
      } else {
        alertService.showAlert("Advertencia", message);
      }
    },

    /**
     * Muestra una alerta de confirmación modal
     */
    showConfirm: (
      titleKey: string,
      messageKey: string,
      onConfirm: () => void,
      onCancel?: () => void,
    ) => {
      const title = getTranslation(titleKey);
      const message = getTranslation(messageKey);

      if (Platform.OS === "web") {
        const fullMessage = title ? `${title}\n\n${message}` : message;
        const confirmed =
          typeof window !== "undefined" ? window.confirm(fullMessage) : true;
        if (confirmed) {
          onConfirm();
        } else if (onCancel) {
          onCancel();
        }
        return;
      }

      alertService.showConfirm(title, message, onConfirm, onCancel);
    },
  };
}
