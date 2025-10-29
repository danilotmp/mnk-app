/**
 * Servicio centralizado para mostrar alertas y mensajes
 * Integrado con i18n para mostrar mensajes según el idioma activo
 */

import { Alert } from 'react-native';
import { useTranslation } from '../i18n';

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
    Alert.alert(title, message, [{ text: 'OK', onPress }]);
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
    cancelText?: string
  ) {
    Alert.alert(
      title,
      message,
      [
        {
          text: cancelText || 'Cancel',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: confirmText || 'OK',
          onPress: onConfirm,
        },
      ]
    );
  }

  /**
   * Muestra un mensaje de éxito
   */
  showSuccess(message: string, onPress?: () => void) {
    // En una implementación más completa, podrías usar un toast o snackbar
    Alert.alert('Éxito', message, [{ text: 'OK', onPress }]);
  }

  /**
   * Muestra un mensaje de error
   */
  showError(message: string, onPress?: () => void) {
    Alert.alert('Error', message, [{ text: 'OK', onPress }]);
  }
}

export const alertService = new AlertService();

/**
 * Hook para usar alertas con traducciones
 */
export function useAlert() {
  const { t } = useTranslation();

  /**
   * Obtiene el texto de una clave de traducción de forma segura
   */
  const getTranslation = (keyPath: string): string => {
    const keys = keyPath.split('.');
    let value: any = t;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) {
        return keyPath; // Devolver la clave si no se encuentra
      }
    }
    
    return typeof value === 'string' ? value : keyPath;
  };

  return {
    showAlert: (titleKey: string, messageKey: string, onPress?: () => void) => {
      const title = getTranslation(titleKey);
      const message = getTranslation(messageKey);
      alertService.showAlert(title, message, onPress);
    },
    
    showSuccess: (messageKey: string, onPress?: () => void) => {
      const message = getTranslation(messageKey);
      alertService.showSuccess(message, onPress);
    },
    
    showError: (messageKey: string, onPress?: () => void) => {
      // Si messageKey no es una clave de traducción, usarlo directamente
      const message = getTranslation(messageKey);
      alertService.showError(message, onPress);
    },
    
    showConfirm: (
      titleKey: string,
      messageKey: string,
      onConfirm: () => void,
      onCancel?: () => void
    ) => {
      const title = getTranslation(titleKey);
      const message = getTranslation(messageKey);
      alertService.showConfirm(title, message, onConfirm, onCancel);
    },
  };
}

