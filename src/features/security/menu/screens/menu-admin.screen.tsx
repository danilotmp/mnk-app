/**
 * Pantalla de administración del menú
 * Permite editar, crear y gestionar los items del menú del sistema
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tooltip } from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { APP_CONFIG } from '@/src/config/app.config';
import { DynamicIcon } from '@/src/domains/security/components/shared/dynamic-icon/dynamic-icon';
import { IconInput } from '@/src/domains/security/components/shared/icon-input/icon-input';
import { CustomSwitch } from '@/src/domains/shared/components/custom-switch/custom-switch';
import { useTranslation } from '@/src/infrastructure/i18n';
import type { Translations } from '@/src/infrastructure/i18n/types';
import { MenuService } from '@/src/infrastructure/menu/menu.service';
import { MenuItem } from '@/src/infrastructure/menu/types';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { Ionicons } from '@expo/vector-icons';
import { openBrowserAsync } from 'expo-web-browser';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { MenuAdminColumn, MenuAdminFormData, MenuAdminItem } from '../types';
import { createMenuAdminStyles } from './menu-admin.screen.styles';

export function MenuAdminScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const menuAdminTranslations = (t.security?.menuAdmin || {}) as NonNullable<NonNullable<Translations['security']>['menuAdmin']>;
  const { isMobile } = useResponsive();
  const alert = useAlert();
  const styles = createMenuAdminStyles(colors);

  const [menuItems, setMenuItems] = useState<MenuAdminItem[]>([]);
  const [originalMenuItems, setOriginalMenuItems] = useState<MenuAdminItem[]>([]); // Datos originales para comparar
  const [loading, setLoading] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState<string>('');
  const [showIconModal, setShowIconModal] = useState(false);
  const [iconModalItemId, setIconModalItemId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [dragOverColumnParentId, setDragOverColumnParentId] = useState<string | null>(null);
  const [showDropZone, setShowDropZone] = useState<string | null>(null); // ID del item sobre el cual mostrar el recuadro
  const draggingItemRef = useRef<string | null>(null);
  const dragOverItemRef = useRef<string | null>(null);
  const draggingColumnRef = useRef<string | null>(null);
  const dragOverColumnRef = useRef<string | null>(null);
  const dragOverColumnParentRef = useRef<string | null>(null);
  const dropZoneRef = useRef<string | null>(null); // Ref para detectar si se soltó sobre el recuadro
  const [formData, setFormData] = useState<MenuAdminFormData>({
    label: '',
    route: '',
    description: '',
    icon: '',
    isPublic: false,
    status: 1,
    order: 0,
  });
  const [validationErrors, setValidationErrors] = useState<{
    icon?: string;
    label?: string;
    route?: string;
  }>({});
  const [savingItem, setSavingItem] = useState(false);

  // Cargar items del menú
  const loadMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      // Solo cargar si estamos en la pantalla de administración (evitar llamadas innecesarias)
      const items = await MenuService.getMenu('es', false, true); // admin = true para administración
      const adminItems = convertToAdminItems(items);
      setMenuItems(adminItems);
      setOriginalMenuItems(JSON.parse(JSON.stringify(adminItems))); // Deep copy para comparar cambios
    } catch (error: any) {
      console.error('Error al cargar menú:', error);
      alert.showError(menuAdminTranslations.errorLoadingMenu || 'Error al cargar el menú');
    } finally {
      setLoading(false);
    }
  }, [alert]);

  // Solo cargar cuando el componente está montado y visible
  useEffect(() => {
    // Usar un pequeño delay para asegurar que el componente está completamente montado
    const timer = setTimeout(() => {
      loadMenuItems();
    }, 100);

    return () => clearTimeout(timer);
  }, []); // Solo ejecutar una vez al montar

  // Convertir MenuItem[] a MenuAdminItem[]
  const convertToAdminItems = (items: MenuItem[], level: number = 0, parentId?: string): MenuAdminItem[] => {
    return items.map((item, index) => {
      // Convertir status a número si viene como string, y usar valor por defecto si no viene
      const statusValue = item.status !== undefined && item.status !== null 
        ? Number(item.status) 
        : 1;
      
      return {
        id: item.id,
        label: item.label,
        route: item.route,
        description: item.description,
        icon: item.icon,
        isPublic: item.isPublic,
        status: statusValue, // Usar el status convertido a número
        order: index,
        level,
        parentId,
        submenu: item.submenu ? convertToAdminItems(item.submenu, level + 1, item.id) : undefined,
        columns: item.columns ? item.columns.map((col, colIndex) => ({
          id: `col-${item.id}-${colIndex}`,
          title: col.title,
          order: colIndex,
          parentId: item.id,
          items: convertToAdminItems(col.items, level + 1, item.id),
        })) : undefined,
      };
    });
  };

  // Verificar si algún hijo tiene estado pendiente (2)
  const hasChildWithPendingStatus = (item: MenuAdminItem): boolean => {
    // Verificar submenu
    if (item.submenu && item.submenu.length > 0) {
      for (const subItem of item.submenu) {
        if (subItem.status === 2) {
          return true;
        }
        // Verificar recursivamente
        if (hasChildWithPendingStatus(subItem)) {
          return true;
        }
      }
    }
    
    // Verificar columns
    if (item.columns && item.columns.length > 0) {
      for (const col of item.columns) {
        if (col.items && col.items.length > 0) {
          for (const colItem of col.items) {
            if (colItem.status === 2) {
              return true;
            }
            // Verificar recursivamente
            if (hasChildWithPendingStatus(colItem)) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  };

  // Toggle expandir/colapsar item
  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Iniciar edición de un item
  const startEdit = (item: MenuAdminItem) => {
    // Buscar el item actualizado del estado para asegurar que tenemos el valor más reciente
    const findItemById = (items: MenuAdminItem[], itemId: string): MenuAdminItem | null => {
      for (const currentItem of items) {
        if (currentItem.id === itemId) {
          return currentItem;
        }
        if (currentItem.submenu) {
          const found = findItemById(currentItem.submenu, itemId);
          if (found) return found;
        }
        if (currentItem.columns) {
          for (const col of currentItem.columns) {
            if (col.items) {
              const found = findItemById(col.items, itemId);
              if (found) return found;
            }
          }
        }
      }
      return null;
    };

    // Buscar el item actualizado del estado
    const currentItem = findItemById(menuItems, item.id) || item;
    
    // Asegurar que el status sea un número válido
    const statusValue = currentItem.status !== undefined && currentItem.status !== null 
      ? Number(currentItem.status) 
      : 1;
    
    setEditingItemId(currentItem.id);
    setFormData({
      label: currentItem.label,
      route: currentItem.route || '',
      description: currentItem.description || '',
      icon: currentItem.icon || '',
      isPublic: currentItem.isPublic || false,
      status: statusValue, // Usar el status convertido a número
      order: currentItem.order,
    });
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditingItemId(null);
    setFormData({
      label: '',
      route: '',
      description: '',
      icon: '',
      isPublic: false,
      status: 1,
      order: 0,
    });
    setValidationErrors({}); // Limpiar errores al cancelar
  };

  // Validar campos obligatorios
  const validateForm = (): boolean => {
    const errors: { icon?: string; label?: string; route?: string } = {};
    
    if (!formData.icon || formData.icon.trim() === '') {
      errors.icon = 'El icono es obligatorio';
    }
    
    if (!formData.label || formData.label.trim() === '') {
      errors.label = 'El nombre es obligatorio';
    }
    
    if (!formData.route || formData.route.trim() === '') {
      errors.route = 'La URL es obligatoria';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Guardar un item individual (para items nuevos)
  const saveSingleItem = async (itemId: string) => {
    if (!validateForm()) {
      alert.showError('Por favor, complete todos los campos obligatorios');
      return;
    }

    try {
      setSavingItem(true);
      
      // Encontrar el item y su padre
      const findItemAndParent = (items: MenuAdminItem[]): { item: MenuAdminItem; parent: MenuAdminItem | null } | null => {
        for (const item of items) {
          if (item.id === itemId) {
            return { item, parent: null };
          }
          if (item.submenu) {
            const found = item.submenu.find(sub => sub.id === itemId);
            if (found) {
              return { item: found, parent: item };
            }
            const recursive = findItemAndParent(item.submenu);
            if (recursive) return recursive;
          }
          if (item.columns) {
            for (const col of item.columns) {
              if (col.items) {
                const found = col.items.find(ci => ci.id === itemId);
                if (found) {
                  return { item: found, parent: item };
                }
                const recursive = findItemAndParent(col.items);
                if (recursive) return recursive;
              }
            }
          }
        }
        return null;
      };

      const result = findItemAndParent(menuItems);
      if (!result) {
        alert.showError('No se encontró el item a guardar');
        return;
      }

      const { item: foundItem, parent } = result;
      
      // Usar los valores actuales del formulario
      const item: MenuAdminItem = {
        ...foundItem,
        label: formData.label,
        route: formData.route,
        description: formData.description,
        icon: formData.icon,
        isPublic: formData.isPublic,
        status: formData.status,
        order: formData.order,
      };
      
      // Convertir a formato MenuItem para el backend
      const convertToMenuItem = (adminItem: MenuAdminItem, parentItem: MenuAdminItem | null): MenuItem => {
        const menuItem: any = {
          // Si es un item nuevo (ID empieza con 'new-'), no enviar el ID para que el backend lo cree
          ...(adminItem.id.startsWith('new-') ? {} : { id: adminItem.id }),
          label: adminItem.label,
          route: adminItem.route || '',
          order: adminItem.order,
          status: adminItem.status,
        };
        
        if (adminItem.description) menuItem.description = adminItem.description;
        if (adminItem.icon) menuItem.icon = adminItem.icon;
        if (adminItem.isPublic !== undefined) menuItem.isPublic = adminItem.isPublic;
        
        // Si tiene padre, incluirlo en la estructura anidada
        if (parentItem) {
          // Crear estructura con el padre y solo este hijo
          const parentMenuItem: any = {
            id: parentItem.id,
            label: parentItem.label,
            route: parentItem.route || '',
            order: parentItem.order,
          };
          
          if (parentItem.description) parentMenuItem.description = parentItem.description;
          if (parentItem.icon) parentMenuItem.icon = parentItem.icon;
          if (parentItem.isPublic !== undefined) parentMenuItem.isPublic = parentItem.isPublic;
          
          // Determinar si el item está en submenu o columns
          const isInSubmenu = parentItem.submenu?.some(s => s.id === adminItem.id);
          
          if (isInSubmenu) {
            parentMenuItem.submenu = [menuItem];
          } else {
            // Está en columns, encontrar la columna
            const column = parentItem.columns?.find(col => 
              col.items?.some(ci => ci.id === adminItem.id)
            );
            if (column) {
              parentMenuItem.columns = [{
                title: column.title,
                items: [menuItem],
              }];
            }
          }
          
          return parentMenuItem as MenuItem;
        }
        
        return menuItem as MenuItem;
      };

      const itemToSync = convertToMenuItem(item, parent);
      const itemsToSync = parent ? [itemToSync] : [itemToSync];
      
      const result_sync = await MenuService.syncMenuItems(itemsToSync);
      
      if (result_sync.result.statusCode === 200) {
        alert.showSuccess('Item guardado correctamente');
        
        // Recargar items para obtener los IDs actualizados del backend
        await loadMenuItems();
        
        // Cerrar el formulario de edición
        setEditingItemId(null);
        setValidationErrors({});
      } else {
        if (result_sync.result.details?.validationErrors) {
          const errors = result_sync.result.details.validationErrors;
          const errorMessages = errors.map((err: any) => err.error).join('\n');
          alert.showError(`Errores de validación:\n${errorMessages}`);
        } else {
          alert.showError(result_sync.result.description || 'Error al guardar el item');
        }
      }
    } catch (error: any) {
      console.error('Error al guardar item:', error);
      alert.showError(error.message || menuAdminTranslations.errorSavingMenu || 'Error al guardar el item');
    } finally {
      setSavingItem(false);
    }
  };

  // Actualizar item en el estado (para edición masiva)
  const updateItem = useCallback((itemId: string, updates: Partial<MenuAdminItem>) => {
    const updateItemsRecursive = (items: MenuAdminItem[]): MenuAdminItem[] => {
      return items.map(item => {
        if (item.id === itemId) {
          return { ...item, ...updates };
        }
        return {
          ...item,
          submenu: item.submenu ? updateItemsRecursive(item.submenu) : undefined,
          columns: item.columns ? item.columns.map(col => ({
            ...col,
            items: col.items ? updateItemsRecursive(col.items) : [],
          })) : undefined,
        };
      });
    };

    setMenuItems(prev => updateItemsRecursive(prev));
  }, []);

  // Abrir modal de selección de icono
  const openIconModal = (item: MenuAdminItem) => {
    setIconModalItemId(item.id);
    setFormData(prev => ({
      ...prev,
      icon: item.icon || '',
    }));
    setShowIconModal(true);
  };

  // Cerrar modal de icono y guardar
  const handleIconSelect = (iconValue: string) => {
    if (iconModalItemId) {
      // Actualizar el icono en el item correspondiente
      const updateItemIcon = (items: MenuAdminItem[], itemId: string, icon: string): MenuAdminItem[] => {
        return items.map(item => {
          if (item.id === itemId) {
            return { ...item, icon };
          }
          if (item.submenu) {
            return { ...item, submenu: updateItemIcon(item.submenu, itemId, icon) };
          }
          if (item.columns) {
            return {
              ...item,
              columns: item.columns.map(col => ({
                ...col,
                items: updateItemIcon(col.items, itemId, icon),
              })),
            };
          }
          return item;
        });
      };
      
      setMenuItems(prev => updateItemIcon(prev, iconModalItemId, iconValue));
      
      // Si está en modo edición, actualizar también el formData
      if (editingItemId === iconModalItemId) {
        setFormData(prev => ({ ...prev, icon: iconValue }));
      }
    }
    setShowIconModal(false);
    setIconModalItemId(null);
  };

  // Detectar items modificados comparando con datos originales
  const getModifiedItems = useCallback((): Set<string> => {
    const modifiedIds = new Set<string>();
    
    const compareItems = (current: MenuAdminItem[], original: MenuAdminItem[]): void => {
      const originalMap = new Map(original.map(item => [item.id, item]));
      
      current.forEach(item => {
        const originalItem = originalMap.get(item.id);
        
        if (!originalItem) {
          // Item nuevo
          modifiedIds.add(item.id);
        } else {
          // Comparar campos relevantes
          if (
            item.label !== originalItem.label ||
            item.route !== originalItem.route ||
            item.description !== originalItem.description ||
            item.icon !== originalItem.icon ||
            item.isPublic !== originalItem.isPublic ||
            item.status !== originalItem.status ||
            item.order !== originalItem.order ||
            item.parentId !== originalItem.parentId
          ) {
            modifiedIds.add(item.id);
          }
        }
        
        // Comparar estructura de columns
        const currentColumns = item.columns || [];
        const originalColumns = originalItem?.columns || [];
        
        // Si la cantidad de columnas cambió, el padre está modificado
        if (currentColumns.length !== originalColumns.length) {
          modifiedIds.add(item.id);
        }
        
        // Comparar cada columna
        currentColumns.forEach((col, colIndex) => {
          const originalCol = originalItem?.columns?.[colIndex];
          
          // Si la columna no existe en original, es nueva (padre modificado)
          if (!originalCol) {
            modifiedIds.add(item.id);
            // Marcar todos los items de la nueva columna como modificados
            col.items?.forEach(colItem => {
              modifiedIds.add(colItem.id);
            });
          } else {
            // Comparar título y orden de la columna
            if (col.title !== originalCol.title || col.order !== originalCol.order) {
              modifiedIds.add(item.id);
            }
            
            // Comparar items dentro de la columna
            if (col.items && originalCol.items) {
              compareItems(col.items, originalCol.items);
            } else if (col.items && col.items.length > 0) {
              // Si la columna tiene items pero la original no, todos los items son nuevos
              col.items.forEach(colItem => {
                modifiedIds.add(colItem.id);
              });
              modifiedIds.add(item.id);
            }
          }
        });
        
        // Comparar recursivamente submenu
        if (item.submenu && originalItem?.submenu) {
          compareItems(item.submenu, originalItem.submenu);
        }
        
        // Detectar items que se movieron de submenu a columnas o viceversa
        const currentSubmenuIds = new Set((item.submenu || []).map(sub => sub.id));
        const originalSubmenuIds = new Set((originalItem?.submenu || []).map(sub => sub.id));
        
        // Crear un set de IDs de items en columnas actuales
        const currentColumnItemIds = new Set<string>();
        currentColumns.forEach(col => {
          col.items?.forEach(colItem => {
            currentColumnItemIds.add(colItem.id);
          });
        });
        
        // Crear un set de IDs de items en columnas originales
        const originalColumnItemIds = new Set<string>();
        originalColumns.forEach(col => {
          col.items?.forEach(colItem => {
            originalColumnItemIds.add(colItem.id);
          });
        });
        
        // Si un item estaba en submenu y ahora está en columnas (o viceversa), está modificado
        currentSubmenuIds.forEach(itemId => {
          if (originalColumnItemIds.has(itemId)) {
            modifiedIds.add(itemId);
            modifiedIds.add(item.id);
          }
        });
        
        currentColumnItemIds.forEach(itemId => {
          if (originalSubmenuIds.has(itemId)) {
            modifiedIds.add(itemId);
            modifiedIds.add(item.id);
          }
        });
      });
    };
    
    compareItems(menuItems, originalMenuItems);
    return modifiedIds;
  }, [menuItems, originalMenuItems]);

  // Verificar si hay cambios pendientes
  const hasUnsavedChanges = getModifiedItems().size > 0;

  // Extraer items modificados manteniendo la estructura jerárquica
  // Función recursiva simple que procesa items y sus hijos
  const extractModifiedItems = useCallback((items: MenuAdminItem[], modifiedIds: Set<string>): MenuAdminItem[] => {
    if (!items || items.length === 0) {
      return [];
    }
    
    return items
      .map(item => {
        const isItemModified = modifiedIds.has(item.id);
        
        // Procesar submenu recursivamente
        let processedSubmenu: MenuAdminItem[] | undefined = undefined;
        if (item.submenu && item.submenu.length > 0) {
          const submenuResult = extractModifiedItems(item.submenu, modifiedIds);
          if (submenuResult.length > 0) {
            processedSubmenu = submenuResult;
          }
        }
        
        // Procesar columns recursivamente
        let processedColumns: MenuAdminColumn[] | undefined = undefined;
        if (item.columns && item.columns.length > 0) {
          const columnsResult = item.columns
            .map(col => {
              const colItemsResult = extractModifiedItems(col.items, modifiedIds);
              if (colItemsResult.length > 0) {
                return {
                  ...col,
                  items: colItemsResult,
                };
              }
              return null;
            })
            .filter((col): col is MenuAdminColumn => col !== null);
          
          if (columnsResult.length > 0) {
            processedColumns = columnsResult;
          }
        }
        
        // Si el item está modificado o tiene hijos modificados, incluirlo
        if (isItemModified || processedSubmenu || processedColumns) {
          const result: MenuAdminItem = { ...item };
          
          // Si el padre está modificado, incluir TODA su estructura actual
          // Copiar directamente sin filtrar (queremos TODOS los items)
          if (isItemModified) {
            // Función auxiliar recursiva para copiar items completos
            const copyItemRecursive = (sourceItem: MenuAdminItem): MenuAdminItem => {
              const copied: MenuAdminItem = { ...sourceItem };
              
              if (sourceItem.submenu && sourceItem.submenu.length > 0) {
                copied.submenu = sourceItem.submenu.map(copyItemRecursive);
              }
              
              if (sourceItem.columns && sourceItem.columns.length > 0) {
                copied.columns = sourceItem.columns.map(col => ({
                  ...col,
                  items: col.items.map(copyItemRecursive),
                }));
              }
              
              return copied;
            };
            
            // Incluir submenu completo (copiar todos los items)
            if (item.submenu && item.submenu.length > 0) {
              result.submenu = item.submenu.map(copyItemRecursive);
            } else {
              delete result.submenu;
            }
            
            // Incluir columns completo (copiar todos los items)
            if (item.columns && item.columns.length > 0) {
              result.columns = item.columns.map(col => ({
                ...col,
                items: col.items.map(copyItemRecursive),
              })).filter(col => col.items && col.items.length > 0);
              
              if (result.columns.length === 0) {
                delete result.columns;
              }
            } else {
              delete result.columns;
            }
          } else {
            // Si el padre no está modificado, solo incluir hijos modificados
            if (processedSubmenu) {
              result.submenu = processedSubmenu;
            } else {
              delete result.submenu;
            }
            if (processedColumns) {
              result.columns = processedColumns;
            } else {
              delete result.columns;
            }
          }
          
          return result;
        }
        
        return null;
      })
      .filter((item): item is MenuAdminItem => item !== null);
  }, []);

  // Cancelar cambios y restaurar estado original
  const handleCancelChanges = () => {
    // Restaurar items originales
    setMenuItems(JSON.parse(JSON.stringify(originalMenuItems)));
    // Cerrar cualquier edición abierta
    setEditingItemId(null);
    // Limpiar errores de validación
    setValidationErrors({});
  };

  // Guardar cambios masivamente
  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges) {
      return;
    }

    try {
      setSavingChanges(true);

      // Obtener IDs de items modificados
      const modifiedIds = getModifiedItems();
      
      // Extraer items modificados manteniendo la estructura jerárquica
      // El backend necesita la estructura anidada (submenu/columns) para preservar parentId
      const modifiedMenuItems = extractModifiedItems(menuItems, modifiedIds);

      // Convertir MenuAdminItem[] a MenuItem[] para enviar al backend
      // IMPORTANTE: El backend espera estructura anidada (submenu/columns) para preservar parentId
      // Un item puede tener TANTO submenu COMO columns al mismo tiempo
      const convertToMenuItems = (items: MenuAdminItem[]): MenuItem[] => {
        if (!items || !Array.isArray(items) || items.length === 0) {
          return [];
        }
        
        const result: MenuItem[] = [];
        
        items.forEach(item => {
          // Validar que el item tenga las propiedades mínimas requeridas
          if (!item || !item.id || item.label === undefined) {
            console.warn('Item inválido encontrado:', item);
            return;
          }
          
          // Crear item base
          const menuItem: any = {
            id: item.id,
            label: item.label,
            order: item.order !== undefined ? item.order : 0,
          };
          
          // Solo incluir propiedades si tienen valor (excepto isPublic que puede ser false)
          if (item.route) menuItem.route = item.route;
          if (item.description) menuItem.description = item.description;
          if (item.icon) menuItem.icon = item.icon;
          if (item.isPublic !== undefined) menuItem.isPublic = item.isPublic;
          
          // IMPORTANTE: Un item puede tener TANTO submenu COMO columns al mismo tiempo
          // Procesar submenu recursivamente
          if (item.submenu && Array.isArray(item.submenu) && item.submenu.length > 0) {
            const convertedSubmenu = convertToMenuItems(item.submenu);
            // Asegurar que sea un array válido (no undefined ni null)
            if (convertedSubmenu && Array.isArray(convertedSubmenu) && convertedSubmenu.length > 0) {
              menuItem.submenu = convertedSubmenu;
            }
          }
          
          // Procesar columns recursivamente
          // Un item puede tener columns Y submenu simultáneamente
          if (item.columns && Array.isArray(item.columns) && item.columns.length > 0) {
            const processedColumns: Array<{ title: string; items: MenuItem[] }> = [];
            
            item.columns.forEach(col => {
              // Validar que la columna tenga título e items
              if (!col || !col.title || !col.items || !Array.isArray(col.items) || col.items.length === 0) {
                return;
              }
              
              // Convertir los items de la columna recursivamente
              const convertedColItems = convertToMenuItems(col.items);
              
              // Validar que la conversión devolvió un array válido con items
              if (convertedColItems && Array.isArray(convertedColItems) && convertedColItems.length > 0) {
                processedColumns.push({
                  title: col.title,
                  items: convertedColItems,
                });
              }
            });
            
            // Solo incluir columns si tiene al menos una columna con items válidos
            if (processedColumns.length > 0) {
              menuItem.columns = processedColumns;
            }
          }
          
          result.push(menuItem as MenuItem);
        });
        
        return result;
      };

      // IMPORTANTE: Enviar solo los items modificados (el backend espera solo los modificados)
      const itemsToSync = convertToMenuItems(modifiedMenuItems);

      const result = await MenuService.syncMenuItems(itemsToSync);

      if (result.result.statusCode === 200) {
        const summary = result.data.summary;
        const summaryMessage = `${summary.created > 0 ? `${summary.created} creado${summary.created > 1 ? 's' : ''}` : ''}${summary.created > 0 && summary.updated > 0 ? ', ' : ''}${summary.updated > 0 ? `${summary.updated} actualizado${summary.updated > 1 ? 's' : ''}` : ''}${(summary.created > 0 || summary.updated > 0) && summary.activated > 0 ? ', ' : ''}${summary.activated > 0 ? `${summary.activated} reactivado${summary.activated > 1 ? 's' : ''}` : ''}`;
        const successMessage = `Menú actualizado correctamente${summaryMessage ? `\n(${summaryMessage})` : ''}`;
        alert.showSuccess(successMessage);

        // Recargar items para obtener los IDs actualizados del backend
        // Esto actualiza tanto menuItems como originalMenuItems
        await loadMenuItems();
      } else {
        // Manejar errores de validación
        if (result.result.details?.validationErrors) {
          const errors = result.result.details.validationErrors;
          const errorMessages = errors.map((err: any) => err.error).join('\n');
          alert.showError(`Errores de validación:\n${errorMessages}`);
        } else {
          alert.showError(result.result.description || menuAdminTranslations.errorSavingMenu || 'Error al guardar los cambios');
        }
      }
    } catch (error: any) {
      console.error('Error al guardar cambios:', error);
      alert.showError(error.message || menuAdminTranslations.errorSavingMenu || 'Error al guardar el item');
    } finally {
      setSavingChanges(false);
    }
  };

  // Guardar cambios (método antiguo - mantener por compatibilidad)
  const saveItem = async (itemId: string) => {
    // Ya no se usa, se guarda masivamente con handleSaveChanges
    setEditingItemId(null);
  };

  // Agregar nodo hijo
  // Agregar un nuevo item en el nivel raíz
  const addRootItem = () => {
    const newItemId = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newOrder = menuItems.length; // El orden será el último
    
    const newItem: MenuAdminItem = {
      id: newItemId,
      label: '',
      route: '',
      description: '',
      icon: '',
      isPublic: false,
      status: 2, // Pendiente
      order: newOrder,
      level: 0, // Nivel raíz
      parentId: undefined,
    };
    
    setMenuItems(prev => [...prev, newItem]);
    
    // Abrir el formulario de edición con los valores por defecto
    setEditingItemId(newItemId);
    setFormData({
      label: '',
      route: '',
      description: '',
      icon: '',
      isPublic: false,
      status: 2, // Pendiente
      order: newOrder,
    });
    setValidationErrors({});
    
    // Hacer scroll al final para ver el nuevo item
    // Esto se puede hacer con un ref al ScrollView si es necesario
  };

  // Agregar una nueva columna vacía
  const addNewColumn = (parentId: string) => {
    const findParentAndAddColumn = (items: MenuAdminItem[]): MenuAdminItem[] => {
      return items.map(item => {
        if (item.id === parentId) {
          const newColumnId = `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Recalcular el order de las columnas existentes (incrementar en 1)
          const existingColumns = item.columns || [];
          const updatedColumns = existingColumns.map(col => ({
            ...col,
            order: col.order + 1,
          }));
          
          const newColumn: MenuAdminColumn = {
            id: newColumnId,
            title: 'Nuevo Agrupamiento',
            order: 0, // Nueva columna al inicio (order 0)
            items: [],
            parentId: parentId,
          };
          
          return {
            ...item,
            columns: [newColumn, ...updatedColumns], // Nueva columna al inicio
          };
        }
        
        // Buscar recursivamente en submenu y columns
        return {
          ...item,
          submenu: item.submenu ? findParentAndAddColumn(item.submenu) : undefined,
          columns: item.columns ? item.columns.map(col => ({
            ...col,
            items: col.items ? findParentAndAddColumn(col.items) : [],
          })) : undefined,
        };
      });
    };
    
    setMenuItems(prev => {
      const updated = findParentAndAddColumn(prev);
      // Expandir el padre para que se vea la nueva columna
      setExpandedItems(prevExpanded => new Set([...prevExpanded, parentId]));
      return updated;
    });
  };

  // Agregar item a una columna específica
  const addItemToColumn = (parentId: string, columnId: string) => {
    let newItemId: string | null = null;
    
    const findParentAndAddToColumn = (items: MenuAdminItem[]): MenuAdminItem[] => {
      return items.map(item => {
        if (item.id === parentId && item.columns) {
          const parentLevel = item.level || 0;
          const newLevel = parentLevel + 1;
          
          const updatedColumns = item.columns.map(col => {
            if (col.id === columnId) {
              newItemId = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const newItem: MenuAdminItem = {
                id: newItemId,
                label: '',
                route: '',
                description: '',
                icon: '',
                isPublic: false,
                status: 2, // Pendiente
                order: col.items?.length || 0,
                level: newLevel,
                parentId: parentId,
              };
              return {
                ...col,
                items: [...(col.items || []), newItem],
              };
            }
            return col;
          });
          
          return {
            ...item,
            columns: updatedColumns,
          };
        }
        
        // Buscar recursivamente en submenu y columns
        return {
          ...item,
          submenu: item.submenu ? findParentAndAddToColumn(item.submenu) : undefined,
          columns: item.columns ? item.columns.map(col => ({
            ...col,
            items: col.items ? findParentAndAddToColumn(col.items) : [],
          })) : undefined,
        };
      });
    };
    
    setMenuItems(prev => {
      const updated = findParentAndAddToColumn(prev);
      
      if (newItemId) {
        // Expandir el padre para que se vea el nuevo item
        setExpandedItems(prevExpanded => new Set([...prevExpanded, parentId]));
        
        // Abrir el formulario de edición con los valores por defecto
        setEditingItemId(newItemId);
        setFormData({
          label: '',
          route: '/',
          description: '',
          icon: '',
          isPublic: false,
          status: 2, // Pendiente
          order: 0,
        });
        setValidationErrors({});
      }
      
      return updated;
    });
  };

  // Actualizar el título de una columna
  const updateColumnTitle = (parentId: string, columnId: string, newTitle: string) => {
    const findParentAndUpdateColumn = (items: MenuAdminItem[]): MenuAdminItem[] => {
      return items.map(item => {
        if (item.id === parentId && item.columns) {
          const updatedColumns = item.columns.map(col => {
            if (col.id === columnId) {
              return {
                ...col,
                title: newTitle,
              };
            }
            return col;
          });
          
          return {
            ...item,
            columns: updatedColumns,
          };
        }
        
        // Buscar recursivamente en submenu y columns
        return {
          ...item,
          submenu: item.submenu ? findParentAndUpdateColumn(item.submenu) : undefined,
          columns: item.columns ? item.columns.map(col => ({
            ...col,
            items: col.items ? findParentAndUpdateColumn(col.items) : [],
          })) : undefined,
        };
      });
    };
    
    setMenuItems(prev => findParentAndUpdateColumn(prev));
    setEditingColumnId(null);
    setEditingColumnTitle('');
  };

  // Iniciar edición del título de una columna
  const startEditColumnTitle = (parentId: string, columnId: string, currentTitle: string) => {
    setEditingColumnId(columnId);
    setEditingColumnTitle(currentTitle);
  };

  // Eliminar una columna y mover sus items al submenu del padre
  const deleteColumnAndMoveItemsToSubmenu = (parentId: string, columnId: string) => {
    const findParentAndDeleteColumn = (items: MenuAdminItem[]): MenuAdminItem[] => {
      return items.map(item => {
        if (item.id === parentId && item.columns) {
          // Encontrar la columna a eliminar
          const columnToDelete = item.columns.find(col => col.id === columnId);
          if (columnToDelete && columnToDelete.items) {
            // Mover los items de la columna al submenu del padre
            const itemsToMove = columnToDelete.items.map(colItem => ({
              ...colItem,
              // Ajustar el nivel (mismo nivel que tendrían en submenu)
              level: item.level + 1,
              // Ajustar el order (agregar al final del submenu)
              order: (item.submenu?.length || 0) + colItem.order,
              // El parentId ya es correcto (es el id del padre)
            }));

            // Eliminar la columna y agregar sus items al submenu
            const updatedColumns = item.columns.filter(col => col.id !== columnId);
            const updatedSubmenu = [...(item.submenu || []), ...itemsToMove];

            return {
              ...item,
              columns: updatedColumns.length > 0 ? updatedColumns : undefined,
              submenu: updatedSubmenu,
            };
          }
        }
        
        // Buscar recursivamente en submenu y columns
        return {
          ...item,
          submenu: item.submenu ? findParentAndDeleteColumn(item.submenu) : undefined,
          columns: item.columns ? item.columns.map(col => ({
            ...col,
            items: col.items ? findParentAndDeleteColumn(col.items) : [],
          })) : undefined,
        };
      });
    };
    
    setMenuItems(prev => findParentAndDeleteColumn(prev));
  };

  const addChildNode = (parentId: string, type: 'submenu' | 'column') => {
    let newItemId: string | null = null;
    
    const findParentAndAdd = (items: MenuAdminItem[]): MenuAdminItem[] => {
      return items.map(item => {
        if (item.id === parentId) {
          // Encontrar el padre, agregar el nuevo item
          newItemId = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const parentLevel = item.level || 0;
          const newLevel = parentLevel + 1;
          
          // Calcular el order basado en la cantidad de hijos existentes
          let newOrder = 0;
          if (type === 'submenu') {
            newOrder = item.submenu?.length || 0;
          } else {
            // Para columns, agregamos a la primera columna si existe
            if (item.columns && item.columns.length > 0) {
              newOrder = item.columns[0]?.items?.length || 0;
            }
          }
          
          const newItem: MenuAdminItem = {
            id: newItemId,
            label: '',
            route: '',
            description: '',
            icon: '',
            isPublic: false,
            status: 2, // Pendiente
            order: newOrder,
            level: newLevel,
            parentId: parentId,
          };
          
          if (type === 'submenu') {
            const updatedSubmenu = [...(item.submenu || []), newItem];
            return {
              ...item,
              submenu: updatedSubmenu,
            };
          } else {
            // Agregar a la primera columna (o crear una nueva si no existe)
            if (!item.columns || item.columns.length === 0) {
              const newColumnId = `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const newColumn: MenuAdminColumn = {
                id: newColumnId,
                title: 'Nuevo Agrupamiento',
                order: 0,
                items: [newItem],
                parentId: parentId,
              };
              return {
                ...item,
                columns: [newColumn],
              };
            } else {
              const updatedColumns = item.columns.map((col, colIndex) => {
                if (colIndex === 0) {
                  return {
                    ...col,
                    items: [...(col.items || []), newItem],
                  };
                }
                return col;
              });
              return {
                ...item,
                columns: updatedColumns,
              };
            }
          }
        }
        
        // Buscar recursivamente en submenu y columns
        return {
          ...item,
          submenu: item.submenu ? findParentAndAdd(item.submenu) : undefined,
          columns: item.columns ? item.columns.map(col => ({
            ...col,
            items: col.items ? findParentAndAdd(col.items) : [],
          })) : undefined,
        };
      });
    };
    
    setMenuItems(prev => {
      const updated = findParentAndAdd(prev);
      
      if (newItemId) {
        // Expandir el padre para que se vea el nuevo item
        setExpandedItems(prevExpanded => new Set([...prevExpanded, parentId]));
        
        // Abrir el formulario de edición con los valores por defecto
        setEditingItemId(newItemId);
        setFormData({
          label: '',
          route: '',
          description: '',
          icon: '',
          isPublic: false,
          status: 2, // Pendiente
          order: 0, // Se calculará cuando se guarde
        });
      }
      
      return updated;
    });
  };

  // Función para encontrar un item por ID en la estructura jerárquica
  const findItemById = (items: MenuAdminItem[], itemId: string): { item: MenuAdminItem; parent: MenuAdminItem[]; index: number } | null => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === itemId) {
        return { item: items[i], parent: items, index: i };
      }
      const submenu = items[i].submenu;
      if (submenu && submenu.length > 0) {
        const found = findItemById(submenu, itemId);
        if (found) return found;
      }
      const columns = items[i].columns;
      if (columns && columns.length > 0) {
        for (const column of columns) {
          const columnItems = column.items;
          if (columnItems && columnItems.length > 0) {
            const found = findItemById(columnItems, itemId);
            if (found) return found;
          }
        }
      }
    }
    return null;
  };

  // Función para reordenar columnas
  const reorderColumns = useCallback((parentId: string, draggedColumnId: string, targetColumnId: string) => {
    if (draggedColumnId === targetColumnId) return;

    setMenuItems(prev => {
      const findParentAndReorderColumns = (items: MenuAdminItem[]): MenuAdminItem[] => {
        return items.map(item => {
          if (item.id === parentId && item.columns && item.columns.length > 0) {
            const draggedIndex = item.columns.findIndex(col => col.id === draggedColumnId);
            const targetIndex = item.columns.findIndex(col => col.id === targetColumnId);

            if (draggedIndex !== -1 && targetIndex !== -1) {
              const newColumns = [...item.columns];
              // Remover la columna arrastrada
              const [draggedColumn] = newColumns.splice(draggedIndex, 1);
              
              // Insertar en la nueva posición
              const newTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
              newColumns.splice(newTargetIndex, 0, draggedColumn);

              // Recalcular order para TODAS las columnas
              const updatedColumns = newColumns.map((col, index) => ({
                ...col,
                order: index, // Recalcular order basado en la nueva posición
              }));

              return {
                ...item,
                columns: updatedColumns,
              };
            }
          }
          
          // Buscar recursivamente en submenu y columns
          return {
            ...item,
            submenu: item.submenu ? findParentAndReorderColumns(item.submenu) : undefined,
            columns: item.columns ? item.columns.map(col => ({
              ...col,
              items: col.items ? findParentAndReorderColumns(col.items) : [],
            })) : undefined,
          };
        });
      };

      return findParentAndReorderColumns(prev);
    });
  }, []);

  // Función para encontrar un item y su contexto (padre, nivel, etc.)
  const findItemContext = (items: MenuAdminItem[], itemId: string, parent: MenuAdminItem | null = null, level: number = 0): { item: MenuAdminItem; parent: MenuAdminItem | null; parentItems: MenuAdminItem[]; index: number; level: number; location: 'root' | 'submenu' | 'column'; columnId?: string } | null => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === itemId) {
        return { item: items[i], parent, parentItems: items, index: i, level, location: parent ? 'submenu' : 'root' };
      }
      
      // Buscar en submenu
      const submenu = items[i].submenu;
      if (submenu && submenu.length > 0) {
        const found = findItemContext(submenu, itemId, items[i], level + 1);
        if (found) return found;
      }
      
      // Buscar en columns
      const columns = items[i].columns;
      if (columns && columns.length > 0) {
        for (const column of columns) {
          const columnItems = column.items;
          if (columnItems && columnItems.length > 0) {
            const found = findItemContext(columnItems, itemId, items[i], level + 1);
            if (found) {
              return { ...found, location: 'column' as const, columnId: column.id };
            }
          }
        }
      }
    }
    return null;
  };

  // Función para remover un item de su ubicación actual
  const removeItemFromLocation = (items: MenuAdminItem[], itemId: string): MenuAdminItem[] => {
    return items.map(item => {
      // Remover del submenu si está ahí
      if (item.submenu && item.submenu.some(sub => sub.id === itemId)) {
        return {
          ...item,
          submenu: item.submenu.filter(sub => sub.id !== itemId),
        };
      }
      
      // Remover de las columnas si está ahí
      if (item.columns && item.columns.some(col => col.items.some(ci => ci.id === itemId))) {
        return {
          ...item,
          columns: item.columns.map(col => ({
            ...col,
            items: col.items.filter(ci => ci.id !== itemId),
          })),
        };
      }
      
      // Buscar recursivamente
      return {
        ...item,
        submenu: item.submenu ? removeItemFromLocation(item.submenu, itemId) : undefined,
        columns: item.columns ? item.columns.map(col => ({
          ...col,
          items: removeItemFromLocation(col.items, itemId),
        })) : undefined,
      };
    }).filter(item => item.id !== itemId); // Remover si es el item raíz
  };

  // Función para agregar un item a una nueva ubicación
  const addItemToLocation = (items: MenuAdminItem[], targetId: string, draggedItem: MenuAdminItem, insertIndex?: number): MenuAdminItem[] => {
    return items.map(item => {
      // Si el target es este item, agregar como hijo en submenu
      if (item.id === targetId) {
        const newItem = {
          ...draggedItem,
          parentId: targetId,
          level: item.level + 1,
          order: insertIndex !== undefined ? insertIndex : (item.submenu?.length || 0),
        };
        
        const updatedSubmenu = [...(item.submenu || [])];
        if (insertIndex !== undefined) {
          updatedSubmenu.splice(insertIndex, 0, newItem);
        } else {
          updatedSubmenu.push(newItem);
        }
        
        // Recalcular orders
        const reorderedSubmenu = updatedSubmenu.map((sub, idx) => ({
          ...sub,
          order: idx,
        }));
        
        return {
          ...item,
          submenu: reorderedSubmenu,
        };
      }
      
      // Si el target está en el submenu de este item
      if (item.submenu && item.submenu.some(sub => sub.id === targetId)) {
        const targetIndex = item.submenu.findIndex(sub => sub.id === targetId);
        const newItem = {
          ...draggedItem,
          parentId: item.id,
          level: item.level + 1,
          order: insertIndex !== undefined ? insertIndex : targetIndex,
        };
        
        const updatedSubmenu = [...item.submenu];
        if (insertIndex !== undefined) {
          updatedSubmenu.splice(insertIndex, 0, newItem);
        } else {
          updatedSubmenu.splice(targetIndex, 0, newItem);
        }
        
        // Recalcular orders
        const reorderedSubmenu = updatedSubmenu.map((sub, idx) => ({
          ...sub,
          order: idx,
        }));
        
        return {
          ...item,
          submenu: reorderedSubmenu,
        };
      }
      
      // Si el target está en una columna de este item
      if (item.columns) {
        for (let colIndex = 0; colIndex < item.columns.length; colIndex++) {
          const column = item.columns[colIndex];
          if (column.items.some(ci => ci.id === targetId)) {
            const targetIndex = column.items.findIndex(ci => ci.id === targetId);
            const newItem = {
              ...draggedItem,
              parentId: item.id,
              level: item.level + 1,
              order: insertIndex !== undefined ? insertIndex : targetIndex,
            };
            
            const updatedItems = [...column.items];
            if (insertIndex !== undefined) {
              updatedItems.splice(insertIndex, 0, newItem);
            } else {
              updatedItems.splice(targetIndex, 0, newItem);
            }
            
            // Recalcular orders
            const reorderedItems = updatedItems.map((ci, idx) => ({
              ...ci,
              order: idx,
            }));
            
            const updatedColumns = [...item.columns];
            updatedColumns[colIndex] = {
              ...column,
              items: reorderedItems,
            };
            
            return {
              ...item,
              columns: updatedColumns,
            };
          }
        }
      }
      
      // Buscar recursivamente
      return {
        ...item,
        submenu: item.submenu ? addItemToLocation(item.submenu, targetId, draggedItem, insertIndex) : undefined,
        columns: item.columns ? item.columns.map(col => ({
          ...col,
          items: addItemToLocation(col.items, targetId, draggedItem, insertIndex),
        })) : undefined,
      };
    });
  };

  // Función para agregar un item arrastrado a una columna específica
  const addDraggedItemToColumn = (items: MenuAdminItem[], parentId: string, columnId: string, draggedItem: MenuAdminItem, insertIndex?: number): MenuAdminItem[] => {
    return items.map(item => {
      if (item.id === parentId && item.columns) {
        const updatedColumns = item.columns.map(col => {
          if (col.id === columnId) {
            const newItem = {
              ...draggedItem,
              parentId: parentId,
              level: item.level + 1,
              order: insertIndex !== undefined ? insertIndex : col.items.length,
            };
            
            const updatedItems = [...col.items];
            if (insertIndex !== undefined) {
              updatedItems.splice(insertIndex, 0, newItem);
            } else {
              updatedItems.push(newItem);
            }
            
            // Recalcular orders
            const reorderedItems = updatedItems.map((ci, idx) => ({
              ...ci,
              order: idx,
            }));
            
            return {
              ...col,
              items: reorderedItems,
            };
          }
          return col;
        });
        
        return {
          ...item,
          columns: updatedColumns,
        };
      }
      
      return {
        ...item,
        submenu: item.submenu ? addDraggedItemToColumn(item.submenu, parentId, columnId, draggedItem, insertIndex) : undefined,
        columns: item.columns ? item.columns.map(col => ({
          ...col,
          items: col.items ? addDraggedItemToColumn(col.items, parentId, columnId, draggedItem, insertIndex) : [],
        })) : undefined,
      };
    });
  };

  // Función mejorada para reordenar/mover items (soporta cambio de padre)
  const reorderItems = useCallback((draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    setMenuItems(prev => {
      // Encontrar el contexto del item arrastrado
      const draggedContext = findItemContext(prev, draggedId);
      if (!draggedContext) return prev;
      
      // Encontrar el contexto del item objetivo
      const targetContext = findItemContext(prev, targetId);
      if (!targetContext) return prev;
      
      const draggedItem = draggedContext.item;
      
      // Si están en el mismo padre y mismo nivel, solo reordenar
      if (draggedContext.parent?.id === targetContext.parent?.id && 
          draggedContext.location === targetContext.location &&
          draggedContext.columnId === targetContext.columnId) {
        const findAndReorder = (items: MenuAdminItem[], parentLevel: number = 0): MenuAdminItem[] => {
          const draggedIndex = items.findIndex(i => i.id === draggedId);
          const targetIndex = items.findIndex(i => i.id === targetId);

          if (draggedIndex !== -1 && targetIndex !== -1) {
            const newItems = [...items];
            const [dragged] = newItems.splice(draggedIndex, 1);
            const newTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
            newItems.splice(newTargetIndex, 0, dragged);

            return newItems.map((item, index) => ({
              ...item,
              order: index,
              submenu: item.submenu ? findAndReorder(item.submenu, parentLevel + 1) : undefined,
              columns: item.columns ? item.columns.map(col => ({
                ...col,
                items: col.items ? findAndReorder(col.items, parentLevel + 1) : col.items,
              })) : undefined,
            }));
          }

          return items.map((item, index) => ({
            ...item,
            order: index,
            submenu: item.submenu ? findAndReorder(item.submenu, parentLevel + 1) : undefined,
            columns: item.columns ? item.columns.map(col => ({
              ...col,
              items: col.items ? findAndReorder(col.items, parentLevel + 1) : col.items,
            })) : undefined,
          }));
        };

        // Aplicar reordenamiento según la ubicación
        if (draggedContext.location === 'column' && draggedContext.columnId && draggedContext.parent) {
          return prev.map(item => {
            if (item.id === draggedContext.parent!.id && item.columns) {
              return {
                ...item,
                columns: item.columns.map(col => {
                  if (col.id === draggedContext.columnId) {
                    return {
                      ...col,
                      items: findAndReorder(col.items, draggedContext.level),
                    };
                  }
                  return col;
                }),
              };
            }
            return item;
          });
        } else if (draggedContext.parent) {
          return prev.map(item => {
            if (item.id === draggedContext.parent!.id) {
              return {
                ...item,
                submenu: findAndReorder(item.submenu || [], draggedContext.level),
              };
            }
            return item;
          });
        } else {
          return findAndReorder(prev);
        }
      }
      
      // Si están en diferentes padres, mover el item
      // Primero remover el item de su ubicación actual
      let updated = removeItemFromLocation(prev, draggedId);
      
      // Determinar dónde agregar el item
      // Si el target está en una columna, agregar a esa columna (no como hermano)
      if (targetContext.location === 'column' && targetContext.columnId && targetContext.parent) {
        // Agregar al final de la columna (o en la posición del target si se especifica)
        updated = addDraggedItemToColumn(updated, targetContext.parent.id, targetContext.columnId, draggedItem, targetContext.index);
      } else if (targetContext.parent) {
        // Si el target tiene un padre, verificar si el padre tiene columnas
        // Si el padre tiene columnas y el target no está en una columna, agregar a la primera columna
        const parentItem = prev.find(item => item.id === targetContext.parent!.id) || 
                          prev.flatMap(item => item.submenu || []).find(sub => sub.id === targetContext.parent!.id) ||
                          prev.flatMap(item => item.columns?.flatMap(col => col.items) || []).find(ci => ci.id === targetContext.parent!.id);
        
        if (parentItem && parentItem.columns && parentItem.columns.length > 0) {
          // El padre tiene columnas, agregar a la primera columna
          updated = addDraggedItemToColumn(updated, targetContext.parent.id, parentItem.columns[0].id, draggedItem);
        } else {
          // Agregar como hermano del target (mismo nivel)
          updated = addItemToLocation(updated, targetContext.parent.id, draggedItem, targetContext.index);
        }
      } else {
        // Si el target es raíz, verificar si tiene hijos (submenu o columns)
        // Si tiene hijos, agregar como hijo; si no, agregar como hermano
        const targetItem = targetContext.item;
        if ((targetItem.submenu && targetItem.submenu.length > 0) || (targetItem.columns && targetItem.columns.length > 0)) {
          // Tiene hijos, agregar como hijo en submenu
          updated = addItemToLocation(updated, targetId, draggedItem);
        } else {
          // No tiene hijos, agregar como hermano al nivel raíz
          const newItem = {
            ...draggedItem,
            parentId: undefined,
            level: 0,
            order: targetContext.index,
          };
          const newItems = [...updated];
          newItems.splice(targetContext.index, 0, newItem);
          updated = newItems.map((item, index) => ({
            ...item,
            order: index,
          }));
        }
      }
      
      // Recalcular orders en todos los niveles
      const recalculateOrders = (items: MenuAdminItem[], level: number = 0): MenuAdminItem[] => {
        return items.map((item, index) => ({
          ...item,
          order: index,
          level,
          submenu: item.submenu ? recalculateOrders(item.submenu, level + 1) : undefined,
          columns: item.columns ? item.columns.map(col => ({
            ...col,
            items: recalculateOrders(col.items, level + 1),
          })) : undefined,
        }));
      };
      
      return recalculateOrders(updated);
    });
  }, []);

  // Handlers para drag and drop
  const handleDragStart = (itemId: string) => {
    setDraggingItemId(itemId);
  };

  const handleDragOver = (e: any, itemId: string) => {
    e.preventDefault();
    if (draggingItemId && draggingItemId !== itemId) {
      setDragOverItemId(itemId);
    }
  };

  const handleDragLeave = () => {
    setDragOverItemId(null);
  };

  const handleDrop = (e: any, targetId: string) => {
    e.preventDefault();
    if (draggingItemId && draggingItemId !== targetId) {
      reorderItems(draggingItemId, targetId);
    }
    setDraggingItemId(null);
    setDragOverItemId(null);
  };

  const handleDragEnd = () => {
    if (draggingItemId && dragOverItemId && draggingItemId !== dragOverItemId) {
      reorderItems(draggingItemId, dragOverItemId);
    }
    setDraggingItemId(null);
    setDragOverItemId(null);
  };

  // Handlers para mouse/touch events (alternativa más robusta)
  const handleMouseDown = useCallback((e: any, itemId: string) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      e.stopPropagation();
      
      draggingItemRef.current = itemId;
      dragOverItemRef.current = null;
      setDraggingItemId(itemId);
      setDragOverItemId(null);
      
      const handleMouseUp = (upEvent: MouseEvent) => {
        upEvent.preventDefault();
        const draggedId = draggingItemRef.current;
        const targetId = dragOverItemRef.current;
        const targetColumnId = dragOverColumnRef.current;
        const targetColumnParentId = dragOverColumnParentRef.current;
        const targetDropZoneId = dropZoneRef.current;
        
        // Si se soltó sobre el recuadro de "agregar como hijo"
        if (draggedId && targetDropZoneId && draggedId !== targetDropZoneId) {
          setMenuItems(prev => {
            const draggedContext = findItemContext(prev, draggedId);
            if (!draggedContext) return prev;
            
            const draggedItem = draggedContext.item;
            let updated = removeItemFromLocation(prev, draggedId);
            // Agregar como hijo del item target
            updated = addItemToLocation(updated, targetDropZoneId, draggedItem);
            
            // Recalcular orders
            const recalculateOrders = (items: MenuAdminItem[], level: number = 0): MenuAdminItem[] => {
              return items.map((item, index) => ({
                ...item,
                order: index,
                level,
                submenu: item.submenu ? recalculateOrders(item.submenu, level + 1) : undefined,
                columns: item.columns ? item.columns.map(col => ({
                  ...col,
                  items: recalculateOrders(col.items, level + 1),
                })) : undefined,
              }));
            };
            
            return recalculateOrders(updated);
          });
        }
        // Si se arrastró sobre una columna directamente
        else if (draggedId && targetColumnId && targetColumnParentId) {
          setMenuItems(prev => {
            const draggedContext = findItemContext(prev, draggedId);
            if (!draggedContext) return prev;
            
            const draggedItem = draggedContext.item;
            let updated = removeItemFromLocation(prev, draggedId);
            updated = addDraggedItemToColumn(updated, targetColumnParentId, targetColumnId, draggedItem);
            
            // Recalcular orders
            const recalculateOrders = (items: MenuAdminItem[], level: number = 0): MenuAdminItem[] => {
              return items.map((item, index) => ({
                ...item,
                order: index,
                level,
                submenu: item.submenu ? recalculateOrders(item.submenu, level + 1) : undefined,
                columns: item.columns ? item.columns.map(col => ({
                  ...col,
                  items: recalculateOrders(col.items, level + 1),
                })) : undefined,
              }));
            };
            
            return recalculateOrders(updated);
          });
        } else if (draggedId && targetId && draggedId !== targetId) {
          reorderItems(draggedId, targetId);
        }
        
        setDraggingItemId(null);
        setDragOverItemId(null);
        setDragOverColumnId(null);
        setDragOverColumnParentId(null);
        setShowDropZone(null);
        draggingItemRef.current = null;
        dragOverItemRef.current = null;
        dragOverColumnRef.current = null;
        dragOverColumnParentRef.current = null;
        dropZoneRef.current = null;
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mouseup', handleMouseUp, { once: true });
    }
  }, [reorderItems]);

  // Handlers para drag and drop de columnas
  const handleColumnMouseDown = useCallback((e: any, parentId: string, columnId: string) => {
    if (Platform.OS !== 'web') return;
    e.preventDefault();
    e.stopPropagation();
    
    draggingColumnRef.current = columnId;
    dragOverColumnRef.current = null;
    setDraggingColumnId(columnId);
    setDragOverColumnId(null);
    
    const handleMouseUp = (upEvent: MouseEvent) => {
      upEvent.preventDefault();
      const draggedId = draggingColumnRef.current;
      const targetId = dragOverColumnRef.current;
      
      if (draggedId && targetId && draggedId !== targetId) {
        reorderColumns(parentId, draggedId, targetId);
      }
      
      setDraggingColumnId(null);
      setDragOverColumnId(null);
      draggingColumnRef.current = null;
      dragOverColumnRef.current = null;
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mouseup', handleMouseUp, { once: true });
  }, [reorderColumns]);

  // Renderizar item del menú
  const renderMenuItem = (item: MenuAdminItem, index: number) => {
    const isExpanded = expandedItems.has(item.id);
    const isEditing = editingItemId === item.id;
    const hasChildren = (item.submenu && item.submenu.length > 0) || (item.columns && item.columns.length > 0);

    const isDragging = draggingItemId === item.id;
    const isDragOver = dragOverItemId === item.id;
    const isModified = getModifiedItems().has(item.id);

    // Construir estilos dinámicos del contenedor del título
    const containerStyle: any = [
      styles.itemTitleContainerBase,
      {
        backgroundColor: isDragOver ? colors.primary + '20' : colors.surface,
        borderColor: isEditing
          ? colors.primary
          : isDragging
            ? colors.primary
            : isDragOver
              ? colors.primary
              : colors.border,
        opacity: isDragging ? 0.5 : 1,
        borderBottomLeftRadius: isEditing ? 0 : 8,
        borderBottomRightRadius: isEditing ? 0 : 8,
        borderBottomWidth: isEditing ? 0 : 1,
        zIndex: isEditing ? 1 : 0,
        ...(Platform.OS === 'web' ? { cursor: isDragging ? 'grabbing' : 'grab' } as any : {}),
      },
    ];

    return (
      <View 
        key={item.id} 
        style={[styles.itemContainerBase, { marginLeft: item.level * 20 }]}
        {...(Platform.OS === 'web' ? { 
          // @ts-ignore - data attributes para web
          'data-item-id': item.id,
          onMouseEnter: () => {
            if (draggingItemId && draggingItemId !== item.id) {
              dragOverItemRef.current = item.id;
              setDragOverItemId(item.id);
              // Si el item no tiene hijos, mostrar el recuadro para agregar como hijo
              if (!hasChildren) {
                setShowDropZone(item.id);
              }
            }
          },
          onMouseLeave: () => {
            if (dragOverItemId === item.id) {
              dragOverItemRef.current = null;
              setDragOverItemId(null);
              // Ocultar el recuadro solo si realmente salimos del contenedor completo
              // (no solo del div del título, sino también del drop zone)
              if (showDropZone === item.id) {
                setShowDropZone(null);
              }
            }
          },
        } : {})}
      >
        {/* Div del título: siempre visible, ocupa todo el ancho */}
        <View style={containerStyle}>
          {/* Icono de expandir/colapsar */}
          {hasChildren && (
            <Tooltip text={isExpanded ? menuAdminTranslations.collapse : menuAdminTranslations.expand} position="top">
              <TouchableOpacity onPress={() => toggleExpand(item.id)} style={styles.expandCollapseButton}>
                <Ionicons
                  name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </Tooltip>
          )}
          {!hasChildren && <View style={styles.expandCollapsePlaceholder} />}

          {/* Handle de arrastre */}
          <Tooltip text={menuAdminTranslations.move} position="top">
            <View
              style={styles.dragHandle}
              {...(Platform.OS === 'web' ? {
                onMouseDown: (e: any) => handleMouseDown(e, item.id),
              } : {})}
            >
              <Ionicons
                name="reorder-three-outline"
                size={20}
                color={colors.textSecondary}
              />
            </View>
          </Tooltip>

          {/* Primera fila: Icono, Nombre, URL, Estado (vista) */}
          <View style={styles.itemRow}>
            {/* Icono clickeable (abre edición igual que el nombre) */}
            <TouchableOpacity
              onPress={() => {
                const isEditing = editingItemId === item.id;
                // Si ya está en edición, cerrar; si no, abrir
                if (isEditing) {
                  setEditingItemId(null);
                } else {
                  startEdit(item);
                }
              }}
              style={styles.itemIconButton}
            >
              {item.icon ? (
                <DynamicIcon
                  name={item.icon}
                  size={24}
                  color={colors.primary}
                />
              ) : (
                <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

              {/* Nombre clickeable para editar */}
              <TouchableOpacity
                onPress={() => {
                  // Si ya está en edición, cerrar; si no, abrir
                  if (isEditing) {
                    setEditingItemId(null);
                  } else {
                    startEdit(item);
                  }
                }}
                style={styles.itemNameButton}
              >
              {/* Indicador de cambios pendientes (punto verde) */}
              {isModified && (
                <View style={styles.modifiedIndicator} />
              )}
              <ThemedText type="body1" style={styles.itemNameText}>
                {item.label}
              </ThemedText>
            </TouchableOpacity>

            {/* URL clickeable (abre edición igual que el nombre) */}
            <TouchableOpacity
              onPress={() => {
                const isEditing = editingItemId === item.id;
                // Si ya está en edición, cerrar; si no, abrir
                if (isEditing) {
                  setEditingItemId(null);
                } else {
                  startEdit(item);
                }
              }}
              style={styles.itemRouteButton}
            >
              {item.route ? (
                <ThemedText type="caption" variant="secondary" numberOfLines={1}>
                  {item.route}
                </ThemedText>
              ) : (
                <ThemedText type="caption" variant="secondary" style={styles.itemRouteText}>
                  {menuAdminTranslations.noUrl}
                </ThemedText>
              )}
            </TouchableOpacity>

            {/* Estado clickeable (abre edición igual que el nombre) */}
            <TouchableOpacity
              onPress={() => {
                const isEditing = editingItemId === item.id;
                // Si ya está en edición, cerrar; si no, abrir
                if (isEditing) {
                  setEditingItemId(null);
                } else {
                  startEdit(item);
                }
              }}
              style={styles.itemStatusButton}
            >
              <StatusBadge
                status={item.status}
                statusDescription={
                  item.status === 1 ? menuAdminTranslations.active : 
                  item.status === 0 ? menuAdminTranslations.inactive : 
                  item.status === -1 ? menuAdminTranslations.deleted : 
                  menuAdminTranslations.pending
                }
                size="small"
                showIcon={true}
              />
              {/* Indicador de hijos con estado pendiente */}
              {hasChildWithPendingStatus(item) && (
                <View style={styles.pendingChildIndicator} />
              )}
            </TouchableOpacity>

            {/* Botón agregar item */}
            <View style={{ flexDirection: 'row', marginLeft: 'auto', gap: 8 }}>
              <Tooltip text="Agregar item" position="top">
                <TouchableOpacity
                  onPress={() => addChildNode(item.id, 'submenu')}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
              </Tooltip>
            </View>
          </View>
        </View>

        {/* Recuadro para agregar como hijo (solo cuando se arrastra sobre un item sin hijos) */}
        {showDropZone === item.id && !hasChildren && draggingItemId && draggingItemId !== item.id && (
          <View
            style={[styles.dropZoneBase, { marginLeft: item.level * 20, backgroundColor: colors.primary + '10', borderColor: colors.primary }]}
            {...(Platform.OS === 'web' ? {
              onMouseEnter: () => {
                dropZoneRef.current = item.id;
              },
              onMouseLeave: () => {
                if (dropZoneRef.current === item.id) {
                  dropZoneRef.current = null;
                }
              },
            } : {})}
          >
            <ThemedText type="body2" style={styles.dropZoneText}>
              {menuAdminTranslations.dropHere}
            </ThemedText>
          </View>
        )}

        {/* Formulario de edición (debajo del título cuando está en edición) */}
        {isEditing && (
          <View 
            style={[
              styles.editFormContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.primary,
              }
            ]}
          >
            {/* Primera fila: Icono, Nombre, URL */}
                <View style={styles.editFormRow}>
                  <View style={styles.editFormField}>
                    <ThemedText type="body2" style={styles.editFormLabel}>
                      {menuAdminTranslations.icon} <ThemedText style={styles.editFormLabelRequired}>*</ThemedText>
                    </ThemedText>
                    <View style={styles.iconInputContainer}>
                      <View style={styles.iconInputWrapper}>
                        <IconInput
                          value={formData.icon || ''}
                          onChange={(value) => {
                            setFormData(prev => ({ ...prev, icon: value }));
                            // Aplicar cambios automáticamente al estado
                            updateItem(item.id, { icon: value });
                            // Limpiar error si existe
                            if (validationErrors.icon) {
                              setValidationErrors(prev => ({ ...prev, icon: undefined }));
                            }
                          }}
                          placeholder={menuAdminTranslations.iconPlaceholder}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.iconDocumentationButton}
                        onPress={async () => {
                          try {
                            const iconsUrl = APP_CONFIG.EXTERNAL_URLS.ICONS_DOCUMENTATION;
                            
                            // En web, abrir en una nueva pestaña
                            if (Platform.OS === 'web') {
                              window.open(iconsUrl, '_blank', 'noopener,noreferrer');
                            } else {
                              // En móviles, usar el navegador in-app
                              await openBrowserAsync(iconsUrl);
                            }
                          } catch (error) {
                            alert.showError(menuAdminTranslations.errorOpeningIconsDoc || 'Error al abrir la documentación de iconos');
                          }
                        }}
                      >
                        <Ionicons name="open-outline" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                    {validationErrors.icon && (
                      <ThemedText type="caption" style={styles.validationError}>
                        {validationErrors.icon}
                      </ThemedText>
                    )}
                  </View>
                  <View style={styles.editFormField}>
                    <ThemedText type="body2" style={styles.editFormLabel}>
                      {menuAdminTranslations.name} <ThemedText style={styles.editFormLabelRequired}>*</ThemedText>
                    </ThemedText>
                    <InputWithFocus
                      containerStyle={[
                        styles.textInputContainerBase,
                        validationErrors.label ? styles.textInputContainerError : styles.textInputContainerNormal
                      ]}
                      primaryColor={colors.primary}
                    >
                      <TextInput
                        value={formData.label}
                        onChangeText={(text) => {
                          setFormData(prev => ({ ...prev, label: text }));
                          // Aplicar cambios automáticamente al estado
                          updateItem(item.id, { label: text });
                          // Limpiar error si existe
                          if (validationErrors.label) {
                            setValidationErrors(prev => ({ ...prev, label: undefined }));
                          }
                        }}
                        placeholder={menuAdminTranslations.namePlaceholder}
                        style={styles.textInput}
                      />
                    </InputWithFocus>
                    {validationErrors.label && (
                      <ThemedText type="caption" style={styles.validationError}>
                        {validationErrors.label}
                      </ThemedText>
                    )}
                  </View>
                  <View style={styles.editFormField}>
                    <ThemedText type="body2" style={styles.editFormLabel}>
                      {menuAdminTranslations.url} <ThemedText style={styles.editFormLabelRequired}>*</ThemedText>
                    </ThemedText>
                    <InputWithFocus
                      containerStyle={[
                        styles.textInputContainerBase,
                        validationErrors.route ? styles.textInputContainerError : styles.textInputContainerNormal
                      ]}
                      primaryColor={colors.primary}
                    >
                      <TextInput
                        value={formData.route}
                        onChangeText={(text) => {
                          // Asegurar que siempre empiece con /
                          let normalizedText = text.trim();
                          // Si está vacío, poner solo "/"
                          if (!normalizedText) {
                            normalizedText = '/';
                          } else if (!normalizedText.startsWith('/')) {
                            // Si no empieza con /, agregarlo
                            normalizedText = '/' + normalizedText;
                          }
                          setFormData(prev => ({ ...prev, route: normalizedText }));
                          // Aplicar cambios automáticamente al estado
                          updateItem(item.id, { route: normalizedText });
                          // Limpiar error si existe
                          if (validationErrors.route) {
                            setValidationErrors(prev => ({ ...prev, route: undefined }));
                          }
                        }}
                        placeholder={menuAdminTranslations.urlPlaceholder}
                        style={styles.textInput}
                      />
                    </InputWithFocus>
                    {validationErrors.route && (
                      <ThemedText type="caption" style={styles.validationError}>
                        {validationErrors.route}
                      </ThemedText>
                    )}
                  </View>
                </View>
                
                {/* Segunda fila: Descripción y Estado/Público */}
                <View style={styles.editFormRow}>
                  <View style={styles.editFormFieldWide}>
                    <ThemedText type="body2" style={styles.editFormLabel}>
                      {menuAdminTranslations.description}
                    </ThemedText>
                    <InputWithFocus
                      containerStyle={[
                        styles.textInputContainerBase,
                        styles.textInputContainerNormal,
                        styles.textInputContainerMultiline
                      ]}
                      primaryColor={colors.primary}
                    >
                      <TextInput
                        value={formData.description}
                        onChangeText={(text) => {
                          setFormData(prev => ({ ...prev, description: text }));
                          // Aplicar cambios automáticamente al estado
                          updateItem(item.id, { description: text });
                        }}
                        placeholder={menuAdminTranslations.descriptionPlaceholder}
                        multiline
                        numberOfLines={3}
                        style={[styles.textInput, { textAlignVertical: 'top' }]}
                      />
                    </InputWithFocus>
                  </View>
                  <View style={styles.editFormField}>
                    <ThemedText type="body2" style={styles.editFormLabel}>
                      {menuAdminTranslations.status}
                    </ThemedText>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingRight: 8 }}
                      nestedScrollEnabled={true}
                    >
                      <View style={styles.selectOptions}>
                        {/* Activo */}
                        <TouchableOpacity
                          style={[
                            styles.selectOption,
                            { borderColor: colors.border },
                            formData.status === 1 && {
                              backgroundColor: '#10b981',
                              borderColor: '#10b981',
                            },
                          ]}
                          onPress={() => {
                            const statusValue = 1;
                            setFormData(prev => ({ ...prev, status: statusValue }));
                            // Aplicar cambios automáticamente al estado
                            updateItem(item.id, { status: statusValue });
                          }}
                        >
                          <ThemedText
                            type="caption"
                            style={formData.status === 1 ? { color: '#FFFFFF' } : { color: colors.text }}
                          >
                            {menuAdminTranslations.active}
                          </ThemedText>
                        </TouchableOpacity>

                        {/* Inactivo */}
                        <TouchableOpacity
                          style={[
                            styles.selectOption,
                            { borderColor: colors.border },
                            formData.status === 0 && {
                              backgroundColor: '#ef4444',
                              borderColor: '#ef4444',
                            },
                          ]}
                          onPress={() => {
                            const statusValue = 0;
                            setFormData(prev => ({ ...prev, status: statusValue }));
                            // Aplicar cambios automáticamente al estado
                            updateItem(item.id, { status: statusValue });
                          }}
                        >
                          <ThemedText
                            type="caption"
                            style={[
                              formData.status === 0 ? { color: '#FFFFFF' } : { color: colors.text },
                              { fontSize: 12 }
                            ]}
                          >
                            Inactivo
                          </ThemedText>
                        </TouchableOpacity>

                        {/* Pendiente */}
                        <TouchableOpacity
                          style={[
                            styles.selectOption,
                            { borderColor: colors.border },
                            formData.status === 2 && {
                              backgroundColor: '#f59e0b',
                              borderColor: '#f59e0b',
                            },
                          ]}
                          onPress={() => {
                            const statusValue = 2;
                            setFormData(prev => ({ ...prev, status: statusValue }));
                            // Aplicar cambios automáticamente al estado
                            updateItem(item.id, { status: statusValue });
                          }}
                        >
                          <ThemedText
                            type="caption"
                            style={[
                              formData.status === 2 ? { color: '#FFFFFF' } : { color: colors.text },
                              { fontSize: 12 }
                            ]}
                          >
                            Pendiente
                          </ThemedText>
                        </TouchableOpacity>

                        {/* Eliminado */}
                        <TouchableOpacity
                          style={[
                            styles.selectOption,
                            { borderColor: colors.border },
                            formData.status === -1 && {
                              backgroundColor: '#6b7280',
                              borderColor: '#6b7280',
                            },
                          ]}
                          onPress={() => {
                            const statusValue = -1;
                            setFormData(prev => ({ ...prev, status: statusValue }));
                            // Aplicar cambios automáticamente al estado
                            updateItem(item.id, { status: statusValue });
                          }}
                        >
                          <ThemedText
                            type="caption"
                            style={[
                              formData.status === -1 ? { color: '#FFFFFF' } : { color: colors.text },
                              { fontSize: 12 }
                            ]}
                          >
                            Eliminado
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                    <View style={styles.publicToggleContainer}>
                      <CustomSwitch
                        value={formData.isPublic || false}
                        onValueChange={(newValue) => {
                          setFormData(prev => ({ ...prev, isPublic: newValue }));
                          updateItem(item.id, { isPublic: newValue });
                        }}
                        label="Público"
                      />
                    </View>
                  </View>
                </View>
                
            {/* Botones de acción */}
            <View style={styles.actionButtons}>
              <Button 
                title="Cancelar" 
                onPress={() => {
                  // Si es un item nuevo, eliminarlo del estado
                  if (item.id.startsWith('new-')) {
                    const removeNewItem = (items: MenuAdminItem[]): MenuAdminItem[] => {
                      return items
                        .map(item => ({
                          ...item,
                          submenu: item.submenu ? removeNewItem(item.submenu.filter(sub => sub.id !== editingItemId)) : undefined,
                          columns: item.columns ? item.columns.map(col => ({
                            ...col,
                            items: col.items ? removeNewItem(col.items.filter(ci => ci.id !== editingItemId)) : [],
                          })) : undefined,
                        }))
                        .filter(item => item.id !== editingItemId);
                    };
                    setMenuItems(prev => removeNewItem(prev));
                  }
                  cancelEdit();
                  // Solo recargar si no es un item nuevo
                  if (!item.id.startsWith('new-')) {
                    loadMenuItems();
                  }
                }} 
                variant="outlined" 
                size="sm" 
              />
              {/* Botón Guardar para items nuevos y edición de items existentes */}
              <View style={styles.saveCancelActions}>
                {savingItem && <ActivityIndicator size="small" color={colors.primary} />}
                <Button 
                  title={savingItem ? menuAdminTranslations.saving : menuAdminTranslations.save || t.common.save} 
                  onPress={() => saveSingleItem(item.id)} 
                  variant="primary" 
                  size="sm"
                  disabled={savingItem}
                />
              </View>
            </View>
              </View>
            )}

        {/* Contenido expandido: Submenu, Botón Agregar Agrupamiento, y Columns */}
        {/* Submenu expandido (antes de las columnas, tal como lo devuelve el servicio) */}
        {isExpanded && item.submenu && item.submenu.length > 0 && (
          <View style={{ marginTop: 8 }}>
            {item.submenu.map((subItem, subIndex) => renderMenuItem(subItem, subIndex))}
          </View>
        )}

        {/* Botón para agregar nuevo agrupamiento (entre subitems y columnas, solo para items padre) */}
        {isExpanded && item.level === 0 && (
          <View style={{ marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => addNewColumn(item.id)}
              style={[styles.addGroupingButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <ThemedText type="body2" style={styles.addGroupingText}>
                {menuAdminTranslations.addGrouping}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Columns expandidas (después de los subitems y el botón de agregar agrupamiento) */}
        {isExpanded && item.columns && item.columns.length > 0 && (
          <View style={{ marginTop: 8 }}>
            {item.columns.map((column) => {
              const isDraggingColumn = draggingColumnId === column.id;
              const isDragOverColumn = dragOverColumnId === column.id;
              
              return (
              <View 
                key={column.id} 
                style={[
                  styles.columnContainerBase,
                  (isDragOverColumn || (draggingItemId && dragOverColumnId === column.id))
                    ? styles.columnContainerDragOver
                    : styles.columnContainerNormal,
                  isDraggingColumn && styles.columnContainerDragging,
                ]}
                {...(Platform.OS === 'web' ? {
                  onMouseEnter: () => {
                    // Si se está arrastrando una columna
                    if (draggingColumnId && draggingColumnId !== column.id) {
                      dragOverColumnRef.current = column.id;
                      setDragOverColumnId(column.id);
                    }
                    // Si se está arrastrando un item, detectar que está sobre la columna
                    if (draggingItemId && draggingItemId !== column.id) {
                      dragOverColumnRef.current = column.id;
                      dragOverColumnParentRef.current = item.id;
                      setDragOverColumnId(column.id);
                      setDragOverColumnParentId(item.id);
                    }
                  },
                  onMouseLeave: () => {
                    if (dragOverColumnId === column.id) {
                      setDragOverColumnId(null);
                      setDragOverColumnParentId(null);
                    }
                  },
                } : {})}
              >
                {/* Header de la columna con título editable */}
                <View style={styles.columnHeader}>
                  {/* Icono de reordenar a la izquierda */}
                  <Tooltip text={menuAdminTranslations.move} position="top">
                    <View
                      style={[
                        styles.columnDragHandle,
                        Platform.OS === 'web' && { cursor: 'grab' } as any,
                      ]}
                      {...(Platform.OS === 'web' ? {
                        onMouseDown: (e: any) => handleColumnMouseDown(e, item.id, column.id),
                      } : {})}
                    >
                      <Ionicons
                        name="reorder-three-outline"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>
                  </Tooltip>
                  {editingColumnId === column.id ? (
                    <View style={styles.columnTitleEditContainer}>
                      <TextInput
                        value={editingColumnTitle}
                        onChangeText={setEditingColumnTitle}
                        style={[styles.columnTitleInput, { backgroundColor: colors.background, borderColor: colors.primary, color: colors.text }]}
                        placeholder={menuAdminTranslations.columnTitlePlaceholder}
                        placeholderTextColor={colors.textSecondary}
                        autoFocus
                        onBlur={() => {
                          if (editingColumnTitle.trim()) {
                            updateColumnTitle(item.id, column.id, editingColumnTitle.trim());
                          } else {
                            setEditingColumnId(null);
                            setEditingColumnTitle('');
                          }
                        }}
                        onSubmitEditing={() => {
                          if (editingColumnTitle.trim()) {
                            updateColumnTitle(item.id, column.id, editingColumnTitle.trim());
                          } else {
                            setEditingColumnId(null);
                            setEditingColumnTitle('');
                          }
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => {
                          if (editingColumnTitle.trim()) {
                            updateColumnTitle(item.id, column.id, editingColumnTitle.trim());
                          } else {
                            setEditingColumnId(null);
                            setEditingColumnTitle('');
                          }
                        }}
                        style={styles.columnTitleButton}
                      >
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingColumnId(null);
                          setEditingColumnTitle('');
                        }}
                        style={styles.columnTitleButton}
                      >
                        <Ionicons name="close" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        onPress={() => startEditColumnTitle(item.id, column.id, column.title)}
                        style={{ flex: 1 }}
                      >
                        <ThemedText type="subtitle" style={styles.columnTitleButtonText}>
                          {column.title}
                        </ThemedText>
                      </TouchableOpacity>
                      <Tooltip text={menuAdminTranslations.deleteGrouping} position="top">
                        <TouchableOpacity
                          onPress={() => {
                            // Si tiene items, mostrar confirmación
                            if (column.items && column.items.length > 0) {
                              alert.showConfirm(
                                menuAdminTranslations.deleteGroupingConfirm,
                                menuAdminTranslations.deleteGroupingMessage,
                                () => {
                                  deleteColumnAndMoveItemsToSubmenu(item.id, column.id);
                                  alert.showSuccess(menuAdminTranslations.itemsMovedToSubmenu);
                                },
                                () => {}
                              );
                            } else {
                              // Si no tiene items, eliminar directamente
                              deleteColumnAndMoveItemsToSubmenu(item.id, column.id);
                            }
                          }}
                          style={styles.columnTitleButton}
                        >
                          <Ionicons name="trash-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                      </Tooltip>
                      <TouchableOpacity
                        onPress={() => addItemToColumn(item.id, column.id)}
                        style={styles.columnTitleButton}
                      >
                        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
                {/* Items de la columna */}
                {column.items.map((colItem, colIndex) => renderMenuItem(colItem, colIndex))}
              </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // Función recursiva para verificar si un item o sus hijos coinciden con la búsqueda
  // Función para verificar si un item coincide con la búsqueda
  const itemMatchesSearch = (item: MenuAdminItem, searchLower: string): boolean => {
    // Verificar el item actual
    const matchesItem = 
      item.label.toLowerCase().includes(searchLower) ||
      item.route?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower);
    
    if (matchesItem) return true;
    
    // Verificar en submenu recursivamente
    if (item.submenu && item.submenu.length > 0) {
      for (const subItem of item.submenu) {
        if (itemMatchesSearch(subItem, searchLower)) {
          return true;
        }
      }
    }
    
    // Verificar en columns recursivamente
    if (item.columns && item.columns.length > 0) {
      for (const col of item.columns) {
        if (col.items && col.items.length > 0) {
          for (const colItem of col.items) {
            if (itemMatchesSearch(colItem, searchLower)) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  };

  // Función para filtrar recursivamente items y sus hijos
  const filterItemRecursively = (item: MenuAdminItem, searchLower: string): MenuAdminItem | null => {
    // Verificar si el item actual coincide
    const itemMatches = 
      item.label.toLowerCase().includes(searchLower) ||
      item.route?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower);
    
    // Filtrar submenu recursivamente
    let filteredSubmenu: MenuAdminItem[] | undefined;
    if (item.submenu && item.submenu.length > 0) {
      filteredSubmenu = item.submenu
        .map(subItem => filterItemRecursively(subItem, searchLower))
        .filter((subItem): subItem is MenuAdminItem => subItem !== null);
    }
    
    // Filtrar columns recursivamente
    let filteredColumns: MenuAdminColumn[] | undefined;
    if (item.columns && item.columns.length > 0) {
      filteredColumns = item.columns
        .map(col => {
          const filteredColItems = col.items
            .map(colItem => filterItemRecursively(colItem, searchLower))
            .filter((colItem): colItem is MenuAdminItem => colItem !== null);
          
          if (filteredColItems.length > 0) {
            return {
              ...col,
              items: filteredColItems,
            };
          }
          return null;
        })
        .filter((col): col is MenuAdminColumn => col !== null);
      
      if (filteredColumns.length === 0) {
        filteredColumns = undefined;
      }
    }
    
    // Si el item coincide o tiene hijos filtrados que coinciden, incluirlo
    if (itemMatches || (filteredSubmenu && filteredSubmenu.length > 0) || (filteredColumns && filteredColumns.length > 0)) {
      return {
        ...item,
        submenu: filteredSubmenu && filteredSubmenu.length > 0 ? filteredSubmenu : undefined,
        columns: filteredColumns,
      };
    }
    
    return null;
  };

  // Filtrar items (incluyendo búsqueda recursiva en subniveles)
  const filteredItems = menuItems
    .map(item => {
      if (!searchValue) return item;
      const searchLower = searchValue.toLowerCase();
      return filterItemRecursively(item, searchLower);
    })
    .filter((item): item is MenuAdminItem => item !== null);

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* Header con búsqueda */}
      <View style={[styles.headerContainer, { borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color={colors.textSecondary}
              style={styles.searchIcon}
            />
            {searchValue.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchValue('')}
                style={styles.searchClearButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
            <InputWithFocus
              containerStyle={[
                styles.searchInputContainerBase,
                searchValue.length > 0 ? styles.searchInputContainerWithValue : styles.searchInputContainerEmpty,
                { borderColor: colors.border, backgroundColor: colors.surface }
              ]}
              primaryColor={colors.primary}
            >
              <TextInput
                placeholder={menuAdminTranslations.searchPlaceholder}
                value={searchValue}
                onChangeText={setSearchValue}
                style={styles.searchInput}
              />
            </InputWithFocus>
          </View>
          <Button
            title={menuAdminTranslations.newItem}
            onPress={addRootItem}
            variant="primary"
            size="md"
          />
        </View>
      </View>

      {/* Lista de items */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText type="body2" variant="secondary" style={{ marginTop: 16 }}>
            {t.common.loading}
          </ThemedText>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {filteredItems.length === 0 ? (
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Ionicons name="menu-outline" size={64} color={colors.textSecondary} />
              <ThemedText type="body1" variant="secondary" style={{ marginTop: 16, textAlign: 'center' }}>
                No hay items en el menú
              </ThemedText>
            </View>
          ) : (
            filteredItems.map((item, index) => renderMenuItem(item, index))
          )}
        </ScrollView>
      )}

      {/* Footer con botón de guardar cambios */}
      {hasUnsavedChanges && (
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <ThemedText type="body2" style={{ color: colors.textSecondary }}>
            {getModifiedItems().size} {getModifiedItems().size === 1 ? 'cambio pendiente' : 'cambios pendientes'} de guardar
          </ThemedText>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Button
              title="Cancelar"
              onPress={handleCancelChanges}
              variant="outlined"
              size="md"
              disabled={savingChanges}
            />
            <Button
              title="Guardar cambios"
              onPress={handleSaveChanges}
              variant="primary"
              size="md"
              disabled={savingChanges}
            >
              {savingChanges && (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              )}
            </Button>
          </View>
        </View>
      )}

      {/* Modal de selección de icono */}
      <Modal
        visible={showIconModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowIconModal(false);
          setIconModalItemId(null);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <Card
            variant="elevated"
            style={{
              width: '100%',
              maxWidth: 500,
              maxHeight: '80%',
              padding: 20,
            }}
          >
            <View style={{ marginBottom: 20 }}>
              <ThemedText type="h3" style={{ marginBottom: 8 }}>
                Seleccionar Icono
              </ThemedText>
              <ThemedText type="body2" variant="secondary">
                Elige un icono para este item del menú
              </ThemedText>
            </View>

            <View style={{ marginBottom: 20 }}>
              <ThemedText type="body2" style={{ marginBottom: 8, color: colors.text }}>
                Icono
              </ThemedText>
              <IconInput
                value={formData.icon || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                placeholder="Nombre del icono (ej: home, settings, user)"
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
              <Button
                title="Cancelar"
                onPress={() => {
                  setShowIconModal(false);
                  setIconModalItemId(null);
                }}
                variant="outlined"
                size="md"
              />
              <Button
                title="Aplicar"
                onPress={() => {
                  handleIconSelect(formData.icon || '');
                }}
                variant="primary"
                size="md"
              />
            </View>
          </Card>
        </View>
      </Modal>
    </ThemedView>
  );
}

