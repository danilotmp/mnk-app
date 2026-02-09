/**
 * Componente para Capa 0: Configuración de Empresa y Sucursal
 * Crea empresa, sucursal y asigna roles/permisos por defecto
 * Se muestra cuando el usuario no tiene empresa o tiene empresa de invitado
 */

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { InputWithFocus } from "@/components/ui/input-with-focus";
import { useTheme } from "@/hooks/use-theme";
import { useCompany } from "@/src/domains/shared";
import { EmailInput, PhoneInput } from "@/src/domains/shared/components";
import { BranchesService } from "@/src/features/security/branches";
import { CompaniesService } from "@/src/features/security/companies";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

interface CompanySetupLayerProps {
  onComplete?: () => void;
}

export function CompanySetupLayer({ onComplete }: CompanySetupLayerProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const L = t.wizard?.layers?.companySetup;
  const alert = useAlert();
  const router = useRouter();
  const { user, setUserContext } = useCompany();

  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"company" | "branch">("company");
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<{
    message: string;
    detail?: string;
  } | null>(null);

  // Datos de empresa
  const [companyData, setCompanyData] = useState({
    code: "",
    name: "",
    email: "",
    phone: "", // WhatsApp
    description: "",
  });

  // Datos de sucursal
  const [branchData, setBranchData] = useState({
    code: "",
    name: "",
    type: "headquarters" as "headquarters" | "branch" | "warehouse" | "store",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
    },
    contactInfo: {
      phone: "",
      email: "",
    },
  });

  const handleCreateCompany = async () => {
    if (
      !companyData.code.trim() ||
      !companyData.name.trim() ||
      !companyData.email.trim()
    ) {
      setGeneralError({ message: L?.codeNameEmailRequired ?? "" });
      return;
    }

    if (!companyData.phone.trim()) {
      setGeneralError({
        message: L?.whatsappRequired ?? "",
      });
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

      alert.showSuccess(L?.companyCreated ?? "");

      // Guardar ID de empresa creada
      setCreatedCompanyId(company.id);

      // Avanzar a crear sucursal
      setStep("branch");
    } catch (error: any) {
      const errorMessage = (error?.message || L?.errorCreatingCompany) ?? "";
      const errorDetail =
        typeof error?.details === "object"
          ? JSON.stringify(error.details)
          : error?.details || error?.result?.description;

      setGeneralError({ message: errorMessage, detail: errorDetail });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!branchData.code.trim() || !branchData.name.trim()) {
      setGeneralError({
        message: L?.branchCodeNameRequired ?? "",
      });
      return;
    }

    // Necesitamos el ID de la empresa creada
    // Por ahora, lo obtenemos del contexto después de crear la empresa
    // En producción, esto se manejaría mejor con estado compartido

    if (!createdCompanyId) {
      setGeneralError({
        message: L?.companyNotFound ?? "",
      });
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

      alert.showSuccess(L?.companyAndBranchReady ?? "");

      // Recargar contexto del usuario para obtener la nueva empresa y sucursal
      if (user && setUserContext) {
        await setUserContext(user);
      }

      // Completar Capa 0
      onComplete?.();
    } catch (error: any) {
      const errorMessage = (error?.message || L?.errorCreatingBranch) ?? "";
      const errorDetail =
        typeof error?.details === "object"
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
        {step === "company" ? (
          <>
            <View style={styles.header}>
              <Ionicons
                name="business-outline"
                size={32}
                color={colors.primary}
              />
              <ThemedText type="h3" style={styles.title}>
                {L?.stepCompany ?? ""}
              </ThemedText>
              <ThemedText
                type="body2"
                style={[styles.subtitle, { color: colors.textSecondary }]}
              >
                {L?.subtitleCompany ?? ""}
              </ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText
                type="body2"
                style={[styles.label, { color: colors.text }]}
              >
                {L?.companyCodeLabel ?? ""}
              </ThemedText>
              <InputWithFocus
                containerStyle={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border,
                  },
                ]}
                primaryColor={colors.primary}
              >
                <Ionicons
                  name="pricetag-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={L?.codePlaceholder ?? ""}
                  placeholderTextColor={colors.textSecondary}
                  value={companyData.code}
                  onChangeText={(val) =>
                    setCompanyData((prev) => ({ ...prev, code: val }))
                  }
                  autoCapitalize="characters"
                />
              </InputWithFocus>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText
                type="body2"
                style={[styles.label, { color: colors.text }]}
              >
                {L?.companyNameLabel ?? ""}
              </ThemedText>
              <InputWithFocus
                containerStyle={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border,
                  },
                ]}
                primaryColor={colors.primary}
              >
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={L?.companyNamePlaceholder ?? ""}
                  placeholderTextColor={colors.textSecondary}
                  value={companyData.name}
                  onChangeText={(val) =>
                    setCompanyData((prev) => ({ ...prev, name: val }))
                  }
                />
              </InputWithFocus>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText
                type="body2"
                style={[styles.label, { color: colors.text }]}
              >
                {L?.emailLabel ?? ""}
              </ThemedText>
              <EmailInput
                value={companyData.email}
                onChangeText={(val) =>
                  setCompanyData((prev) => ({ ...prev, email: val }))
                }
                placeholder={L?.emailPlaceholder ?? ""}
                required
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText
                type="body2"
                style={[styles.label, { color: colors.text }]}
              >
                {L?.whatsappLabel ?? ""}
              </ThemedText>
              <PhoneInput
                value={companyData.phone}
                onChangeText={(val) =>
                  setCompanyData((prev) => ({ ...prev, phone: val }))
                }
                placeholder={L?.phonePlaceholder ?? ""}
                required
              />
              <ThemedText
                type="caption"
                style={{ color: colors.textSecondary, marginTop: 4 }}
              >
                {L?.whatsappCaption ?? ""}
              </ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText
                type="body2"
                style={[styles.label, { color: colors.text }]}
              >
                {L?.descriptionLabel ?? ""}
              </ThemedText>
              <InputWithFocus
                containerStyle={[
                  styles.textAreaContainer,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border,
                  },
                ]}
                primaryColor={colors.primary}
              >
                <TextInput
                  style={[styles.textArea, { color: colors.text }]}
                  placeholder={L?.descriptionPlaceholder ?? ""}
                  placeholderTextColor={colors.textSecondary}
                  value={companyData.description}
                  onChangeText={(val) =>
                    setCompanyData((prev) => ({ ...prev, description: val }))
                  }
                  multiline
                  numberOfLines={3}
                />
              </InputWithFocus>
            </View>

            <Button
              title={
                saving
                  ? (L?.creating ?? "")
                  : (L?.createCompanyAndContinue ?? "")
              }
              onPress={handleCreateCompany}
              variant="primary"
              size="lg"
              disabled={saving}
              style={styles.saveButton}
            >
              {saving && (
                <ActivityIndicator
                  size="small"
                  color={colors.contrastText}
                  style={{ marginRight: 8 }}
                />
              )}
            </Button>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Ionicons
                name="storefront-outline"
                size={32}
                color={colors.primary}
              />
              <ThemedText type="h3" style={styles.title}>
                {L?.stepBranch ?? ""}
              </ThemedText>
              <ThemedText
                type="body2"
                style={[styles.subtitle, { color: colors.textSecondary }]}
              >
                {L?.subtitleBranch ?? ""}
              </ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText
                type="body2"
                style={[styles.label, { color: colors.text }]}
              >
                {L?.branchCodeLabel ?? ""}
              </ThemedText>
              <InputWithFocus
                containerStyle={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border,
                  },
                ]}
                primaryColor={colors.primary}
              >
                <Ionicons
                  name="pricetag-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={L?.branchCodePlaceholder ?? ""}
                  placeholderTextColor={colors.textSecondary}
                  value={branchData.code}
                  onChangeText={(val) =>
                    setBranchData((prev) => ({ ...prev, code: val }))
                  }
                  autoCapitalize="characters"
                />
              </InputWithFocus>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText
                type="body2"
                style={[styles.label, { color: colors.text }]}
              >
                {L?.branchNameLabel ?? ""}
              </ThemedText>
              <InputWithFocus
                containerStyle={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border,
                  },
                ]}
                primaryColor={colors.primary}
              >
                <Ionicons
                  name="storefront-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={L?.branchNamePlaceholder ?? ""}
                  placeholderTextColor={colors.textSecondary}
                  value={branchData.name}
                  onChangeText={(val) =>
                    setBranchData((prev) => ({ ...prev, name: val }))
                  }
                />
              </InputWithFocus>
            </View>

            <Button
              title={
                saving
                  ? (L?.creating ?? "")
                  : (L?.createBranchAndContinue ?? "")
              }
              onPress={handleCreateBranch}
              variant="primary"
              size="lg"
              disabled={saving}
              style={styles.saveButton}
            >
              {saving && (
                <ActivityIndicator
                  size="small"
                  color={colors.contrastText}
                  style={{ marginRight: 8 }}
                />
              )}
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
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontWeight: "600",
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    textAlignVertical: "top",
  },
  saveButton: {
    marginTop: 8,
  },
});
