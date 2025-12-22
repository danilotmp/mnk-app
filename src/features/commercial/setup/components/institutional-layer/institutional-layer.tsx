/**
 * Componente para Capa 1: Contexto Institucional
 * Recopila información básica sobre la empresa para que la IA entienda qué es y cómo opera
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { Select, SelectOption } from '@/components/ui/select';
import { useTheme } from '@/hooks/use-theme';
import { CommercialService } from '@/src/domains/commercial';
import { CommercialProfile, CommercialProfilePayload } from '@/src/domains/commercial/types';
import { useCompany } from '@/src/domains/shared';
import { CustomSwitch } from '@/src/domains/shared/components/custom-switch/custom-switch';
import { useLanguage, useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface InstitutionalLayerProps {
  onProgressUpdate?: (progress: number) => void;
  onDataChange?: (hasData: boolean) => void;
}

// Lista de industrias comunes
const INDUSTRIES: SelectOption[] = [
  { value: 'Tecnología', label: 'Tecnología' },
  { value: 'Retail', label: 'Retail / Comercio' },
  { value: 'Servicios', label: 'Servicios' },
  { value: 'Salud', label: 'Salud' },
  { value: 'Educación', label: 'Educación' },
  { value: 'Finanzas', label: 'Finanzas' },
  { value: 'Inmobiliaria', label: 'Inmobiliaria' },
  { value: 'Manufactura', label: 'Manufactura' },
  { value: 'Alimentación', label: 'Alimentación / Restaurantes' },
  { value: 'Turismo', label: 'Turismo / Hotelería' },
  { value: 'Transporte', label: 'Transporte / Logística' },
  { value: 'Construcción', label: 'Construcción' },
  { value: 'Marketing', label: 'Marketing / Publicidad' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Consultoría', label: 'Consultoría' },
  { value: 'Otro', label: 'Otro' },
];

// Lista de zonas horarias comunes (América Latina y principales)
const TIMEZONES: SelectOption[] = [
  { value: 'America/Guayaquil', label: 'Ecuador (America/Guayaquil)' },
  { value: 'America/Lima', label: 'Perú (America/Lima)' },
  { value: 'America/Bogota', label: 'Colombia (America/Bogota)' },
  { value: 'America/Caracas', label: 'Venezuela (America/Caracas)' },
  { value: 'America/Santiago', label: 'Chile (America/Santiago)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (America/Argentina/Buenos_Aires)' },
  { value: 'America/Mexico_City', label: 'México (America/Mexico_City)' },
  { value: 'America/New_York', label: 'Estados Unidos - Este (America/New_York)' },
  { value: 'America/Chicago', label: 'Estados Unidos - Centro (America/Chicago)' },
  { value: 'America/Denver', label: 'Estados Unidos - Montaña (America/Denver)' },
  { value: 'America/Los_Angeles', label: 'Estados Unidos - Pacífico (America/Los_Angeles)' },
  { value: 'America/Sao_Paulo', label: 'Brasil (America/Sao_Paulo)' },
  { value: 'Europe/Madrid', label: 'España (Europe/Madrid)' },
  { value: 'UTC', label: 'UTC' },
];

// Función para obtener la zona horaria del sistema
const getSystemTimezone = (): string => {
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  } catch (error) {
    // Si falla, retornar UTC como fallback
  }
  return 'UTC';
};

export function InstitutionalLayer({ onProgressUpdate, onDataChange, onComplete }: InstitutionalLayerProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { language: currentLanguage } = useLanguage();
  const alert = useAlert();
  const { company } = useCompany();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CommercialProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false); // Flag para evitar llamados repetitivos
  // Obtener valores por defecto del sistema
  const systemTimezone = getSystemTimezone();
  const systemLanguage = currentLanguage || 'es';

  const [formData, setFormData] = useState({
    businessDescription: '',
    industry: '',
    language: systemLanguage,
    timezone: systemTimezone,
    is24_7: false,
    defaultTaxMode: 'included' as 'included' | 'excluded',
    allowsBranchPricing: false,
  });
  // Guardar los datos originales para comparar cambios
  const [originalFormData, setOriginalFormData] = useState<typeof formData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar perfil existente - solo una vez cuando cambia company.id
  useEffect(() => {
    if (!company?.id || isLoadingProfile) return;

    const loadProfile = async () => {
      setIsLoadingProfile(true);
      setLoading(true);
      
      try {
        const existingProfile = await CommercialService.getProfile(company.id);
        setProfile(existingProfile);
        
        // Debug: Log para verificar los datos recibidos
        console.log('Perfil cargado desde API:', existingProfile);
        
        // Mapear los datos al formulario, asegurando que los valores estén presentes
        const newFormData = {
          businessDescription: existingProfile.businessDescription || '',
          industry: existingProfile.industry || '',
          language: existingProfile.language || systemLanguage,
          timezone: existingProfile.timezone || company.settings?.timezone || systemTimezone,
          is24_7: existingProfile.is24_7 ?? false,
          defaultTaxMode: (existingProfile.defaultTaxMode || 'included') as 'included' | 'excluded',
          allowsBranchPricing: existingProfile.allowsBranchPricing ?? false,
        };
        
        // Debug: Log para verificar los datos mapeados
        console.log('Datos mapeados al formulario:', newFormData);
        
        setFormData(newFormData);
        // Guardar los datos originales para comparar cambios
        setOriginalFormData(newFormData);
        setGeneralError(null); // Limpiar errores previos si se carga correctamente
      } catch (error: any) {
        // Si no existe perfil (404), es normal (primera vez) - no es un error
        if (error?.statusCode === 404 || error?.result?.statusCode === 404) {
          // Perfil no existe, es la primera vez - inicializar con valores por defecto
          setProfile(null);
          const defaultFormData = {
            businessDescription: '',
            industry: '',
            language: systemLanguage,
            timezone: company.settings?.timezone || systemTimezone,
            is24_7: false,
            defaultTaxMode: 'included' as 'included' | 'excluded',
            allowsBranchPricing: false,
          };
          setFormData(defaultFormData);
          // Guardar los datos originales (vacíos en este caso)
          setOriginalFormData(defaultFormData);
          // No mostrar error para 404 - es normal cuando no existe perfil
        } else {
          // Otro tipo de error - mostrar toast
          const errorMessage = error?.message || error?.result?.description || 'Error al cargar perfil';
          alert.showError(errorMessage);
        }
      } finally {
        setLoading(false);
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id para evitar llamados repetitivos

  // Calcular progreso
  useEffect(() => {
    if (!company?.id) return;

    const fields = [
      formData.businessDescription,
      formData.industry,
      formData.language,
      formData.timezone,
    ];
    const completedFields = fields.filter(f => f && f.trim()).length;
    const progress = Math.round((completedFields / fields.length) * 100);
    
    onProgressUpdate?.(progress);
    onDataChange?.(completedFields > 0);
  }, [formData, company?.id, onProgressUpdate, onDataChange]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Función para detectar si hay cambios en el formulario
  const hasChanges = (): boolean => {
    if (!originalFormData) return true; // Si no hay datos originales, considerar que hay cambios (nuevo perfil)
    
    return (
      formData.businessDescription.trim() !== (originalFormData.businessDescription || '').trim() ||
      formData.industry.trim() !== (originalFormData.industry || '').trim() ||
      formData.language !== originalFormData.language ||
      formData.timezone.trim() !== (originalFormData.timezone || '').trim() ||
      formData.is24_7 !== originalFormData.is24_7 ||
      formData.defaultTaxMode !== originalFormData.defaultTaxMode ||
      formData.allowsBranchPricing !== originalFormData.allowsBranchPricing
    );
  };

  // Función para avanzar a la siguiente etapa
  const handleContinue = () => {
    // Si el botón dice "Continuar", significa que no hay cambios pendientes
    // y la información ya está guardada, por lo que siempre debemos avanzar
    // El backend determinará el progreso real y la siguiente capa
    onComplete?.();
  };

  const handleSave = async () => {
    if (!company?.id) return;

    setSaving(true);
    setGeneralError(null);

    try {
      // Construir payload - asegurar que los campos se envíen correctamente
      const trimmedDescription = formData.businessDescription.trim();
      const trimmedIndustry = formData.industry.trim();
      const trimmedTimezone = formData.timezone.trim();
      
      const payload: CommercialProfilePayload = {
        companyId: company.id,
        // Enviar campos solo si tienen contenido (no undefined para evitar eliminarlos del JSON)
        ...(trimmedDescription ? { businessDescription: trimmedDescription } : {}),
        ...(trimmedIndustry ? { industry: trimmedIndustry } : {}),
        language: formData.language,
        ...(trimmedTimezone ? { timezone: trimmedTimezone } : {}),
        is24_7: formData.is24_7,
        defaultTaxMode: formData.defaultTaxMode,
        allowsBranchPricing: formData.allowsBranchPricing,
      };

      // Debug: Log del payload y valores del formulario antes de enviar
      console.log('Valores del formulario:', {
        businessDescription: formData.businessDescription,
        industry: formData.industry,
        language: formData.language,
        timezone: formData.timezone,
      });
      console.log('Payload a enviar:', payload);

      // Usar UPSERT unificado - el backend decide si crear o actualizar
      await CommercialService.upsertProfile(payload);
      alert.showSuccess(profile ? 'Información actualizada correctamente' : 'Información guardada correctamente');

      // Recargar perfil después de guardar (solo si no hay error)
      try {
        const updated = await CommercialService.getProfile(company.id);
        setProfile(updated);
        
        // Actualizar formData con los valores guardados
        const newFormData = {
          businessDescription: updated.businessDescription || '',
          industry: updated.industry || '',
          language: updated.language || systemLanguage,
          timezone: updated.timezone || company.settings?.timezone || systemTimezone,
          is24_7: updated.is24_7 || false,
          defaultTaxMode: (updated.defaultTaxMode || 'included') as 'included' | 'excluded',
          allowsBranchPricing: updated.allowsBranchPricing || false,
        };
        setFormData(newFormData);
        // Actualizar los datos originales después de guardar
        setOriginalFormData(newFormData);
        
        // Notificar que el progreso está al 100% después de guardar exitosamente
        // (si el usuario guardó, significa que la información está completa)
        onProgressUpdate?.(100);
        
        // No llamar automáticamente a onComplete - el usuario debe presionar "Continuar" para avanzar
      } catch (error: any) {
        // Si falla al recargar, no es crítico - el perfil ya se guardó
        console.error('Error al recargar perfil después de guardar:', error);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al guardar información';
      const errorDetail = typeof error?.details === 'object' 
        ? JSON.stringify(error.details) 
        : error?.details || error?.result?.description;
      
      // Mostrar error en toast
      const fullErrorMessage = errorDetail ? `${errorMessage}: ${errorDetail}` : errorMessage;
      alert.showError(fullErrorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Función unificada para el botón: guardar si hay cambios, continuar si no
  const handleButtonPress = async () => {
    if (hasChanges()) {
      await handleSave();
    } else {
      handleContinue();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText type="body2" style={{ marginTop: 16, color: colors.textSecondary }}>
          Cargando información...
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>

      <View style={styles.formContainer}>
        {/* Industria - Movida antes de la descripción */}
        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            ¿En qué industria está tu empresa?
          </ThemedText>
          <Select
            value={formData.industry}
            options={INDUSTRIES}
            onSelect={(val) => handleChange('industry', val as string)}
            placeholder="Selecciona una industria"
            searchable={true}
            error={!!errors.industry}
            errorMessage={errors.industry}
          />
        </View>

        {/* Descripción del Negocio */}
        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            ¿A qué se dedica tu empresa?
          </ThemedText>
          <InputWithFocus
            containerStyle={[
              styles.textAreaContainer,
              {
                backgroundColor: colors.surface,
                borderColor: errors.businessDescription ? colors.error : colors.border,
              },
            ]}
            primaryColor={colors.primary}
            error={!!errors.businessDescription}
          >
            <TextInput
              style={[styles.textArea, { color: colors.text }]}
              placeholder="Ej: Empresa de desarrollo de software especializada en soluciones empresariales"
              placeholderTextColor={colors.textSecondary}
              value={formData.businessDescription}
              onChangeText={val => handleChange('businessDescription', val)}
              multiline
              numberOfLines={4}
            />
          </InputWithFocus>
          {errors.businessDescription && (
            <ThemedText type="caption" style={{ color: colors.error, marginTop: 4 }}>
              {errors.businessDescription}
            </ThemedText>
          )}
        </View>

        {/* Idioma y Zona Horaria - En la misma línea */}
        <View style={styles.inputGroup}>
          <View style={styles.rowContainer}>
            {/* Idioma - Obtenido automáticamente del sistema */}
            <View style={styles.halfWidth}>
              <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                Idioma principal
              </ThemedText>
              <Select
                value={formData.language}
                options={[
                  { value: 'es', label: 'Español' },
                  { value: 'en', label: 'English' },
                ]}
                onSelect={(val) => handleChange('language', val as string)}
                placeholder="Selecciona un idioma"
                searchable={false}
              />
              <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
                Se toma automáticamente del idioma configurado en el sistema
              </ThemedText>
            </View>

            {/* Zona Horaria - Obtenida automáticamente del sistema */}
            <View style={styles.halfWidth}>
              <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                Zona horaria
              </ThemedText>
              <Select
                value={formData.timezone}
                options={TIMEZONES}
                onSelect={(val) => handleChange('timezone', val as string)}
                placeholder="Selecciona una zona horaria"
                searchable={true}
              />
              <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
                Se toma automáticamente de la zona horaria del sistema ({systemTimezone})
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Atención 24/7 */}
        <View style={styles.inputGroup}>
          <CustomSwitch
            value={formData.is24_7}
            onValueChange={(val) => handleChange('is24_7', val)}
            label="¿Atiendes 24 horas al día, 7 días a la semana?"
          />
        </View>

        {/* Modo de impuestos por defecto */}
        <View style={styles.inputGroup}>
          <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
            ¿Los precios incluyen impuestos por defecto?
          </ThemedText>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioOption,
                {
                  borderColor: formData.defaultTaxMode === 'included' ? colors.primary : colors.border,
                  backgroundColor: formData.defaultTaxMode === 'included' ? colors.primary + '20' : 'transparent',
                },
              ]}
              onPress={() => handleChange('defaultTaxMode', 'included')}
            >
              <View
                style={[
                  styles.radioCircle,
                  {
                    borderColor: formData.defaultTaxMode === 'included' ? colors.primary : colors.border,
                  },
                ]}
              >
                {formData.defaultTaxMode === 'included' && (
                  <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <ThemedText type="body2" style={{ color: colors.text, marginLeft: 12 }}>
                Sí, los precios incluyen impuestos
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioOption,
                {
                  borderColor: formData.defaultTaxMode === 'excluded' ? colors.primary : colors.border,
                  backgroundColor: formData.defaultTaxMode === 'excluded' ? colors.primary + '20' : 'transparent',
                },
              ]}
              onPress={() => handleChange('defaultTaxMode', 'excluded')}
            >
              <View
                style={[
                  styles.radioCircle,
                  {
                    borderColor: formData.defaultTaxMode === 'excluded' ? colors.primary : colors.border,
                  },
                ]}
              >
                {formData.defaultTaxMode === 'excluded' && (
                  <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <ThemedText type="body2" style={{ color: colors.text, marginLeft: 12 }}>
                No, los impuestos se agregan aparte
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Precios por sucursal */}
        <View style={styles.inputGroup}>
          <CustomSwitch
            value={formData.allowsBranchPricing}
            onValueChange={(val) => handleChange('allowsBranchPricing', val)}
            label="¿Tus ofertas tienen precios diferentes por sucursal?"
          />
        </View>

        {/* Botón Guardar */}
        <Button
          title={
            saving 
              ? 'Guardando...' 
              : hasChanges() 
              ? 'Guardar Información' 
              : 'Continuar'
          }
          onPress={handleButtonPress}
          variant="primary"
          size="lg"
          disabled={saving}
          style={styles.saveButton}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="arrow-forward-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          )}
        </Button>

        {/* Información sobre qué se activa */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <ThemedText type="body2" style={{ color: colors.textSecondary, marginLeft: 8, flex: 1 }}>
            Con esta información, la IA podrá responder preguntas sobre tu negocio, ubicación y operación básica.
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
  inputGroup: {
    gap: 8,
  },
  label: {
    fontWeight: '600',
    marginBottom: 4,
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
    minHeight: 150,
  },
  textArea: {
    fontSize: 16,
    minHeight: 130,
    textAlignVertical: 'top',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  radioGroup: {
    gap: 12,
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  saveButton: {
    marginTop: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
});
