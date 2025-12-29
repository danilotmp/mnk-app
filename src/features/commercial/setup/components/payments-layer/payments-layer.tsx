/**
 * Componente para Capa 3: Pagos
 * Gestiona métodos de pago, cuentas e instrucciones de pago
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tooltip } from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/use-theme';
import { CatalogService, catalogDetailsToInstructionTypeOptions, catalogDetailsToPaymentMethodOptions, catalogDetailsToSimpleOptions } from '@/src/domains/catalog';
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
import { DynamicIcon } from '@/src/domains/security/components/shared/dynamic-icon/dynamic-icon';
import { useCompany } from '@/src/domains/shared';
import { CustomSwitch } from '@/src/domains/shared/components/custom-switch/custom-switch';
import { RecordStatus } from '@/src/domains/shared/types/status.types';
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

// Las listas de PAYMENT_METHOD_OPTIONS, INSTRUCTION_TYPE_OPTIONS y ACCOUNT_TYPE_OPTIONS ahora se cargan desde catálogos

export function PaymentsLayer({ onProgressUpdate, onDataChange, onComplete, onSkip }: PaymentsLayerProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const { company } = useCompany();

  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodType, setSelectedMethodType] = useState<PaymentMethodType | null>(null); // Tipo de método seleccionado en la UI
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null); // Método existente de la BD
  const [selectedAccount, setSelectedAccount] = useState<PaymentAccount | null>(null);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [instructions, setInstructions] = useState<PaymentInstruction[]>([]);
  const [displayedInstructions, setDisplayedInstructions] = useState<PaymentInstruction[]>([]);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showInstructionForm, setShowInstructionForm] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null); // ID de la cuenta en edición
  const [editingAccountData, setEditingAccountData] = useState<Record<string, { name: string; provider?: string; accountType?: string; accountNumber?: string; accountHolder?: string; identification?: string; status: number }>>({}); // Datos de edición de cuentas
  const [editingInstructionId, setEditingInstructionId] = useState<string | null>(null); // ID de la instrucción en edición
  const [editingInstructionData, setEditingInstructionData] = useState<Record<string, { instructionType: PaymentInstructionType; message: string; status: number; paymentAccountId?: string | null }>>({}); // Datos de edición
  const [editingPreviousInstructionType, setEditingPreviousInstructionType] = useState<Record<string, PaymentInstructionType | null>>({}); // Guarda el tipo anterior antes de seleccionar una cuenta en edición
  const [saving, setSaving] = useState(false);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false); // Flag para evitar llamados repetitivos
  const [paymentMethodOptions, setPaymentMethodOptions] = useState<Array<{ value: PaymentMethodType; label: string; icon: keyof typeof Ionicons.glyphMap }>>([]);
  const [instructionTypeOptions, setInstructionTypeOptions] = useState<Array<{ value: PaymentInstructionType; label: string; description: string }>>([]);
  const [accountTypeOptions, setAccountTypeOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);
  // Color para iconos de acción: primaryDark en dark theme, primary en light theme
  const actionIconColor = isDark ? colors.primaryDark : colors.primary;
  const [accountForm, setAccountForm] = useState({
    name: '',
    provider: '',
    accountType: '',
    accountNumber: '',
    accountHolder: '',
    identification: '',
  });
  const [instructionForm, setInstructionForm] = useState({
    instructionType: 'general' as PaymentInstructionType,
    message: '',
    paymentAccountId: '',
  });
  const [previousInstructionType, setPreviousInstructionType] = useState<PaymentInstructionType | null>(null); // Guarda el tipo anterior antes de seleccionar una cuenta

  // Cargar métodos de pago - evitar llamados repetitivos
  const loadPaymentMethods = useCallback(async () => {
    if (!company?.id || isLoadingMethods) return;

    setIsLoadingMethods(true);
    setLoading(true);

    try {
      const data = await CommercialService.getPaymentMethods(company.id, true); // admin=true desde el wizard
      setPaymentMethods(data);
      // Solo seleccionar el primero si no hay uno seleccionado
      if (data.length > 0 && !selectedMethod) {
        setSelectedMethod(data[0]);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al cargar métodos de pago';
      const errorDetail = typeof error?.details === 'object' 
        ? JSON.stringify(error.details) 
        : error?.details || error?.result?.description || error?.result?.details;
      alert.showError(errorMessage, errorDetail);
    } finally {
      setLoading(false);
      setIsLoadingMethods(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id para evitar loops

  // Actualizar cuentas e instrucciones cuando se selecciona un método
  useEffect(() => {
    if (selectedMethod) {
      setAccounts(selectedMethod.accounts || []);
      setInstructions(selectedMethod.instructions || []);
      // Solo resetear cuenta seleccionada si la cuenta ya no existe en el método actualizado
      setSelectedAccount(prevAccount => {
        if (prevAccount && !selectedMethod.accounts?.find(acc => acc.id === prevAccount.id)) {
          // Si la cuenta anterior ya no existe, buscar la primera cuenta que tenga instrucciones
          const allInstructions = selectedMethod.instructions || [];
          const accountWithInstructions = selectedMethod.accounts?.find(acc => 
            allInstructions.some(inst => inst.paymentAccountId === acc.id)
          );
          return accountWithInstructions || null;
        }
        // Si no hay cuenta seleccionada pero hay instrucciones específicas de cuenta, seleccionar la primera cuenta que tenga instrucciones
        if (!prevAccount) {
          const allInstructions = selectedMethod.instructions || [];
          const accountWithInstructions = selectedMethod.accounts?.find(acc => 
            allInstructions.some(inst => inst.paymentAccountId === acc.id)
          );
          return accountWithInstructions || null;
        }
        return prevAccount; // Mantener la cuenta seleccionada si todavía existe
      });
      // El otro useEffect se encargará de actualizar displayedInstructions cuando cambie selectedAccount
    } else if (selectedMethodType) {
      // Si hay tipo seleccionado pero no método en BD, inicializar vacío
      setAccounts([]);
      setInstructions([]);
      setDisplayedInstructions([]);
      setSelectedAccount(null);
    } else {
      // Si no hay nada seleccionado, limpiar todo
      setAccounts([]);
      setInstructions([]);
      setDisplayedInstructions([]);
      setSelectedAccount(null);
    }
  }, [selectedMethod, selectedMethodType]);

  // Actualizar instrucciones mostradas - solo mostrar instrucciones generales
  useEffect(() => {
    if (!selectedMethod) {
      // Si no hay método en BD pero hay tipo seleccionado, mostrar vacío
      setDisplayedInstructions([]);
      return;
    }

    const allInstructions = selectedMethod.instructions || [];
    // Solo mostrar instrucciones generales (sin cuenta asociada)
    const generalInstructions = allInstructions.filter(inst => !inst.paymentAccountId);
    setDisplayedInstructions(generalInstructions);
  }, [selectedMethod]);

  // Cargar catálogos de métodos de pago, tipos de instrucción y tipos de cuenta
  useEffect(() => {
    if (!company?.id || isLoadingCatalogs) return;

    const loadCatalogs = async () => {
      setIsLoadingCatalogs(true);
      try {
        // Cargar catálogos en paralelo
        const [paymentMethodsResponse, instructionTypesResponse, accountTypesResponse] = await Promise.all([
          CatalogService.queryCatalog('PAYMENT_METHODS', company.id, false),
          CatalogService.queryCatalog('INSTRUCTION_TYPES', company.id, false),
          CatalogService.queryCatalog('ACCOUNT_TYPES', company.id, false),
        ]);

        setPaymentMethodOptions(catalogDetailsToPaymentMethodOptions(paymentMethodsResponse.details));
        setInstructionTypeOptions(catalogDetailsToInstructionTypeOptions(instructionTypesResponse.details));
        const accountTypes = catalogDetailsToSimpleOptions(accountTypesResponse.details);
        setAccountTypeOptions(accountTypes);
        
        // Preseleccionar la primera opción de tipo de cuenta si el formulario está vacío
        if (accountTypes.length > 0 && !accountForm.accountType) {
          setAccountForm(prev => ({ ...prev, accountType: accountTypes[0].value }));
        }
      } catch (error: any) {
        console.error('Error al cargar catálogos:', error);
        alert.showError('Error al cargar catálogos', error.message);
        // En caso de error, mantener arrays vacíos
        setPaymentMethodOptions([]);
        setInstructionTypeOptions([]);
        setAccountTypeOptions([]);
      } finally {
        setIsLoadingCatalogs(false);
      }
    };

    loadCatalogs();
  }, [company?.id]);

  // Cargar métodos solo una vez cuando cambia company.id
  useEffect(() => {
    loadPaymentMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id

  // Calcular progreso
  // Con que tenga un registro (método de pago) es suficiente para continuar
  useEffect(() => {
    if (!company?.id) return;

    const hasMethods = paymentMethods.length > 0;
    // Si hay al menos un método de pago, el progreso es 100%
    // Si no hay métodos, el progreso es 0%
    const progress = hasMethods ? 100 : 0;

    onProgressUpdate?.(progress);
    onDataChange?.(hasMethods);
    
    // No llamar automáticamente a onComplete - solo cuando el usuario presione "Continuar"
  }, [paymentMethods, company?.id, onProgressUpdate, onDataChange]);

  // Verificar si un método ya existe en la BD
  const getExistingMethod = (methodType: PaymentMethodType): PaymentMethod | null => {
    return paymentMethods.find(m => m.method === methodType) || null;
  };

  // Verificar si un método tiene cuentas o instrucciones
  // El controlador se muestra cuando el método existe (ya que controla el isActive del método)
  const hasAccountsOrInstructions = (method: PaymentMethod | null): boolean => {
    if (!method) return false;
    // El controlador debe mostrarse siempre que el método exista
    // porque controla el isActive del método mismo
    return true;
  };

  // Actualizar el estado isActive de un método de pago
  const handleToggleIsActive = async (method: PaymentMethod, newValue: boolean) => {
    if (!company?.id) return;

    setSaving(true);
    try {
      await CommercialService.updatePaymentMethod(method.id, { isActive: newValue });
      alert.showSuccess(`Método de pago ${newValue ? 'activado' : 'desactivado'} correctamente`);
      // Recargar métodos para obtener datos actualizados
      await loadPaymentMethods();
      // Actualizar método seleccionado si es el que se modificó
      if (selectedMethod?.id === method.id) {
        const updatedMethods = await CommercialService.getPaymentMethods(company.id, true); // admin=true desde el wizard
        const updatedMethod = updatedMethods.find(m => m.id === method.id);
        if (updatedMethod) {
          setSelectedMethod(updatedMethod);
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al actualizar método de pago';
      alert.showError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Crear método de pago si no existe, retornar el método (existente o nuevo)
  const ensurePaymentMethod = async (methodType: PaymentMethodType): Promise<PaymentMethod> => {
    if (!company?.id) {
      throw new Error('No se pudo obtener el ID de la empresa');
    }

    // Verificar si ya existe
    const existing = getExistingMethod(methodType);
    if (existing) {
      return existing;
    }

    // Crear nuevo método
    const payload: PaymentMethodPayload = {
      companyId: company.id,
      method: methodType,
      isActive: true,
    };

    const newMethod = await CommercialService.createPaymentMethod(payload);
    // Recargar métodos para obtener datos completos
    await loadPaymentMethods();
    // Buscar el método recién creado con sus datos completos
    const updatedMethods = await CommercialService.getPaymentMethods(company.id, true); // admin=true desde el wizard
    return updatedMethods.find(m => m.method === methodType) || newMethod;
  };

  // Función para validar URL
  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleCreateAccount = async () => {
    if (!company?.id || !selectedMethodType) return;

    // Validaciones obligatorias comunes
    if (!accountForm.name.trim()) {
      alert.showError('El nombre de la cuenta es requerido');
      return;
    }

    if (!accountForm.provider.trim()) {
      alert.showError('El Proveedor/Banco es requerido');
      return;
    }

    if (!accountForm.accountHolder.trim()) {
      alert.showError('El Titular de la cuenta es requerido');
      return;
    }

    // Validaciones según el tipo de método
    if (selectedMethodType === 'online') {
      // Para Pagos Online
      if (!accountForm.accountNumber.trim()) {
        alert.showError('El Link de Pago es requerido');
        return;
      }
      if (!isValidUrl(accountForm.accountNumber.trim())) {
        alert.showError('El Link de Pago debe ser una URL válida (ej: https://ejemplo.com/pago)');
        return;
      }
    } else if (selectedMethodType === 'transfer') {
      // Para Transferencias
      if (!accountForm.accountType) {
        alert.showError('El Tipo de cuenta es requerido');
        return;
      }
      if (!accountForm.accountNumber.trim()) {
        alert.showError('El Número de cuenta es requerido');
        return;
      }
      if (!accountForm.identification.trim()) {
        alert.showError('La Identificación es requerida');
        return;
      }
    }

    setSaving(true);

    try {
      // Primero asegurar que el método existe
      const method = await ensurePaymentMethod(selectedMethodType);
      setSelectedMethod(method);

      // Crear la cuenta
      const payload: PaymentAccountPayload = {
        paymentMethodId: method.id,
        name: accountForm.name.trim(),
        provider: accountForm.provider.trim() || undefined,
        accountNumber: accountForm.accountNumber.trim() || undefined,
        accountHolder: accountForm.accountHolder.trim() || undefined,
        identification: accountForm.identification.trim() || undefined,
        additionalData: accountForm.accountType ? { accountType: accountForm.accountType } : undefined,
        status: RecordStatus.ACTIVE, // 1 = Activo
      };

      await CommercialService.createPaymentAccount(method.id, payload);
      alert.showSuccess('Cuenta creada correctamente');
      setShowAccountForm(false);
      // Preseleccionar siempre la primera opción (índice 0) de tipo de cuenta al resetear
      const defaultAccountType = accountTypeOptions.length > 0 ? accountTypeOptions[0].value : '';
      setAccountForm({
        name: '',
        provider: '',
        accountType: defaultAccountType,
        accountNumber: '',
        accountHolder: '',
        identification: '',
      });
      // Recargar métodos para obtener datos actualizados
      await loadPaymentMethods();
      // Actualizar método seleccionado con datos frescos
      const updatedMethods = await CommercialService.getPaymentMethods(company.id, true); // admin=true desde el wizard
      const updatedMethod = updatedMethods.find(m => m.method === selectedMethodType);
      if (updatedMethod) {
        setSelectedMethod(updatedMethod);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al crear cuenta';
      const errorDetail = typeof error?.details === 'object' 
        ? JSON.stringify(error.details) 
        : error?.details || error?.result?.description || error?.result?.details;
      
      alert.showError(errorMessage, errorDetail);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInstruction = async () => {
    if (!company?.id || !selectedMethodType) return;

    if (!instructionForm.message.trim()) {
      alert.showError('El mensaje de instrucción es requerido');
      return;
    }

    setSaving(true);

    try {
      // Primero asegurar que el método existe
      const method = await ensurePaymentMethod(selectedMethodType);
      setSelectedMethod(method);

      // Crear la instrucción
      const payload: PaymentInstructionPayload = {
        paymentMethodId: method.id,
        paymentAccountId: instructionForm.paymentAccountId || null,
        instructionType: instructionForm.instructionType,
        message: instructionForm.message.trim(),
        status: RecordStatus.ACTIVE, // 1 = Activo
      };

      await CommercialService.createPaymentInstruction(method.id, payload);
      alert.showSuccess('Instrucción creada correctamente');
      setShowInstructionForm(false);
      setInstructionForm({
        instructionType: 'general',
        message: '',
        paymentAccountId: '',
      });
      setPreviousInstructionType(null); // Limpiar el tipo guardado
      // Recargar métodos para obtener datos actualizados
      await loadPaymentMethods();
      // Actualizar método seleccionado con datos frescos
      const updatedMethods = await CommercialService.getPaymentMethods(company.id, true); // admin=true desde el wizard
      const updatedMethod = updatedMethods.find(m => m.method === selectedMethodType);
      if (updatedMethod) {
        setSelectedMethod(updatedMethod);
        // Si se creó una instrucción específica de cuenta, seleccionar automáticamente esa cuenta
        if (payload.paymentAccountId) {
          const account = updatedMethod.accounts?.find(acc => acc.id === payload.paymentAccountId);
          if (account) {
            setSelectedAccount(account);
          }
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al crear instrucción';
      const errorDetail = typeof error?.details === 'object' 
        ? JSON.stringify(error.details) 
        : error?.details || error?.result?.description || error?.result?.details;
      
      alert.showError(errorMessage, errorDetail);
    } finally {
      setSaving(false);
    }
  };

  // Manejar click en una cuenta para editar
  const handleAccountClick = (account: PaymentAccount) => {
    if (editingAccountId === account.id) return; // Ya está en edición
    
    setEditingAccountId(account.id);
    // Preseleccionar la primera opción de tipo de cuenta si no hay valor
    const existingAccountType = (account.additionalData as any)?.accountType || '';
    // Si no hay tipo de cuenta existente y hay opciones disponibles, usar la primera
    const defaultAccountType = !existingAccountType && accountTypeOptions.length > 0
      ? accountTypeOptions[0].value 
      : existingAccountType;
    
    setEditingAccountData({
      [account.id]: {
        name: account.name || '',
        provider: account.provider || '',
        accountType: defaultAccountType,
        accountNumber: account.accountNumber || '',
        accountHolder: account.accountHolder || '',
        identification: account.identification || '',
        status: account.status,
      },
    });
  };

  // Guardar cambios de una cuenta editada
  const handleSaveAccount = async (accountId: string) => {
    if (!company?.id || !selectedMethod?.id) {
      alert.showError('No se pudo obtener la información necesaria');
      return;
    }

    const formData = editingAccountData[accountId];
    if (!formData) return;

    // Validaciones obligatorias comunes
    if (!formData.name?.trim()) {
      alert.showError('El nombre de la cuenta es requerido');
      return;
    }

    if (!formData.provider?.trim()) {
      alert.showError('El Proveedor/Banco es requerido');
      return;
    }

    if (!formData.accountHolder?.trim()) {
      alert.showError('El Titular de la cuenta es requerido');
      return;
    }

    // Validaciones según el tipo de método
    if (selectedMethodType === 'online') {
      // Para Pagos Online
      if (!formData.accountNumber?.trim()) {
        alert.showError('El Link de Pago es requerido');
        return;
      }
      if (!isValidUrl(formData.accountNumber.trim())) {
        alert.showError('El Link de Pago debe ser una URL válida (ej: https://ejemplo.com/pago)');
        return;
      }
    } else if (selectedMethodType === 'transfer') {
      // Para Transferencias
      if (!formData.accountType) {
        alert.showError('El Tipo de cuenta es requerido');
        return;
      }
      if (!formData.accountNumber?.trim()) {
        alert.showError('El Número de cuenta es requerido');
        return;
      }
      if (!formData.identification?.trim()) {
        alert.showError('La Identificación es requerida');
        return;
      }
    }

    setSaving(true);

    try {
      const payload: Partial<PaymentAccountPayload> = {
        name: formData.name.trim(),
        provider: formData.provider.trim(),
        accountNumber: formData.accountNumber?.trim() || undefined,
        accountHolder: formData.accountHolder.trim(),
        identification: formData.identification?.trim() || undefined,
        additionalData: formData.accountType ? { accountType: formData.accountType } : undefined,
        status: formData.status,
      };

      await CommercialService.updatePaymentAccount(selectedMethod.id, accountId, payload);
      alert.showSuccess('Cuenta actualizada correctamente');
      setEditingAccountId(null);
      setEditingAccountData({});
      // Recargar métodos para obtener datos actualizados
      await loadPaymentMethods();
      // Actualizar método seleccionado con datos frescos
      const updatedMethods = await CommercialService.getPaymentMethods(company.id, true);
      const updatedMethod = updatedMethods.find(m => m.method === selectedMethodType);
      if (updatedMethod) {
        setSelectedMethod(updatedMethod);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al actualizar cuenta';
      const errorDetail = typeof error?.details === 'object' 
        ? JSON.stringify(error.details) 
        : error?.details || error?.result?.description || error?.result?.details;
      
      alert.showError(errorMessage, errorDetail);
    } finally {
      setSaving(false);
    }
  };

  // Eliminar una cuenta
  const handleDeleteAccount = async (accountId: string) => {
    if (!selectedMethod?.id || !company?.id) {
      alert.showError('No se pudo obtener la información necesaria');
      return;
    }

    // Buscar la cuenta para obtener sus datos actuales
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) {
      alert.showError('No se pudo encontrar la cuenta');
      return;
    }

    setSaving(true);

    try {
      // En lugar de eliminar físicamente, cambiar el estado a DELETED
      const payload: Partial<PaymentAccountPayload> = {
        name: account.name || undefined,
        provider: account.provider || undefined,
        accountNumber: account.accountNumber || undefined,
        accountHolder: account.accountHolder || undefined,
        identification: account.identification || undefined,
        additionalData: (account.additionalData as any)?.accountType ? { accountType: (account.additionalData as any).accountType } : undefined,
        status: RecordStatus.DELETED, // Cambiar estado a Eliminado
      };

      await CommercialService.updatePaymentAccount(selectedMethod.id, accountId, payload);
      alert.showSuccess('Cuenta eliminada correctamente');
      // Recargar métodos para obtener datos actualizados
      await loadPaymentMethods();
      // Actualizar método seleccionado con datos frescos
      const updatedMethods = await CommercialService.getPaymentMethods(company.id, true);
      const updatedMethod = updatedMethods.find(m => m.method === selectedMethodType);
      if (updatedMethod) {
        setSelectedMethod(updatedMethod);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al eliminar cuenta';
      const errorDetail = typeof error?.details === 'object' 
        ? JSON.stringify(error.details) 
        : error?.details || error?.result?.description || error?.result?.details;
      
      alert.showError(errorMessage, errorDetail);
    } finally {
      setSaving(false);
    }
  };

  // Cancelar edición de una cuenta
  const handleCancelAccount = (accountId: string) => {
    setEditingAccountId(null);
    setEditingAccountData({});
  };

  // Manejar click en el título/header de una instrucción para editar
  const handleInstructionTitleClick = (instruction: PaymentInstruction) => {
    if (editingInstructionId === instruction.id) return; // Ya está en edición
    
    setEditingInstructionId(instruction.id);
    setEditingInstructionData({
      [instruction.id]: {
        instructionType: instruction.instructionType,
        message: instruction.message,
        status: instruction.status,
        paymentAccountId: instruction.paymentAccountId || null,
      },
    });
  };

  // Guardar cambios de una instrucción editada
  const handleSaveInstruction = async (instructionId: string) => {
    if (!company?.id || !selectedMethod?.id) {
      alert.showError('No se pudo obtener la información necesaria');
      return;
    }

    const formData = editingInstructionData[instructionId];
    if (!formData) return;

    if (!formData.message.trim()) {
      alert.showError('El mensaje de instrucción es requerido');
      return;
    }

    setSaving(true);

    try {
      const payload: Partial<PaymentInstructionPayload> = {
        instructionType: formData.instructionType,
        message: formData.message.trim(),
        paymentAccountId: formData.paymentAccountId || null,
        status: formData.status,
      };

      await CommercialService.updatePaymentInstruction(selectedMethod.id, instructionId, payload);
      alert.showSuccess('Instrucción actualizada correctamente');
      setEditingInstructionId(null);
      setEditingInstructionData({});
      setEditingPreviousInstructionType(prev => {
        const next = { ...prev };
        delete next[instructionId];
        return next;
      });
      // Recargar métodos para obtener datos actualizados
      await loadPaymentMethods();
      // Actualizar método seleccionado con datos frescos
      const updatedMethods = await CommercialService.getPaymentMethods(company.id, true);
      const updatedMethod = updatedMethods.find(m => m.method === selectedMethodType);
      if (updatedMethod) {
        setSelectedMethod(updatedMethod);
        // Si se actualizó una instrucción específica de cuenta, asegurar que la cuenta esté seleccionada
        if (payload.paymentAccountId) {
          const account = updatedMethod.accounts?.find(acc => acc.id === payload.paymentAccountId);
          if (account && (!selectedAccount || selectedAccount.id !== account.id)) {
            setSelectedAccount(account);
          }
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al actualizar instrucción';
      const errorDetail = typeof error?.details === 'object' 
        ? JSON.stringify(error.details) 
        : error?.details || error?.result?.description || error?.result?.details;
      
      alert.showError(errorMessage, errorDetail);
    } finally {
      setSaving(false);
    }
  };

  // Eliminar una instrucción
  const handleDeleteInstruction = async (instructionId: string) => {
    if (!selectedMethod?.id || !company?.id) {
      alert.showError('No se pudo obtener la información necesaria');
      return;
    }

    // Buscar la instrucción para obtener sus datos actuales
    const instruction = instructions.find(inst => inst.id === instructionId);
    if (!instruction) {
      alert.showError('No se pudo encontrar la instrucción');
      return;
    }

    setSaving(true);

    try {
      // En lugar de eliminar físicamente, cambiar el estado a DELETED
      const payload: Partial<PaymentInstructionPayload> = {
        instructionType: instruction.instructionType,
        message: instruction.message,
        paymentAccountId: instruction.paymentAccountId || null,
        status: RecordStatus.DELETED, // Cambiar estado a Eliminado
      };

      await CommercialService.updatePaymentInstruction(selectedMethod.id, instructionId, payload);
      alert.showSuccess('Instrucción eliminada correctamente');
      // Recargar métodos para obtener datos actualizados
      await loadPaymentMethods();
      // Actualizar método seleccionado con datos frescos
      const updatedMethods = await CommercialService.getPaymentMethods(company.id, true);
      const updatedMethod = updatedMethods.find(m => m.method === selectedMethodType);
      if (updatedMethod) {
        setSelectedMethod(updatedMethod);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al eliminar instrucción';
      const errorDetail = typeof error?.details === 'object' 
        ? JSON.stringify(error.details) 
        : error?.details || error?.result?.description || error?.result?.details;
      
      alert.showError(errorMessage, errorDetail);
    } finally {
      setSaving(false);
    }
  };

  // Cancelar edición de una instrucción
  const handleCancelInstruction = (instructionId: string) => {
    setEditingInstructionId(null);
    setEditingInstructionData({});
    setEditingPreviousInstructionType(prev => {
      const next = { ...prev };
      delete next[instructionId];
      return next;
    });
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
      <View style={styles.formContainer}>
        {/* Sección: Seleccionar Método de Pago - Siempre visible */}
        <Card variant="elevated" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet-outline" size={24} color={colors.primary} />
            <ThemedText type="h4" style={styles.sectionTitle}>
              Método de pago
            </ThemedText>
          </View>
          <View style={styles.optionsGrid}>
            {paymentMethodOptions.map((option) => {
              const existingMethod = getExistingMethod(option.value);
              const isSelected = selectedMethodType === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionCard,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.primary + '20' : colors.surface,
                    },
                  ]}
                  onPress={async () => {
                    setSelectedMethodType(option.value);
                    // Si el método ya existe, cargar sus datos
                    if (existingMethod) {
                      setSelectedMethod(existingMethod);
                    } else {
                      setSelectedMethod(null);
                    }
                    // Si se cambia a un método que no soporta "Por Cuenta" y está seleccionado, resetear a "General"
                    if ((option.value === 'cash' || option.value === 'card') && 
                        instructionForm.instructionType === 'account_specific') {
                      // Buscar la opción "general" en instructionTypeOptions
                      const generalOption = instructionTypeOptions.find(opt => opt.value === 'general');
                      if (generalOption) {
                        setInstructionForm(prev => ({ ...prev, instructionType: 'general', paymentAccountId: '' }));
                        setPreviousInstructionType(null); // Limpiar el tipo guardado
                      }
                    }
                  }}
                >
                  {/* Toggle switch si el método tiene cuentas o instrucciones */}
                  {existingMethod && hasAccountsOrInstructions(existingMethod) && (
                    <View style={styles.optionCardHeader}>
                      <CustomSwitch
                        value={existingMethod.isActive}
                        onValueChange={(newValue) => handleToggleIsActive(existingMethod, newValue)}
                        disabled={saving}
                      />
                    </View>
                  )}
                  <Ionicons
                    name={option.icon}
                    size={32}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                  <ThemedText
                    type="body2"
                    style={{
                      marginTop: 8,
                      fontWeight: isSelected ? '600' : '400',
                      color: isSelected ? colors.primary : colors.text,
                    }}
                  >
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Sección: Cuentas de Pago - Solo para transfer y online */}
        {selectedMethodType && (selectedMethodType === 'transfer' || selectedMethodType === 'online') && (
          <Card variant="elevated" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="card-outline" size={24} color={colors.primary} />
              <ThemedText type="h4" style={styles.sectionTitle}>
                Cuentas de {paymentMethodOptions.find(opt => opt.value === selectedMethodType)?.label}
              </ThemedText>
            </View>
            <ThemedText type="body2" style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Agrega las cuentas bancarias o de pago asociadas a este método
            </ThemedText>

            {/* Lista de cuentas */}
            {accounts.length > 0 && (
              <View style={styles.listContainer}>
                {accounts.map((account) => {
                  const isEditing = editingAccountId === account.id;
                  const formData = isEditing ? editingAccountData[account.id] : null;
                  const currentStatus = formData?.status ?? account.status;
                  
                  return (
                    <Card
                      key={account.id}
                      variant="outlined"
                      style={styles.guidelineCard}
                    >
                      <View style={styles.guidelineHeader}>
                        <View style={styles.guidelineTitleRow}>
                          {isEditing ? (
                            <InputWithFocus
                              containerStyle={[
                                styles.titleInputContainer,
                                {
                                  backgroundColor: colors.surface,
                                  borderColor: colors.border,
                                  flex: 1,
                                },
                              ]}
                              primaryColor={colors.primary}
                            >
                              <TextInput
                                style={[styles.titleInput, { color: colors.text }]}
                                placeholder="Nombre de la cuenta"
                                placeholderTextColor={colors.textSecondary}
                                value={formData?.name || ''}
                                onChangeText={(text) => setEditingAccountData(prev => ({
                                  ...prev,
                                  [account.id]: { ...prev[account.id] || { name: account.name || '', provider: account.provider || '', accountNumber: account.accountNumber || '', accountHolder: account.accountHolder || '', identification: account.identification || '', status: account.status }, name: text }
                                }))}
                                editable={!saving}
                              />
                            </InputWithFocus>
                          ) : (
                            <View style={{ flex: 1 }}>
                              <TouchableOpacity
                                style={{ flex: 1 }}
                                onPress={() => handleAccountClick(account)}
                                activeOpacity={0.7}
                              >
                                <ThemedText type="h4" style={{ fontWeight: '700', flex: 1 }}>
                                  {account.name}
                                </ThemedText>
                              </TouchableOpacity>
                              {account.provider && (
                                <ThemedText type="body2" variant="secondary" style={{ marginTop: 4 }}>
                                  {account.provider}
                                </ThemedText>
                              )}
                            </View>
                          )}
                          <View style={styles.badgeActionsContainer}>
                            {isEditing ? (
                              <>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                  <View style={styles.statusOptionsContainer}>
                                    {/* Activo */}
                                    <TouchableOpacity
                                      style={[
                                        styles.statusOption,
                                        { borderColor: colors.border },
                                        currentStatus === RecordStatus.ACTIVE && {
                                          backgroundColor: '#10b981',
                                          borderColor: '#10b981',
                                        },
                                      ]}
                                      onPress={() => {
                                        setEditingAccountData(prev => ({
                                          ...prev,
                                          [account.id]: { ...prev[account.id] || { name: account.name || '', provider: account.provider || '', accountNumber: account.accountNumber || '', accountHolder: account.accountHolder || '', identification: account.identification || '', status: account.status }, status: RecordStatus.ACTIVE }
                                        }));
                                      }}
                                      disabled={saving}
                                    >
                                      <ThemedText
                                        type="caption"
                                        style={currentStatus === RecordStatus.ACTIVE ? { color: '#FFFFFF' } : { color: colors.text }}
                                      >
                                        {t.security?.users?.active || 'Activo'}
                                      </ThemedText>
                                    </TouchableOpacity>

                                    {/* Inactivo */}
                                    <TouchableOpacity
                                      style={[
                                        styles.statusOption,
                                        { borderColor: colors.border },
                                        currentStatus === RecordStatus.INACTIVE && {
                                          backgroundColor: '#ef4444',
                                          borderColor: '#ef4444',
                                        },
                                      ]}
                                      onPress={() => {
                                        setEditingAccountData(prev => ({
                                          ...prev,
                                          [account.id]: { ...prev[account.id] || { name: account.name || '', provider: account.provider || '', accountNumber: account.accountNumber || '', accountHolder: account.accountHolder || '', identification: account.identification || '', status: account.status }, status: RecordStatus.INACTIVE }
                                        }));
                                      }}
                                      disabled={saving}
                                    >
                                      <ThemedText
                                        type="caption"
                                        style={currentStatus === RecordStatus.INACTIVE ? { color: '#FFFFFF' } : { color: colors.text }}
                                      >
                                        {t.security?.users?.inactive || 'Inactivo'}
                                      </ThemedText>
                                    </TouchableOpacity>

                                    {/* Pendiente */}
                                    <TouchableOpacity
                                      style={[
                                        styles.statusOption,
                                        { borderColor: colors.border },
                                        currentStatus === RecordStatus.PENDING && {
                                          backgroundColor: '#f59e0b',
                                          borderColor: '#f59e0b',
                                        },
                                      ]}
                                      onPress={() => {
                                        setEditingAccountData(prev => ({
                                          ...prev,
                                          [account.id]: { ...prev[account.id] || { name: account.name || '', provider: account.provider || '', accountNumber: account.accountNumber || '', accountHolder: account.accountHolder || '', identification: account.identification || '', status: account.status }, status: RecordStatus.PENDING }
                                        }));
                                      }}
                                      disabled={saving}
                                    >
                                      <ThemedText
                                        type="caption"
                                        style={currentStatus === RecordStatus.PENDING ? { color: '#FFFFFF' } : { color: colors.text }}
                                      >
                                        {t.security?.users?.pending || 'Pendiente'}
                                      </ThemedText>
                                    </TouchableOpacity>

                                    {/* Suspendido */}
                                    <TouchableOpacity
                                      style={[
                                        styles.statusOption,
                                        { borderColor: colors.border },
                                        currentStatus === RecordStatus.SUSPENDED && {
                                          backgroundColor: '#f97316',
                                          borderColor: '#f97316',
                                        },
                                      ]}
                                      onPress={() => {
                                        setEditingAccountData(prev => ({
                                          ...prev,
                                          [account.id]: { ...prev[account.id] || { name: account.name || '', provider: account.provider || '', accountNumber: account.accountNumber || '', accountHolder: account.accountHolder || '', identification: account.identification || '', status: account.status }, status: RecordStatus.SUSPENDED }
                                        }));
                                      }}
                                      disabled={saving}
                                    >
                                      <ThemedText
                                        type="caption"
                                        style={currentStatus === RecordStatus.SUSPENDED ? { color: '#FFFFFF' } : { color: colors.text }}
                                      >
                                        {t.security?.users?.suspended || 'Suspendido'}
                                      </ThemedText>
                                    </TouchableOpacity>
                                  </View>
                                </ScrollView>
                                <TouchableOpacity
                                  style={styles.cancelButton}
                                  onPress={() => handleCancelAccount(account.id)}
                                  disabled={saving}
                                >
                                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                              </>
                            ) : (
                              <>
                                <StatusBadge
                                  status={typeof account.status === 'number' ? account.status : RecordStatus.ACTIVE}
                                  statusDescription={
                                    (typeof account.statusDescription === 'string' && account.statusDescription.trim() !== '')
                                      ? account.statusDescription 
                                      : (account.status === RecordStatus.ACTIVE ? 'Activo' : 
                                         account.status === RecordStatus.INACTIVE ? 'Inactivo' : 
                                         account.status === RecordStatus.PENDING ? 'Pendiente' : 
                                         account.status === RecordStatus.SUSPENDED ? 'Suspendido' : 
                                         account.status === RecordStatus.DELETED ? 'Eliminado' : 'Activo')
                                  }
                                  size="small"
                                />
                                <View style={styles.actionIconsContainer}>
                                  <Tooltip text="Editar" position="top">
                                    <TouchableOpacity
                                      style={styles.actionIconButton}
                                      onPress={() => handleAccountClick(account)}
                                      disabled={saving}
                                    >
                                      <Ionicons name="pencil" size={18} color={actionIconColor} />
                                    </TouchableOpacity>
                                  </Tooltip>
                                  <Tooltip text="Eliminar" position="top">
                                    <TouchableOpacity
                                      style={styles.actionIconButton}
                                      onPress={() => handleDeleteAccount(account.id)}
                                      disabled={saving}
                                    >
                                      <Ionicons name="trash" size={18} color={actionIconColor} />
                                    </TouchableOpacity>
                                  </Tooltip>
                                </View>
                              </>
                            )}
                          </View>
                        </View>
                      </View>

                      {isEditing ? (
                        <>
                          {/* Primera fila: Proveedor */}
                          <View style={styles.twoColumnRow}>
                            <View style={styles.columnField}>
                              <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 12 }]}>
                                Proveedor/Banco *
                              </ThemedText>
                              <InputWithFocus
                                containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                primaryColor={colors.primary}
                              >
                                <TextInput
                                  style={[styles.input, { color: colors.text }]}
                                  placeholder="Ej: Banco Pichincha"
                                  placeholderTextColor={colors.textSecondary}
                                  value={formData?.provider || ''}
                                  onChangeText={(text) => setEditingAccountData(prev => ({
                                    ...prev,
                                    [account.id]: { ...prev[account.id] || { name: account.name || '', provider: account.provider || '', accountType: (account.additionalData as any)?.accountType || '', accountNumber: account.accountNumber || '', accountHolder: account.accountHolder || '', identification: account.identification || '', status: account.status }, provider: text }
                                  }))}
                                  editable={!saving}
                                />
                              </InputWithFocus>
                            </View>
                          </View>

                          {/* Segunda fila: Tipo de cuenta (solo transfer) y Número de cuenta / Link de Pago */}
                          <View style={styles.twoColumnRow}>
                            {selectedMethodType === 'transfer' && (
                              <View style={styles.columnField}>
                                <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                                  Tipo de cuenta *
                                </ThemedText>
                                <View style={styles.accountTypeSelector}>
                                  {accountTypeOptions.map((option, index) => {
                                    const currentType = formData?.accountType || '';
                                    const isOption0 = index === 0;
                                    // Si no hay tipo seleccionado, la opción 0 debe estar seleccionada
                                    const shouldBeSelected = !currentType && isOption0;
                                    const isSelected = currentType === option.value || shouldBeSelected;
                                    
                                    return (
                                      <TouchableOpacity
                                        key={option.value}
                                        style={[
                                          styles.accountTypeOption,
                                          {
                                            borderColor: shouldBeSelected ? colors.primary : (isSelected ? colors.primary : colors.border),
                                            backgroundColor: isSelected ? colors.primary + '20' : colors.surface,
                                          },
                                        ]}
                                        onPress={() => {
                                          // Si se intenta deseleccionar la opción 0, mantenerla seleccionada
                                          if (isOption0 && currentType === option.value) {
                                            return; // No permitir deseleccionar la opción 0
                                          }
                                          const newType = currentType === option.value ? accountTypeOptions[0].value : option.value;
                                          // Si se intenta deseleccionar la primera opción cuando está preseleccionada, mantenerla
                                          const finalType = (newType === '' && shouldBeSelected) ? option.value : newType;
                                          setEditingAccountData(prev => ({
                                            ...prev,
                                            [account.id]: { 
                                              ...prev[account.id] || { 
                                                name: account.name || '', 
                                                provider: account.provider || '', 
                                                accountType: (account.additionalData as any)?.accountType || '', 
                                                accountNumber: account.accountNumber || '', 
                                                accountHolder: account.accountHolder || '', 
                                                identification: account.identification || '', 
                                                status: account.status 
                                              }, 
                                              accountType: finalType
                                            }
                                          }));
                                        }}
                                        disabled={saving}
                                      >
                                        <View
                                          style={[
                                            styles.radioCircle,
                                            { 
                                              borderColor: isSelected 
                                                ? colors.primary 
                                                : (isDark ? colors.text : colors.border)
                                            },
                                          ]}
                                        >
                                          {isSelected && (
                                            <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                                          )}
                                        </View>
                                        <ThemedText type="body2" style={{ color: colors.text, marginLeft: 8 }}>
                                          {option.label}
                                        </ThemedText>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                              </View>
                            )}
                            <View style={styles.columnField}>
                              <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                                {selectedMethodType === 'online' ? 'Link de Pago *' : 'Número de cuenta *'}
                              </ThemedText>
                              <InputWithFocus
                                containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                primaryColor={colors.primary}
                              >
                                <TextInput
                                  style={[styles.input, { color: colors.text }]}
                                  placeholder={selectedMethodType === 'online' ? 'https://ejemplo.com/pago' : 'Número de cuenta'}
                                  placeholderTextColor={colors.textSecondary}
                                  value={formData?.accountNumber || ''}
                                  keyboardType={selectedMethodType === 'online' ? 'url' : 'numeric'}
                                  autoCapitalize={selectedMethodType === 'online' ? 'none' : 'sentences'}
                                  onChangeText={(text) => {
                                    if (selectedMethodType === 'online') {
                                      // Para online, agregar https:// automáticamente si no empieza con http:// o https://
                                      let urlText = text.trim();
                                      if (urlText && !urlText.startsWith('http://') && !urlText.startsWith('https://')) {
                                        urlText = 'https://' + urlText;
                                      }
                                      setEditingAccountData(prev => ({
                                        ...prev,
                                        [account.id]: { ...prev[account.id] || { name: account.name || '', provider: account.provider || '', accountType: (account.additionalData as any)?.accountType || '', accountNumber: account.accountNumber || '', accountHolder: account.accountHolder || '', identification: account.identification || '', status: account.status }, accountNumber: urlText }
                                      }));
                                    } else {
                                      // Solo permitir números para transfer
                                      const numericText = text.replace(/[^0-9]/g, '');
                                      setEditingAccountData(prev => ({
                                        ...prev,
                                        [account.id]: { ...prev[account.id] || { name: account.name || '', provider: account.provider || '', accountType: (account.additionalData as any)?.accountType || '', accountNumber: account.accountNumber || '', accountHolder: account.accountHolder || '', identification: account.identification || '', status: account.status }, accountNumber: numericText }
                                      }));
                                    }
                                  }}
                                  editable={!saving}
                                />
                              </InputWithFocus>
                            </View>
                          </View>

                          {/* Tercera fila: Identificación (solo transfer) y Titular */}
                          {selectedMethodType === 'transfer' && (
                            <View style={styles.twoColumnRow}>
                              <View style={styles.columnField}>
                                <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                                  Identificación *
                                </ThemedText>
                                <InputWithFocus
                                  containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                  primaryColor={colors.primary}
                                >
                                  <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Identificación del titular"
                                    placeholderTextColor={colors.textSecondary}
                                    value={formData?.identification || ''}
                                    onChangeText={(text) => setEditingAccountData(prev => ({
                                      ...prev,
                                      [account.id]: { ...prev[account.id] || { name: account.name || '', provider: account.provider || '', accountType: (account.additionalData as any)?.accountType || '', accountNumber: account.accountNumber || '', accountHolder: account.accountHolder || '', identification: account.identification || '', status: account.status }, identification: text }
                                    }))}
                                    editable={!saving}
                                  />
                                </InputWithFocus>
                              </View>
                              <View style={styles.columnField}>
                                <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                                  Titular de la cuenta *
                                </ThemedText>
                                <InputWithFocus
                                  containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                  primaryColor={colors.primary}
                                >
                                  <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Nombre del titular"
                                    placeholderTextColor={colors.textSecondary}
                                    value={formData?.accountHolder || ''}
                                    onChangeText={(text) => setEditingAccountData(prev => ({
                                      ...prev,
                                      [account.id]: { ...prev[account.id] || { name: account.name || '', provider: account.provider || '', accountType: (account.additionalData as any)?.accountType || '', accountNumber: account.accountNumber || '', accountHolder: account.accountHolder || '', identification: account.identification || '', status: account.status }, accountHolder: text }
                                    }))}
                                    editable={!saving}
                                  />
                                </InputWithFocus>
                              </View>
                            </View>
                          )}
                          {selectedMethodType === 'online' && (
                            <View style={styles.twoColumnRow}>
                              <View style={styles.columnField}>
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
                                    value={formData?.accountHolder || ''}
                                    onChangeText={(text) => setEditingAccountData(prev => ({
                                      ...prev,
                                      [account.id]: { ...prev[account.id] || { name: account.name || '', provider: account.provider || '', accountType: (account.additionalData as any)?.accountType || '', accountNumber: account.accountNumber || '', accountHolder: account.accountHolder || '', identification: account.identification || '', status: account.status }, accountHolder: text }
                                    }))}
                                    editable={!saving}
                                  />
                                </InputWithFocus>
                              </View>
                            </View>
                          )}

                          <View style={styles.formActions}>
                            <View style={{ flex: 1 }} />
                            <Button
                              title="Cancelar"
                              onPress={() => handleCancelAccount(account.id)}
                              variant="outlined"
                              size="md"
                              disabled={saving}
                            />
                            <Button
                              title="Aceptar"
                              onPress={() => handleSaveAccount(account.id)}
                              variant="primary"
                              size="md"
                              disabled={saving}
                            />
                          </View>
                        </>
                      ) : (
                        <View style={{ marginTop: 0 }}>
                          {/* Primera línea: Tipo de cuenta (solo transfer) y Titular */}
                          <View style={styles.twoColumnRow}>
                            {selectedMethodType === 'transfer' && (account.additionalData as any)?.accountType && (
                              <View style={styles.columnField}>
                                <ThemedText type="body2" style={{ color: colors.text, marginBottom: 4 }}>
                                  <ThemedText type="body2" style={{ fontWeight: '600', color: colors.text }}>Tipo de cuenta: </ThemedText>
                                  {(account.additionalData as any).accountType === 'ahorros' ? 'Ahorros' : 
                                   (account.additionalData as any).accountType === 'corriente' ? 'Corriente' : 
                                   (account.additionalData as any).accountType}
                                </ThemedText>
                              </View>
                            )}
                            {account.accountHolder && (
                              <View style={styles.columnField}>
                                <ThemedText type="body2" style={{ color: colors.text, marginBottom: 4 }}>
                                  <ThemedText type="body2" style={{ fontWeight: '600', color: colors.text }}>Titular: </ThemedText>
                                  {account.accountHolder}
                                </ThemedText>
                              </View>
                            )}
                          </View>
                          
                          {/* Segunda línea: Número/Link e Identificación (solo transfer) */}
                          <View style={styles.twoColumnRow}>
                            {account.accountNumber && (
                              <View style={styles.columnField}>
                                <ThemedText type="body2" style={{ color: colors.text, marginBottom: 4 }}>
                                  <ThemedText type="body2" style={{ fontWeight: '600', color: colors.text }}>
                                    {selectedMethodType === 'online' ? 'Link de Pago: ' : 'Número: '}
                                  </ThemedText>
                                  {account.accountNumber}
                                </ThemedText>
                              </View>
                            )}
                            {selectedMethodType === 'transfer' && account.identification && (
                              <View style={styles.columnField}>
                                <ThemedText type="body2" style={{ color: colors.text }}>
                                  <ThemedText type="body2" style={{ fontWeight: '600', color: colors.text }}>Identificación: </ThemedText>
                                  {account.identification}
                                </ThemedText>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {/* Instrucciones específicas de esta cuenta */}
                      {(() => {
                        const accountInstructions = (selectedMethod?.instructions || []).filter(
                          inst => inst.paymentAccountId === account.id
                        );
                        
                        if (accountInstructions.length === 0) return null;

                        return (
                          <View style={{ marginTop: 24 }}>
                            <ThemedText type="body2" style={[styles.label, { color: colors.text, marginBottom: 12 }]}>
                              Instrucciones de esta cuenta
                            </ThemedText>
                            <View style={styles.listContainer}>
                              {accountInstructions.map((instruction) => {
                                const isEditing = editingInstructionId === instruction.id;
                                const formData = isEditing ? editingInstructionData[instruction.id] : null;
                                const currentStatus = formData?.status ?? instruction.status;
                                const typeOption = instructionTypeOptions.find(opt => opt.value === instruction.instructionType);
                                
                                return (
                                  <Card
                                    key={instruction.id}
                                    variant="outlined"
                                    style={StyleSheet.flatten([styles.guidelineCard, { marginBottom: 12 }])}
                                  >
                                    {/* Reutilizar el mismo div de edición que las instrucciones generales */}
                                    {isEditing ? (
                                      <>
                                        <View style={styles.guidelineHeader}>
                                          <View style={styles.guidelineTitleRow}>
                                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                              {instructionTypeOptions
                                                .filter(option => {
                                                  if (option.value === 'account_specific') {
                                                    return selectedMethodType === 'transfer' || selectedMethodType === 'online';
                                                  }
                                                  return true;
                                                })
                                                .map((option) => {
                                                  const currentType = formData?.instructionType ?? instruction.instructionType;
                                                  const isAccountSpecific = option.value === 'account_specific';
                                                  return (
                                                    <TouchableOpacity
                                                      key={option.value}
                                                      style={[
                                                        styles.radioOptionHorizontal,
                                                        {
                                                          borderColor: currentType === option.value ? colors.primary : colors.border,
                                                          backgroundColor: currentType === option.value ? colors.primary + '20' : colors.surface,
                                                          flex: 1,
                                                          opacity: isAccountSpecific && currentType !== option.value ? 0.5 : 1,
                                                        },
                                                      ]}
                                                      onPress={() => {
                                                        if (!isAccountSpecific) {
                                                          setEditingInstructionData(prev => {
                                                            const currentFormData = prev[instruction.id] || { instructionType: instruction.instructionType, message: instruction.message, status: instruction.status, paymentAccountId: instruction.paymentAccountId || null };
                                                            if (currentFormData.paymentAccountId) {
                                                              return {
                                                                ...prev,
                                                                [instruction.id]: {
                                                                  ...currentFormData,
                                                                  instructionType: option.value,
                                                                  paymentAccountId: ''
                                                                }
                                                              };
                                                            }
                                                            return {
                                                              ...prev,
                                                              [instruction.id]: { ...currentFormData, instructionType: option.value }
                                                            };
                                                          });
                                                          setEditingPreviousInstructionType(prev => {
                                                            const next = { ...prev };
                                                            delete next[instruction.id];
                                                            return next;
                                                          });
                                                        }
                                                      }}
                                                      disabled={isAccountSpecific}
                                                    >
                                                      <View
                                                        style={[
                                                          styles.radioCircle,
                                                          { 
                                                            borderColor: currentType === option.value 
                                                              ? colors.primary 
                                                              : (isDark ? colors.text : colors.border)
                                                          },
                                                        ]}
                                                      >
                                                        {currentType === option.value && (
                                                          <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                                                        )}
                                                      </View>
                                                      <View style={styles.radioLabelHorizontal}>
                                                        <ThemedText type="body2" style={{ color: colors.text, fontWeight: '600' }}>
                                                          {option.label}
                                                        </ThemedText>
                                                        <ThemedText type="caption" style={{ color: colors.textSecondary }} numberOfLines={2}>
                                                          {option.description}
                                                        </ThemedText>
                                                      </View>
                                                    </TouchableOpacity>
                                                  );
                                                })}
                                              
                                              {/* Botones de estado */}
                                              <View style={styles.statusOptionsContainer}>
                                                <TouchableOpacity
                                                  style={[
                                                    styles.statusOption,
                                                    { borderColor: colors.border },
                                                    currentStatus === RecordStatus.ACTIVE && {
                                                      backgroundColor: '#10b981',
                                                      borderColor: '#10b981',
                                                    },
                                                  ]}
                                                  onPress={() => {
                                                    setEditingInstructionData(prev => ({
                                                      ...prev,
                                                      [instruction.id]: { ...prev[instruction.id] || { instructionType: instruction.instructionType, message: instruction.message, status: instruction.status, paymentAccountId: instruction.paymentAccountId || null }, status: RecordStatus.ACTIVE }
                                                    }));
                                                  }}
                                                  disabled={saving}
                                                >
                                                  <ThemedText
                                                    type="caption"
                                                    style={currentStatus === RecordStatus.ACTIVE ? { color: '#FFFFFF' } : { color: colors.text }}
                                                  >
                                                    {t.security?.users?.active || 'Activo'}
                                                  </ThemedText>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                  style={[
                                                    styles.statusOption,
                                                    { borderColor: colors.border },
                                                    currentStatus === RecordStatus.INACTIVE && {
                                                      backgroundColor: '#ef4444',
                                                      borderColor: '#ef4444',
                                                    },
                                                  ]}
                                                  onPress={() => {
                                                    setEditingInstructionData(prev => ({
                                                      ...prev,
                                                      [instruction.id]: { ...prev[instruction.id] || { instructionType: instruction.instructionType, message: instruction.message, status: instruction.status, paymentAccountId: instruction.paymentAccountId || null }, status: RecordStatus.INACTIVE }
                                                    }));
                                                  }}
                                                  disabled={saving}
                                                >
                                                  <ThemedText
                                                    type="caption"
                                                    style={currentStatus === RecordStatus.INACTIVE ? { color: '#FFFFFF' } : { color: colors.text }}
                                                  >
                                                    {t.security?.users?.inactive || 'Inactivo'}
                                                  </ThemedText>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                  style={[
                                                    styles.statusOption,
                                                    { borderColor: colors.border },
                                                    currentStatus === RecordStatus.PENDING && {
                                                      backgroundColor: '#f59e0b',
                                                      borderColor: '#f59e0b',
                                                    },
                                                  ]}
                                                  onPress={() => {
                                                    setEditingInstructionData(prev => ({
                                                      ...prev,
                                                      [instruction.id]: { ...prev[instruction.id] || { instructionType: instruction.instructionType, message: instruction.message, status: instruction.status, paymentAccountId: instruction.paymentAccountId || null }, status: RecordStatus.PENDING }
                                                    }));
                                                  }}
                                                  disabled={saving}
                                                >
                                                  <ThemedText
                                                    type="caption"
                                                    style={currentStatus === RecordStatus.PENDING ? { color: '#FFFFFF' } : { color: colors.text }}
                                                  >
                                                    {t.security?.users?.pending || 'Pendiente'}
                                                  </ThemedText>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                  style={[
                                                    styles.statusOption,
                                                    { borderColor: colors.border },
                                                    currentStatus === RecordStatus.SUSPENDED && {
                                                      backgroundColor: '#f97316',
                                                      borderColor: '#f97316',
                                                    },
                                                  ]}
                                                  onPress={() => {
                                                    setEditingInstructionData(prev => ({
                                                      ...prev,
                                                      [instruction.id]: { ...prev[instruction.id] || { instructionType: instruction.instructionType, message: instruction.message, status: instruction.status, paymentAccountId: instruction.paymentAccountId || null }, status: RecordStatus.SUSPENDED }
                                                    }));
                                                  }}
                                                  disabled={saving}
                                                >
                                                  <ThemedText
                                                    type="caption"
                                                    style={currentStatus === RecordStatus.SUSPENDED ? { color: '#FFFFFF' } : { color: colors.text }}
                                                  >
                                                    {t.security?.users?.suspended || 'Suspendido'}
                                                  </ThemedText>
                                                </TouchableOpacity>
                                              </View>

                                              {/* Icono de cerrar */}
                                              <TouchableOpacity
                                                style={styles.cancelButton}
                                                onPress={() => handleCancelInstruction(instruction.id)}
                                                disabled={saving}
                                              >
                                                <Ionicons name="close" size={20} color={colors.textSecondary} />
                                              </TouchableOpacity>
                                            </View>
                                          </View>
                                        </View>
                                        {accounts.length > 0 && (
                                          <>
                                            <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16, marginBottom: 0 }]}>
                                              Cuenta asociada
                                            </ThemedText>
                                            <ThemedText type="caption" style={{ color: colors.textSecondary, marginBottom: 0 }}>
                                              Deja vacío para instrucción general, o selecciona una cuenta para instrucción específica
                                            </ThemedText>
                                            <View style={styles.selectContainer}>
                                              <TouchableOpacity
                                                style={[
                                                  styles.selectOption,
                                                  {
                                                    borderColor: (formData?.paymentAccountId || '') === '' ? colors.primary : colors.border,
                                                    backgroundColor: (formData?.paymentAccountId || '') === '' ? colors.primary + '20' : colors.surface,
                                                  },
                                                ]}
                                                onPress={() => {
                                                  const restoredType = editingPreviousInstructionType[instruction.id] || (formData?.instructionType || instruction.instructionType === 'warning' ? 'warning' : 'general');
                                                  setEditingInstructionData(prev => ({
                                                    ...prev,
                                                    [instruction.id]: { 
                                                      ...prev[instruction.id] || { instructionType: instruction.instructionType, message: instruction.message, status: instruction.status, paymentAccountId: instruction.paymentAccountId || null }, 
                                                      paymentAccountId: '',
                                                      instructionType: restoredType
                                                    }
                                                  }));
                                                  setEditingPreviousInstructionType(prev => {
                                                    const next = { ...prev };
                                                    delete next[instruction.id];
                                                    return next;
                                                  });
                                                }}
                                              >
                                                <ThemedText type="body2" style={{ color: colors.text }}>
                                                  {(editingPreviousInstructionType[instruction.id] || formData?.instructionType || instruction.instructionType) === 'warning' ? 'Advertencia General' : 'Instrucción General'}
                                                </ThemedText>
                                                {(formData?.paymentAccountId || '') === '' && (
                                                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                                                )}
                                              </TouchableOpacity>
                                              {accounts.map((acc) => (
                                                <TouchableOpacity
                                                  key={acc.id}
                                                  style={[
                                                    styles.selectOption,
                                                    {
                                                      borderColor: (formData?.paymentAccountId || instruction.paymentAccountId) === acc.id ? colors.primary : colors.border,
                                                      backgroundColor: (formData?.paymentAccountId || instruction.paymentAccountId) === acc.id ? colors.primary + '20' : colors.surface,
                                                    },
                                                  ]}
                                                  onPress={() => {
                                                    const currentFormData = formData || { instructionType: instruction.instructionType, message: instruction.message, status: instruction.status, paymentAccountId: instruction.paymentAccountId || null };
                                                    if (!currentFormData.paymentAccountId && !instruction.paymentAccountId) {
                                                      setEditingPreviousInstructionType(prev => ({
                                                        ...prev,
                                                        [instruction.id]: currentFormData.instructionType
                                                      }));
                                                    }
                                                    setEditingInstructionData(prev => ({
                                                      ...prev,
                                                      [instruction.id]: {
                                                        ...prev[instruction.id] || { instructionType: instruction.instructionType, message: instruction.message, status: instruction.status, paymentAccountId: instruction.paymentAccountId || null },
                                                        paymentAccountId: acc.id,
                                                        instructionType: 'account_specific'
                                                      }
                                                    }));
                                                  }}
                                                >
                                                  <ThemedText type="body2" style={{ color: colors.text }}>
                                                    {acc.name}
                                                  </ThemedText>
                                                  {(formData?.paymentAccountId || instruction.paymentAccountId) === acc.id && (
                                                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                                                  )}
                                                </TouchableOpacity>
                                              ))}
                                            </View>
                                          </>
                                        )}
                                        <InputWithFocus
                                          containerStyle={[styles.textAreaContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                          primaryColor={colors.primary}
                                        >
                                          <TextInput
                                            style={[styles.textArea, { color: colors.text }]}
                                            placeholder="Describe el mensaje de instrucción..."
                                            placeholderTextColor={colors.textSecondary}
                                            value={formData?.message || ''}
                                            onChangeText={(text) => setEditingInstructionData(prev => ({
                                              ...prev,
                                              [instruction.id]: { ...prev[instruction.id] || { instructionType: instruction.instructionType, message: instruction.message, status: instruction.status, paymentAccountId: instruction.paymentAccountId || null }, message: text }
                                            }))}
                                            multiline
                                            numberOfLines={6}
                                            textAlignVertical="top"
                                            editable={!saving}
                                          />
                                        </InputWithFocus>
                                        <View style={styles.formActions}>
                                          <View style={{ flex: 1 }} />
                                          <Button
                                            title="Cancelar"
                                            onPress={() => handleCancelInstruction(instruction.id)}
                                            variant="outlined"
                                            size="md"
                                            disabled={saving}
                                          />
                                          <Button
                                            title="Aceptar"
                                            onPress={() => handleSaveInstruction(instruction.id)}
                                            variant="primary"
                                            size="md"
                                            disabled={saving}
                                          />
                                        </View>
                                      </>
                                    ) : (
                                      <View style={[styles.badgeActionsContainer, { alignItems: 'center', gap: 12 }]}>
                                        <ThemedText 
                                          type="body2" 
                                          style={{ color: colors.text, flex: 1 }}
                                          numberOfLines={1}
                                          ellipsizeMode="tail"
                                        >
                                          {instruction.message}
                                        </ThemedText>
                                        <StatusBadge
                                          status={typeof instruction.status === 'number' ? instruction.status : RecordStatus.ACTIVE}
                                          statusDescription={
                                            (typeof instruction.statusDescription === 'string' && instruction.statusDescription.trim() !== '')
                                              ? instruction.statusDescription 
                                              : (instruction.status === RecordStatus.ACTIVE ? 'Activo' : 
                                                 instruction.status === RecordStatus.INACTIVE ? 'Inactivo' : 
                                                 instruction.status === RecordStatus.PENDING ? 'Pendiente' : 
                                                 instruction.status === RecordStatus.SUSPENDED ? 'Suspendido' : 
                                                 instruction.status === RecordStatus.DELETED ? 'Eliminado' : 'Activo')
                                          }
                                          size="small"
                                        />
                                        <Tooltip text="Editar" position="top">
                                          <TouchableOpacity
                                            onPress={() => handleInstructionTitleClick(instruction)}
                                            style={styles.actionIconButton}
                                          >
                                            <Ionicons name="pencil" size={18} color={actionIconColor} />
                                          </TouchableOpacity>
                                        </Tooltip>
                                        <Tooltip text="Eliminar" position="top">
                                          <TouchableOpacity
                                            onPress={() => handleDeleteInstruction(instruction.id)}
                                            style={styles.actionIconButton}
                                            disabled={saving}
                                          >
                                            <Ionicons name="trash-outline" size={18} color={actionIconColor} />
                                          </TouchableOpacity>
                                        </Tooltip>
                                      </View>
                                    )}
                                  </Card>
                                );
                              })}
                            </View>
                          </View>
                        );
                      })()}
                    </Card>
                  );
                })}
              </View>
            )}
          </Card>
        )}

        {/* Sección: Instrucciones de Pago - Para todos los métodos */}
        {selectedMethodType && (
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
            {displayedInstructions.length > 0 && (
              <View style={styles.listContainer}>
                {displayedInstructions.map((instruction) => {
                  const isEditing = editingInstructionId === instruction.id;
                  const formData = isEditing ? editingInstructionData[instruction.id] : null;
                  const currentStatus = formData?.status ?? instruction.status;
                  const typeOption = instructionTypeOptions.find(opt => opt.value === instruction.instructionType);
                  
                  return (
                    <Card
                      key={instruction.id}
                      variant="outlined"
                      style={styles.guidelineCard}
                    >
                      <View style={styles.guidelineHeader}>
                        <View style={styles.guidelineTitleRow}>
                          {isEditing ? (
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              {/* Selector de tipo de instrucción */}
                              {instructionTypeOptions
                                .filter(option => {
                                  // "Por Cuenta" solo disponible para transfer y online
                                  if (option.value === 'account_specific') {
                                    return selectedMethodType === 'transfer' || selectedMethodType === 'online';
                                  }
                                  return true;
                                })
                                .map((option) => {
                                  const currentType = formData?.instructionType ?? instruction.instructionType;
                                  const isAccountSpecific = option.value === 'account_specific';
                                  return (
                                    <TouchableOpacity
                                      key={option.value}
                                      style={[
                                        styles.radioOptionHorizontal,
                                        {
                                          borderColor: currentType === option.value ? colors.primary : colors.border,
                                          backgroundColor: currentType === option.value ? colors.primary + '20' : colors.surface,
                                          flex: 1,
                                          opacity: isAccountSpecific && currentType !== option.value ? 0.5 : 1, // Hacer más transparente cuando no está seleccionada
                                        },
                                      ]}
                                      onPress={() => {
                                        // "Por Cuenta" no puede ser seleccionada directamente por el usuario
                                        // Solo se selecciona automáticamente al elegir una cuenta
                                        if (!isAccountSpecific) {
                                          setEditingInstructionData(prev => {
                                            const currentFormData = prev[instruction.id] || { instructionType: instruction.instructionType, message: instruction.message, status: instruction.status, paymentAccountId: instruction.paymentAccountId || null };
                                            // Si se cambia a General o Advertencia y hay una cuenta seleccionada, limpiar la cuenta
                                            if (currentFormData.paymentAccountId) {
                                              return {
                                                ...prev,
                                                [instruction.id]: {
                                                  ...currentFormData,
                                                  instructionType: option.value,
                                                  paymentAccountId: ''
                                                }
                                              };
                                            }
                                            return {
                                              ...prev,
                                              [instruction.id]: { ...currentFormData, instructionType: option.value }
                                            };
                                          });
                                          // Limpiar el tipo guardado si se cambia el tipo
                                          setEditingPreviousInstructionType(prev => {
                                            const next = { ...prev };
                                            delete next[instruction.id];
                                            return next;
                                          });
                                        }
                                      }}
                                      disabled={isAccountSpecific} // "Por Cuenta" siempre está deshabilitada para clicks directos
                                    >
                                      <View
                                        style={[
                                          styles.radioCircle,
                                          { 
                                            borderColor: currentType === option.value 
                                              ? colors.primary 
                                              : (isDark ? colors.text : colors.border)
                                          },
                                        ]}
                                      >
                                        {currentType === option.value && (
                                          <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                                        )}
                                      </View>
                                      <View style={styles.radioLabelHorizontal}>
                                        <ThemedText type="body2" style={{ color: colors.text, fontWeight: '600' }}>
                                          {option.label}
                                        </ThemedText>
                                        <ThemedText type="caption" style={{ color: colors.textSecondary }} numberOfLines={2}>
                                          {option.description}
                                        </ThemedText>
                                      </View>
                                    </TouchableOpacity>
                                  );
                                })}
                              
                              {/* Botones de estado */}
                              <View style={styles.statusOptionsContainer}>
                                {/* Activo */}
                                <TouchableOpacity
                                  style={[
                                    styles.statusOption,
                                    { borderColor: colors.border },
                                    currentStatus === RecordStatus.ACTIVE && {
                                      backgroundColor: '#10b981',
                                      borderColor: '#10b981',
                                    },
                                  ]}
                                  onPress={() => {
                                    setEditingInstructionData(prev => ({
                                      ...prev,
                                      [instruction.id]: { ...prev[instruction.id] || { instructionType: instruction.instructionType, message: instruction.message, status: instruction.status, paymentAccountId: instruction.paymentAccountId || null }, status: RecordStatus.ACTIVE }
                                    }));
                                  }}
                                  disabled={saving}
                                >
                                  <ThemedText
                                    type="caption"
                                    style={currentStatus === RecordStatus.ACTIVE ? { color: '#FFFFFF' } : { color: colors.text }}
                                  >
                                    {t.security?.users?.active || 'Activo'}
                                  </ThemedText>
                                </TouchableOpacity>

                                {/* Inactivo */}
                                <TouchableOpacity
                                  style={[
                                    styles.statusOption,
                                    { borderColor: colors.border },
                                    currentStatus === RecordStatus.INACTIVE && {
                                      backgroundColor: '#ef4444',
                                      borderColor: '#ef4444',
                                    },
                                  ]}
                                  onPress={() => {
                                    setEditingInstructionData(prev => ({
                                      ...prev,
                                      [instruction.id]: { ...prev[instruction.id] || { instructionType: instruction.instructionType, message: instruction.message, status: instruction.status, paymentAccountId: instruction.paymentAccountId || null }, status: RecordStatus.INACTIVE }
                                    }));
                                  }}
                                  disabled={saving}
                                >
                                  <ThemedText
                                    type="caption"
                                    style={currentStatus === RecordStatus.INACTIVE ? { color: '#FFFFFF' } : { color: colors.text }}
                                  >
                                    {t.security?.users?.inactive || 'Inactivo'}
                                  </ThemedText>
                                </TouchableOpacity>

                                {/* Pendiente */}
                                <TouchableOpacity
                                  style={[
                                    styles.statusOption,
                                    { borderColor: colors.border },
                                    currentStatus === RecordStatus.PENDING && {
                                      backgroundColor: '#f59e0b',
                                      borderColor: '#f59e0b',
                                    },
                                  ]}
                                  onPress={() => {
                                    setEditingInstructionData(prev => ({
                                      ...prev,
                                      [instruction.id]: { ...prev[instruction.id] || { instructionType: instruction.instructionType, message: instruction.message, status: instruction.status, paymentAccountId: instruction.paymentAccountId || null }, status: RecordStatus.PENDING }
                                    }));
                                  }}
                                  disabled={saving}
                                >
                                  <ThemedText
                                    type="caption"
                                    style={currentStatus === RecordStatus.PENDING ? { color: '#FFFFFF' } : { color: colors.text }}
                                  >
                                    {t.security?.users?.pending || 'Pendiente'}
                                  </ThemedText>
                                </TouchableOpacity>

                                {/* Suspendido */}
                                <TouchableOpacity
                                  style={[
                                    styles.statusOption,
                                    { borderColor: colors.border },
                                    currentStatus === RecordStatus.SUSPENDED && {
                                      backgroundColor: '#f97316',
                                      borderColor: '#f97316',
                                    },
                                  ]}
                                  onPress={() => {
                                    setEditingInstructionData(prev => ({
                                      ...prev,
                                      [instruction.id]: { ...prev[instruction.id] || { instructionType: instruction.instructionType, message: instruction.message, status: instruction.status, paymentAccountId: instruction.paymentAccountId || null }, status: RecordStatus.SUSPENDED }
                                    }));
                                  }}
                                  disabled={saving}
                                >
                                  <ThemedText
                                    type="caption"
                                    style={currentStatus === RecordStatus.SUSPENDED ? { color: '#FFFFFF' } : { color: colors.text }}
                                  >
                                    {t.security?.users?.suspended || 'Suspendido'}
                                  </ThemedText>
                                </TouchableOpacity>
                              </View>

                              {/* Icono de cerrar */}
                              <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => handleCancelInstruction(instruction.id)}
                                disabled={saving}
                              >
                                <Ionicons name="close" size={20} color={colors.textSecondary} />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={{ flex: 1 }}
                              onPress={() => handleInstructionTitleClick(instruction)}
                              activeOpacity={0.7}
                            >
                              <ThemedText type="h4" style={{ fontWeight: '700', flex: 1 }}>
                                {typeOption?.label || instruction.instructionType}
                                {instruction.paymentAccountId && (
                                  <ThemedText type="caption" style={{ color: colors.textSecondary, marginLeft: 8 }}>
                                    {' '}(Específica)
                                  </ThemedText>
                                )}
                              </ThemedText>
                            </TouchableOpacity>
                          )}
                          <View style={styles.badgeActionsContainer}>
                            {!isEditing && (
                              <>
                                <StatusBadge
                                  status={typeof instruction.status === 'number' ? instruction.status : RecordStatus.ACTIVE}
                                  statusDescription={
                                    (typeof instruction.statusDescription === 'string' && instruction.statusDescription.trim() !== '')
                                      ? instruction.statusDescription 
                                      : (instruction.status === RecordStatus.ACTIVE ? 'Activo' : 
                                         instruction.status === RecordStatus.INACTIVE ? 'Inactivo' : 
                                         instruction.status === RecordStatus.PENDING ? 'Pendiente' : 
                                         instruction.status === RecordStatus.SUSPENDED ? 'Suspendido' : 
                                         instruction.status === RecordStatus.DELETED ? 'Eliminado' : 'Activo')
                                  }
                                  size="small"
                                />
                                <View style={styles.actionIconsContainer}>
                                  <Tooltip text="Editar" position="top">
                                    <TouchableOpacity
                                      style={styles.actionIconButton}
                                      onPress={() => handleInstructionTitleClick(instruction)}
                                      disabled={saving}
                                    >
                                      <Ionicons name="pencil" size={18} color={actionIconColor} />
                                    </TouchableOpacity>
                                  </Tooltip>
                                  <Tooltip text="Eliminar" position="top">
                                    <TouchableOpacity
                                      style={styles.actionIconButton}
                                      onPress={() => handleDeleteInstruction(instruction.id)}
                                      disabled={saving}
                                    >
                                      <Ionicons name="trash" size={18} color={actionIconColor} />
                                    </TouchableOpacity>
                                  </Tooltip>
                                </View>
                              </>
                            )}
                          </View>
                        </View>
                      </View>

                      {isEditing && accounts.length > 0 && (
                        <>
                          <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16, marginBottom: 0 }]}>
                            Cuenta asociada
                          </ThemedText>
                          <ThemedText type="caption" style={{ color: colors.textSecondary, marginBottom: 0 }}>
                            Deja vacío para instrucción general, o selecciona una cuenta para instrucción específica
                          </ThemedText>
                          <View style={styles.selectContainer}>
                            <TouchableOpacity
                              style={[
                                styles.selectOption,
                                {
                                  borderColor: (formData?.paymentAccountId || '') === '' ? colors.primary : colors.border,
                                  backgroundColor: (formData?.paymentAccountId || '') === '' ? colors.primary + '20' : colors.surface,
                                },
                              ]}
                              onPress={() => {
                                // Restaurar el tipo de instrucción anterior cuando se selecciona la opción 0
                                const restoredType = editingPreviousInstructionType[instruction.id] || (formData?.instructionType || instruction.instructionType === 'warning' ? 'warning' : 'general');
                                setEditingInstructionData(prev => ({
                                  ...prev,
                                  [instruction.id]: { 
                                    ...prev[instruction.id] || { instructionType: instruction.instructionType, message: instruction.message, status: instruction.status, paymentAccountId: instruction.paymentAccountId || null }, 
                                    paymentAccountId: '',
                                    instructionType: restoredType
                                  }
                                }));
                                setEditingPreviousInstructionType(prev => {
                                  const next = { ...prev };
                                  delete next[instruction.id];
                                  return next;
                                });
                              }}
                            >
                              <ThemedText type="body2" style={{ color: colors.text }}>
                                {(editingPreviousInstructionType[instruction.id] || formData?.instructionType || instruction.instructionType) === 'warning' ? 'Advertencia General' : 'Instrucción General'}
                              </ThemedText>
                              {(formData?.paymentAccountId || '') === '' && (
                                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                              )}
                            </TouchableOpacity>
                            {accounts.map((account) => (
                              <TouchableOpacity
                                key={account.id}
                                style={[
                                  styles.selectOption,
                                  {
                                    borderColor: (formData?.paymentAccountId || instruction.paymentAccountId) === account.id ? colors.primary : colors.border,
                                    backgroundColor: (formData?.paymentAccountId || instruction.paymentAccountId) === account.id ? colors.primary + '20' : colors.surface,
                                  },
                                ]}
                                onPress={() => {
                                  // Si se selecciona una cuenta específica, guardar el tipo actual y cambiar automáticamente el tipo a 'account_specific'
                                  const currentFormData = formData || { instructionType: instruction.instructionType, message: instruction.message, status: instruction.status, paymentAccountId: instruction.paymentAccountId || null };
                                  // Guardar el tipo anterior solo si no hay cuenta seleccionada previamente
                                  if (!currentFormData.paymentAccountId && !instruction.paymentAccountId) {
                                    setEditingPreviousInstructionType(prev => ({
                                      ...prev,
                                      [instruction.id]: currentFormData.instructionType
                                    }));
                                  }
                                  setEditingInstructionData(prev => ({
                                    ...prev,
                                    [instruction.id]: {
                                      ...prev[instruction.id] || { instructionType: instruction.instructionType, message: instruction.message, status: instruction.status, paymentAccountId: instruction.paymentAccountId || null },
                                      paymentAccountId: account.id,
                                      instructionType: 'account_specific'
                                    }
                                  }));
                                }}
                              >
                                <ThemedText type="body2" style={{ color: colors.text }}>
                                  {account.name}
                                </ThemedText>
                                {(formData?.paymentAccountId || instruction.paymentAccountId) === account.id && (
                                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                                )}
                              </TouchableOpacity>
                            ))}
                          </View>
                        </>
                      )}

                      {isEditing ? (
                        <>
                          <InputWithFocus
                            containerStyle={[styles.textAreaContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            primaryColor={colors.primary}
                          >
                            <TextInput
                              style={[styles.textArea, { color: colors.text }]}
                              placeholder="Describe el mensaje de instrucción..."
                              placeholderTextColor={colors.textSecondary}
                              value={formData?.message || ''}
                              onChangeText={(text) => setEditingInstructionData(prev => ({
                                ...prev,
                                [instruction.id]: { ...prev[instruction.id] || { instructionType: instruction.instructionType, message: instruction.message, status: instruction.status, paymentAccountId: instruction.paymentAccountId || null }, message: text }
                              }))}
                              multiline
                              numberOfLines={6}
                              textAlignVertical="top"
                              editable={!saving}
                            />
                          </InputWithFocus>
                          <View style={styles.formActions}>
                            <View style={{ flex: 1 }} />
                            <Button
                              title="Cancelar"
                              onPress={() => handleCancelInstruction(instruction.id)}
                              variant="outlined"
                              size="md"
                              disabled={saving}
                            />
                            <Button
                              title="Aceptar"
                              onPress={() => handleSaveInstruction(instruction.id)}
                              variant="primary"
                              size="md"
                              disabled={saving}
                            />
                          </View>
                        </>
                      ) : (
                        <ThemedText type="body2" style={{ color: colors.text, marginTop: 12 }}>
                          {instruction.message}
                        </ThemedText>
                      )}
                    </Card>
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
                <View style={styles.radioGroupContainer}>
                  <View style={styles.radioGroupRow}>
                    {instructionTypeOptions
                      .filter(option => {
                        // "Por Cuenta" solo disponible para transfer y online
                        if (option.value === 'account_specific') {
                          return selectedMethodType === 'transfer' || selectedMethodType === 'online';
                        }
                        return true;
                      })
                      .map((option) => {
                        const isAccountSpecific = option.value === 'account_specific';
                        const isSelected = instructionForm.instructionType === option.value;
                        return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.radioOptionHorizontal,
                          {
                            borderColor: isSelected ? colors.primary : colors.border,
                            backgroundColor: isSelected ? colors.primary + '20' : colors.surface,
                            flex: 1,
                            opacity: isAccountSpecific && !isSelected ? 0.5 : 1, // Hacer más transparente cuando no está seleccionada
                          },
                        ]}
                        onPress={() => {
                          // "Por Cuenta" no puede ser seleccionada directamente por el usuario
                          // Solo se selecciona automáticamente al elegir una cuenta
                          if (!isAccountSpecific) {
                            setInstructionForm(prev => ({ ...prev, instructionType: option.value }));
                          }
                        }}
                        disabled={isAccountSpecific} // "Por Cuenta" siempre está deshabilitada para clicks directos
                      >
                        <View
                          style={[
                            styles.radioCircle,
                            { 
                              borderColor: instructionForm.instructionType === option.value 
                                ? colors.primary 
                                : (isDark ? colors.text : colors.border)
                            },
                          ]}
                        >
                          {instructionForm.instructionType === option.value && (
                            <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                          )}
                        </View>
                        <View style={styles.radioLabelHorizontal}>
                          <ThemedText type="body2" style={{ color: colors.text, fontWeight: '600' }}>
                            {option.label}
                          </ThemedText>
                          <ThemedText type="caption" style={{ color: colors.textSecondary }} numberOfLines={2}>
                            {option.description}
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                        );
                      })}
                  </View>
                </View>

                {accounts.length > 0 && (
                  <>
                    <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16, marginBottom: 0 }]}>
                      Cuenta asociada
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: colors.textSecondary, marginBottom: 0 }}>
                      Deja vacío para instrucción general, o selecciona una cuenta para instrucción específica
                    </ThemedText>
                    <View style={styles.selectContainer}>
                      <TouchableOpacity
                        style={[
                          styles.selectOption,
                          {
                            borderColor: !instructionForm.paymentAccountId ? colors.primary : colors.border,
                            backgroundColor: !instructionForm.paymentAccountId ? colors.primary + '20' : colors.surface,
                          },
                        ]}
                        onPress={() => {
                          // Restaurar el tipo de instrucción anterior cuando se selecciona la opción 0
                          setInstructionForm(prev => {
                            const restoredType = previousInstructionType || (prev.instructionType === 'warning' ? 'warning' : 'general');
                            return { 
                              ...prev, 
                              paymentAccountId: '',
                              instructionType: restoredType
                            };
                          });
                          setPreviousInstructionType(null); // Limpiar el tipo guardado
                        }}
                      >
                        <ThemedText type="body2" style={{ color: colors.text }}>
                          {(previousInstructionType || instructionForm.instructionType) === 'warning' ? 'Advertencia General' : 'Instrucción General'}
                        </ThemedText>
                        {!instructionForm.paymentAccountId && (
                          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        )}
                      </TouchableOpacity>
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
                          onPress={() => {
                          // Si se selecciona una cuenta específica (no "Instrucción General"),
                          // guardar el tipo actual y cambiar automáticamente el tipo a 'account_specific'
                          setInstructionForm(prev => {
                            // Guardar el tipo anterior solo si no es 'account_specific'
                            if (prev.instructionType !== 'account_specific') {
                              setPreviousInstructionType(prev.instructionType);
                            }
                            return {
                              ...prev,
                              paymentAccountId: account.id,
                              instructionType: 'account_specific'
                            };
                          });
                        }}
                        >
                          <ThemedText type="body2" style={{ color: colors.text }}>
                            {account.name}
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
                  Instrucción *
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
                      setPreviousInstructionType(null); // Limpiar el tipo guardado
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
            {/* Formulario de nueva cuenta */}
            {showAccountForm ? (
              <Card variant="outlined" style={styles.formCard}>
                {/* Primera fila: Nombre y Proveedor */}
                <View style={styles.twoColumnRow}>
                  <View style={styles.columnField}>
                    <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                      Nombre de la cuenta *
                    </ThemedText>
                    <InputWithFocus
                      containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      primaryColor={colors.primary}
                    >
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Ej: Cuenta Principal"
                        placeholderTextColor={colors.textSecondary}
                        value={accountForm.name}
                        onChangeText={(val) => setAccountForm(prev => ({ ...prev, name: val }))}
                      />
                    </InputWithFocus>
                  </View>
                  <View style={styles.columnField}>
                    <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                      Proveedor/Banco *
                    </ThemedText>
                    <InputWithFocus
                      containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      primaryColor={colors.primary}
                    >
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Ej: Banco Pichincha"
                        placeholderTextColor={colors.textSecondary}
                        value={accountForm.provider}
                        onChangeText={(val) => setAccountForm(prev => ({ ...prev, provider: val }))}
                      />
                    </InputWithFocus>
                  </View>
                </View>

                {/* Segunda fila: Tipo de cuenta (solo transfer) y Número de cuenta / Link de Pago */}
                <View style={styles.twoColumnRow}>
                  {selectedMethodType === 'transfer' && (
                    <View style={styles.columnField}>
                      <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                        Tipo de cuenta
                      </ThemedText>
                      <View style={styles.accountTypeSelector}>
                        {accountTypeOptions.map((option, index) => {
                          // La opción 0 siempre debe estar seleccionada si no hay valor
                          const isOption0 = index === 0;
                          const currentType = accountForm.accountType || '';
                          // Si no hay tipo seleccionado, la opción 0 debe estar seleccionada
                          const shouldBeSelected = !currentType && isOption0;
                          const isSelected = currentType === option.value || shouldBeSelected;
                          
                          return (
                            <TouchableOpacity
                              key={option.value}
                              style={[
                                styles.accountTypeOption,
                                {
                                  borderColor: shouldBeSelected ? colors.primary : (isSelected ? colors.primary : colors.border),
                                  backgroundColor: isSelected ? colors.primary + '20' : colors.surface,
                                },
                              ]}
                              onPress={() => {
                                // Si se intenta deseleccionar la opción 0 cuando está preseleccionada, mantenerla seleccionada
                                if (shouldBeSelected && currentType === '') {
                                  // Ya está preseleccionada, confirmar la selección
                                  setAccountForm(prev => ({ ...prev, accountType: option.value }));
                                } else if (isOption0 && currentType === option.value) {
                                  // No permitir deseleccionar la opción 0
                                  return;
                                } else {
                                  // Toggle normal: si está seleccionada, deseleccionar; si no, seleccionar
                                  setAccountForm(prev => ({ ...prev, accountType: prev.accountType === option.value ? accountTypeOptions[0].value : option.value }));
                                }
                              }}
                            >
                              <View
                                style={[
                                  styles.radioCircle,
                                  { 
                                    borderColor: isSelected 
                                      ? colors.primary 
                                      : (isDark ? colors.text : colors.border)
                                  },
                                ]}
                              >
                                {isSelected && (
                                  <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                                )}
                              </View>
                              <ThemedText type="body2" style={{ color: colors.text, marginLeft: 8 }}>
                                {option.label}
                              </ThemedText>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                  <View style={styles.columnField}>
                    <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                      {selectedMethodType === 'online' ? 'Link de Pago *' : 'Número de cuenta *'}
                    </ThemedText>
                    <InputWithFocus
                      containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      primaryColor={colors.primary}
                    >
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder={selectedMethodType === 'online' ? 'https://ejemplo.com/pago' : 'Número de cuenta'}
                        placeholderTextColor={colors.textSecondary}
                        value={accountForm.accountNumber}
                        keyboardType={selectedMethodType === 'online' ? 'url' : 'numeric'}
                        autoCapitalize={selectedMethodType === 'online' ? 'none' : 'sentences'}
                        onChangeText={(val) => {
                          if (selectedMethodType === 'online') {
                            // Para online, agregar https:// automáticamente si no empieza con http:// o https://
                            let urlText = val.trim();
                            if (urlText && !urlText.startsWith('http://') && !urlText.startsWith('https://')) {
                              urlText = 'https://' + urlText;
                            }
                            setAccountForm(prev => ({ ...prev, accountNumber: urlText }));
                          } else {
                            // Solo permitir números para transfer
                            const numericVal = val.replace(/\D/g, '');
                            setAccountForm(prev => ({ ...prev, accountNumber: numericVal }));
                          }
                        }}
                      />
                    </InputWithFocus>
                  </View>
                </View>

                {/* Tercera fila: Identificación (solo transfer) y Titular */}
                {selectedMethodType === 'transfer' && (
                  <View style={styles.twoColumnRow}>
                    <View style={styles.columnField}>
                      <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                        Identificación *
                      </ThemedText>
                      <InputWithFocus
                        containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        primaryColor={colors.primary}
                      >
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          placeholder="Identificación del titular"
                          placeholderTextColor={colors.textSecondary}
                          value={accountForm.identification}
                          onChangeText={(val) => setAccountForm(prev => ({ ...prev, identification: val }))}
                        />
                      </InputWithFocus>
                    </View>
                    <View style={styles.columnField}>
                      <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                        Titular de la cuenta *
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
                    </View>
                  </View>
                )}
                {selectedMethodType === 'online' && (
                  <View style={styles.twoColumnRow}>
                    <View style={styles.columnField}>
                      <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                        Titular de la cuenta *
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
                    </View>
                  </View>
                )}

                <View style={styles.formActions}>
                  <Button
                    title="Cancelar"
                    onPress={() => {
                      setShowAccountForm(false);
                      setAccountForm({
                        name: '',
                        provider: '',
                        accountType: '',
                        accountNumber: '',
                        accountHolder: '',
                        identification: '',
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

        {!selectedMethodType && paymentMethods.length > 0 && (
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
            {paymentMethods.length > 0 ? (
              <Ionicons 
                name="arrow-forward-outline" 
                size={20} 
                color="#FFFFFF" 
                style={{ marginRight: 8 }} 
              />
            ) : (
              <DynamicIcon 
                name="MaterialCommunityIcons.skip-forward-outline" 
                size={20} 
                color="#FFFFFF" 
                style={{ marginRight: 8 }} 
              />
            )}
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
              <DynamicIcon name="MaterialCommunityIcons.skip-forward-outline" size={20} color={colors.text} style={{ marginRight: 8 }} />
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
  formContainer: {
    gap: 20,
  },
  sectionCard: {
    padding: 20,
    paddingLeft: 0,
    paddingRight: 0,
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
  activeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    top: 8,
    right: 8,
  },
  optionCardHeader: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
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
  guidelineCard: {
    padding: 16,
    gap: 12,
  },
  guidelineHeader: {
    marginBottom: 8,
  },
  guidelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
  },
  titleInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    padding: 0,
  },
  badgeActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconButton: {
    padding: 4,
    borderRadius: 4,
  },
  cancelButton: {
    padding: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusOptionsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
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
    position: 'relative',
  },
  radioGroup: {
    gap: 12,
    marginTop: 8,
  },
  radioGroupContainer: {
    marginTop: 8,
  },
  radioGroupHorizontal: {
    width: '100%',
  },
  radioGroupRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  radioOptionHorizontal: {
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
  radioLabelHorizontal: {
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
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  columnField: {
    flex: 1,
  },
  accountTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 0,
  },
  accountTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
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
