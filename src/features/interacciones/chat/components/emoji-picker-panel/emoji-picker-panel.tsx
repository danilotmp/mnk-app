/**
 * Componente para el panel de selección de emojis
 */
import { ThemedText } from '@/components/themed-text';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { emojiPickerPanelStyles } from './emoji-picker-panel.styles';
import type { EmojiPickerPanelProps } from './emoji-picker-panel.types';

export const EmojiPickerPanel = React.memo(({
  emojisWithKeywords,
  onEmojiSelect,
  onClose,
  isMobile,
  colors,
}: EmojiPickerPanelProps) => {
  const [emojiFilter, setEmojiFilter] = useState('');

  const filteredEmojis = emojisWithKeywords.filter(item => {
    if (emojiFilter === '') return true;
    const filterLower = emojiFilter.toLowerCase();
    return item.keywords.some(keyword => keyword.toLowerCase().includes(filterLower));
  });

  return (
    <View
      style={[
        emojiPickerPanelStyles.container,
        isMobile && emojiPickerPanelStyles.containerMobile,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      ]}
    >
      {/* Header con buscador y botón cerrar */}
      <View style={[emojiPickerPanelStyles.headerContainer, { borderBottomColor: colors.border }]}>
        <View style={emojiPickerPanelStyles.filterContainer}>
          <InputWithFocus
            containerStyle={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 6,
              backgroundColor: colors.background,
              paddingLeft: 12,
              paddingRight: 12,
              height: 36,
              flex: 1,
            }}
            primaryColor={colors.primary}
          >
            <TextInput
              placeholder="Buscar emoticones..."
              value={emojiFilter}
              onChangeText={setEmojiFilter}
              style={{
                padding: 8,
                color: colors.text,
                fontSize: 14,
              }}
              placeholderTextColor={colors.textSecondary}
            />
          </InputWithFocus>
        </View>
        <TouchableOpacity
          style={emojiPickerPanelStyles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={[
          emojiPickerPanelStyles.scroll,
          isMobile && emojiPickerPanelStyles.scrollMobile,
        ]}
        contentContainerStyle={[
          emojiPickerPanelStyles.content,
          isMobile && emojiPickerPanelStyles.contentMobile,
        ]}
        horizontal={isMobile}
        showsVerticalScrollIndicator={!isMobile}
        showsHorizontalScrollIndicator={isMobile}
      >
        <View style={[
          emojiPickerPanelStyles.grid,
          isMobile && emojiPickerPanelStyles.gridMobile,
        ]}>
          {filteredEmojis.map((item, index) => (
            <TouchableOpacity
              key={`emoji-${index}`}
              style={emojiPickerPanelStyles.button}
              onPress={() => onEmojiSelect(item.emoji)}
              activeOpacity={0.7}
            >
              <ThemedText type="h4" style={{ fontSize: 28 }}>
                {item.emoji}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
});

EmojiPickerPanel.displayName = 'EmojiPickerPanel';
