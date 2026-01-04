/**
 * Componente para el panel de mensajes rápidos y recomendaciones
 */
import { ThemedText } from '@/components/themed-text';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { Ionicons } from '@expo/vector-icons';
import type { Recommendation } from '@/src/domains/commercial/types';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { quickMessagesPanelStyles } from './quick-messages-panel.styles';
import type { QuickMessagesPanelProps } from './quick-messages-panel.types';

export const QuickMessagesPanel = React.memo(({
  quickMessages,
  recommendations,
  loadingRecommendations,
  onQuickMessageSelect,
  onRecommendationSelect,
  onClose,
  isMobile,
  colors,
}: QuickMessagesPanelProps) => {
  const [searchFilter, setSearchFilter] = useState('');

  const filteredQuickMessages = quickMessages.filter(
    msg => searchFilter === '' || msg.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const filteredRecommendations = recommendations.filter(
    rec => searchFilter === '' || rec.message.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Combinar todos los mensajes en un solo array con tipo identificador
  type MessageItem = 
    | { type: 'quick'; content: string; id: string }
    | { type: 'loading'; content: ''; id: string }
    | { type: 'recommendation'; content: string; id: string; recommendation: Recommendation };

  const allMessages: MessageItem[] = [
    ...filteredQuickMessages.map(msg => ({ type: 'quick' as const, content: msg, id: `quick-${msg}` })),
    ...(loadingRecommendations 
      ? [{ type: 'loading' as const, content: '' as const, id: 'loading' }]
      : filteredRecommendations.map(rec => ({ type: 'recommendation' as const, content: rec.message, id: rec.id, recommendation: rec }))
    ),
  ];

  return (
    <View
      style={[
        quickMessagesPanelStyles.container,
        isMobile && quickMessagesPanelStyles.containerMobile,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      ]}
    >
      {/* Header con buscador y botón cerrar */}
      <View style={[quickMessagesPanelStyles.headerContainer, { borderBottomColor: colors.border }]}>
        <View style={quickMessagesPanelStyles.filterContainer}>
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
              placeholder="Buscar mensajes..."
              value={searchFilter}
              onChangeText={setSearchFilter}
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
          style={quickMessagesPanelStyles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={[
          quickMessagesPanelStyles.scroll,
          isMobile && quickMessagesPanelStyles.scrollMobile,
        ]}
        contentContainerStyle={[
          quickMessagesPanelStyles.content,
          isMobile && quickMessagesPanelStyles.contentMobile,
        ]}
        horizontal={isMobile}
        showsVerticalScrollIndicator={!isMobile}
        showsHorizontalScrollIndicator={isMobile}
      >
        <View style={[
          quickMessagesPanelStyles.grid,
          isMobile && quickMessagesPanelStyles.gridMobile,
        ]}>
          {allMessages.length > 0 ? (
            allMessages.map((item) => {
              if (item.type === 'loading') {
                return (
                  <View key={item.id} style={{ padding: 20, alignItems: 'center', justifyContent: 'center', minWidth: 200 }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                );
              }

              const isQuickMessage = item.type === 'quick';
              const iconName = isQuickMessage ? 'flash' : 'bulb';
              const iconColor = isQuickMessage ? colors.primary : '#FFA500';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    quickMessagesPanelStyles.card,
                    isMobile && quickMessagesPanelStyles.cardMobile,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    if (item.type === 'quick') {
                      onQuickMessageSelect(item.content);
                    } else if (item.type === 'recommendation') {
                      onRecommendationSelect(item.recommendation);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={quickMessagesPanelStyles.iconContainer}>
                    <Ionicons name={iconName} size={18} color={iconColor} />
                  </View>
                  <ThemedText type="body2" style={{ color: colors.text, textAlign: 'center', flex: 1 }}>
                    {item.content}
                  </ThemedText>
                </TouchableOpacity>
              );
            })
          ) : (
            <ThemedText type="body2" style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>
              No hay mensajes disponibles
            </ThemedText>
          )}
        </View>
      </ScrollView>
    </View>
  );
});

QuickMessagesPanel.displayName = 'QuickMessagesPanel';
