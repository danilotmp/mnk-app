/**
 * Componente de carrusel horizontal para configurar empresas
 * Muestra cada empresa con sus selectores de sucursales y roles en un carrusel
 */

import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import React, {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import {
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { createCompanyConfigCarouselStyles } from "./company-config-carousel.styles";

export interface CompanyConfigCarouselRef {
  scrollToIndex: (index: number) => void;
}

interface CompanyConfigCarouselProps {
  selectedCompanyIds: string[];
  companies: Array<{ id: string; name: string; code: string }>;
  branchesByCompany: Record<string, any[]>;
  rolesByCompany: Record<string, any[]>;
  companyBranches: Record<string, string[]>;
  companyRoles: Record<string, string[]>;
  onBranchSelect: (companyId: string, branchIds: string[]) => void;
  onRoleSelect: (companyId: string, roleIds: string[]) => void;
  branchErrors?: string;
  roleErrors?: string;
  isLoading?: boolean;
  t?: any;
}

export const CompanyConfigCarousel = forwardRef<
  CompanyConfigCarouselRef,
  CompanyConfigCarouselProps
>(function CompanyConfigCarousel(
  {
    selectedCompanyIds,
    companies,
    branchesByCompany,
    rolesByCompany,
    companyBranches,
    companyRoles,
    onBranchSelect,
    onRoleSelect,
    branchErrors,
    roleErrors,
    isLoading = false,
    t,
  },
  ref,
) {
  const { colors } = useTheme();
  const styles = createCompanyConfigCarouselStyles();
  const scrollViewRef = useRef<ScrollView>(null);
  const pendingScrollIndexRef = useRef<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const cardWidth = containerWidth;

  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex(index: number) {
        const len = selectedCompanyIds.length;
        if (len === 0) return;
        const safeIndex = Math.max(0, Math.min(index, len - 1));
        if (scrollViewRef.current && cardWidth > 0) {
          scrollViewRef.current.scrollTo({
            x: safeIndex * cardWidth,
            animated: true,
          });
          setCurrentIndex(safeIndex);
        } else {
          pendingScrollIndexRef.current = safeIndex;
        }
      },
    }),
    [selectedCompanyIds.length, cardWidth],
  );

  // Si no hay empresas seleccionadas, no mostrar nada
  if (selectedCompanyIds.length === 0) {
    return null;
  }

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / cardWidth);
    setCurrentIndex(index);
  };

  const scrollToIndex = (index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * cardWidth,
        animated: true,
      });
    }
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < selectedCompanyIds.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  };

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
      const pending = pendingScrollIndexRef.current;
      if (pending !== null && scrollViewRef.current) {
        pendingScrollIndexRef.current = null;
        scrollViewRef.current.scrollTo({
          x: pending * width,
          animated: true,
        });
        setCurrentIndex(pending);
      }
    }
  };

  return (
    <View style={styles.container} onLayout={handleContainerLayout}>
      {/* Header con indicador de empresa actual */}
      <View style={styles.header}>
        <ThemedText type="body2" style={styles.headerTitle}>
          Configuración por Empresa
        </ThemedText>
        <View style={styles.headerIndicator}>
          {/* Botón anterior */}
          {currentIndex > 0 && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={goToPrevious}
              disabled={isLoading}
            >
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          <ThemedText type="body2" variant="secondary">
            {currentIndex + 1} de {selectedCompanyIds.length}
          </ThemedText>
          {/* Botón siguiente */}
          {currentIndex < selectedCompanyIds.length - 1 && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={goToNext}
              disabled={isLoading}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Carrusel */}
      <View style={styles.carouselContainer}>
        {/* ScrollView horizontal con paginación */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          snapToInterval={cardWidth > 0 ? cardWidth : undefined}
          decelerationRate="fast"
          snapToAlignment="start"
        >
          {selectedCompanyIds.map((companyId, index) => {
            const company = companies.find((c) => c.id === companyId);
            const companyBranchesList = companyBranches[companyId] || [];
            const companyRolesList = companyRoles[companyId] || [];
            const availableBranches = branchesByCompany[companyId] || [];
            const availableRoles = rolesByCompany[companyId] || [];
            const hasBranchError =
              !!branchErrors && companyBranchesList.length === 0;
            const hasRoleError = !!roleErrors && companyRolesList.length === 0;

            return (
              <View
                key={companyId}
                style={[styles.slide, { width: cardWidth }]}
              >
                <Card variant="elevated" style={styles.companyCard}>
                  {/* Contenedor interno con padding */}
                  <View style={styles.cardContent}>
                    {/* Header de la empresa */}
                    <View
                      style={[
                        styles.companyHeader,
                        { borderBottomColor: colors.primary + "33" },
                      ]}
                    >
                      <View style={styles.companyHeaderContent}>
                        <Ionicons
                          name="business"
                          size={24}
                          color={colors.primary}
                        />
                        <View style={styles.companyHeaderText}>
                          <ThemedText type="h4" style={styles.companyName}>
                            {company?.name || companyId}
                          </ThemedText>
                          <ThemedText type="caption" variant="secondary">
                            {company?.code || ""}
                          </ThemedText>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.companyBadge,
                          { backgroundColor: colors.primary + "1A" },
                        ]}
                      >
                        <ThemedText
                          type="caption"
                          style={[
                            styles.companyBadgeText,
                            { color: colors.primary },
                          ]}
                        >
                          Empresa {index + 1}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Selector de Sucursales */}
                    <View style={styles.inputGroup}>
                      <Select
                        label="Sucursales"
                        placeholder="Selecciona una o más sucursales"
                        value={companyBranchesList}
                        options={
                          availableBranches.length > 0
                            ? availableBranches.map((branch) => ({
                                value: branch.id,
                                label: branch.name,
                              }))
                            : []
                        }
                        onSelect={(value) =>
                          onBranchSelect(companyId, value as string[])
                        }
                        error={hasBranchError}
                        errorMessage={
                          hasBranchError ? branchErrors || "" : undefined
                        }
                        multiple={true}
                        required
                        disabled={isLoading || availableBranches.length === 0}
                        searchable={true}
                      />
                      {availableBranches.length === 0 && (
                        <ThemedText
                          type="caption"
                          variant="secondary"
                          style={styles.emptyMessage}
                        >
                          {t?.security?.users?.noBranches ||
                            "No hay sucursales disponibles para esta empresa"}
                        </ThemedText>
                      )}
                    </View>

                    {/* Selector de Roles */}
                    <View style={styles.inputGroup}>
                      <Select
                        label="Roles"
                        placeholder="Selecciona uno o más roles"
                        value={companyRolesList}
                        options={
                          availableRoles.length > 0
                            ? availableRoles.map((role) => ({
                                value: role.id,
                                label: role.name,
                              }))
                            : []
                        }
                        onSelect={(value) =>
                          onRoleSelect(companyId, value as string[])
                        }
                        error={hasRoleError}
                        errorMessage={
                          hasRoleError ? roleErrors || "" : undefined
                        }
                        multiple={true}
                        required
                        disabled={isLoading || availableRoles.length === 0}
                        searchable={true}
                      />
                      {availableRoles.length === 0 && (
                        <ThemedText
                          type="caption"
                          variant="secondary"
                          style={styles.emptyMessage}
                        >
                          {t?.security?.users?.noRole ||
                            "No hay roles disponibles para esta empresa"}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                </Card>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Indicadores de paginación */}
      {selectedCompanyIds.length > 1 && (
        <View style={styles.paginationContainer}>
          {selectedCompanyIds.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
                {
                  backgroundColor:
                    index === currentIndex ? colors.primary : colors.border,
                },
              ]}
              onPress={() => scrollToIndex(index)}
            />
          ))}
        </View>
      )}
    </View>
  );
});
