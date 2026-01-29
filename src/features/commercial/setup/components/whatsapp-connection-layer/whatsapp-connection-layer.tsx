/**
 * Componente para Capa de Conexión WhatsApp
 * Crea la instancia de WhatsApp y muestra el QR code para conectar.
 * Si el perfil ya tiene whatsappQR, se muestra sin orquestar los servicios.
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { CommercialService } from '@/src/domains/commercial';
import type { CommercialProfile } from '@/src/domains/commercial/types';
import { useCompany } from '@/src/domains/shared';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';

/** Normaliza whatsappQR del perfil (string o objeto con qr) a base64 string para mostrar. */
function getWhatsAppQRBase64(whatsappQR: CommercialProfile['whatsappQR']): string | null {
  if (whatsappQR == null) return null;
  if (typeof whatsappQR === 'string') return whatsappQR;
  return whatsappQR.qr || null;
}

interface WhatsAppConnectionLayerProps {
  onProgressUpdate?: (progress: number) => void;
  onDataChange?: (hasData: boolean) => void;
  onComplete?: () => void;
}

export function WhatsAppConnectionLayer({ onProgressUpdate, onDataChange, onComplete }: WhatsAppConnectionLayerProps) {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const { t } = useTranslation();
  const alert = useAlert();
  const { company } = useCompany();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState<string | null>(null);

  // Al montar: si el perfil ya tiene whatsappQR, mostrarlo sin llamar a create/qrcode
  useEffect(() => {
    if (!company?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const profile = await CommercialService.getProfile(company.id);
        if (cancelled) return;
        const existingQR = getWhatsAppQRBase64(profile.whatsappQR);
        if (existingQR) {
          setQrCode(existingQR);
          if (profile.whatsapp) setWhatsapp(profile.whatsapp);
          onProgressUpdate?.(100);
          onDataChange?.(true);
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error('Error al cargar perfil para WhatsApp:', error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [company?.id]);

  /** Orquesta create → qrcode → guardar en perfil. Usado para "Generar" y "Regenerar". */
  const handleConnect = async () => {
    if (!company?.id) {
      alert.showError('No se encontró la empresa');
      return;
    }

    try {
      setLoading(true);
      const profile = await CommercialService.getProfile(company.id);
      
      if (!profile.whatsapp) {
        alert.showError('Debes configurar el número de WhatsApp en la capa de Contexto Institucional primero');
        return;
      }

      const whatsappValue = profile.whatsapp;
      setWhatsapp(whatsappValue);

      // Paso 1: Crear instancia de WhatsApp
      setCreating(true);
      const createResponse = await CommercialService.createWhatsAppInstance(whatsappValue);
      
      if (!createResponse.success) {
        alert.showError('Error al crear la instancia de WhatsApp');
        return;
      }

      // Paso 2: Obtener QR code
      const qrResponse = await CommercialService.getWhatsAppQRCode(whatsappValue);
      
      if (!qrResponse.qrcode) {
        alert.showError('Error al obtener el código QR');
        return;
      }

      setQrCode(qrResponse.qrcode);

      // Paso 3: Guardar QR code en el perfil
      // El endpoint connectWhatsApp actualiza automáticamente whatsappQR, pero primero guardamos el QR
      await CommercialService.updateProfile(company.id, {
        whatsappQR: {
          qr: qrResponse.qrcode,
          expiresAt: new Date(Date.now() + 60 * 1000).toISOString(), // Expira en 1 minuto (típico de QR de WhatsApp)
        },
      });

      // Paso 4: Llamar al endpoint de conexión para marcar como conectado
      // Este endpoint actualiza automáticamente whatsappQR en el backend
      try {
        await CommercialService.connectWhatsApp(company.id);
      } catch (error: any) {
        // Si falla, no es crítico - el QR ya está guardado
        console.error('Error al conectar WhatsApp (no crítico):', error);
      }

      // Actualizar progreso
      onProgressUpdate?.(100);
      onDataChange?.(true);
      alert.showSuccess('Código QR generado correctamente. Escanea el código con WhatsApp para conectar.');
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al conectar WhatsApp';
      alert.showError(errorMessage);
    } finally {
      setLoading(false);
      setCreating(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <View style={styles.formContainer}>
        {!qrCode && !loading && (
          <View style={styles.actionContainer}>
            <Button
              title={creating ? 'Creando instancia...' : 'Generar Código QR'}
              onPress={handleConnect}
              variant="primary"
              size="lg"
              disabled={creating}
              style={styles.button}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              )}
            </Button>
          </View>
        )}

        {qrCode && (
          <View style={styles.qrContainer}>
            <View style={[styles.qrContent, isMobile && styles.qrContentMobile]}>
              {/* Instrucciones a la izquierda */}
              <View style={styles.instructionsContainer}>
                <ThemedText type="body2" style={[styles.qrTitle, { color: colors.text }]}>
                  Escanea este código con WhatsApp
                </ThemedText>
                <ThemedText type="caption" style={[styles.qrInstructions, { color: colors.textSecondary }]}>
                  1. Abre WhatsApp en tu teléfono{'\n'}
                  2. Ve a Configuración → Dispositivos vinculados{'\n'}
                  3. Toca "Vincular un dispositivo"{'\n'}
                  4. Escanea este código QR
                </ThemedText>
              </View>

              {/* QR a la derecha */}
              <View style={styles.qrImageWrapper}>
                <View style={[styles.qrImageContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Image
                    source={{ uri: qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}` }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>
                
                {/* Botón Regenerar bajo la imagen */}
                <Button
                  title={creating ? 'Regenerando...' : 'Regenerar'}
                  onPress={handleConnect}
                  variant="outline"
                  size="lg"
                  disabled={creating}
                  style={styles.regenerateButton}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
                  ) : (
                    <Ionicons name="refresh-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                  )}
                </Button>
              </View>
            </View>
          </View>
        )}

        {loading && !qrCode && !creating && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText type="body2" style={{ marginTop: 16, color: colors.textSecondary }}>
              Cargando información...
            </ThemedText>
          </View>
        )}

        <View style={[styles.infoBox, { backgroundColor: colors.surfaceVariant }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <ThemedText type="body2" style={{ color: colors.textSecondary, marginLeft: 8, flex: 1 }}>
            El código QR expira después de un tiempo. Si expira, genera uno nuevo haciendo clic en "Regenerar".
          </ThemedText>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    gap: 24,
  },
  actionContainer: {
    marginTop: 16,
  },
  button: {
    marginTop: 8,
  },
  qrContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  qrContent: {
    flexDirection: 'row',
    gap: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
    maxWidth: 1000,
    width: '100%',
  },
  qrContentMobile: {
    flexDirection: 'column',
    gap: 24,
    alignItems: 'center',
  },
  instructionsContainer: {
    flex: 0,
    alignItems: 'flex-start',
    minWidth: 300,
    maxWidth: 400,
  },
  qrTitle: {
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'left',
  },
  qrInstructions: {
    textAlign: 'left',
    lineHeight: 20,
  },
  qrImageWrapper: {
    alignItems: 'center',
    flex: 0,
    minWidth: 280,
  },
  qrImageContainer: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  qrImage: {
    width: 250,
    height: 250,
  },
  regenerateButton: {
    width: '100%',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
});
