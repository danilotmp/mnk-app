/**
 * Componente para Capa 4: Recomendaciones
 * Gestiona recomendaciones generales y sugerencias de productos/servicios
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InlineAlert } from '@/components/ui/inline-alert';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { CommercialService } from '@/src/domains/commercial';
import {
    Offering,
    Recommendation,
    RecommendationPayload,
    RecommendationType,
} from '@/src/domains/commercial/types';
import { useCompany } from '@/src/domains/shared';
import { CustomSwitch } from '@/src/domains/shared/components/custom-switch/custom-switch';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface RecommendationsLayerProps {
  onProgressUpdate?: (progress: number) => void;
  onDataChange?: (hasData: boolean) => void;
  onComplete?: (hasData?: boolean) => void; // Callback cuando la capa se completa al 100%
  onSkip?: () => void; // Callback cuando se omite la capa
  allowedTypes?: RecommendationType[]; // Filtrar tipos de recomendación según la capa
  layerTitle?: string; // Título personalizado para la capa
  layerDescription?: string; // Descripción personalizada para la capa
}

const RECOMMENDATION_TYPE_OPTIONS: { value: RecommendationType; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'informational', label: 'Informativa', description: 'Información útil para el cliente', icon: 'information-circle-outline' },
  { value: 'orientation', label: 'Orientación', description: 'Guía o consejo general', icon: 'compass-outline' },
  { value: 'suggestion', label: 'Sugerencia', description: 'Sugerencia suave de producto/servicio', icon: 'bulb-outline' },
  { value: 'upsell', label: 'Upsell', description: 'Sugerencia comercial más directa', icon: 'trending-up-outline' },
];

export function RecommendationsLayer({ 
  onProgressUpdate, 
  onDataChange, 
  onComplete,
  onSkip,
  allowedTypes,
  layerTitle,
  layerDescription,
}: RecommendationsLayerProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const { company } = useCompany();

  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState<{ message: string; detail?: string } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false); // Flag para evitar llamados repetitivos

  // Filtrar opciones de tipo según allowedTypes
  const availableTypeOptions = allowedTypes && allowedTypes.length > 0
    ? RECOMMENDATION_TYPE_OPTIONS.filter(opt => allowedTypes.includes(opt.value))
    : RECOMMENDATION_TYPE_OPTIONS;

  const [formData, setFormData] = useState({
    type: (allowedTypes && allowedTypes.length > 0 ? allowedTypes[0] : 'informational') as RecommendationType,
    message: '',
    offeringId: '',
    priority: 10,
    isActive: true,
  });

  // Cargar recomendaciones - evitar llamados repetitivos
  const loadRecommendations = useCallback(async () => {
    if (!company?.id || isLoadingData) return;

    setIsLoadingData(true);
    setLoading(true);
    setGeneralError(null);

    try {
      const data = await CommercialService.getRecommendations(company.id);
      // Filtrar por tipos permitidos si se especifica
      const filteredData = allowedTypes && allowedTypes.length > 0
        ? data.filter(r => allowedTypes.includes(r.type))
        : data;
      setRecommendations(filteredData);
      setGeneralError(null); // Limpiar errores si se carga correctamente
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al cargar recomendaciones';
      setGeneralError({ message: errorMessage });
      // No mostrar toast - solo InlineAlert en la pantalla
    } finally {
      setLoading(false);
      setIsLoadingData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id

  // Cargar ofertas para el selector - evitar llamados repetitivos
  const loadOfferings = useCallback(async () => {
    if (!company?.id) return;

    try {
      const data = await CommercialService.getOfferings(company.id);
      setOfferings(data);
    } catch (error: any) {
      // Si no hay ofertas, está bien, las recomendaciones pueden ser generales
      // Error silencioso - solo log
      console.log('No hay ofertas disponibles');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  // Cargar datos solo una vez cuando cambia company.id
  useEffect(() => {
    if (company?.id) {
      loadRecommendations();
      loadOfferings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id

  // Calcular progreso
  useEffect(() => {
    if (!company?.id) return;

    // Filtrar recomendaciones por tipos permitidos si se especifica
    const relevantRecommendations = allowedTypes && allowedTypes.length > 0
      ? recommendations.filter(r => allowedTypes.includes(r.type))
      : recommendations;
    
    const hasRecommendations = relevantRecommendations.length > 0;
    const progress = hasRecommendations ? 100 : 0;

    onProgressUpdate?.(progress);
    onDataChange?.(hasRecommendations);
    
    // Si se completa al 100%, notificar después de un breve delay
    if (progress === 100) {
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }
  }, [recommendations, company?.id, onProgressUpdate, onDataChange, onComplete, allowedTypes]);

  const handleCreate = async () => {
    if (!company?.id) return;

    if (!formData.message.trim()) {
      setGeneralError({ message: 'El mensaje de recomendación es requerido' });
      return;
    }

    setSaving(true);
    setGeneralError(null);

    try {
      const payload: RecommendationPayload = {
        companyId: company.id,
        branchId: null,
        offeringId: formData.offeringId || null,
        type: formData.type,
        message: formData.message.trim(),
        priority: formData.priority,
        isActive: formData.isActive,
      };

      await CommercialService.createRecommendation(payload);
      alert.showSuccess('Recomendación creada correctamente');
      setShowForm(false);
      setFormData({
        type: (allowedTypes && allowedTypes.length > 0 ? allowedTypes[0] : 'informational') as RecommendationType,
        message: '',
        offeringId: '',
        priority: 10,
        isActive: true,
      });
      // Recargar recomendaciones sin mostrar toast de error si falla
      try {
        await loadRecommendations();
      } catch (error) {
        // Error ya manejado en loadRecommendations con InlineAlert
        console.error('Error al recargar recomendaciones:', error);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al crear recomendación';
      const errorDetail = typeof error?.details === 'object' 
        ? JSON.stringify(error.details) 
        : error?.details || error?.result?.description;
      
      setGeneralError({ message: errorMessage, detail: errorDetail });
    } finally {
      setSaving(false);
    }
  };

  if (loading && recommendations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText type="body2" style={{ marginTop: 16, color: colors.textSecondary }}>
          Cargando recomendaciones...
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      {generalError && (
        <InlineAlert
          type="error"
          message={generalError.message}
          detail={generalError.detail}
          style={styles.alert}
          autoClose={false}
        />
      )}

      <View style={styles.formContainer}>
        {/* Información sobre recomendaciones */}
        <Card variant="outlined" style={styles.infoCard}>
          <Ionicons name="bulb-outline" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <ThemedText type="body2" style={{ fontWeight: '600', marginBottom: 4 }}>
              {layerTitle || '¿Qué son las recomendaciones?'}
            </ThemedText>
            <ThemedText type="body2" style={{ color: colors.textSecondary }}>
              {layerDescription || 'Las recomendaciones son mensajes que la IA puede compartir con los clientes durante las conversaciones. Pueden ser informativas (sin relación comercial) o sugerencias de productos/servicios.'}
            </ThemedText>
          </View>
        </Card>

        {/* Lista de recomendaciones */}
        {recommendations.length > 0 && (
          <Card variant="elevated" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
              <ThemedText type="h4" style={styles.sectionTitle}>
                Recomendaciones Configuradas
              </ThemedText>
            </View>

            <View style={styles.listContainer}>
              {recommendations.map((recommendation) => {
                const typeOption = RECOMMENDATION_TYPE_OPTIONS.find(opt => opt.value === recommendation.type);
                const relatedOffering = recommendation.offeringId 
                  ? offerings.find(o => o.id === recommendation.offeringId)
                  : null;

                return (
                  <View
                    key={recommendation.id}
                    style={[styles.recommendationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={styles.recommendationHeader}>
                      <View style={styles.recommendationType}>
                        <Ionicons
                          name={typeOption?.icon || 'information-circle-outline'}
                          size={20}
                          color={colors.primary}
                        />
                        <ThemedText type="body2" style={{ fontWeight: '600', marginLeft: 8 }}>
                          {typeOption?.label || recommendation.type}
                        </ThemedText>
                      </View>
                      <View style={styles.recommendationMeta}>
                        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                          Prioridad: {recommendation.priority}
                        </ThemedText>
                        {recommendation.isActive ? (
                          <View style={[styles.badge, { backgroundColor: '#10b981' + '20' }]}>
                            <ThemedText type="caption" style={{ color: '#10b981', fontWeight: '600' }}>
                              Activa
                            </ThemedText>
                          </View>
                        ) : (
                          <View style={[styles.badge, { backgroundColor: colors.textSecondary + '20' }]}>
                            <ThemedText type="caption" style={{ color: colors.textSecondary, fontWeight: '600' }}>
                              Inactiva
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    </View>

                    <ThemedText type="body2" style={{ color: colors.text, marginTop: 12 }}>
                      {recommendation.message}
                    </ThemedText>

                    {relatedOffering && (
                      <View style={styles.relatedOffering}>
                        <Ionicons name="cube-outline" size={16} color={colors.textSecondary} />
                        <ThemedText type="caption" style={{ color: colors.textSecondary, marginLeft: 4 }}>
                          Relacionada con: {relatedOffering.name}
                        </ThemedText>
                      </View>
                    )}

                    {!recommendation.offeringId && (
                      <View style={styles.relatedOffering}>
                        <Ionicons name="globe-outline" size={16} color={colors.textSecondary} />
                        <ThemedText type="caption" style={{ color: colors.textSecondary, marginLeft: 4 }}>
                          Recomendación general
                        </ThemedText>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* Formulario de nueva recomendación */}
        {showForm ? (
          <Card variant="elevated" style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              <ThemedText type="h4" style={styles.sectionTitle}>
                Nueva Recomendación
              </ThemedText>
            </View>

            <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
              Tipo de recomendación
            </ThemedText>
            <View style={styles.optionsGrid}>
              {RECOMMENDATION_TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionCard,
                    {
                      borderColor: formData.type === option.value ? colors.primary : colors.border,
                      backgroundColor: formData.type === option.value ? colors.primary + '20' : colors.surface,
                    },
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, type: option.value }))}
                >
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={formData.type === option.value ? colors.primary : colors.textSecondary}
                  />
                  <ThemedText
                    type="body2"
                    style={{
                      marginTop: 8,
                      fontWeight: formData.type === option.value ? '600' : '400',
                      color: formData.type === option.value ? colors.primary : colors.text,
                      textAlign: 'center',
                    }}
                  >
                    {option.label}
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    style={{
                      marginTop: 4,
                      color: colors.textSecondary,
                      textAlign: 'center',
                      fontSize: 10,
                    }}
                  >
                    {option.description}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Selector de oferta (opcional) */}
            {offerings.length > 0 && (
              <>
                <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                  ¿Relacionar con una oferta? (opcional)
                </ThemedText>
                <View style={styles.selectContainer}>
                  <TouchableOpacity
                    style={[
                      styles.selectOption,
                      {
                        borderColor: formData.offeringId === '' ? colors.primary : colors.border,
                        backgroundColor: formData.offeringId === '' ? colors.primary + '20' : colors.surface,
                      },
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, offeringId: '' }))}
                  >
                    <ThemedText type="body2" style={{ color: colors.text }}>
                      Recomendación general (sin oferta)
                    </ThemedText>
                    {formData.offeringId === '' && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                  {offerings.map((offering) => (
                    <TouchableOpacity
                      key={offering.id}
                      style={[
                        styles.selectOption,
                        {
                          borderColor: formData.offeringId === offering.id ? colors.primary : colors.border,
                          backgroundColor: formData.offeringId === offering.id ? colors.primary + '20' : colors.surface,
                        },
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, offeringId: offering.id }))}
                    >
                      <ThemedText type="body2" style={{ color: colors.text }}>
                        {offering.name}
                      </ThemedText>
                      {formData.offeringId === offering.id && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
              Mensaje de recomendación *
            </ThemedText>
            <InputWithFocus
              containerStyle={[styles.textAreaContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
              primaryColor={colors.primary}
            >
              <TextInput
                style={[styles.textArea, { color: colors.text }]}
                placeholder={
                  formData.type === 'informational'
                    ? 'Ej: El cajero más cercano está a 3 cuadras'
                    : formData.type === 'suggestion'
                    ? 'Ej: Si deseas, contamos con servicio de tour guiado'
                    : 'Escribe el mensaje que la IA compartirá...'
                }
                placeholderTextColor={colors.textSecondary}
                value={formData.message}
                onChangeText={(val) => setFormData(prev => ({ ...prev, message: val }))}
                multiline
                numberOfLines={4}
              />
            </InputWithFocus>

            <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
              Prioridad (1-100)
            </ThemedText>
            <InputWithFocus
              containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
              primaryColor={colors.primary}
            >
              <Ionicons name="flag-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="10"
                placeholderTextColor={colors.textSecondary}
                value={formData.priority.toString()}
                onChangeText={(val) => {
                  const num = parseInt(val, 10);
                  if (!isNaN(num) && num >= 1 && num <= 100) {
                    setFormData(prev => ({ ...prev, priority: num }));
                  } else if (val === '') {
                    setFormData(prev => ({ ...prev, priority: 10 }));
                  }
                }}
                keyboardType="number-pad"
              />
            </InputWithFocus>
            <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
              Mayor número = mayor prioridad. La IA mostrará primero las recomendaciones con mayor prioridad.
            </ThemedText>

            <View style={styles.switchRow}>
              <CustomSwitch
                value={formData.isActive}
                onValueChange={(val) => setFormData(prev => ({ ...prev, isActive: val }))}
                label="Recomendación activa"
              />
            </View>

            <View style={styles.formActions}>
              <Button
                title="Cancelar"
                onPress={() => {
                  setShowForm(false);
                  setFormData({
                    type: 'informational',
                    message: '',
                    offeringId: '',
                    priority: 10,
                    isActive: true,
                  });
                }}
                variant="outlined"
                size="md"
                disabled={saving}
              />
              <Button
                title={saving ? 'Guardando...' : 'Crear Recomendación'}
                onPress={handleCreate}
                variant="primary"
                size="md"
                disabled={saving}
              />
            </View>
          </Card>
        ) : (
          <Button
            title="Agregar Recomendación"
            onPress={() => setShowForm(true)}
            variant="primary"
            size="lg"
            style={styles.addButton}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          </Button>
        )}

        {recommendations.length === 0 && !showForm && (
          <Card variant="outlined" style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <ThemedText type="body2" style={{ color: colors.textSecondary, marginLeft: 8, flex: 1 }}>
              Crea recomendaciones para que la IA pueda sugerir información útil o productos a tus clientes
            </ThemedText>
          </Card>
        )}

        {/* Botones Continuar y Omitir */}
        <View style={styles.continueButtonContainer}>
          <Button
            title={recommendations.length > 0 ? 'Continuar' : 'Omitir'}
            onPress={async () => {
              const hasData = recommendations.length > 0;
              if (hasData) {
                // Si hay datos, marcar como completada y avanzar
                onComplete?.(hasData);
              } else {
                // Si no hay datos, marcar como omitida y avanzar
                onSkip?.();
              }
            }}
            variant="primary"
            size="lg"
            disabled={saving}
            style={styles.continueButton}
          >
            <Ionicons 
              name={recommendations.length > 0 ? "arrow-forward-outline" : "skip-forward-outline"} 
              size={20} 
              color="#FFFFFF" 
              style={{ marginRight: 8 }} 
            />
          </Button>
          {recommendations.length > 0 && onSkip && (
            <Button
              title="Omitir"
              onPress={() => {
                onSkip?.();
              }}
              variant="outlined"
              size="lg"
              disabled={saving}
              style={styles.skipButton}
            >
              <Ionicons name="skip-forward-outline" size={20} color={colors.text} style={{ marginRight: 8 }} />
            </Button>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alert: {
    marginBottom: 16,
  },
  formContainer: {
    gap: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  sectionCard: {
    padding: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    flex: 1,
  },
  listContainer: {
    gap: 12,
    marginTop: 8,
  },
  recommendationCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendationType: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recommendationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  relatedOffering: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  formCard: {
    padding: 20,
    gap: 16,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectContainer: {
    gap: 8,
    marginTop: 8,
  },
  selectOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 120,
  },
  textArea: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  switchRow: {
    marginTop: 8,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  addButton: {
    marginTop: 8,
  },
  continueButtonContainer: {
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  continueButton: {
    width: '100%',
  },
  skipButton: {
    width: '100%',
  },
});
