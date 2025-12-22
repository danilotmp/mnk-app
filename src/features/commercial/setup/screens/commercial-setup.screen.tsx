/**
 * Wizard de Contextualización Comercial para IA
 * Guía al usuario a través de las capas de información necesarias
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { CommercialService } from '@/src/domains/commercial';
import { CommercialCapabilities, LayerProgress } from '@/src/domains/commercial/types';
import { useCompany } from '@/src/domains/shared';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { CompanySetupLayer } from '../components/company-setup-layer/company-setup-layer';
import { InstitutionalLayer } from '../components/institutional-layer/institutional-layer';
import { OperationalLayer } from '../components/operational-layer/operational-layer';
import { PaymentsLayer } from '../components/payments-layer/payments-layer';
import { RecommendationsLayer } from '../components/recommendations-layer/recommendations-layer';
import { WizardStep, WizardStepper } from '../components/wizard-stepper';

export function CommercialSetupScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const router = useRouter();
  const alert = useAlert();
  const params = useLocalSearchParams<{ product?: string; layer?: string }>();
  const { company, user, branch } = useCompany();

  const [loading, setLoading] = useState(true);
  const [layerProgress, setLayerProgress] = useState<LayerProgress[]>([]);
  const [currentLayer, setCurrentLayer] = useState<string>('institutional');
  const [showLayer0, setShowLayer0] = useState(false);

  // Detectar si necesita Capa 0 (crear empresa/sucursal)
  const needsCompanySetup = (): boolean => {
    if (!user) return true;
    if (!company) return true;
    
    // Detectar empresa de invitado
    const code = (company.code || '').toUpperCase();
    const name = (company.name || '').toUpperCase();
    const isGuest = code.includes('GUEST') || code.includes('INVITADO') || 
                    name.includes('GUEST') || name.includes('INVITADO') ||
                    code === 'DEFAULT' || name === 'EMPRESA POR DEFECTO';
    
    if (isGuest) return true;
    if (!branch) return true;
    
    return false;
  };

  // Inicializar según parámetros y estado del usuario
  useEffect(() => {
    // Si no está logueado, redirigir a login
    if (!user) {
      router.replace('/auth/login?redirect=' + encodeURIComponent('/commercial/setup?product=' + (params.product || 'chat-ia')));
      return;
    }

    // Si viene con layer=0, mostrar Capa 0
    if (params.layer === '0') {
      setShowLayer0(true);
      setCurrentLayer('institutional'); // Por defecto, pero no se mostrará hasta completar Capa 0
      return;
    }

    // Si necesita setup de empresa (Capa 0), mostrarla
    if (needsCompanySetup()) {
      setShowLayer0(true);
      return;
    }

    // Si tiene empresa real, cargar progreso normal
    if (company?.id) {
      setShowLayer0(false);
      // Si viene con layer específico, usarlo
      if (params.layer) {
        setCurrentLayer(params.layer);
      }
    }
  }, [user, company, branch, params.layer, params.product, router]);

  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  // Función helper para marcar una capa como completada u omitida
  const markLayerAsCompleted = useCallback(async (layer: string, hasData: boolean = false) => {
    if (!company?.id) return;
    
    try {
      // Obtener capacidades actuales
      const currentCapabilities = await CommercialService.getCapabilities(company.id);
      
      // Mapear capa a capacidad correspondiente
      const capabilityMap: Record<string, keyof CommercialCapabilities> = {
        'institutional': 'canAnswerAboutBusiness', // También puede activar canAnswerAboutLocation
        'offerings': 'canAnswerAboutPrices',
        'promotions': 'canAnswerAboutPrices', // Las promociones también afectan precios
        'payments': 'canAnswerAboutPayment',
        'recommendations': 'canRecommend', // También puede activar canSuggestProducts
      };
      
      const capabilityKey = capabilityMap[layer];
      if (capabilityKey) {
        // Si tiene datos, activar la capacidad; si no tiene datos pero se completó, también activarla (omitida)
        await CommercialService.updateCapabilities(company.id, {
          [capabilityKey]: true,
        });
      }
      
      // Actualizar el progreso local
      setLayerProgress(prev => {
        const updated = prev.map(l => l.layer === layer 
          ? { ...l, completed: true, completionPercentage: hasData ? 100 : 50, skipped: !hasData }
          : l
        );
        // Si no existe la capa en el progreso, agregarla
        if (!updated.find(l => l.layer === layer)) {
          updated.push({
            layer: layer as any,
            completed: true,
            completionPercentage: hasData ? 100 : 50,
            enabledCapabilities: capabilityKey ? [capabilityKey] : [],
            missingFields: hasData ? [] : [layer],
            skipped: !hasData,
          });
        }
        return updated;
      });
    } catch (error: any) {
      console.error('Error al marcar capa como completada:', error);
      // No mostrar error al usuario - solo log
    }
  }, [company?.id]);

  // Cargar progreso de capas - evitar llamados repetitivos
  const loadProgress = useCallback(async () => {
    if (!company?.id || isLoadingProgress) return;

    setIsLoadingProgress(true);
    setLoading(true);

    try {
      const progress = await CommercialService.getLayerProgress(company.id);
      
      // Usar el estado actual de currentLayer para determinar la siguiente capa
      setCurrentLayer(prevLayer => {
        // Determinar qué capa mostrar:
        // 1. Si la capa actual está completa, avanzar a la siguiente incompleta
        // 2. Si la capa actual no existe en el progreso, buscar la primera incompleta
        // 3. Si todas están completas, quedarse en la última
        const currentLayerProgress = progress.find(p => p.layer === prevLayer);
        let targetLayer = prevLayer;
        
        // Filtrar capa 'operational' del progreso
        const filteredProgress = progress.filter(p => p.layer !== 'operational');
        
        if (currentLayerProgress?.completed) {
          // La capa actual está completa, avanzar a la siguiente incompleta
          const nextIncomplete = filteredProgress.find(p => !p.completed && p.layer !== 'operational');
          if (nextIncomplete) {
            targetLayer = nextIncomplete.layer;
          } else {
            // Todas están completas, quedarse en la última
            const lastLayer = filteredProgress[filteredProgress.length - 1];
            if (lastLayer) {
              targetLayer = lastLayer.layer;
            }
          }
        } else if (!currentLayerProgress) {
          // La capa actual no existe en el progreso, buscar la primera incompleta
          const firstIncomplete = filteredProgress.find(p => !p.completed && p.layer !== 'operational');
          if (firstIncomplete) {
            targetLayer = firstIncomplete.layer;
          }
        }
        // Si la capa actual existe y no está completa, mantenerla
        
        return targetLayer;
      });
      
      // Actualizar el estado con el progreso, pero preservar el progreso de capas que ya están al 100%
      // (para evitar que se sobrescriba el progreso que se estableció después de guardar)
      setLayerProgress(prev => {
        const updated = progress.map(newLayer => {
          const existingLayer = prev.find(l => l.layer === newLayer.layer);
          // Si la capa existente ya está al 100%, mantenerla
          if (existingLayer && existingLayer.completionPercentage === 100) {
            return existingLayer;
          }
          // Si la nueva capa está al 100%, usar la nueva
          if (newLayer.completionPercentage === 100) {
            return newLayer;
          }
          // Si la capa existente tiene más progreso que la nueva, mantener la existente
          if (existingLayer && existingLayer.completionPercentage > newLayer.completionPercentage) {
            return existingLayer;
          }
          // En otros casos, usar la nueva
          return newLayer;
        });
        
        // Agregar capas que no están en el progreso nuevo pero sí en el anterior
        prev.forEach(existingLayer => {
          if (!updated.find(l => l.layer === existingLayer.layer)) {
            updated.push(existingLayer);
          }
        });
        
        return updated;
      });
    } catch (error: any) {
      // Error silencioso - solo log (no mostrar toast en pantalla)
      console.error('Error al cargar el progreso:', error);
    } finally {
      setLoading(false);
      setIsLoadingProgress(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id para evitar loops

  useEffect(() => {
    if (company?.id) {
      loadProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id

  // Definir pasos por defecto (sin capa 'operational' - se unificó con recomendaciones)
  const defaultSteps: WizardStep[] = [
    { id: 'institutional', label: 'Contexto Institucional', layer: 'institutional', completed: false, enabled: true, completionPercentage: 0 },
    { id: 'offerings', label: 'Ofertas', layer: 'offerings', completed: false, enabled: true, completionPercentage: 0 },
    { id: 'promotions', label: 'Promociones', layer: 'promotions', completed: false, enabled: true, completionPercentage: 0 },
    { id: 'payments', label: 'Pagos', layer: 'payments', completed: false, enabled: true, completionPercentage: 0 },
    { id: 'recommendations', label: 'Recomendaciones', layer: 'recommendations', completed: false, enabled: true, completionPercentage: 0 },
  ];

  // Convertir LayerProgress a WizardStep (sin capa 'operational')
  // Si layerProgress está vacío, usar pasos por defecto
  const wizardSteps: WizardStep[] = layerProgress.length > 0
    ? layerProgress
        .filter(layer => layer.layer !== 'operational') // Filtrar capa 'operational'
        .map((layer) => ({
          id: layer.layer,
          label:
            layer.layer === 'institutional'
              ? 'Contexto Institucional'
              : layer.layer === 'offerings'
              ? 'Ofertas'
              : layer.layer === 'promotions'
              ? 'Promociones'
              : layer.layer === 'payments'
              ? 'Pagos'
              : 'Recomendaciones', // Incluye todos los tipos: informational, orientation, suggestion, upsell
          layer: layer.layer,
          completed: layer.completed,
          enabled: true,
          completionPercentage: layer.completionPercentage,
          skipped: layer.skipped,
        }))
    : defaultSteps;

  const handleStepPress = (step: WizardStep) => {
    setCurrentLayer(step.layer);
  };

  const handleBack = () => {
    router.back();
  };

  if (!company) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <ThemedText type="h2" style={styles.title}>
              Configuración de Chat IA
            </ThemedText>
            <ThemedText type="body1" style={[styles.subtitle, { color: colors.textSecondary }]}>
              Completa la información para que la IA pueda interactuar mejor con tus clientes
            </ThemedText>
          </View>
        </View>

        {/* Stepper Visual (solo si no está en Capa 0) */}
        {!showLayer0 && (
          <Card variant="elevated" style={styles.stepperCard}>
            <WizardStepper 
              steps={wizardSteps} 
              currentStep={currentLayer}
              onStepPress={handleStepPress}
            />
          </Card>
        )}

        {/* Capa 0: Configuración de Empresa/Sucursal */}
        {showLayer0 ? (
          <Card variant="elevated" style={styles.contentCard}>
            <CompanySetupLayer
              onComplete={() => {
                setShowLayer0(false);
                setCurrentLayer('institutional');
                // Recargar progreso después de crear empresa
                if (company?.id) {
                  loadProgress();
                }
              }}
            />
          </Card>
        ) : (
          <>
            {/* Contenido de la Capa Actual */}
            <Card variant="elevated" style={styles.contentCard}>
              <ThemedText type="h4" style={styles.contentTitle}>
                {wizardSteps.find(s => s.id === currentLayer)?.label || 'Capa'}
              </ThemedText>
              <ThemedText type="body2" style={[styles.contentDescription, { color: colors.textSecondary }]}>
                {currentLayer === 'institutional' && 
                  'Cuéntanos sobre tu empresa: a qué se dedica, en qué industria está, y cómo opera.'}
                {currentLayer === 'offerings' && 
                  'Configura tus ofertas (productos, servicios y paquetes) y precios para que la IA pueda informar valores a los clientes.'}
                {currentLayer === 'promotions' && 
                  'Define promociones e incentivos temporales para tus ofertas.'}
                {currentLayer === 'payments' && 
                  'Define los métodos de pago aceptados y cómo los clientes pueden realizar pagos.'}
                {currentLayer === 'recommendations' && 
                  'Crea recomendaciones informativas, de orientación, sugerencias y upsell que la IA puede ofrecer durante las conversaciones.'}
              </ThemedText>

              {/* Renderizar componente de la capa actual */}
              <View style={styles.layerContent}>
                {currentLayer === 'institutional' && (
                  <InstitutionalLayer
                    onProgressUpdate={(progress) => {
                      setLayerProgress(prev => {
                        const updated = prev.map(l => l.layer === 'institutional' 
                          ? { ...l, completionPercentage: progress, completed: progress === 100 }
                          : l
                        );
                        // Si no existe la capa en el progreso, agregarla
                        if (!updated.find(l => l.layer === 'institutional')) {
                          updated.push({
                            layer: 'institutional',
                            completed: progress === 100,
                            completionPercentage: progress,
                            enabledCapabilities: [],
                            missingFields: progress === 100 ? [] : ['institutional'],
                          });
                        }
                        return updated;
                      });
                    }}
                    onDataChange={(hasData) => {
                      // Actualizar capacidades cuando hay datos
                    }}
                    onComplete={async () => {
                      // Recargar progreso primero para obtener datos actualizados
                      await loadProgress();
                      // Luego avanzar a la siguiente capa en la secuencia
                      setCurrentLayer(prevLayer => {
                        const layerOrder = ['institutional', 'offerings', 'promotions', 'payments', 'recommendations'];
                        const currentIndex = layerOrder.indexOf(prevLayer);
                        if (currentIndex >= 0 && currentIndex < layerOrder.length - 1) {
                          return layerOrder[currentIndex + 1];
                        }
                        return prevLayer;
                      });
                    }}
                  />
                )}
                {currentLayer === 'offerings' && (
                  <OperationalLayer
                    onProgressUpdate={(progress) => {
                      setLayerProgress(prev => {
                        const updated = prev.map(l => l.layer === 'offerings' 
                          ? { ...l, completionPercentage: progress, completed: progress === 100 }
                          : l
                        );
                        // Si no existe la capa en el progreso, agregarla
                        if (!updated.find(l => l.layer === 'offerings')) {
                          updated.push({
                            layer: 'offerings',
                            completed: progress === 100,
                            completionPercentage: progress,
                            enabledCapabilities: [],
                            missingFields: progress === 100 ? [] : ['offerings'],
                          });
                        }
                        return updated;
                      });
                    }}
                    onDataChange={(hasData) => {
                      // Actualizar capacidades cuando hay datos
                    }}
                    onComplete={async () => {
                      // No recargar progreso aquí para evitar sobrescribir el progreso al 100%
                      // que se estableció después de guardar exitosamente
                      // await loadProgress();
                      setCurrentLayer(prevLayer => {
                        const layerOrder = ['institutional', 'offerings', 'promotions', 'payments', 'recommendations'];
                        const currentIndex = layerOrder.indexOf(prevLayer);
                        if (currentIndex >= 0 && currentIndex < layerOrder.length - 1) {
                          return layerOrder[currentIndex + 1];
                        }
                        return prevLayer;
                      });
                    }}
                  />
                )}
                {currentLayer === 'promotions' && (
                  <View style={{ padding: 20 }}>
                    <ThemedText type="body1" style={{ color: colors.textSecondary, textAlign: 'center' }}>
                      La gestión de promociones estará disponible próximamente.
                    </ThemedText>
                    <ThemedText type="body2" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
                      Esta funcionalidad permitirá crear promociones e incentivos temporales para tus ofertas.
                    </ThemedText>
                    
                    {/* Botones Continuar y Omitir */}
                    <View style={{ marginTop: 24, gap: 12 }}>
                      <Button
                        title="Continuar"
                        onPress={async () => {
                          // Marcar como completada (sin datos porque no está implementada)
                          await markLayerAsCompleted('promotions', false);
                          setCurrentLayer(prevLayer => {
                            const layerOrder = ['institutional', 'offerings', 'promotions', 'payments', 'recommendations'];
                            const currentIndex = layerOrder.indexOf(prevLayer);
                            if (currentIndex >= 0 && currentIndex < layerOrder.length - 1) {
                              return layerOrder[currentIndex + 1];
                            }
                            return prevLayer;
                          });
                        }}
                        variant="primary"
                        size="lg"
                        style={{ width: '100%' }}
                      >
                        <Ionicons name="arrow-forward-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                      </Button>
                      <Button
                        title="Omitir"
                        onPress={async () => {
                          // Marcar como omitida (sin datos)
                          await markLayerAsCompleted('promotions', false);
                          setCurrentLayer(prevLayer => {
                            const layerOrder = ['institutional', 'offerings', 'promotions', 'payments', 'recommendations'];
                            const currentIndex = layerOrder.indexOf(prevLayer);
                            if (currentIndex >= 0 && currentIndex < layerOrder.length - 1) {
                              return layerOrder[currentIndex + 1];
                            }
                            return prevLayer;
                          });
                        }}
                        variant="outlined"
                        size="lg"
                        style={{ width: '100%' }}
                      >
                        <Ionicons name="skip-forward-outline" size={20} color={colors.text} style={{ marginRight: 8 }} />
                      </Button>
                    </View>
                  </View>
                )}
                {currentLayer === 'payments' && (
                  <PaymentsLayer
                    onProgressUpdate={(progress) => {
                      setLayerProgress(prev => {
                        const updated = prev.map(l => l.layer === 'payments' 
                          ? { ...l, completionPercentage: progress, completed: progress === 100 }
                          : l
                        );
                        // Si no existe la capa en el progreso, agregarla
                        if (!updated.find(l => l.layer === 'payments')) {
                          updated.push({
                            layer: 'payments',
                            completed: progress === 100,
                            completionPercentage: progress,
                            enabledCapabilities: [],
                            missingFields: progress === 100 ? [] : ['payments'],
                          });
                        }
                        return updated;
                      });
                    }}
                    onDataChange={(hasData) => {
                      // Actualizar capacidades cuando hay datos
                    }}
                    onComplete={async (hasData: boolean = false) => {
                      // Marcar como completada con los datos proporcionados
                      await markLayerAsCompleted('payments', hasData);
                      setCurrentLayer(prevLayer => {
                        const layerOrder = ['institutional', 'offerings', 'promotions', 'payments', 'recommendations'];
                        const currentIndex = layerOrder.indexOf(prevLayer);
                        if (currentIndex >= 0 && currentIndex < layerOrder.length - 1) {
                          return layerOrder[currentIndex + 1];
                        }
                        return prevLayer;
                      });
                    }}
                    onSkip={async () => {
                      // Marcar como omitida sin datos
                      await markLayerAsCompleted('payments', false);
                      setCurrentLayer(prevLayer => {
                        const layerOrder = ['institutional', 'offerings', 'promotions', 'payments', 'recommendations'];
                        const currentIndex = layerOrder.indexOf(prevLayer);
                        if (currentIndex >= 0 && currentIndex < layerOrder.length - 1) {
                          return layerOrder[currentIndex + 1];
                        }
                        return prevLayer;
                      });
                    }}
                  />
                )}
                {currentLayer === 'recommendations' && (
                  <RecommendationsLayer
                    onProgressUpdate={(progress) => {
                      setLayerProgress(prev => {
                        const updated = prev.map(l => l.layer === 'recommendations' 
                          ? { ...l, completionPercentage: progress, completed: progress === 100 }
                          : l
                        );
                        // Si no existe la capa en el progreso, agregarla
                        if (!updated.find(l => l.layer === 'recommendations')) {
                          updated.push({
                            layer: 'recommendations',
                            completed: progress === 100,
                            completionPercentage: progress,
                            enabledCapabilities: [],
                            missingFields: progress === 100 ? [] : ['recommendations'],
                          });
                        }
                        return updated;
                      });
                    }}
                    onDataChange={(hasData) => {
                      // Actualizar capacidades cuando hay datos
                    }}
                    onComplete={async (hasData: boolean = false) => {
                      // Marcar como completada con los datos proporcionados
                      await markLayerAsCompleted('recommendations', hasData);
                      // Si todas están completas, se puede mostrar mensaje de finalización (futuro)
                    }}
                    onSkip={async () => {
                      // Marcar como omitida sin datos
                      await markLayerAsCompleted('recommendations', false);
                    }}
                    // Mostrar todos los tipos de recomendaciones (sin filtro)
                    layerTitle="Recomendaciones"
                    layerDescription="Crea recomendaciones informativas, de orientación, sugerencias y upsell que la IA puede ofrecer durante las conversaciones"
                  />
                )}
              </View>
            </Card>
          </>
        )}

        {/* Información sobre capacidades */}
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoContent}>
            <Ionicons name="bulb-outline" size={24} color={colors.primary} />
            <View style={styles.infoText}>
              <ThemedText type="body2" style={{ fontWeight: '600', marginBottom: 4 }}>
                ¿Qué se activa con cada capa?
              </ThemedText>
              <ThemedText type="body2" style={{ color: colors.textSecondary }}>
                {layerProgress
                  .find(p => p.layer === currentLayer)
                  ?.enabledCapabilities.map(cap => {
                    const labels: Record<string, string> = {
                      canAnswerAboutBusiness: 'La IA puede responder sobre tu negocio',
                      canAnswerAboutLocation: 'La IA puede informar ubicaciones',
                      canAnswerAboutPrices: 'La IA puede informar precios',
                      canAnswerAboutPayment: 'La IA puede explicar métodos de pago',
                      canRecommend: 'La IA puede hacer recomendaciones',
                      canSuggestProducts: 'La IA puede sugerir productos/servicios',
                    };
                    return labels[cap] || cap;
                  })
                  .join(', ') || 'Completa esta capa para activar capacidades'}
              </ThemedText>
            </View>
          </View>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    padding: 8,
    marginTop: -8,
    marginLeft: -8,
  },
  headerContent: {
    flex: 1,
    gap: 8,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    lineHeight: 20,
  },
  stepperCard: {
    padding: 16,
    marginBottom: 24,
  },
  contentCard: {
    padding: 24,
    marginBottom: 16,
    gap: 16,
  },
  contentTitle: {
    marginBottom: 4,
  },
  contentDescription: {
    lineHeight: 20,
    marginBottom: 16,
  },
  layerContent: {
    minHeight: 200,
  },
  infoCard: {
    padding: 16,
  },
  infoContent: {
    flexDirection: 'row',
    gap: 12,
  },
  infoText: {
    flex: 1,
    gap: 4,
  },
});
