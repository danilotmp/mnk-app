/**
 * Componente selector de idioma
 */

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, Pressable, TouchableOpacity, View } from "react-native";
import { languageSelectorStyles } from "./language-selector.styles";
import { useLanguage } from "./language.context";
import { useTranslation } from "./use-translation";

export function LanguageSelector() {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const { language, setLanguage, availableLanguages } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const { t } = useTranslation();

  const currentLanguage = availableLanguages.find(
    (lang) => lang.code === language,
  );

  const handleSelectLanguage = async (code: "es" | "en") => {
    await setLanguage(code);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          languageSelectorStyles.button,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          isMobile && languageSelectorStyles.mobileButton,
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
        accessibilityLabel={`Idioma actual: ${currentLanguage?.name}`}
        accessibilityHint="Toca para cambiar el idioma"
      >
        <ThemedText style={languageSelectorStyles.flagIcon}>
          {currentLanguage?.flag || "🌐"}
        </ThemedText>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={[
            languageSelectorStyles.modalOverlay,
            { backgroundColor: colors.overlay },
          ]}
          onPress={() => setModalVisible(false)}
        >
          <ThemedView
            style={[
              languageSelectorStyles.modalContent,
              {
                backgroundColor: colors.surfaceVariant,
                shadowColor: colors.shadow,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View
              style={[
                languageSelectorStyles.header,
                { borderBottomColor: colors.border },
              ]}
            >
              <ThemedText type="h3">{t.language.selectLanguage}</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <ThemedText type="h4">✕</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={languageSelectorStyles.languagesList}>
              {availableLanguages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    languageSelectorStyles.languageItem,
                    {
                      backgroundColor:
                        lang.code === language ? colors.surface : "transparent",
                    },
                  ]}
                  onPress={() => handleSelectLanguage(lang.code)}
                >
                  <ThemedText style={languageSelectorStyles.languageFlag}>
                    {lang.flag}
                  </ThemedText>
                  <View style={languageSelectorStyles.languageInfo}>
                    <ThemedText type="defaultSemiBold">{lang.name}</ThemedText>
                    {lang.code === language && (
                      <Ionicons
                        name="checkmark"
                        size={24}
                        color={colors.primary}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ThemedView>
        </Pressable>
      </Modal>
    </>
  );
}
