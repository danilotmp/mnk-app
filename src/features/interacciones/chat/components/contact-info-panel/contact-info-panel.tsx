/**
 * Componente para el panel de información del contacto
 */
import { ThemedText } from '@/components/themed-text';
import { Tooltip } from '@/components/ui/tooltip';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, ScrollView, TouchableOpacity, View } from 'react-native';
import { contactInfoPanelStyles } from './contact-info-panel.styles';
import type { ContactInfoPanelProps } from './contact-info-panel.types';

export const ContactInfoPanel = React.memo(({
  contact,
  availableTags,
  isMobile,
  panelAnim,
  onClose,
  colors,
}: ContactInfoPanelProps) => {
  const containerStyle = isMobile
    ? [
        contactInfoPanelStyles.modal,
        {
          backgroundColor: colors.surfaceVariant,
          opacity: panelAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
          transform: [
            {
              translateX: panelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 400],
              }),
            },
          ],
        },
      ]
    : [
        contactInfoPanelStyles.panel,
        {
          backgroundColor: colors.surfaceVariant,
          borderLeftWidth: 1,
          borderLeftColor: colors.border,
          width: panelAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [350, 0],
          }),
          overflow: 'hidden',
        },
      ];

  return (
    <Animated.View style={containerStyle}>
      <ScrollView
        style={contactInfoPanelStyles.scroll}
        contentContainerStyle={isMobile ? { paddingBottom: 20, width: '100%' } : undefined}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bounces={!isMobile}
        nestedScrollEnabled={false}
      >
        {/* Header con avatar y nombre */}
        <View style={contactInfoPanelStyles.headerSection}>
          {/* Botón para cerrar el panel en la esquina superior derecha */}
          <TouchableOpacity
            style={contactInfoPanelStyles.headerCloseButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[contactInfoPanelStyles.avatarSmall, { backgroundColor: colors.primary + '30' }]}>
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <ThemedText type="body2" style={{ marginTop: 12, color: colors.text, fontWeight: '600', fontSize: 16 }}>
            {contact.name}
          </ThemedText>

          {/* Información con iconos */}
          <View style={contactInfoPanelStyles.iconsRow}>
            <View style={contactInfoPanelStyles.iconItem}>
              <Ionicons name="call" size={16} color={colors.textSecondary} />
              <ThemedText type="caption" style={{ marginLeft: 6, color: colors.textSecondary }}>
                {contact.phoneNumber}
              </ThemedText>
            </View>
            {contact.email && (
              <View style={contactInfoPanelStyles.iconItem}>
                <Ionicons name="mail" size={16} color={colors.textSecondary} />
                <ThemedText type="caption" style={{ marginLeft: 6, color: colors.textSecondary }}>
                  {contact.email}
                </ThemedText>
              </View>
            )}
            <View style={contactInfoPanelStyles.iconItem}>
              <Ionicons name="briefcase" size={16} color={colors.textSecondary} />
              <ThemedText type="caption" style={{ marginLeft: 6, color: colors.textSecondary }}>
                Negociaciones: 0
              </ThemedText>
            </View>
            <View style={contactInfoPanelStyles.iconItem}>
              <Ionicons name="document-text" size={16} color={colors.textSecondary} />
              <ThemedText type="caption" style={{ marginLeft: 6, color: colors.textSecondary }}>
                Órdenes: 0
              </ThemedText>
            </View>
          </View>

          {/* Barra de navegación */}
          <View style={contactInfoPanelStyles.navBar}>
            <Tooltip text="Cliente" position="top">
              <TouchableOpacity style={[contactInfoPanelStyles.navItem, { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
                <Ionicons name="person" size={20} color={colors.primary} />
              </TouchableOpacity>
            </Tooltip>
            <Tooltip text="Agendamiento" position="top">
              <TouchableOpacity style={contactInfoPanelStyles.navItem}>
                <Ionicons name="calendar" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </Tooltip>
            <Tooltip text="Ordenes" position="top">
              <TouchableOpacity style={contactInfoPanelStyles.navItem}>
                <Ionicons name="list" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </Tooltip>
            <Tooltip text="Pagos" position="top">
              <TouchableOpacity style={contactInfoPanelStyles.navItem}>
                <Ionicons name="card" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </Tooltip>
          </View>
        </View>

        {/* Detalles del cliente */}
        <View style={contactInfoPanelStyles.section}>
          <View style={[contactInfoPanelStyles.sectionHeader, { borderBottomColor: colors.border }]}>
            <ThemedText type="body2" style={{ color: colors.text, fontWeight: '600' }}>
              Detalles del cliente
            </ThemedText>
            <TouchableOpacity>
              <Ionicons name="pencil" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={contactInfoPanelStyles.details}>
            <View style={contactInfoPanelStyles.detailRow}>
              <ThemedText type="body2" style={{ color: colors.textSecondary }}>
                Nombres:
              </ThemedText>
              <ThemedText type="body2" style={{ color: colors.text, marginLeft: 8 }}>
                {contact.name}
              </ThemedText>
            </View>
            <View style={contactInfoPanelStyles.detailRow}>
              <ThemedText type="body2" style={{ color: colors.textSecondary }}>
                Teléfono:
              </ThemedText>
              <ThemedText type="body2" style={{ color: colors.text, marginLeft: 8 }}>
                {contact.phoneNumber}
              </ThemedText>
            </View>
            <View style={contactInfoPanelStyles.detailRow}>
              <ThemedText type="body2" style={{ color: colors.textSecondary }}>
                Email:
              </ThemedText>
              <ThemedText type="body2" style={{ color: colors.text, marginLeft: 8 }}>
                {contact.email || 'Sin email'}
              </ThemedText>
            </View>
            <View style={contactInfoPanelStyles.detailRow}>
              <ThemedText type="body2" style={{ color: colors.textSecondary }}>
                Identificación:
              </ThemedText>
              <ThemedText type="body2" style={{ color: colors.text, marginLeft: 8 }}>
                Sin identificación
              </ThemedText>
            </View>
            <View style={contactInfoPanelStyles.detailRow}>
              <ThemedText type="body2" style={{ color: colors.textSecondary }}>
                Fecha de Nacimiento:
              </ThemedText>
              <ThemedText type="body2" style={{ color: colors.text, marginLeft: 8 }}>
                Sin fecha
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity style={contactInfoPanelStyles.seeMore}>
            <ThemedText type="caption" style={{ color: colors.primary }}>
              Ver más
            </ThemedText>
            <Ionicons name="chevron-down" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Etiquetas */}
        <View style={contactInfoPanelStyles.section}>
          <View style={[contactInfoPanelStyles.sectionHeader, { borderBottomColor: colors.border }]}>
            <ThemedText type="body2" style={{ color: colors.text, fontWeight: '600' }}>
              Etiquetas
            </ThemedText>
            <TouchableOpacity>
              <Ionicons name="pencil" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={contactInfoPanelStyles.tagsContainer}>
            {contact.tags && contact.tags.length > 0 ? (
              contact.tags.map((tagId) => {
                const tag = availableTags.find(t => t.id === tagId);
                if (!tag) return null;
                return (
                  <View
                    key={tagId}
                    style={[contactInfoPanelStyles.infoTag, { backgroundColor: tag.color }]}
                  >
                    <ThemedText type="caption" style={{ color: '#FFFFFF' }}>
                      {tag.label}
                    </ThemedText>
                  </View>
                );
              })
            ) : (
              <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                Sin etiquetas
              </ThemedText>
            )}
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
});

ContactInfoPanel.displayName = 'ContactInfoPanel';
