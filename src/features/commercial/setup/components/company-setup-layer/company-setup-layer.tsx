/**
 * Componente para Capa 0: Configuración de Empresa y Sucursal
 * Crea empresa, sucursal y asigna roles/permisos por defecto
 * Se muestra cuando el usuario no tiene empresa o tiene empresa de invitado
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/inline-alert';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { useCompany } from '@/src/domains/shared';
import { BranchesService } from '@/src/features/security/branches';
import { CompaniesService } from '@/src/features/security/companies';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';

interface CompanySetupLayerProps {
  onComplete?: () => void;
}

export function CompanySetupLayer({ onComplete }: CompanySetupLayerProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const router = useRouter();
  const { user, setUserContext } = useCompany();

  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'company' | 'branch'>('company');
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<{ message: string; detail?: string } | null>(null);

  // Datos de empresa
  const [companyData, setCompanyData] = useState({
    code: '',
    name: '',
    email: '',
    phone: '', // WhatsApp
    description: '',
  });

  // Datos de sucursal
  const [branchData, setBranchData] = useState({
    code: '',
    name: '',
    type: 'headquarters' as 'headquarters' | 'branch' | 'warehouse' | 'store',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
    contactInfo: {
      phone: '',
      email: '',
    },
  });

  const handleCreateCompany = async () => {
    if (!companyData.code.trim() || !companyData.name.trim() || !companyData.email.trim()) {
      setGeneralError({ message: 'Código, nombre y email son requeridos' });
      return;
    }

    if (!companyData.phone.trim()) {
      setGeneralError({ message: 'El número de WhatsApp es requerido para Chat IA' });
      return;
    }

    setSaving(true);
    setGeneralError(null);

    try {
      const company = await CompaniesService.createCompany({
        code: companyData.code.trim().toUpperCase(),
        name: companyData.name.trim(),
        email: companyData.email.trim(),
        phone: companyData.phone.trim(),
        description: companyData.description.trim() || undefined,
        status: 1,
      });

      alert.showSuccess('Empresa creada correctamente');
      
      // Guardar ID de empresa creada
      setCreatedCompanyId(company.id);
      
      // Avanzar a crear sucursal
      setStep('branch');
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al crear empresa';
      const errorDetail = typeof error?.details === 'object' 
        ? JSON.stringify(error.details) 
        : error?.details || error?.result?.description;
      
      setGeneralError({ message: errorMessage, detail: errorDetail });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!branchData.code.trim() || !branchData.name.trim()) {
      setGeneralError({ message: 'Código y nombre de sucursal son requeridos' });
      return;
    }

    // Necesitamos el ID de la empresa creada
    // Por ahora, lo obtenemos del contexto después de crear la empresa
    // En producción, esto se manejaría mejor con estado compartido

    if (!createdCompanyId) {
      setGeneralError({ message: 'Error: No se encontró el ID de la empresa creada' });
      return;
    }

    setSaving(true);
    setGeneralError(null);

    try {
      await BranchesService.createBranch({
        companyId: createdCompanyId,
        code: branchData.code.trim().toUpperCase(),
        name: branchData.name.trim(),
        type: branchData.type,
        address: branchData.address,
        contactInfo: branchData.contactInfo,
        status: 1, // Activo
      });
      
      alert.showSuccess('Sucursal creada correctamente');
      alert.showSuccess('Empresa y sucursal configuradas. Ahora puedes continuar con la configuración de Chat IA.');
      
      // Recargar contexto del usuario para obtener la nueva empresa y sucursal
      if (user && setUserContext) {
        await setUserContext(user);
      }

      // Completar Capa 0
      onComplete?.();
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al crear sucursal';
      const errorDetail = typeof error?.details === 'object' 
        ? JSON.stringify(error.details) 
        : error?.details || error?.result?.description;
      
      setGeneralError({ message: errorMessage, detail: errorDetail });
    } finally {
      setSaving(false);
    }
  };

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
        {step === 'company' ? (
          <>
            <View style={styles.header}>
              <Ionicons name="business-outline" size={32} color={colors.primary} />
              <ThemedText type="h3" style={styles.title}>
                Crear tu Empresa
              </ThemedText>
              <ThemedText type="body2" style={[styles.subtitle, { color: colors.textSecondary }]}>
                Para usar Chat IA necesitas configurar tu empresa y al menos una sucursal
              </ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                Código de la Empresa *
              </ThemedText>
              <InputWithFocus
                containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                primaryColor={colors.primary}
              >
                <Ionicons name="pricetag-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Ej: MIEMPRESA"
                  placeholderTextColor={colors.textSecondary}
                  value={companyData.code}
                  onChangeText={(val) => setCompanyData(prev => ({ ...prev, code: val }))}
                  autoCapitalize="characters"
                />
              </InputWithFocus>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                Nombre de la Empresa *
              </ThemedText>
              <InputWithFocus
                containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                primaryColor={colors.primary}
              >
                <Ionicons name="business-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Nombre de tu empresa"
                  placeholderTextColor={colors.textSecondary}
                  value={companyData.name}
                  onChangeText={(val) => setCompanyData(prev => ({ ...prev, name: val }))}
                />
              </InputWithFocus>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                Email *
              </ThemedText>
              <InputWithFocus
                containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                primaryColor={colors.primary}
              >
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="correo@empresa.com"
                  placeholderTextColor={colors.textSecondary}
                  value={companyData.email}
                  onChangeText={(val) => setCompanyData(prev => ({ ...prev, email: val }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </InputWithFocus>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                Número de WhatsApp *
              </ThemedText>
              <InputWithFocus
                containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                primaryColor={colors.primary}
              >
                <Ionicons name="logo-whatsapp" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="+593 99 999 9999"
                  placeholderTextColor={colors.textSecondary}
                  value={companyData.phone}
                  onChangeText={(val) => setCompanyData(prev => ({ ...prev, phone: val }))}
                  keyboardType="phone-pad"
                />
              </InputWithFocus>
              <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
                Este número se usará para conectar Chat IA con tus clientes
              </ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                Descripción (opcional)
              </ThemedText>
              <InputWithFocus
                containerStyle={[styles.textAreaContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                primaryColor={colors.primary}
              >
                <TextInput
                  style={[styles.textArea, { color: colors.text }]}
                  placeholder="Describe brevemente tu empresa"
                  placeholderTextColor={colors.textSecondary}
                  value={companyData.description}
                  onChangeText={(val) => setCompanyData(prev => ({ ...prev, description: val }))}
                  multiline
                  numberOfLines={3}
                />
              </InputWithFocus>
            </View>

            <Button
              title={saving ? 'Creando...' : 'Crear Empresa y Continuar'}
              onPress={handleCreateCompany}
              variant="primary"
              size="lg"
              disabled={saving}
              style={styles.saveButton}
            >
              {saving && <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />}
            </Button>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Ionicons name="storefront-outline" size={32} color={colors.primary} />
              <ThemedText type="h3" style={styles.title}>
                Crear Sucursal Principal
              </ThemedText>
              <ThemedText type="body2" style={[styles.subtitle, { color: colors.textSecondary }]}>
                Necesitas al menos una sucursal para continuar
              </ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                Código de la Sucursal *
              </ThemedText>
              <InputWithFocus
                containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                primaryColor={colors.primary}
              >
                <Ionicons name="pricetag-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Ej: SUC-001"
                  placeholderTextColor={colors.textSecondary}
                  value={branchData.code}
                  onChangeText={(val) => setBranchData(prev => ({ ...prev, code: val }))}
                  autoCapitalize="characters"
                />
              </InputWithFocus>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                Nombre de la Sucursal *
              </ThemedText>
              <InputWithFocus
                containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                primaryColor={colors.primary}
              >
                <Ionicons name="storefront-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Ej: Sucursal Principal"
                  placeholderTextColor={colors.textSecondary}
                  value={branchData.name}
                  onChangeText={(val) => setBranchData(prev => ({ ...prev, name: val }))}
                />
              </InputWithFocus>
            </View>

            <Button
              title={saving ? 'Creando...' : 'Crear Sucursal y Continuar'}
              onPress={handleCreateBranch}
              variant="primary"
              size="lg"
              disabled={saving}
              style={styles.saveButton}
            >
              {saving && <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />}
            </Button>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  alert: {
    marginBottom: 16,
  },
  formContainer: {
    gap: 20,
  },
  header: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
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
    minHeight: 100,
  },
  textArea: {
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 8,
  },
});
