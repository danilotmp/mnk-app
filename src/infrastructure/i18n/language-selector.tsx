/**
 * Componente selector de idioma
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLanguage } from './language.context';

export function LanguageSelector() {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const { language, setLanguage, availableLanguages } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  const currentLanguage = availableLanguages.find((lang) => lang.code === language);

  const handleSelectLanguage = async (code: 'es' | 'en') => {
    await setLanguage(code);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          isMobile && styles.mobileButton
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
        accessibilityLabel={`Idioma actual: ${currentLanguage?.name}`}
        accessibilityHint="Toca para cambiar el idioma"
      >
        <ThemedText style={styles.flagIcon}>
          {currentLanguage?.flag || '🌐'}
        </ThemedText>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <ThemedView
            style={[styles.modalContent, { backgroundColor: colors.background }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <ThemedText type="h3">Selecciona el idioma</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <ThemedText type="h4">✕</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.languagesList}>
              {availableLanguages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    { backgroundColor: lang.code === language ? colors.surface : 'transparent' },
                  ]}
                  onPress={() => handleSelectLanguage(lang.code)}
                >
                  <ThemedText style={styles.languageFlag}>{lang.flag}</ThemedText>
                  <View style={styles.languageInfo}>
                    <ThemedText type="defaultSemiBold">{lang.name}</ThemedText>
                    {lang.code === language && (
                      <Ionicons name="checkmark" size={24} color={colors.primary} />
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

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  flagIcon: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  languagesList: {
    gap: 8,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  languageFlag: {
    fontSize: 32,
  },
  languageInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

