/**
 * Componente para Capa 3: Pagos
 * Gestiona métodos de pago, cuentas e instrucciones de pago
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InlineAlert } from '@/components/ui/inline-alert';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { useTheme } from '@/hooks/use-theme';
import { CommercialService } from '@/src/domains/commercial';
import {
    PaymentAccount,
    PaymentAccountPayload,
    PaymentInstruction,
    PaymentInstructionPayload,
    PaymentInstructionType,
    PaymentMethod,
    PaymentMethodPayload,
    PaymentMethodType,
} from '@/src/domains/commercial/types';
import { useCompany } from '@/src/domains/shared';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface PaymentsLayerProps {
  onProgressUpdate?: (progress: number) => void;
  onDataChange?: (hasData: boolean) => void;
  onComplete?: (hasData?: boolean) => void;
  onSkip?: () => void;
}

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethodType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'cash', label: 'Efectivo', icon: 'cash-outline' },
  { value: 'transfer', label: 'Transferencia', icon: 'swap-horizontal-outline' },
  { value: 'card', label: 'Tarjeta', icon: 'card-outline' },
  { value: 'online', label: 'Pago Online', icon: 'globe-outline' },
];

const INSTRUCTION_TYPE_OPTIONS: { value: PaymentInstructionType; label: string; description: string }[] = [
  { value: 'general', label: 'General', description: 'Instrucciones generales para todos los clientes' },
  { value: 'account_specific', label: 'Por Cuenta', description: 'Instrucciones específicas para una cuenta' },
  { value: 'warning', label: 'Advertencia', description: 'Aclaraciones o advertencias importantes' },
];

export function PaymentsLayer({ onProgressUpdate, onDataChange, onComplete, onSkip }: PaymentsLayerProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const { company } = useCompany();

  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [instructions, setInstructions] = useState<PaymentInstruction[]>([]);
  const [showMethodForm, setShowMethodForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showInstructionForm, setShowInstructionForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState<{ message: string; detail?: string } | null>(null);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false); // Flag para evitar llamados repetitivos

  const [methodForm, setMethodForm] = useState<PaymentMethodType>('cash');
  const [accountForm, setAccountForm] = useState({
    label: '',
    provider: '',
    accountNumber: '',
    accountHolder: '',
    identification: '',
    swiftCode: '',
  });
  const [instructionForm, setInstructionForm] = useState({
    instructionType: 'general' as PaymentInstructionType,
    message: '',
    paymentAccountId: '',
  });

  // Cargar métodos de pago - evitar llamados repetitivos
  const loadPaymentMethods = useCallback(async () => {
    if (!company?.id || isLoadingMethods) return;

    setIsLoadingMethods(true);
    setLoading(true);
    setGeneralError(null);

    try {
      const data = await CommercialService.getPaymentMethods(company.id);
      setPaymentMethods(data);
      // Solo seleccionar el primero si no hay uno seleccionado
      if (data.length > 0 && !selectedMethod) {
        setSelectedMethod(data[0]);
      }
      setGeneralError(null); // Limpiar errores si se carga correctamente
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al cargar métodos de pago';
      setGeneralError({ message: errorMessage });
      // No mostrar toast - solo InlineAlert en la pantalla
    } finally {
      setLoading(false);
      setIsLoadingMethods(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id para evitar loops

  // Cargar cuentas e instrucciones cuando se selecciona un método
  useEffect(() => {
    if (selectedMethod) {
      // Las cuentas e instrucciones se cargan desde el contexto completo
      // Por ahora las inicializamos vacías
      setAccounts([]);
      setInstructions([]);
    }
  }, [selectedMethod]);

  // Cargar métodos solo una vez cuando cambia company.id
  useEffect(() => {
    loadPaymentMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id

  // Calcular progreso
  useEffect(() => {
    if (!company?.id) return;

    const hasMethods = paymentMethods.length > 0;
    const hasAccounts = accounts.length > 0;
    const hasInstructions = instructions.length > 0;
    
    const fields = [hasMethods, hasAccounts, hasInstructions];
    const completed = fields.filter(f => f).length;
    const progress = Math.round((completed / fields.length) * 100);

    onProgressUpdate?.(progress);
    onDataChange?.(hasMethods || hasAccounts || hasInstructions);
    
    // No llamar automáticamente a onComplete - solo cuando el usuario presione "Continuar"
  }, [paymentMethods, accounts, instructions, company?.id, onProgressUpdate, onDataChange]);

  const handleCreateMethod = async () => {
    if (!company?.id) return;

    setSaving(true);
    setGeneralError(null);

    try {
      const payload: PaymentMethodPayload = {
        companyId: company.id,
        method: methodForm,
        isActive: true,
      };

      await CommercialService.createPaymentMethod(payload);
      alert.showSuccess('Método de pago creado correctamente');
      setShowMethodForm(false);
      // Recargar métodos sin mostrar toast de error si falla
      try {
        await loadPaymentMethods();
      } catch (error) {
        // Error ya manejado en loadPaymentMethods con InlineAlert
        console.error('Error al recargar métodos de pago:', error);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al crear método de pago';
      const errorDetail = typeof error?.details === 'object' 
        ? JSON.stringify(error.details) 
        : error?.details || error?.result?.description;
      
      setGeneralError({ message: errorMessage, detail: errorDetail });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!company?.id || !selectedMethod) return;

    if (!accountForm.label.trim()) {
      setGeneralError({ message: 'La etiqueta de la cuenta es requerida' });
      return;
    }

    setSaving(true);
    setGeneralError(null);

    try {
      const payload: PaymentAccountPayload = {
        paymentMethodId: selectedMethod.id,
        label: accountForm.label.trim(),
        provider: accountForm.provider.trim() || undefined,
        accountNumber: accountForm.accountNumber.trim() || undefined,
        accountHolder: accountForm.accountHolder.trim() || undefined,
        identification: accountForm.identification.trim() || undefined,
        swiftCode: accountForm.swiftCode.trim() || undefined,
        isActive: true,
      };

      await CommercialService.createPaymentAccount(selectedMethod.id, payload);
      alert.showSuccess('Cuenta creada correctamente');
      setShowAccountForm(false);
      setAccountForm({
        label: '',
        provider: '',
        accountNumber: '',
        accountHolder: '',
        identification: '',
        swiftCode: '',
      });
      // Recargar cuentas (por ahora solo actualizamos el estado local)
      setAccounts(prev => [...prev, { ...payload, id: 'temp-' + Date.now() } as PaymentAccount]);
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al crear cuenta';
      const errorDetail = typeof error?.details === 'object' 
        ? JSON.stringify(error.details) 
        : error?.details || error?.result?.description;
      
      setGeneralError({ message: errorMessage, detail: errorDetail });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInstruction = async () => {
    if (!company?.id || !selectedMethod) return;

    if (!instructionForm.message.trim()) {
      setGeneralError({ message: 'El mensaje de instrucción es requerido' });
      return;
    }

    setSaving(true);
    setGeneralError(null);

    try {
      const payload: PaymentInstructionPayload = {
        paymentMethodId: selectedMethod.id,
        paymentAccountId: instructionForm.paymentAccountId || null,
        instructionType: instructionForm.instructionType,
        message: instructionForm.message.trim(),
      };

      await CommercialService.createPaymentInstruction(selectedMethod.id, payload);
      alert.showSuccess('Instrucción creada correctamente');
      setShowInstructionForm(false);
      setInstructionForm({
        instructionType: 'general',
        message: '',
        paymentAccountId: '',
      });
      // Recargar instrucciones (por ahora solo actualizamos el estado local)
      setInstructions(prev => [...prev, { ...payload, id: 'temp-' + Date.now() } as PaymentInstruction]);
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al crear instrucción';
      const errorDetail = typeof error?.details === 'object' 
        ? JSON.stringify(error.details) 
        : error?.details || error?.result?.description;
      
      setGeneralError({ message: errorMessage, detail: errorDetail });
    } finally {
      setSaving(false);
    }
  };

  if (loading && paymentMethods.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText type="body2" style={{ marginTop: 16, color: colors.textSecondary }}>
          Cargando métodos de pago...
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
        {/* Sección: Métodos de Pago */}
        <Card variant="elevated" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet-outline" size={24} color={colors.primary} />
            <ThemedText type="h4" style={styles.sectionTitle}>
              Métodos de Pago
            </ThemedText>
          </View>
          <ThemedText type="body2" style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Define los métodos de pago que aceptas
          </ThemedText>

          {/* Lista de métodos */}
          {paymentMethods.length > 0 && (
            <View style={styles.listContainer}>
              {paymentMethods.map((method) => {
                const methodOption = PAYMENT_METHOD_OPTIONS.find(opt => opt.value === method.method);
                return (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.listItem,
                      {
                        backgroundColor: selectedMethod?.id === method.id ? colors.primary + '20' : colors.surface,
                        borderColor: selectedMethod?.id === method.id ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedMethod(method)}
                  >
                    <Ionicons
                      name={methodOption?.icon || 'cash-outline'}
                      size={24}
                      color={selectedMethod?.id === method.id ? colors.primary : colors.text}
                    />
                    <View style={styles.listItemContent}>
                      <ThemedText type="body1" style={{ fontWeight: '600' }}>
                        {methodOption?.label || method.method}
                      </ThemedText>
                    </View>
                    {selectedMethod?.id === method.id && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Formulario de nuevo método */}
          {showMethodForm ? (
            <Card variant="outlined" style={styles.formCard}>
              <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                Selecciona un método de pago
              </ThemedText>
              <View style={styles.optionsGrid}>
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionCard,
                      {
                        borderColor: methodForm === option.value ? colors.primary : colors.border,
                        backgroundColor: methodForm === option.value ? colors.primary + '20' : colors.surface,
                      },
                    ]}
                    onPress={() => setMethodForm(option.value)}
                  >
                    <Ionicons
                      name={option.icon}
                      size={32}
                      color={methodForm === option.value ? colors.primary : colors.textSecondary}
                    />
                    <ThemedText
                      type="body2"
                      style={{
                        marginTop: 8,
                        fontWeight: methodForm === option.value ? '600' : '400',
                        color: methodForm === option.value ? colors.primary : colors.text,
                      }}
                    >
                      {option.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formActions}>
                <Button
                  title="Cancelar"
                  onPress={() => setShowMethodForm(false)}
                  variant="outlined"
                  size="md"
                  disabled={saving}
                />
                <Button
                  title={saving ? 'Guardando...' : 'Crear Método'}
                  onPress={handleCreateMethod}
                  variant="primary"
                  size="md"
                  disabled={saving}
                />
              </View>
            </Card>
          ) : (
            <Button
              title="Agregar Método de Pago"
              onPress={() => setShowMethodForm(true)}
              variant="outlined"
              size="md"
              style={styles.addButton}
            >
              <Ionicons name="add" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            </Button>
          )}
        </Card>

        {/* Sección: Cuentas de Pago */}
        {selectedMethod && (
          <Card variant="elevated" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="card-outline" size={24} color={colors.primary} />
              <ThemedText type="h4" style={styles.sectionTitle}>
                Cuentas de {PAYMENT_METHOD_OPTIONS.find(opt => opt.value === selectedMethod.method)?.label}
              </ThemedText>
            </View>
            <ThemedText type="body2" style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Agrega las cuentas bancarias o de pago asociadas a este método
            </ThemedText>

            {/* Lista de cuentas */}
            {accounts.length > 0 && (
              <View style={styles.listContainer}>
                {accounts.map((account) => (
                  <View
                    key={account.id}
                    style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={styles.listItemContent}>
                      <ThemedText type="body1" style={{ fontWeight: '600' }}>
                        {account.label}
                      </ThemedText>
                      {account.provider && (
                        <ThemedText type="body2" style={{ color: colors.textSecondary, marginTop: 4 }}>
                          {account.provider}
                        </ThemedText>
                      )}
                      {account.accountNumber && (
                        <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
                          {account.accountNumber}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Formulario de nueva cuenta */}
            {showAccountForm ? (
              <Card variant="outlined" style={styles.formCard}>
                <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                  Etiqueta de la cuenta *
                </ThemedText>
                <InputWithFocus
                  containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  primaryColor={colors.primary}
                >
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Ej: Cuenta Principal, Cuenta de Ahorros"
                    placeholderTextColor={colors.textSecondary}
                    value={accountForm.label}
                    onChangeText={(val) => setAccountForm(prev => ({ ...prev, label: val }))}
                  />
                </InputWithFocus>

                <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                  Proveedor/Banco
                </ThemedText>
                <InputWithFocus
                  containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  primaryColor={colors.primary}
                >
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Ej: Banco Pichincha, PayPal"
                    placeholderTextColor={colors.textSecondary}
                    value={accountForm.provider}
                    onChangeText={(val) => setAccountForm(prev => ({ ...prev, provider: val }))}
                  />
                </InputWithFocus>

                <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                  Número de cuenta
                </ThemedText>
                <InputWithFocus
                  containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  primaryColor={colors.primary}
                >
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Número de cuenta"
                    placeholderTextColor={colors.textSecondary}
                    value={accountForm.accountNumber}
                    onChangeText={(val) => setAccountForm(prev => ({ ...prev, accountNumber: val }))}
                  />
                </InputWithFocus>

                <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                  Titular de la cuenta
                </ThemedText>
                <InputWithFocus
                  containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  primaryColor={colors.primary}
                >
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Nombre del titular"
                    placeholderTextColor={colors.textSecondary}
                    value={accountForm.accountHolder}
                    onChangeText={(val) => setAccountForm(prev => ({ ...prev, accountHolder: val }))}
                  />
                </InputWithFocus>

                <View style={styles.formActions}>
                  <Button
                    title="Cancelar"
                    onPress={() => {
                      setShowAccountForm(false);
                      setAccountForm({
                        label: '',
                        provider: '',
                        accountNumber: '',
                        accountHolder: '',
                        identification: '',
                        swiftCode: '',
                      });
                    }}
                    variant="outlined"
                    size="md"
                    disabled={saving}
                  />
                  <Button
                    title={saving ? 'Guardando...' : 'Crear Cuenta'}
                    onPress={handleCreateAccount}
                    variant="primary"
                    size="md"
                    disabled={saving}
                  />
                </View>
              </Card>
            ) : (
              <Button
                title="Agregar Cuenta"
                onPress={() => setShowAccountForm(true)}
                variant="outlined"
                size="md"
                style={styles.addButton}
              >
                <Ionicons name="add" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              </Button>
            )}
          </Card>
        )}

        {/* Sección: Instrucciones de Pago */}
        {selectedMethod && (
          <Card variant="elevated" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
              <ThemedText type="h4" style={styles.sectionTitle}>
                Instrucciones de Pago
              </ThemedText>
            </View>
            <ThemedText type="body2" style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Define mensajes que la IA compartirá con los clientes sobre cómo realizar pagos
            </ThemedText>

            {/* Lista de instrucciones */}
            {instructions.length > 0 && (
              <View style={styles.listContainer}>
                {instructions.map((instruction) => {
                  const typeOption = INSTRUCTION_TYPE_OPTIONS.find(opt => opt.value === instruction.instructionType);
                  return (
                    <View
                      key={instruction.id}
                      style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      <View style={styles.listItemContent}>
                        <View style={styles.instructionHeader}>
                          <ThemedText type="body1" style={{ fontWeight: '600' }}>
                            {typeOption?.label || instruction.instructionType}
                          </ThemedText>
                          {instruction.paymentAccountId && (
                            <ThemedText type="caption" style={{ color: colors.textSecondary, marginLeft: 8 }}>
                              (Específica)
                            </ThemedText>
                          )}
                        </View>
                        <ThemedText type="body2" style={{ color: colors.textSecondary, marginTop: 4 }}>
                          {instruction.message}
                        </ThemedText>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Formulario de nueva instrucción */}
            {showInstructionForm ? (
              <Card variant="outlined" style={styles.formCard}>
                <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                  Tipo de instrucción
                </ThemedText>
                <View style={styles.radioGroup}>
                  {INSTRUCTION_TYPE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.radioOption,
                        {
                          borderColor: instructionForm.instructionType === option.value ? colors.primary : colors.border,
                          backgroundColor: instructionForm.instructionType === option.value ? colors.primary + '20' : 'transparent',
                        },
                      ]}
                      onPress={() => setInstructionForm(prev => ({ ...prev, instructionType: option.value }))}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          { borderColor: instructionForm.instructionType === option.value ? colors.primary : colors.border },
                        ]}
                      >
                        {instructionForm.instructionType === option.value && (
                          <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                        )}
                      </View>
                      <View style={styles.radioLabel}>
                        <ThemedText type="body2" style={{ color: colors.text, fontWeight: '600' }}>
                          {option.label}
                        </ThemedText>
                        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                          {option.description}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {instructionForm.instructionType === 'account_specific' && accounts.length > 0 && (
                  <>
                    <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                      Cuenta asociada (opcional)
                    </ThemedText>
                    <View style={styles.selectContainer}>
                      {accounts.map((account) => (
                        <TouchableOpacity
                          key={account.id}
                          style={[
                            styles.selectOption,
                            {
                              borderColor: instructionForm.paymentAccountId === account.id ? colors.primary : colors.border,
                              backgroundColor: instructionForm.paymentAccountId === account.id ? colors.primary + '20' : colors.surface,
                            },
                          ]}
                          onPress={() => setInstructionForm(prev => ({ ...prev, paymentAccountId: account.id }))}
                        >
                          <ThemedText type="body2" style={{ color: colors.text }}>
                            {account.label}
                          </ThemedText>
                          {instructionForm.paymentAccountId === account.id && (
                            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                  Mensaje de instrucción *
                </ThemedText>
                <InputWithFocus
                  containerStyle={[styles.textAreaContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  primaryColor={colors.primary}
                >
                  <TextInput
                    style={[styles.textArea, { color: colors.text }]}
                    placeholder="Ej: Aceptamos pagos en efectivo en recepción"
                    placeholderTextColor={colors.textSecondary}
                    value={instructionForm.message}
                    onChangeText={(val) => setInstructionForm(prev => ({ ...prev, message: val }))}
                    multiline
                    numberOfLines={4}
                  />
                </InputWithFocus>

                <View style={styles.formActions}>
                  <Button
                    title="Cancelar"
                    onPress={() => {
                      setShowInstructionForm(false);
                      setInstructionForm({
                        instructionType: 'general',
                        message: '',
                        paymentAccountId: '',
                      });
                    }}
                    variant="outlined"
                    size="md"
                    disabled={saving}
                  />
                  <Button
                    title={saving ? 'Guardando...' : 'Crear Instrucción'}
                    onPress={handleCreateInstruction}
                    variant="primary"
                    size="md"
                    disabled={saving}
                  />
                </View>
              </Card>
            ) : (
              <Button
                title="Agregar Instrucción"
                onPress={() => setShowInstructionForm(true)}
                variant="outlined"
                size="md"
                style={styles.addButton}
              >
                <Ionicons name="add" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              </Button>
            )}
          </Card>
        )}

        {!selectedMethod && paymentMethods.length > 0 && (
          <Card variant="outlined" style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <ThemedText type="body2" style={{ color: colors.textSecondary, marginLeft: 8, flex: 1 }}>
              Selecciona un método de pago para configurar cuentas e instrucciones
            </ThemedText>
          </Card>
        )}

        {paymentMethods.length === 0 && (
          <Card variant="outlined" style={styles.infoCard}>
            <Ionicons name="bulb-outline" size={20} color={colors.primary} />
            <ThemedText type="body2" style={{ color: colors.textSecondary, marginLeft: 8, flex: 1 }}>
              Comienza agregando los métodos de pago que aceptas
            </ThemedText>
          </Card>
        )}

        {/* Botones Continuar y Omitir */}
        <View style={styles.continueButtonContainer}>
          <Button
            title={paymentMethods.length > 0 ? 'Continuar' : 'Omitir'}
            onPress={async () => {
              const hasData = paymentMethods.length > 0;
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
              name={paymentMethods.length > 0 ? "arrow-forward-outline" : "skip-forward-outline"} 
              size={20} 
              color="#FFFFFF" 
              style={{ marginRight: 8 }} 
            />
          </Button>
          {paymentMethods.length > 0 && onSkip && (
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
  sectionDescription: {
    lineHeight: 20,
  },
  listContainer: {
    gap: 12,
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  listItemContent: {
    flex: 1,
  },
  formCard: {
    padding: 16,
    marginTop: 8,
    gap: 16,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
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
  radioLabel: {
    marginLeft: 12,
    flex: 1,
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
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  addButton: {
    marginTop: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
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
