/**
 * Componente reutilizable para la gestión de permisos
 * Puede ser usado tanto en la página de permisos como en un modal
 */

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { PermissionsService, useCompanyOptions } from "@/src/domains/security";
import type { PermissionChange } from "@/src/domains/security/components";
import {
    PermissionsFlowFilters,
    PermissionsManagementFlow,
} from "@/src/domains/security/components";
import type {
    SecurityPermission,
    SecurityRole,
} from "@/src/domains/security/types";
import { useCompany } from "@/src/domains/shared/hooks";
import type { PermissionOperation } from "@/src/features/security/roles";
import { RolesService } from "@/src/features/security/roles";
import { useTranslation } from "@/src/infrastructure/i18n";
import { MenuItem } from "@/src/infrastructure/menu/types";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { createPermissionsListStyles } from "@/src/styles/pages/permissions-list.styles";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

interface PermissionsManagementContentProps {
  initialCompanyId?: string;
  initialRoleId?: string;
  onClose?: () => void;
  onError?: (error: { message: string; detail?: string }) => void;
  onSuccess?: (message: string) => void;
}

export function PermissionsManagementContent({
  initialCompanyId,
  initialRoleId,
  onClose,
  onError,
  onSuccess,
}: PermissionsManagementContentProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const { isMobile } = useResponsive();
  const styles = createPermissionsListStyles(isMobile);

  const [rolePermissions, setRolePermissions] = useState<SecurityPermission[]>(
    [],
  );
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false);
  const [menuRefreshKey, setMenuRefreshKey] = useState(0);

  const [permissionChanges, setPermissionChanges] = useState<
    PermissionChange[]
  >([]);
  const [savingChanges, setSavingChanges] = useState(false);

  const [selectedCompanyId, setSelectedCompanyId] = useState<
    string | undefined
  >(initialCompanyId);
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(
    initialRoleId,
  );
  const [roles, setRoles] = useState<SecurityRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const [searchValue, setSearchValue] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [showDefaultOptions, setShowDefaultOptions] = useState(true);
  const [showAll, setShowAll] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const { company: currentCompany } = useCompany();
  const { companies } = useCompanyOptions();
  const hasPreselectedCompanyRef = React.useRef(false);

  /**
   * Validar si un string es un UUID válido
   */
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  /**
   * Función auxiliar recursiva para buscar menuItemId por route
   * Retorna solo si el id es un UUID válido
   */
  const findMenuItemIdByRouteRecursive = (
    route: string,
    item: MenuItem,
  ): string | null => {
    // Verificar el item actual
    if (item.route === route) {
      if (isValidUUID(item.id)) {
        return item.id;
      }
      console.warn(
        `El menuItem con route "${route}" tiene un id inválido: "${item.id}". Debe ser un UUID.`,
      );
    }

    // Buscar recursivamente en submenu
    if (item.submenu && item.submenu.length > 0) {
      for (const subItem of item.submenu) {
        const found = findMenuItemIdByRouteRecursive(route, subItem);
        if (found) return found;
      }
    }

    // Buscar recursivamente en columns
    if (item.columns && item.columns.length > 0) {
      for (const column of item.columns) {
        if (column.items && column.items.length > 0) {
          for (const colItem of column.items) {
            const found = findMenuItemIdByRouteRecursive(route, colItem);
            if (found) return found;
          }
        }
      }
    }

    return null;
  };

  /**
   * Buscar menuItemId por route en menuItems (recursivamente)
   * Retorna solo si el id es un UUID válido
   */
  const findMenuItemIdByRoute = (
    route: string | undefined,
    items: MenuItem[],
  ): string | null => {
    if (!route) return null;

    for (const item of items) {
      const found = findMenuItemIdByRouteRecursive(route, item);
      if (found) return found;
    }

    return null;
  };

  /**
   * Convertir PermissionChange[] a PermissionOperation[]
   */
  const convertPermissionChangesToOperations = async (
    changes: PermissionChange[],
    menuItems: MenuItem[],
    rolePermissions: SecurityPermission[],
  ): Promise<PermissionOperation[]> => {
    const genericPermissionsResponse = await PermissionsService.getPermissions(
      {},
    );

    const allPermissions = Array.isArray(genericPermissionsResponse.data)
      ? genericPermissionsResponse.data
      : genericPermissionsResponse.data || [];

    const genericPermissionIds: Record<string, string> = {};
    const actions = ["view", "create", "edit", "delete"];

    for (const action of actions) {
      const genericPermission = allPermissions.find(
        (p: SecurityPermission) =>
          p.action === action && (!p.route || p.route === ""),
      );
      if (genericPermission) {
        genericPermissionIds[action] = genericPermission.id;
      }
    }

    const missingActions = ["view", "create", "edit", "delete"].filter(
      (action) => !genericPermissionIds[action],
    );
    if (missingActions.length > 0) {
      throw new Error(
        `No se encontraron permisos genéricos para: ${missingActions.join(", ")}`,
      );
    }

    const operations: PermissionOperation[] = [];

    for (const change of changes) {
      const menuItemId = findMenuItemIdByRoute(change.route, menuItems);
      if (!menuItemId) {
        console.warn(
          `No se encontró menuItemId válido (UUID) para la ruta: ${change.route}`,
        );
        continue;
      }

      const originalView = rolePermissions.some(
        (p) => p.route === change.route && p.action === "view",
      );
      const originalCreate = rolePermissions.some(
        (p) => p.route === change.route && p.action === "create",
      );
      const originalEdit = rolePermissions.some(
        (p) => p.route === change.route && p.action === "edit",
      );
      const originalDelete = rolePermissions.some(
        (p) => p.route === change.route && p.action === "delete",
      );

      if (change.view !== originalView) {
        operations.push({
          permissionId: genericPermissionIds.view,
          menuItemId,
          action: change.view ? "add" : "remove",
        });
      }

      if (change.create !== originalCreate) {
        operations.push({
          permissionId: genericPermissionIds.create,
          menuItemId,
          action: change.create ? "add" : "remove",
        });
      }

      if (change.edit !== originalEdit) {
        operations.push({
          permissionId: genericPermissionIds.edit,
          menuItemId,
          action: change.edit ? "add" : "remove",
        });
      }

      if (change.delete !== originalDelete) {
        operations.push({
          permissionId: genericPermissionIds.delete,
          menuItemId,
          action: change.delete ? "add" : "remove",
        });
      }
    }

    return operations;
  };

  // Cargar roles por empresa
  const loadRolesByCompany = useCallback(
    async (companyId: string | undefined) => {
      if (!companyId) {
        setRoles([]);
        setSelectedRoleId(undefined);
        return;
      }

      try {
        setLoadingRoles(true);
        const response = await RolesService.getRoles({ companyId });

        const companyRoles = (response.data || []).filter(
          (role) => role.companyId === companyId,
        );
        setRoles(companyRoles);

        if (
          selectedRoleId &&
          !companyRoles.find((r) => r.id === selectedRoleId)
        ) {
          setSelectedRoleId(undefined);
        }

        // Si hay un roleId inicial y está en los roles cargados, seleccionarlo automáticamente
        if (initialRoleId && companyRoles.find((r) => r.id === initialRoleId)) {
          setSelectedRoleId(initialRoleId);
        }
      } catch (error: any) {
        console.error("Error al cargar roles:", error);
        setRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    },
    [selectedRoleId, initialRoleId],
  );

  // Cargar permisos del rol cuando cambia selectedRoleId
  useEffect(() => {
    if (selectedRoleId) {
      setPermissionChanges([]);

      const loadRolePermissions = async () => {
        try {
          setLoadingRolePermissions(true);
          const role = await RolesService.getRoleById(selectedRoleId);
          setRolePermissions(role.permissions || []);
        } catch (error: any) {
          console.error("Error al cargar permisos del rol:", error);
          setRolePermissions([]);
        } finally {
          setLoadingRolePermissions(false);
        }
      };

      loadRolePermissions();
    } else {
      setRolePermissions([]);
      setPermissionChanges([]);
    }
  }, [selectedRoleId]);

  // Cargar roles cuando cambia la empresa seleccionada
  useEffect(() => {
    loadRolesByCompany(selectedCompanyId);
  }, [selectedCompanyId, loadRolesByCompany]);

  // Cargar roles iniciales si hay companyId inicial
  useEffect(() => {
    if (initialCompanyId && initialCompanyId !== selectedCompanyId) {
      setSelectedCompanyId(initialCompanyId);
    }
  }, [initialCompanyId]);

  // Preseleccionar la empresa actual del selector cuando no hay initialCompanyId
  useEffect(() => {
    if (
      hasPreselectedCompanyRef.current ||
      initialCompanyId != null ||
      !currentCompany?.id ||
      companies.length === 0
    ) {
      return;
    }
    const isCurrentInList = companies.some((c) => c.id === currentCompany.id);
    if (!isCurrentInList) return;
    hasPreselectedCompanyRef.current = true;
    setSelectedCompanyId(currentCompany.id);
  }, [initialCompanyId, currentCompany?.id, companies]);

  const handleCompanyChange = (companyId: string | undefined) => {
    setSelectedCompanyId(companyId);
    setSelectedRoleId(undefined);
    setPermissionChanges([]);
    loadRolesByCompany(companyId);
  };

  const handleRoleChange = (roleId: string | undefined) => {
    setSelectedRoleId(roleId);
    setPermissionChanges([]);
  };

  const handleSaveChanges = async () => {
    if (permissionChanges.length === 0 || !selectedRoleId) {
      return;
    }

    try {
      setSavingChanges(true);

      // Convertir PermissionChange[] a PermissionOperation[]
      const operations = await convertPermissionChangesToOperations(
        permissionChanges,
        menuItems,
        rolePermissions,
      );

      if (operations.length === 0) {
        const errorMessage = "No hay cambios válidos para guardar";
        if (onError) {
          onError({ message: errorMessage });
        } else {
          alert.showError(errorMessage);
        }
        return;
      }

      const result = await RolesService.bulkUpdateRolePermissions(
        selectedRoleId,
        operations,
        selectedCompanyId,
      );

      if (result && "summary" in result && result.summary) {
        const summary = result.summary;
        const summaryMessage = `${summary.added > 0 ? `${summary.added} agregado${summary.added > 1 ? "s" : ""}` : ""}${summary.added > 0 && summary.removed > 0 ? ", " : ""}${summary.removed > 0 ? `${summary.removed} removido${summary.removed > 1 ? "s" : ""}` : ""}`;
        const successMessage = `Permisos actualizados correctamente${summaryMessage ? ` (${summaryMessage})` : ""}`;
        if (onSuccess) {
          onSuccess(successMessage);
        } else {
          alert.showSuccess(successMessage);
        }
      } else {
        const successMessage = "Permisos actualizados correctamente";
        if (onSuccess) {
          onSuccess(successMessage);
        } else {
          alert.showSuccess(successMessage);
        }
      }

      setPermissionChanges([]);

      if (selectedRoleId) {
        try {
          setLoadingRolePermissions(true);
          const updatedRole = await RolesService.getRoleById(selectedRoleId);
          setRolePermissions(updatedRole.permissions || []);
          setMenuRefreshKey((prev) => prev + 1);
        } catch (error: any) {
          console.error("Error al recargar permisos del rol:", error);
        } finally {
          setLoadingRolePermissions(false);
        }
      }
    } catch (error: any) {
      const backendResult = error?.result || error?.response?.data || error;
      const rawDetails = backendResult?.details ?? error?.details;
      const detailString =
        typeof rawDetails === "string"
          ? rawDetails
          : rawDetails?.message
            ? String(rawDetails.message)
            : undefined;

      const errorMessage =
        backendResult?.description ||
        error?.message ||
        "Error al guardar permisos";

      if (onError) {
        onError({ message: errorMessage, detail: detailString });
      } else {
        alert.showError(errorMessage, false, undefined, detailString);
      }
    } finally {
      setSavingChanges(false);
    }
  };

  const pendingCount = permissionChanges.reduce((total, change) => {
    const originalView = rolePermissions.some(
      (p) => p.route === change.route && p.action === "view",
    );
    const originalCreate = rolePermissions.some(
      (p) => p.route === change.route && p.action === "create",
    );
    const originalEdit = rolePermissions.some(
      (p) => p.route === change.route && p.action === "edit",
    );
    const originalDelete = rolePermissions.some(
      (p) => p.route === change.route && p.action === "delete",
    );

    let count = 0;
    if (change.view !== originalView) count++;
    if (change.create !== originalCreate) count++;
    if (change.edit !== originalEdit) count++;
    if (change.delete !== originalDelete) count++;

    return total + count;
  }, 0);

  const pendingText =
    typeof t.security?.permissions?.pendingChanges === "function"
      ? t.security.permissions.pendingChanges(pendingCount)
      : t.security?.permissions?.pendingChanges ||
        `${pendingCount} ${pendingCount === 1 ? "permiso" : "permisos"} pendiente${pendingCount === 1 ? "" : "s"} de guardar`;

  return (
    <View style={{ flex: 1 }}>
      {/* Selectores dependientes: Empresa y Rol */}
      <View style={[styles.selectorsContainer, { gap: 16, marginBottom: 16 }]}>
        <View style={{ flex: 1 }}>
          <Select
            label={t.security?.users?.company || "Empresa"}
            placeholder={
              t.security?.users?.selectCompany || "Selecciona una empresa"
            }
            value={selectedCompanyId}
            options={companies.map((comp) => ({
              value: comp.id,
              label: comp.name,
            }))}
            onSelect={(value) => handleCompanyChange(value as string)}
            searchable={companies.length > 5}
            required
          />
        </View>

        <View style={{ flex: 1 }}>
          <Select
            label={"Rol"}
            placeholder={t.security?.roles?.selectRole || "Selecciona un rol"}
            value={selectedRoleId}
            options={roles.map((role) => ({
              value: role.id,
              label: role.name,
            }))}
            onSelect={(value) => handleRoleChange(value as string)}
            searchable={roles.length > 5}
            disabled={!selectedCompanyId || loadingRoles}
            required
          />
        </View>
      </View>

      {/* Filtros locales para PermissionsManagementFlow */}
      <PermissionsFlowFilters
        menuItems={menuItems}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        selectedModule={selectedModule}
        onModuleChange={setSelectedModule}
        selectedAction={selectedAction}
        onActionChange={setSelectedAction}
        showDefaultOptions={showDefaultOptions}
        onShowDefaultOptionsChange={setShowDefaultOptions}
        showAll={showAll}
        onShowAllChange={setShowAll}
        onClearFilters={() => {
          setSearchValue("");
          setSelectedModule("");
          setSelectedAction("");
          setShowDefaultOptions(true);
        }}
      />

      {/* Componente de administración masiva de permisos */}
      {selectedRoleId && !loadingRolePermissions ? (
        <View style={[styles.dataTableContainer, { flex: 1 }]}>
          <PermissionsManagementFlow
            key={`${selectedRoleId}-${menuRefreshKey}-${rolePermissions.length}`}
            permissions={rolePermissions}
            roleId={selectedRoleId}
            searchValue={searchValue}
            selectedModule={selectedModule}
            selectedAction={selectedAction}
            showDefaultOptions={showDefaultOptions}
            showAll={showAll}
            onChanges={(changes) => {
              setPermissionChanges(changes);
            }}
            onMenuItemsLoaded={(items) => {
              setMenuItems(items);
            }}
          />
        </View>
      ) : selectedRoleId && loadingRolePermissions ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 40,
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText
            type="body2"
            variant="secondary"
            style={{ marginTop: 16, textAlign: "center" }}
          >
            Cargando permisos del rol...
          </ThemedText>
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 40,
          }}
        >
          <View style={{ alignItems: "center", gap: 16 }}>
            <Ionicons
              name="git-branch-outline"
              size={64}
              color={colors.textSecondary}
            />
            <ThemedText
              type="body1"
              style={{
                textAlign: "center",
                color: colors.textSecondary,
                maxWidth: 300,
              }}
            >
              {!selectedCompanyId
                ? t.security?.permissions?.selectCompany ||
                  "Selecciona una empresa para comenzar"
                : t.security?.permissions?.selectRole ||
                  "Selecciona un rol para ver y gestionar sus permisos"}
            </ThemedText>
          </View>
        </View>
      )}

      {/* Footer con botón de guardar */}
      {permissionChanges.length > 0 && (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.surfaceVariant ?? colors.surface,
              borderTopColor: colors.border,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
            },
          ]}
        >
          <ThemedText type="body2" style={{ color: colors.textSecondary }}>
            {pendingText}
          </ThemedText>
          <Button
            title={t.common?.save || "Guardar"}
            onPress={handleSaveChanges}
            variant="primary"
            size="md"
            disabled={savingChanges}
          >
            {savingChanges && (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
            )}
          </Button>
        </View>
      )}
    </View>
  );
}
