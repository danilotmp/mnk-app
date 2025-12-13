/**
 * Pantalla de administración del menú
 * Permite editar, crear y gestionar los items del menú del sistema
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { Select } from '@/components/ui/select';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { DynamicIcon } from '@/src/domains/security/components/shared/dynamic-icon/dynamic-icon';
import { IconInput } from '@/src/domains/security/components/shared/icon-input/icon-input';
import { useTranslation } from '@/src/infrastructure/i18n';
import { MenuService } from '@/src/infrastructure/menu/menu.service';
import { MenuItem } from '@/src/infrastructure/menu/types';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, ScrollView, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { MenuAdminColumn, MenuAdminFormData, MenuAdminItem } from '../types';
import { createMenuAdminStyles } from './menu-admin.screen.styles';

export function MenuAdminScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
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
  const [showIconModal, setShowIconModal] = useState(false);
  const [iconModalItemId, setIconModalItemId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const draggingItemRef = useRef<string | null>(null);
  const [formData, setFormData] = useState<MenuAdminFormData>({
    label: '',
    route: '',
    description: '',
    icon: '',
    isPublic: false,
    status: 1,
    order: 0,
  });

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
      alert.showError('Error al cargar el menú');
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
    return items.map((item, index) => ({
      id: item.id,
      label: item.label,
      route: item.route,
      description: item.description,
      icon: item.icon,
      isPublic: item.isPublic,
      status: 1, // Por defecto activo, esto debería venir del backend
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
    }));
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
    setEditingItemId(item.id);
    setFormData({
      label: item.label,
      route: item.route || '',
      description: item.description || '',
      icon: item.icon || '',
      isPublic: item.isPublic || false,
      status: item.status,
      order: item.order,
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
        
        // Comparar recursivamente submenu y columns
        if (item.submenu && originalItem?.submenu) {
          compareItems(item.submenu, originalItem.submenu);
        }
        if (item.columns && originalItem?.columns) {
          item.columns.forEach((col, colIndex) => {
            const originalCol = originalItem.columns?.[colIndex];
            if (originalCol && col.items && originalCol.items) {
              compareItems(col.items, originalCol.items);
            }
          });
        }
      });
    };
    
    compareItems(menuItems, originalMenuItems);
    return modifiedIds;
  }, [menuItems, originalMenuItems]);

  // Verificar si hay cambios pendientes
  const hasUnsavedChanges = getModifiedItems().size > 0;

  // Extraer items modificados manteniendo la estructura jerárquica
  // IMPORTANTE: El backend espera estructura anidada (submenu/columns) para preservar parentId
  // Si un hijo está modificado, incluir el padre con su estructura anidada que contenga solo los hijos modificados
  const extractModifiedItems = useCallback((items: MenuAdminItem[], modifiedIds: Set<string>): MenuAdminItem[] => {
    const result: MenuAdminItem[] = [];
    
    const processItem = (item: MenuAdminItem): MenuAdminItem | null => {
      const isItemModified = modifiedIds.has(item.id);
      
      // Procesar hijos primero para saber si hay hijos modificados
      let modifiedSubmenu: MenuAdminItem[] | undefined = undefined;
      let modifiedColumns: MenuAdminColumn[] | undefined = undefined;
      
      // Procesar submenu recursivamente
      if (item.submenu && item.submenu.length > 0) {
        const processedSubmenu = item.submenu
          .map(subItem => processItem(subItem))
          .filter((subItem): subItem is MenuAdminItem => subItem !== null);
        
        if (processedSubmenu.length > 0) {
          modifiedSubmenu = processedSubmenu;
        }
      }
      
      // Procesar columns recursivamente
      if (item.columns && item.columns.length > 0) {
        const processedColumns = item.columns
          .map(col => {
            const processedColItems = col.items
              .map(colItem => processItem(colItem))
              .filter((colItem): colItem is MenuAdminItem => colItem !== null);
            
            if (processedColItems.length > 0) {
              return {
                ...col,
                items: processedColItems,
              };
            }
            return null;
          })
          .filter((col): col is MenuAdminColumn => col !== null);
        
        if (processedColumns.length > 0) {
          modifiedColumns = processedColumns;
        }
      }
      
      // Incluir el item si:
      // 1. Está modificado directamente, O
      // 2. Tiene hijos modificados (para mantener la jerarquía)
      if (isItemModified || modifiedSubmenu || modifiedColumns) {
        const extractedItem: MenuAdminItem = {
          ...item,
        };
        
        // Incluir submenu/columns solo si hay hijos modificados
        // Esto mantiene la estructura jerárquica que el backend necesita
        if (modifiedSubmenu) {
          extractedItem.submenu = modifiedSubmenu;
        } else {
          delete extractedItem.submenu;
        }
        
        if (modifiedColumns) {
          extractedItem.columns = modifiedColumns;
        } else {
          delete extractedItem.columns;
        }
        
        return extractedItem;
      }
      
      // Si el item no está modificado y no tiene hijos modificados, no incluirlo
      return null;
    };
    
    // Procesar todos los items raíz
    items.forEach(item => {
      const processedItem = processItem(item);
      if (processedItem) {
        result.push(processedItem);
      }
    });
    
    return result;
  }, []);

  // Guardar cambios masivamente
  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges) {
      return;
    }

    try {
      setSavingChanges(true);

      // Obtener IDs de items modificados
      const modifiedIds = getModifiedItems();
      
      console.log('Items modificados (IDs):', Array.from(modifiedIds));
      console.log('Total de items modificados:', modifiedIds.size);
      
      // Extraer items modificados manteniendo la estructura jerárquica
      // El backend necesita la estructura anidada (submenu/columns) para preservar parentId
      const modifiedMenuItems = extractModifiedItems(menuItems, modifiedIds);
      
      console.log('Items a sincronizar (antes de conversión):', JSON.stringify(modifiedMenuItems.map(i => ({ 
        id: i.id, 
        label: i.label,
        hasSubmenu: !!i.submenu,
        hasColumns: !!i.columns,
        submenuCount: i.submenu?.length || 0,
        columnsCount: i.columns?.length || 0,
      })), null, 2));

      // Convertir MenuAdminItem[] a MenuItem[] para enviar al backend
      // IMPORTANTE: El backend espera estructura anidada (submenu/columns) para preservar parentId
      // El backend convierte la estructura anidada a plana usando el id del padre como parentId
      const convertToMenuItems = (items: MenuAdminItem[]): MenuItem[] => {
        const result: MenuItem[] = [];
        
        items.forEach(item => {
          // Crear item base
          const menuItem: any = {
            id: item.id,
            label: item.label,
            order: item.order, // IMPORTANTE: Incluir el campo order
          };
          
          // Solo incluir propiedades si tienen valor
          if (item.route) menuItem.route = item.route;
          if (item.description) menuItem.description = item.description;
          if (item.icon) menuItem.icon = item.icon;
          if (item.isPublic !== undefined) menuItem.isPublic = item.isPublic;
          
          // Incluir submenu si existe (el backend lo necesita para preservar parentId)
          // El backend convertirá esto a estructura plana usando el id del padre como parentId
          if (item.submenu && item.submenu.length > 0) {
            menuItem.submenu = item.submenu.map(subItem => {
              const subMenuItem: any = {
                id: subItem.id,
                label: subItem.label,
                route: subItem.route || '',
                order: subItem.order, // IMPORTANTE: Incluir el campo order
              };
              if (subItem.description) subMenuItem.description = subItem.description;
              if (subItem.icon) subMenuItem.icon = subItem.icon;
              if (subItem.isPublic !== undefined) subMenuItem.isPublic = subItem.isPublic;
              return subMenuItem;
            });
          }
          
          // Incluir columns si existen (el backend lo necesita para preservar parentId)
          if (item.columns && item.columns.length > 0) {
            menuItem.columns = item.columns.map(col => ({
              title: col.title,
              items: col.items.map(colItem => {
                const colMenuItem: any = {
                  id: colItem.id,
                  label: colItem.label,
                  route: colItem.route || '',
                  order: colItem.order, // IMPORTANTE: Incluir el campo order
                };
                if (colItem.description) colMenuItem.description = colItem.description;
                if (colItem.icon) colMenuItem.icon = colItem.icon;
                if (colItem.isPublic !== undefined) colMenuItem.isPublic = colItem.isPublic;
                return colMenuItem;
              }),
            }));
          }
          
          result.push(menuItem as MenuItem);
        });
        
        return result;
      };

      const itemsToSync = convertToMenuItems(modifiedMenuItems);
      
      console.log('Items a sincronizar (después de conversión):', JSON.stringify(itemsToSync.map(i => ({
        id: i.id,
        label: i.label,
        route: i.route,
        hasSubmenu: !!i.submenu,
        hasColumns: !!i.columns,
        submenuIds: i.submenu?.map(s => s.id) || [],
        columnItemIds: i.columns?.flatMap(c => c.items.map(ci => ci.id)) || [],
      })), null, 2));

      const result = await MenuService.syncMenuItems(itemsToSync);

      if (result.result.statusCode === 200) {
        const summary = result.data.summary;
        const summaryMessage = `${summary.created > 0 ? `${summary.created} creado${summary.created > 1 ? 's' : ''}` : ''}${summary.created > 0 && summary.updated > 0 ? ', ' : ''}${summary.updated > 0 ? `${summary.updated} actualizado${summary.updated > 1 ? 's' : ''}` : ''}${(summary.created > 0 || summary.updated > 0) && summary.activated > 0 ? ', ' : ''}${summary.activated > 0 ? `${summary.activated} reactivado${summary.activated > 1 ? 's' : ''}` : ''}`;
        const successMessage = `Menú actualizado correctamente${summaryMessage ? ` (${summaryMessage})` : ''}`;
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
          alert.showError(result.result.description || 'Error al guardar los cambios');
        }
      }
    } catch (error: any) {
      console.error('Error al guardar cambios:', error);
      alert.showError(error.message || 'Error al guardar los cambios');
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
  const addChildNode = (parentId: string, type: 'submenu' | 'column') => {
    // TODO: Implementar agregar nodo hijo
    console.log('Agregar nodo hijo:', parentId, type);
    alert.showInfo('Funcionalidad en desarrollo');
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

  // Función para reordenar items
  const reorderItems = useCallback((draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    setMenuItems(prev => {
      const findAndReorder = (items: MenuAdminItem[], parentLevel: number = 0): MenuAdminItem[] => {
        const draggedIndex = items.findIndex(i => i.id === draggedId);
        const targetIndex = items.findIndex(i => i.id === targetId);

        // Si ambos están en este nivel
        if (draggedIndex !== -1 && targetIndex !== -1) {
          const newItems = [...items];
          // Remover el item arrastrado
          const [draggedItem] = newItems.splice(draggedIndex, 1);
          
          // Insertar en la nueva posición
          const newTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
          newItems.splice(newTargetIndex, 0, draggedItem);

          // Recalcular orden para TODOS los items en este nivel
          // El order debe reflejar la posición visual (0, 1, 2, 3...)
          return newItems.map((item, index) => ({
            ...item,
            order: index, // Recalcular order basado en la nueva posición
            // Recalcular order también para submenu y columns recursivamente
            submenu: item.submenu && item.submenu.length > 0 
              ? findAndReorder(item.submenu, parentLevel + 1)
              : undefined,
            columns: item.columns && item.columns.length > 0
              ? item.columns.map(col => ({
                  ...col,
                  items: col.items && col.items.length > 0
                    ? findAndReorder(col.items, parentLevel + 1)
                    : col.items,
                }))
              : undefined,
          }));
        }

        // Si no están en este nivel, buscar recursivamente
        // IMPORTANTE: También recalcular order en cada nivel para mantener consistencia
        return items.map((item, index) => ({
          ...item,
          order: index, // Asegurar que el order siempre refleje la posición visual
          submenu: item.submenu && item.submenu.length > 0 
            ? findAndReorder(item.submenu, parentLevel + 1)
            : undefined,
          columns: item.columns && item.columns.length > 0
            ? item.columns.map(col => ({
                ...col,
                items: col.items && col.items.length > 0
                  ? findAndReorder(col.items, parentLevel + 1)
                  : col.items,
              }))
            : undefined,
        }));
      };

      return findAndReorder(prev);
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

  // Ref para mantener el item objetivo durante el drag
  const dragOverItemRef = useRef<string | null>(null);

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
        
        if (draggedId && targetId && draggedId !== targetId) {
          console.log('Reordenando:', draggedId, '->', targetId);
          reorderItems(draggedId, targetId);
        }
        
        setDraggingItemId(null);
        setDragOverItemId(null);
        draggingItemRef.current = null;
        dragOverItemRef.current = null;
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mouseup', handleMouseUp, { once: true });
    }
  }, [reorderItems]);

  // Renderizar item del menú
  const renderMenuItem = (item: MenuAdminItem, index: number) => {
    const isExpanded = expandedItems.has(item.id);
    const isEditing = editingItemId === item.id;
    const hasChildren = (item.submenu && item.submenu.length > 0) || (item.columns && item.columns.length > 0);

    const isDragging = draggingItemId === item.id;
    const isDragOver = dragOverItemId === item.id;
    const isModified = getModifiedItems().has(item.id);

    const containerStyle: any = {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: isDragOver 
        ? colors.primary + '20' 
        : colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isEditing
        ? colors.primary // Borde azul cuando está en edición
        : isDragging 
          ? colors.primary 
          : isDragOver 
            ? colors.primary 
            : colors.border,
      opacity: isDragging ? 0.5 : 1,
    };

    if (Platform.OS === 'web') {
      containerStyle.cursor = isDragging ? 'grabbing' : 'grab';
    }

    const dragHandleStyle: any = {
      marginRight: 8,
      padding: 4,
    };

    if (Platform.OS === 'web') {
      dragHandleStyle.cursor = 'grab';
    }

    return (
      <View 
        key={item.id} 
        style={{ marginLeft: item.level * 20, marginBottom: 8 }}
        {...(Platform.OS === 'web' ? { 
          // @ts-ignore - data attributes para web
          'data-item-id': item.id,
        } : {})}
      >
        {/* Div del título: siempre visible, ocupa todo el ancho */}
        <View
          style={[
            containerStyle,
            {
              width: '100%',
              marginBottom: 0,
              borderTopLeftRadius: 8, // Bordes superiores siempre redondeados
              borderTopRightRadius: 8,
              borderBottomLeftRadius: isEditing ? 0 : 8, // Sin borde inferior redondeado cuando está en edición
              borderBottomRightRadius: isEditing ? 0 : 8,
              borderBottomWidth: isEditing ? 0 : 1, // Sin borde inferior cuando está en edición
              zIndex: isEditing ? 1 : 0, // El div activo está sobre el de edición
            }
          ]}
          {...(Platform.OS === 'web' ? {
            onMouseEnter: () => {
              if (draggingItemId && draggingItemId !== item.id) {
                dragOverItemRef.current = item.id;
                setDragOverItemId(item.id);
              }
            },
            onMouseLeave: () => {
              if (dragOverItemId === item.id) {
                dragOverItemRef.current = null;
                setDragOverItemId(null);
              }
            },
          } : {})}
        >
          {/* Handle de arrastre */}
          <View
            style={dragHandleStyle}
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

          {/* Icono de expandir/colapsar */}
          {hasChildren && (
            <TouchableOpacity onPress={() => toggleExpand(item.id)} style={{ marginRight: 8 }}>
              <Ionicons
                name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
          {!hasChildren && <View style={{ width: 28 }} />}

          {/* Primera fila: Icono, Nombre, URL, Estado (vista) */}
          <View style={{ flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
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
              style={{ padding: 4 }}
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
                style={{ flex: 2, minWidth: 200, flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
              {/* Indicador de cambios pendientes (punto verde) */}
              {isModified && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.success,
                  }}
                />
              )}
              <ThemedText type="body1" style={{ fontWeight: '600', color: colors.text }}>
                {item.label}
              </ThemedText>
            </TouchableOpacity>

            {/* URL */}
            <View style={{ flex: 2, minWidth: 200 }}>
              {item.route ? (
                <ThemedText type="caption" variant="secondary" numberOfLines={1}>
                  {item.route}
                </ThemedText>
              ) : (
                <ThemedText type="caption" variant="secondary" style={{ fontStyle: 'italic' }}>
                  Sin URL
                </ThemedText>
              )}
            </View>

            {/* Estado */}
            <View style={{ flex: 1, minWidth: 100, alignItems: 'center', marginRight: 8 }}>
              <ThemedText
                type="caption"
                style={{
                  color: item.status === 1 ? colors.success : item.status === 0 ? colors.error : colors.textSecondary,
                  fontWeight: '500',
                }}
              >
                {item.status === 1 ? 'Activo' : item.status === 0 ? 'Inactivo' : item.status === -1 ? 'Eliminado' : 'Pendiente'}
              </ThemedText>
            </View>

            {/* Botón agregar hijo */}
            <TouchableOpacity
              onPress={() => addChildNode(item.id, 'submenu')}
              style={{ marginLeft: 'auto' }}
            >
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Formulario de edición (debajo del título cuando está en edición) */}
        {isEditing && (
          <View 
            style={{ 
              width: '100%',
              backgroundColor: colors.surface, // Mismo color que el div activo
              borderTopLeftRadius: 0, // Sin borde superior redondeado para conectar con el div activo
              borderTopRightRadius: 0,
              borderBottomLeftRadius: 8, // Solo bordes inferiores redondeados
              borderBottomRightRadius: 8,
              borderWidth: 1,
              borderTopWidth: 0, // Sin borde superior para conectar visualmente
              borderColor: colors.primary, // Borde azul activo (laterales e inferior)
              padding: 12,
              gap: 12,
              marginTop: -1, // Ligeramente sobrepuesto para conectar mejor
              zIndex: 0, // El div de edición está debajo del activo
            }}
          >
            {/* Primera fila: Icono, Nombre, URL */}
                <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                  <View style={{ flex: 1, minWidth: 180 }}>
                    <ThemedText type="body2" style={{ marginBottom: 8, color: colors.text }}>
                      Icono
                    </ThemedText>
                    <IconInput
                      value={formData.icon || ''}
                      onChange={(value) => {
                        setFormData(prev => ({ ...prev, icon: value }));
                        // Aplicar cambios automáticamente al estado
                        updateItem(item.id, { icon: value });
                      }}
                      placeholder="Nombre del icono (ej: home, settings)"
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 180 }}>
                    <ThemedText type="body2" style={{ marginBottom: 8, color: colors.text }}>
                      Nombre
                    </ThemedText>
                    <InputWithFocus
                      containerStyle={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 8,
                        backgroundColor: colors.surface,
                      }}
                      primaryColor={colors.primary}
                    >
                      <TextInput
                        value={formData.label}
                        onChangeText={(text) => {
                          setFormData(prev => ({ ...prev, label: text }));
                          // Aplicar cambios automáticamente al estado
                          updateItem(item.id, { label: text });
                        }}
                        placeholder="Nombre del item"
                        style={{
                          padding: 12,
                          color: colors.text,
                        }}
                      />
                    </InputWithFocus>
                  </View>
                  <View style={{ flex: 1, minWidth: 180 }}>
                    <ThemedText type="body2" style={{ marginBottom: 8, color: colors.text }}>
                      URL
                    </ThemedText>
                    <InputWithFocus
                      containerStyle={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 8,
                        backgroundColor: colors.surface,
                      }}
                      primaryColor={colors.primary}
                    >
                      <TextInput
                        value={formData.route}
                        onChangeText={(text) => {
                          setFormData(prev => ({ ...prev, route: text }));
                          // Aplicar cambios automáticamente al estado
                          updateItem(item.id, { route: text });
                        }}
                        placeholder="/ruta"
                        style={{
                          padding: 12,
                          color: colors.text,
                        }}
                      />
                    </InputWithFocus>
                  </View>
                </View>
                
                {/* Segunda fila: Descripción y Estado/Público */}
                <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                  <View style={{ flex: 2, minWidth: 180 }}>
                    <ThemedText type="body2" style={{ marginBottom: 8, color: colors.text }}>
                      Descripción
                    </ThemedText>
                    <InputWithFocus
                      containerStyle={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 8,
                        backgroundColor: colors.surface,
                        minHeight: 105,
                      }}
                      primaryColor={colors.primary}
                    >
                      <TextInput
                        value={formData.description}
                        onChangeText={(text) => {
                          setFormData(prev => ({ ...prev, description: text }));
                          // Aplicar cambios automáticamente al estado
                          updateItem(item.id, { description: text });
                        }}
                        placeholder="Descripción del item"
                        multiline
                        numberOfLines={3}
                        style={{
                          padding: 12,
                          color: colors.text,
                          textAlignVertical: 'top',
                        }}
                      />
                    </InputWithFocus>
                  </View>
                  <View style={{ flex: 1, minWidth: 180 }}>
                    <ThemedText type="body2" style={{ marginBottom: 8, color: colors.text }}>
                      Estado
                    </ThemedText>
                    <Select
                      value={formData.status}
                      options={[
                        { value: -1, label: 'Eliminado' },
                        { value: 0, label: 'Inactivo' },
                        { value: 1, label: 'Activo' },
                        { value: 2, label: 'Pendiente' },
                      ]}
                      onSelect={(value) => {
                        const statusValue = value as number;
                        setFormData(prev => ({ ...prev, status: statusValue }));
                        // Aplicar cambios automáticamente al estado
                        updateItem(item.id, { status: statusValue });
                      }}
                    />
                    <View style={styles.publicToggleContainer}>
                      <View style={styles.publicToggleRow}>
                        <ThemedText type="body2" style={{ color: colors.text }}>
                          Público
                        </ThemedText>
                        <View style={styles.publicToggleControls}>
                          <Switch
                            value={formData.isPublic}
                            onValueChange={(value) => {
                              setFormData(prev => ({ ...prev, isPublic: value }));
                              // Aplicar cambios automáticamente al estado
                              updateItem(item.id, { isPublic: value });
                            }}
                            trackColor={{ 
                              false: colors.border + 'CC', 
                              true: colors.primary 
                            }}
                            thumbColor="#FFFFFF"
                            ios_backgroundColor={colors.border + 'CC'}
                            style={styles.publicToggleSwitch}
                          />
                          <ThemedText 
                            type="caption" 
                            style={[
                              styles.publicToggleText,
                              { 
                                color: formData.isPublic ? colors.primary : colors.textSecondary,
                                fontWeight: formData.isPublic ? '600' : '400',
                              }
                            ]}
                          >
                            {formData.isPublic ? 'Sí' : 'No'}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
                
            {/* Botones de acción */}
            <View style={styles.actionButtons}>
              <Button 
                title="Cancelar" 
                onPress={() => {
                  cancelEdit();
                  // Recargar para restaurar valores originales
                  loadMenuItems();
                }} 
                variant="outlined" 
                size="sm" 
              />
            </View>
              </View>
            )}

        {/* Submenu expandido */}
        {isExpanded && item.submenu && item.submenu.length > 0 && (
          <View style={{ marginTop: 8 }}>
            {item.submenu.map((subItem, subIndex) => renderMenuItem(subItem, subIndex))}
          </View>
        )}

        {/* Columns expandidas */}
        {isExpanded && item.columns && item.columns.length > 0 && (
          <View style={{ marginTop: 8 }}>
            {item.columns.map((column) => (
              <View key={column.id} style={{ marginBottom: 16 }}>
                <ThemedText type="subtitle" style={{ marginBottom: 8, fontWeight: '600' }}>
                  {column.title}
                </ThemedText>
                {column.items.map((colItem, colIndex) => renderMenuItem(colItem, colIndex))}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Filtrar items
  const filteredItems = menuItems.filter(item => {
    if (!searchValue) return true;
    const searchLower = searchValue.toLowerCase();
    return (
      item.label.toLowerCase().includes(searchLower) ||
      item.route?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* Header con búsqueda */}
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ flex: 1, position: 'relative' }}>
            <Ionicons
              name="search"
              size={20}
              color={colors.textSecondary}
              style={{ position: 'absolute', left: 12, top: 14, zIndex: 1 }}
            />
            <InputWithFocus
              containerStyle={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                backgroundColor: colors.surface,
                paddingLeft: 40,
              }}
              primaryColor={colors.primary}
            >
              <TextInput
                placeholder="Filtrar por nombre, código, módulo o acción..."
                value={searchValue}
                onChangeText={setSearchValue}
                style={{
                  padding: 12,
                  color: colors.text,
                }}
              />
            </InputWithFocus>
          </View>
          <Button
            title="Nuevo Item"
            onPress={() => {
              // TODO: Implementar crear nuevo item
              alert.showInfo('Funcionalidad en desarrollo');
            }}
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
            Cargando menú...
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

