/**
 * Componente para seleccionar sucursal
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, TouchableOpacity, View } from 'react-native';
import { useBranches } from '../../hooks/use-multi-company.hook';
import { Branch } from '../../types';
import { createBranchSelectorStyles } from './branch-selector.styles';
import { BranchSelectorProps } from './branch-selector.types';

export function BranchSelector({ onBranchChange }: BranchSelectorProps) {
  const { branches, currentBranch, switchBranch, canSwitch, isLoading } = useBranches();
  const { colors } = useTheme();
  const styles = createBranchSelectorStyles();
  const [modalVisible, setModalVisible] = useState(false);
  const [switching, setSwitching] = useState(false);

  if (!canSwitch || branches.length <= 1) {
    return null; // No mostrar si solo tiene una sucursal
  }

  const handleBranchSelect = async (branch: Branch) => {
    if (branch.id === currentBranch?.id) {
      setModalVisible(false);
      return;
    }

    try {
      setSwitching(true);
      await switchBranch(branch.id);
      setModalVisible(false);
      onBranchChange?.(branch);
    } catch (error) {
      // Eliminado console.error en cambio de sucursal
    } finally {
      setSwitching(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={[styles.button, { backgroundColor: colors.surface }]}
        disabled={isLoading}
      >
        <ThemedText type="body2" variant="secondary">
          Sucursal:
        </ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.branchName}>
          {currentBranch?.name || 'Seleccionar'}
        </ThemedText>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Seleccionar Sucursal</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <ThemedText type="h4" variant="accent">
                  ✕
                </ThemedText>
              </TouchableOpacity>
            </View>

            {switching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText style={styles.loadingText}>Cambiando sucursal...</ThemedText>
              </View>
            ) : (
              <FlatList
                data={branches}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.branchItem,
                      {
                        backgroundColor:
                          item.id === currentBranch?.id ? colors.primaryLight : 'transparent',
                      },
                    ]}
                    onPress={() => handleBranchSelect(item)}
                  >
                    <View style={styles.branchInfo}>
                      <ThemedText
                        type="defaultSemiBold"
                        variant={item.id === currentBranch?.id ? 'primary' : undefined}
                      >
                        {item.name}
                      </ThemedText>
                      <ThemedText type="body2" variant="secondary">
                        {item.address.city} - {item.code}
                      </ThemedText>
                    </View>
                    {item.id === currentBranch?.id && (
                      <ThemedText variant="accent">✓</ThemedText>
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </ThemedView>
        </View>
      </Modal>
    </View>
  );
}

