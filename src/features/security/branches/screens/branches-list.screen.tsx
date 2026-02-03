/**
 * Página principal de administración de Sucursales
 */

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { SideModal } from "@/components/ui/side-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tooltip } from "@/components/ui/tooltip";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { useCompanyOptions } from "@/src/domains/security/hooks";
import { DynamicIcon } from "@/src/domains/shared/components";
import { DataTable } from "@/src/domains/shared/components/data-table/data-table";
import type { TableColumn } from "@/src/domains/shared/components/data-table/data-table.types";
import { SearchFilterBar } from "@/src/domains/shared/components/search-filter-bar/search-filter-bar";
import { FilterConfig } from "@/src/domains/shared/components/search-filter-bar/search-filter-bar.types";
import {
    BranchCreateForm,
    BranchEditForm,
    BranchesService,
} from "@/src/features/security/branches";
import {
    Branch,
    BranchFilters,
} from "@/src/features/security/branches/types/domain";
import { useRouteAccessGuard } from "@/src/infrastructure/access";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { extractErrorInfo } from "@/src/infrastructure/messages/error-utils";
import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { createBranchesListScreenStyles } from "./branches-list.screen.styles";

export function BranchesListScreen() {
  const { colors, spacing, typography, pageLayout, borderRadius } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const pathname = usePathname();
  const { isMobile } = useResponsive();
  const styles = useMemo(
    () =>
      createBranchesListScreenStyles(
        {
          colors,
          spacing,
          typography,
          pageLayout,
          borderRadius,
        },
        isMobile,
      ),
    [colors, spacing, typography, pageLayout, borderRadius, isMobile],
  );

  const {
    loading: accessLoading,
    allowed: hasAccess,
    handleApiError,
    isScreenFocused,
  } = useRouteAccessGuard(pathname);

  const { companies } = useCompanyOptions({ includeInactive: true });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [localFilter, setLocalFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const loadingRef = useRef(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState<BranchFilters>({
    page: 1,
    limit: 10,
    search: "",
    companyId: undefined,
    type: undefined,
    status: undefined,
  });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [formActions, setFormActions] = useState<{
    isLoading: boolean;
    handleSubmit: () => void;
    handleCancel: () => void;
    generalError?: { message: string; detail?: string } | null;
  } | null>(null);
  const filtersSignatureRef = useRef<string>("");

  const loadBranches = useCallback(
    async (currentFilters: BranchFilters) => {
      if (loadingRef.current) {
        return;
      }

      try {
        loadingRef.current = true;
        setLoading(true);
        setHasError(false);

        const response = await BranchesService.getBranches(currentFilters);
        const items = Array.isArray(response.data) ? response.data : [];
        setBranches(items);

        if (response.meta) {
          setPagination({
            page: response.meta.page ?? currentFilters.page ?? 1,
            limit: response.meta.limit ?? currentFilters.limit ?? 10,
            total: response.meta.total ?? items.length,
            totalPages: response.meta.totalPages ?? 1,
            hasNext: response.meta.hasNext ?? false,
            hasPrev: response.meta.hasPrev ?? false,
          });
        } else {
          setPagination({
            page: currentFilters.page ?? 1,
            limit: currentFilters.limit ?? 10,
            total: items.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          });
        }
      } catch (error: any) {
        if (handleApiError(error)) {
          setHasError(true);
          return;
        }
        const { message: errorMessage, detail: detailString } =
          extractErrorInfo(
            error,
            t.security?.branches?.loadError || "Error al cargar sucursales",
          );
        setHasError(true);
        alert.showError(errorMessage, false, undefined, detailString, error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [alert, handleApiError, t.security?.branches?.loadError],
  );

  useEffect(() => {
    if (!isScreenFocused || !hasAccess || accessLoading || hasError) {
      return;
    }

    const signature = JSON.stringify(filters);
    if (filtersSignatureRef.current === signature) {
      return;
    }

    filtersSignatureRef.current = signature;
    loadBranches(filters);
  }, [
    accessLoading,
    filters,
    hasAccess,
    hasError,
    isScreenFocused,
    loadBranches,
  ]);

  const handleSearchSubmit = useCallback((term: string) => {
    setLocalFilter(term);
    setFilters((prev) => ({
      ...prev,
      search: term,
      page: 1,
    }));
    setHasError(false);
  }, []);

  const handleAdvancedFilterChange = useCallback((key: string, value: any) => {
    setHasError(false);

    if (key === "deleted") {
      setFilters((prev) => ({
        ...prev,
        status: value === "deleted" ? -1 : undefined,
        page: 1,
      }));
      return;
    }

    if (key === "status") {
      setFilters((prev) => ({
        ...prev,
        status: value === "" ? undefined : Number.parseInt(value, 10),
        page: 1,
      }));
      return;
    }

    const processedValue =
      key === "status" && value !== "" ? Number.parseInt(value, 10) : value;

    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : processedValue,
      page: 1,
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 10,
      search: "",
      companyId: undefined,
      type: undefined,
      status: undefined,
    });
    setLocalFilter("");
    setHasError(false);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleLimitChange = useCallback((limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const filteredBranches = useMemo(() => {
    if (!localFilter.trim()) {
      return branches;
    }

    const term = localFilter.trim().toLowerCase();
    return branches.filter((branch) => {
      return (
        branch.code.toLowerCase().includes(term) ||
        branch.name.toLowerCase().includes(term) ||
        (branch.company?.name || "").toLowerCase().includes(term)
      );
    });
  }, [branches, localFilter]);

  const columns = useMemo<TableColumn<Branch>[]>(() => {
    return [
      {
        key: "company",
        label: "Empresa",
        minWidth: 200,
        render: (item) => (
          <ThemedText type="body2" style={{ color: colors.textSecondary }}>
            {item.company?.name ||
              t.security?.branches?.unknownCompany ||
              "Sin empresa"}
          </ThemedText>
        ),
      },
      {
        key: "code",
        label: "Código",
        width: 140,
        render: (item) => (
          <ThemedText type="body2" style={{ color: colors.text }}>
            {item.code}
          </ThemedText>
        ),
      },
      {
        key: "name",
        label: "Nombre",
        minWidth: 200,
        render: (item) => (
          <ThemedText
            type="body2"
            style={{ color: colors.text, flexShrink: 1 }}
          >
            {item.name}
          </ThemedText>
        ),
      },
      {
        key: "type",
        label: "Tipo",
        width: 140,
        render: (item) => (
          <ThemedText type="body2" style={{ color: colors.textSecondary }}>
            {t.security?.branches?.types?.[item.type || "branch"] || item.type}
          </ThemedText>
        ),
      },
      {
        key: "status",
        label: t.security?.users?.status || "Estado",
        width: 120,
        align: "center",
        render: (item) => (
          <StatusBadge
            status={item.status}
            statusDescription={item.statusDescription}
            size="small"
          />
        ),
      },
      {
        key: "actions",
        label: t.common?.actions || "Acciones",
        width: 120,
        align: "center",
        render: (item) => (
          <View style={styles.actionsContainer}>
            <Tooltip
              text={t.security?.branches?.editShort || "Editar"}
              position="left"
            >
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditBranch(item)}
              >
                <Ionicons name="pencil" size={18} color={colors.primaryDark} />
              </TouchableOpacity>
            </Tooltip>
          </View>
        ),
      },
    ];
  }, [
    colors.primary,
    colors.text,
    colors.textSecondary,
    styles.actionButton,
    styles.actionsContainer,
    t.common?.actions,
    t.security?.branches?.editShort,
    t.security?.branches?.types,
    t.security?.branches?.unknownCompany,
    t.security?.users?.status,
  ]);

  const usersTranslations = (t.security?.users as any) || {};
  const commonTranslations = t.common || {};

  const filterConfigs = useMemo<FilterConfig[]>(() => {
    return [
      {
        key: "companyId",
        label: t.security?.branches?.filters?.company || "Empresa",
        type: "select",
        options: [
          {
            key: "all",
            value: "",
            label: t.security?.branches?.filters?.allCompanies || "Todas",
          },
          ...companies.map((company) => ({
            key: company.id,
            value: company.id,
            label: company.name,
          })),
        ],
      },
      {
        key: "type",
        label: t.security?.branches?.filters?.type || "Tipo",
        type: "select",
        options: [
          {
            key: "all",
            value: "",
            label: t.security?.branches?.filters?.allTypes || "Todos",
          },
          { key: "headquarters", value: "headquarters", label: "Casa matriz" },
          { key: "branch", value: "branch", label: "Sucursal" },
          { key: "warehouse", value: "warehouse", label: "Bodega" },
          { key: "store", value: "store", label: "Tienda" },
        ],
      },
      {
        key: "status",
        label: usersTranslations.status || "Estado",
        type: "select",
        options: [
          { key: "all", value: "", label: commonTranslations.all || "Todos" },
          {
            key: "active",
            value: "1",
            label: usersTranslations.active || "Activo",
          },
          {
            key: "inactive",
            value: "0",
            label: usersTranslations.inactive || "Inactivo",
          },
          {
            key: "pending",
            value: "2",
            label: usersTranslations.pending || "Pendiente",
          },
          {
            key: "suspended",
            value: "3",
            label: usersTranslations.suspended || "Suspendido",
          },
        ],
      },
      {
        key: "deleted",
        label: usersTranslations.deletedFilter || "Otros",
        type: "select",
        options: [
          {
            key: "deleted",
            value: "deleted",
            label: usersTranslations.deletedUser || "Eliminados",
          },
        ],
      },
    ];
  }, [
    companies,
    commonTranslations.all,
    t.security?.branches?.filters,
    usersTranslations,
  ]);

  const handleCreateBranch = useCallback(() => {
    setFormActions(null);
    setSelectedBranchId(null);
    setModalMode("create");
    setIsModalVisible(true);
  }, []);

  const handleEditBranch = useCallback((branch: Branch) => {
    setFormActions(null);
    setSelectedBranchId(branch.id);
    setModalMode("edit");
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setModalMode(null);
    setSelectedBranchId(null);
    setFormActions(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    filtersSignatureRef.current = JSON.stringify(filters);
    loadBranches(filters);
    handleCloseModal();
  }, [filters, handleCloseModal, loadBranches]);

  if (accessLoading) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={{ marginTop: 12 }}>
          {t.common?.loading || "Cargando..."}
        </ThemedText>
      </ThemedView>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, isMobile && styles.contentMobile]}>
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <View style={styles.headerRow}>
              <DynamicIcon
                name="Ionicons:storefront"
                size={
                  isMobile ? pageLayout.iconTitleMobile : pageLayout.iconTitle
                }
                color={colors.primary}
                style={styles.headerIcon}
              />
              <ThemedText
                type="h1"
                style={isMobile ? styles.titleMobile : styles.title}
              >
                {t.security?.branches?.title || "Administración de Sucursales"}
              </ThemedText>
            </View>
            <ThemedText type="body1" style={styles.subtitle}>
              {t.security?.branches?.subtitle ||
                "Gestiona las sucursales registradas en el sistema"}
            </ThemedText>
          </View>
          <View style={styles.actionsContainer}>
            <Tooltip
              content={t.security?.branches?.create || "Crear sucursal"}
              placement="bottom"
              disabled={!isMobile}
            >
              <Button
                title={
                  isMobile
                    ? ""
                    : t.security?.branches?.create || "Crear sucursal"
                }
                onPress={handleCreateBranch}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={colors.contrastText}
                  style={!isMobile ? { marginRight: spacing.sm } : undefined}
                />
              </Button>
            </Tooltip>
          </View>
        </View>

        <SearchFilterBar
          filterValue={localFilter}
          onFilterChange={setLocalFilter}
          onSearchSubmit={handleSearchSubmit}
          filterPlaceholder={
            t.security?.branches?.filterPlaceholder ||
            "Filtrar por código, nombre o empresa"
          }
          searchPlaceholder={
            t.security?.branches?.searchPlaceholder || "Buscar sucursales"
          }
          filters={filterConfigs}
          activeFilters={{
            companyId: filters.companyId || "",
            type: filters.type || "",
            status:
              filters.status !== undefined && filters.status !== -1
                ? filters.status.toString()
                : "",
            deleted: filters.status === -1 ? "deleted" : "",
          }}
          onAdvancedFilterChange={handleAdvancedFilterChange}
          onClearFilters={handleClearFilters}
          filteredCount={
            localFilter.trim() ? filteredBranches.length : undefined
          }
          totalCount={pagination.total}
        />

        <View style={styles.dataTableContainer}>
          <DataTable
            data={filteredBranches}
            columns={columns}
            loading={loading}
            emptyMessage={
              t.security?.branches?.empty || "No hay sucursales registradas"
            }
            onRowPress={handleEditBranch}
            keyExtractor={(item) => item.id}
            showPagination
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: localFilter.trim()
                ? filteredBranches.length
                : pagination.total,
              totalPages: localFilter.trim()
                ? Math.ceil(filteredBranches.length / pagination.limit) || 1
                : pagination.totalPages,
              hasNext: localFilter.trim()
                ? pagination.page <
                  Math.ceil(filteredBranches.length / pagination.limit)
                : pagination.hasNext,
              hasPrev: pagination.hasPrev,
              onPageChange: handlePageChange,
              onLimitChange: handleLimitChange,
              limitOptions: [10, 25, 50, 100],
            }}
          />
        </View>
      </View>

      {modalMode && (
        <SideModal
          visible={isModalVisible}
          onClose={handleCloseModal}
          title={
            modalMode === "edit"
              ? t.security?.branches?.editTitle || "Editar sucursal"
              : t.security?.branches?.createTitle || "Crear sucursal"
          }
          subtitle={
            modalMode === "edit"
              ? t.security?.branches?.editSubtitle ||
                "Actualiza la información de la sucursal seleccionada"
              : t.security?.branches?.createSubtitle ||
                "Completa la información para registrar una nueva sucursal"
          }
          topAlert={
            formActions?.generalError ? (
              <InlineAlert
                type="error"
                message={formActions.generalError.message}
                detail={formActions.generalError.detail}
                duration={5000}
                autoClose={true}
                onDismiss={() => {
                  if (formActions) {
                    setFormActions({ ...formActions, generalError: null });
                  }
                }}
              />
            ) : undefined
          }
          footer={
            formActions ? (
              <>
                <Button
                  title={t.common.cancel}
                  onPress={formActions.handleCancel}
                  variant="outlined"
                  size="md"
                  disabled={formActions.isLoading}
                />
                <Button
                  title={
                    modalMode === "edit"
                      ? t.common.save
                      : t.security?.branches?.create || "Crear sucursal"
                  }
                  onPress={formActions.handleSubmit}
                  variant="primary"
                  size="md"
                  disabled={formActions.isLoading}
                />
              </>
            ) : null
          }
        >
          {modalMode === "edit" && selectedBranchId ? (
            <BranchEditForm
              branchId={selectedBranchId}
              onSuccess={handleFormSuccess}
              onCancel={handleCloseModal}
              showHeader={false}
              showFooter={false}
              onFormReady={setFormActions}
            />
          ) : null}
          {modalMode === "create" ? (
            <BranchCreateForm
              onSuccess={handleFormSuccess}
              onCancel={handleCloseModal}
              showHeader={false}
              showFooter={false}
              onFormReady={setFormActions}
            />
          ) : null}
        </SideModal>
      )}
    </ThemedView>
  );
}
