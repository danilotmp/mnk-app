import { ThemedText } from '@/components/themed-text';
import { isMobileDevice } from '@/constants/breakpoints';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/src/infrastructure/i18n';
import { createHorizontalMenuStyles } from '@/src/styles/components/horizontal-menu.styles';
import { usePathname } from 'expo-router';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';

export interface MenuItem {
  id: string;
  label: string;
  route?: string;
  onPress?: () => void;
  icon?: string;
  description?: string;
  submenu?: MenuItem[];
  columns?: MenuColumn[];
}

export interface MenuColumn {
  title: string;
  items: MenuItem[];
}

interface HorizontalMenuProps {
  items: MenuItem[];
  onItemPress?: (item: MenuItem) => void;
}

/**
 * Menú de navegación horizontal responsive con mega menú
 * - Desktop/Tablet: Menú horizontal con mega menú de columnas
 * - Mobile: Menú hamburger con drawer
 */
export function HorizontalMenu({ items, onItemPress }: HorizontalMenuProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const styles = createHorizontalMenuStyles();
  const pathname = usePathname();
  const isMobile = isMobileDevice(width);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ left: 0 });
  const [activeMenuItem, setActiveMenuItem] = useState<string | null>(null); // Para rastrear opción activa del menú principal
  const [activeSubmenuItem, setActiveSubmenuItem] = useState<string | null>(null); // Para rastrear opción activa del submenú
  const menuItemRefs = useRef<any>({});
  const slideAnim = useRef(new Animated.Value(-400)).current; // Animación para deslizar desde la izquierda
  const pendingRouteRef = useRef<string | null>(null); // Para rastrear la ruta que estamos navegando
  const pendingItemIdRef = useRef<string | null>(null); // Para rastrear el itemId que estamos navegando
  const justClickedRef = useRef<boolean>(false); // Flag para indicar que acabamos de hacer click
  const pendingSubmenuItemRef = useRef<string | null>(null); // Para almacenar el itemId del submenú que debe activarse después del render

  // Función para cerrar el menú con animación
  const closeMobileMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setMobileMenuOpen(false);
    });
  };

  // Detectar la ruta actual y establecer el item activo
  useEffect(() => {
    // Si acabamos de hacer click, NO procesar todavía
    // Esto previene que el useEffect limpie el estado inmediatamente después del click
    if (justClickedRef.current) {
      return; // Salir inmediatamente sin procesar
    }
    
    // Si no hay pathname, no hacer nada
    if (!pathname) {
      return;
    }
    
    // Si no hay items todavía (menú cargando), esperar a que cargue
    // IMPORTANTE: No retornar temprano aquí, porque cuando el menú carga,
    // necesitamos que este useEffect se ejecute para detectar la ruta activa
    if (!items || items.length === 0) {
      // Si el menú está vacío pero hay una ruta activa, mantener el estado
      // Esto previene que se pierda la selección durante la carga del menú
      return;
    }

    // Función para comparar rutas de manera flexible
    const isRouteMatch = (pathname: string, route: string): boolean => {
      if (!route) return false;
      
      const normalizedPath = pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
      const normalizedRoute = route.toLowerCase().replace(/^\/+|\/+$/g, '');
      
      // Verificar coincidencia exacta
      if (normalizedPath === normalizedRoute) {
        return true;
      }
      
      // Verificar si el pathname empieza con la ruta seguida de /
      if (normalizedPath.startsWith(normalizedRoute + '/')) {
        return true;
      }
      
      // Verificar si el pathname termina con / seguido de la ruta
      if (normalizedPath.endsWith('/' + normalizedRoute)) {
        return true;
      }
      
      // Verificar si contiene la ruta con delimitadores
      return normalizedPath.includes('/' + normalizedRoute + '/');
    };

    // Función recursiva para buscar el item activo basado en la ruta
    const findActiveItem = (items: MenuItem[], parentId?: string): { itemId: string | null; parentId: string | null } => {
      for (const item of items) {
        // Comparar la ruta
        if (item.route && isRouteMatch(pathname, item.route)) {
          // Si encontramos el item activo en el nivel principal, marcarlo
          if (!parentId) {
            setActiveMenuItem(item.id);
          }
          return { itemId: item.id, parentId: parentId || null };
        }
        if (item.submenu) {
          const result = findActiveItem(item.submenu, item.id);
          if (result.itemId) {
            // Si encontramos un subitem activo, también marcar el padre
            setActiveMenuItem(item.id);
            // NO abrir el submenú automáticamente - solo el usuario puede abrirlo con click
            return result;
          }
        }
        if (item.columns) {
          for (const column of item.columns) {
            const result = findActiveItem(column.items, item.id);
            if (result.itemId) {
              // Si encontramos un subitem activo, también marcar el padre
              setActiveMenuItem(item.id);
              // NO abrir el mega menú automáticamente - solo el usuario puede abrirlo con click
              return result;
            }
          }
        }
      }
      return { itemId: null, parentId: null };
    };

    const { itemId, parentId } = findActiveItem(items);
    
    // Si hay una ruta pendiente, verificar primero si el pathname coincide
    if (pendingRouteRef.current) {
      const routeMatches = isRouteMatch(pathname, pendingRouteRef.current);
      
      if (routeMatches && itemId) {
        // La ruta coincide y encontramos el item - establecerlo
        // IMPORTANTE: NO limpiar las banderas todavía - mantenerlas mientras el item esté activo
        
        // Mantener el submenú abierto si es necesario
        if (parentId) {
          const findParentItemById = (items: MenuItem[], targetId: string): MenuItem | null => {
            for (const item of items) {
              if (item.id === targetId) {
                return item;
              }
              if (item.submenu) {
                const found = findParentItemById(item.submenu, targetId);
                if (found) return item;
              }
              if (item.columns) {
                for (const column of item.columns) {
                  const found = findParentItemById(column.items, targetId);
                  if (found) return item;
                }
              }
            }
            return null;
          };
          
        const parentItem = findParentItemById(items, parentId);
        if (parentItem && (parentItem.submenu || parentItem.columns)) {
          // Abrir el submenú primero
          setActiveSubmenu(parentItem.id);
          setActiveMenuItem(parentItem.id);
          
          // Para submenús simples, almacenar el itemId en memoria y aplicar después del render
          // Para columnas, establecer directamente (ya funciona bien)
          if (parentItem.submenu && !parentItem.columns) {
            // Es un submenú simple - almacenar en ref para aplicar después del render
            // Usar setTimeout para asegurar que React haya procesado el cambio de activeSubmenu
            pendingSubmenuItemRef.current = itemId;
            setTimeout(() => {
              if (pendingSubmenuItemRef.current === itemId) {
                setActiveSubmenuItem(itemId);
                pendingSubmenuItemRef.current = null;
              }
            }, 50); // Delay suficiente para que React procese el cambio de estado
          } else {
            // Es un menú con columnas - establecer directamente (ya funciona bien)
            setActiveSubmenuItem(itemId);
          }
        } else {
          // Si no encontramos el padre, establecer el item activo directamente
          setActiveSubmenuItem(itemId);
        }
      } else {
        // Si no hay parentId, establecer el item activo directamente
        setActiveSubmenuItem(itemId);
      }
        
        // Solo limpiar las banderas si el itemId coincide con el pendiente
        // Esto asegura que el estado se mantenga correctamente
        if (pendingItemIdRef.current === itemId) {
          // Las banderas se mantendrán hasta que cambie la ruta o se seleccione otro item
          // No las limpiamos aquí para evitar que se pierda la selección
        }
        return; // Salir temprano - ya manejamos el caso
      } else if (routeMatches && !itemId) {
        // La ruta coincide pero no encontramos el item - usar el itemId pendiente
        if (pendingItemIdRef.current) {
          setActiveSubmenuItem(pendingItemIdRef.current);
          // Buscar el padre del item pendiente
          const findItemById = (items: MenuItem[], targetId: string): { item: MenuItem | null; parent: MenuItem | null } => {
            for (const item of items) {
              if (item.id === targetId) {
                return { item, parent: null };
              }
              if (item.submenu) {
                for (const subitem of item.submenu) {
                  if (subitem.id === targetId) {
                    return { item: subitem, parent: item };
                  }
                }
              }
              if (item.columns) {
                for (const column of item.columns) {
                  for (const colItem of column.items) {
                    if (colItem.id === targetId) {
                      return { item: colItem, parent: item };
                    }
                  }
                }
              }
            }
            return { item: null, parent: null };
          };
          
          const { parent } = findItemById(items, pendingItemIdRef.current);
          if (parent && (parent.submenu || parent.columns)) {
            setActiveSubmenu(parent.id);
            setActiveMenuItem(parent.id);
          }
        }
        return; // Mantener el estado pendiente hasta que se encuentre el item
      } else {
        // La ruta no coincide todavía - mantener el estado pendiente
        // NO limpiar nada, esperar a que la navegación complete
        return;
      }
    }
    
    // Si no hay ruta pendiente, comportamiento normal
    if (itemId) {
      // Limpiar las banderas pendientes solo si el itemId actual es diferente al pendiente
      // Esto previene que se limpien las banderas cuando el item está activo
      if (pendingItemIdRef.current && pendingItemIdRef.current !== itemId) {
        // El item activo es diferente al pendiente - limpiar las banderas
        pendingRouteRef.current = null;
        pendingItemIdRef.current = null;
        justClickedRef.current = false;
      } else if (pendingItemIdRef.current === itemId) {
        // El item activo coincide con el pendiente - limpiar el flag de click
        // pero mantener las banderas para proteger el estado
        justClickedRef.current = false;
      }
      
      // Si el item activo está en un submenú, mantener el submenú abierto
      // IMPORTANTE: Esto es crítico para que el item activo sea visible después del refresh
      if (parentId) {
        // Buscar el item padre por su ID directamente en el menú principal
        const findParentItemById = (items: MenuItem[], targetId: string): MenuItem | null => {
          for (const item of items) {
            // Buscar el item que tiene el targetId como su id
            if (item.id === targetId) {
              return item;
            }
            // Si no lo encontramos en este nivel, buscar recursivamente en submenús
            // pero solo para encontrar el item padre, no para buscar dentro de submenús
            if (item.submenu) {
              // Verificar si alguno de los subitems tiene el targetId como padre
              // Si es así, el item actual es el padre
              const hasChildWithId = item.submenu.some(subItem => subItem.id === targetId);
              if (hasChildWithId) {
                return item;
              }
            }
            if (item.columns) {
              // Verificar si alguno de los items en las columnas tiene el targetId
              for (const column of item.columns) {
                const hasChildWithId = column.items.some(colItem => colItem.id === targetId);
                if (hasChildWithId) {
                  return item;
                }
              }
            }
          }
          return null;
        };
        
        const parentItem = findParentItemById(items, parentId);
        if (parentItem && (parentItem.submenu || parentItem.columns)) {
          // Abrir el submenú primero
          setActiveSubmenu(parentItem.id);
          setActiveMenuItem(parentItem.id);
          
          // Para submenús simples, almacenar el itemId en memoria y aplicar después del render
          // Para columnas, establecer directamente (ya funciona bien)
          if (parentItem.submenu && !parentItem.columns) {
            // Es un submenú simple - almacenar en ref para aplicar después del render
            // Usar setTimeout para asegurar que React haya procesado el cambio de activeSubmenu
            pendingSubmenuItemRef.current = itemId;
            setTimeout(() => {
              if (pendingSubmenuItemRef.current === itemId) {
                setActiveSubmenuItem(itemId);
                pendingSubmenuItemRef.current = null;
              }
            }, 50); // Delay suficiente para que React procese el cambio de estado
          } else {
            // Es un menú con columnas - establecer directamente (ya funciona bien)
            setActiveSubmenuItem(itemId);
          }
        } else {
          // Si no encontramos el padre o no tiene submenú/columnas, establecer el item activo directamente
          setActiveSubmenuItem(itemId);
        }
      } else {
        // Si no hay parentId pero encontramos un item activo en el nivel principal
        // Asegurarnos de que el item principal esté marcado como activo
        const findItemById = (items: MenuItem[], targetId: string): MenuItem | null => {
          for (const item of items) {
            if (item.id === targetId) {
              return item;
            }
            if (item.submenu) {
              const found = findItemById(item.submenu, targetId);
              if (found) return item;
            }
            if (item.columns) {
              for (const column of item.columns) {
                const found = findItemById(column.items, targetId);
                if (found) return item;
              }
            }
          }
          return null;
        };
        
        const foundItem = findItemById(items, itemId);
        if (foundItem && !foundItem.submenu && !foundItem.columns) {
          // Es un item de nivel principal sin submenú
          setActiveMenuItem(itemId);
        }
      }
    } else {
      // Si no hay item activo, verificar si debemos limpiar las banderas
      // IMPORTANTE: Si hay una ruta pendiente y activeSubmenuItem está establecido,
      // NO limpiar - mantener el estado hasta que se encuentre el item
      if (pendingRouteRef.current && pendingItemIdRef.current) {
        // Hay una ruta pendiente y un itemId pendiente - mantener el estado
        // Solo limpiar si la ruta actual definitivamente NO coincide
        if (!isRouteMatch(pathname, pendingRouteRef.current)) {
          // La ruta cambió y no coincide con la pendiente - limpiar todo
          pendingRouteRef.current = null;
          pendingItemIdRef.current = null;
          justClickedRef.current = false;
          setActiveMenuItem(null);
          setActiveSubmenuItem(null);
        }
        // Si la ruta coincide o aún no ha cambiado, mantener el estado
      } else if (!pendingRouteRef.current) {
        // No hay ruta pendiente y no hay item activo - limpiar normalmente
        setActiveMenuItem(null);
        setActiveSubmenuItem(null);
      }
      // Si hay ruta pendiente pero aún no coincide, mantener el estado (no limpiar)
    }
  }, [pathname, items]); // Agregado items a las dependencias para que se actualice cuando el menú carga

  // useLayoutEffect para aplicar el item activo del submenú ANTES del paint
  // Esto es necesario solo para submenús simples, ya que se renderizan condicionalmente
  // useLayoutEffect se ejecuta de forma síncrona después de todas las mutaciones del DOM pero antes del paint
  useLayoutEffect(() => {
    // Solo procesar si hay un item pendiente
    if (pendingSubmenuItemRef.current) {
      // Si el submenú ya está abierto, aplicar inmediatamente
      if (activeSubmenu) {
        const activeItem = items.find(item => item.id === activeSubmenu);
        if (activeItem && activeItem.submenu && !activeItem.columns) {
          // Verificar que el item pendiente realmente existe en el submenú
          const itemExists = activeItem.submenu.some(subitem => subitem.id === pendingSubmenuItemRef.current);
          if (itemExists) {
            // Es un submenú simple, está abierto y el item existe - aplicar inmediatamente
            setActiveSubmenuItem(pendingSubmenuItemRef.current);
            pendingSubmenuItemRef.current = null; // Limpiar el ref después de aplicar
          }
        }
      }
      // Si el submenú aún no está abierto, esperar a que se abra (se procesará en el siguiente render)
    }
  }, [activeSubmenu, items, pathname]); // Se ejecuta cuando activeSubmenu, items o pathname cambian

  const handleItemPress = (item: MenuItem) => {
    if (item.submenu && item.submenu.length > 0) {
      // Medir posición del elemento antes de abrir el submenú
      if (menuItemRefs.current[item.id]) {
        menuItemRefs.current[item.id].measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          // Usar x (posición relativa al ScrollView) en lugar de pageX (posición absoluta)
          setSubmenuPosition({ left: x });
        });
      }
      // Si el submenú ya está abierto, cerrarlo (toggle)
      // Si está cerrado, abrirlo
      if (activeSubmenu === item.id) {
        // Si el submenú está abierto, cerrarlo
        setActiveSubmenu(null);
      } else {
        // Abrir el submenú y marcar como activo
        setActiveSubmenu(item.id);
        setActiveMenuItem(item.id);
      }
      // NO limpiar activeSubmenuItem aquí porque el useEffect lo manejará basado en la ruta actual
    } else if (item.columns && item.columns.length > 0) {
      // Medir posición del elemento antes de abrir el mega menú
      if (menuItemRefs.current[item.id]) {
        menuItemRefs.current[item.id].measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          // Usar x (posición relativa al ScrollView) en lugar de pageX (posición absoluta)
          setSubmenuPosition({ left: x });
        });
      }
      // Si el mega menú ya está abierto, cerrarlo (toggle)
      // Si está cerrado, abrirlo
      if (activeSubmenu === item.id) {
        // Si el mega menú está abierto, cerrarlo
        setActiveSubmenu(null);
      } else {
        // Abrir el mega menú y marcar como activo
        setActiveSubmenu(item.id);
        setActiveMenuItem(item.id);
      }
      // NO limpiar activeSubmenuItem aquí porque el useEffect lo manejará basado en la ruta actual
    } else {
      // Navegar o ejecutar acción
      setActiveMenuItem(item.id); // Marcar como activa
      setActiveSubmenuItem(null); // Limpiar selección del submenú (solo cuando navegamos a una página principal)
      if (item.onPress) {
        item.onPress();
      }
      if (onItemPress) {
        onItemPress(item);
      }
      if (isMobile) {
        closeMobileMenu();
      }
      setActiveSubmenu(null);
    }
  };

  const handleSubmenuItemPress = (item: MenuItem, parentId: string) => {
    // IMPORTANTE: Marcar que acabamos de hacer click para prevenir que el useEffect limpie el estado
    justClickedRef.current = true;
    
    // 1. Guardar la ruta y el itemId esperados ANTES de navegar
    if (item.route) {
      pendingRouteRef.current = item.route;
    }
    pendingItemIdRef.current = item.id;
    
    // 2. Establecer el item activo inmediatamente para feedback visual
    setActiveSubmenuItem(item.id);
    
    // 3. Asegurar que el submenú/mega menú permanezca abierto
    // Esto es crítico - igual que con columnas, el menú debe permanecer visible
    if (parentId) {
      // Buscar el item padre para mantener su submenú abierto
      const parentItem = items.find(i => i.id === parentId);
      if (parentItem && (parentItem.submenu || parentItem.columns)) {
        setActiveSubmenu(parentItem.id);
        setActiveMenuItem(parentItem.id);
      }
    }
    
    // 4. Ejecutar callbacks de navegación DESPUÉS de establecer el estado
    // Esto asegura que el estado visual se establezca antes de que cambie el pathname
    if (item.onPress) {
      item.onPress();
    }
    if (onItemPress) {
      onItemPress(item);
    }
    if (isMobile) {
      closeMobileMenu();
    }

    // Cerrar cualquier menú desplegado al navegar (desktop/tablet)
    setActiveSubmenu(null);
    
    // Resetear el flag después de un delay más largo para asegurar que el useEffect no limpie
    setTimeout(() => {
      justClickedRef.current = false;
    }, 500);
  };

  const handleMouseEnter = (itemId: string) => {
    // Solo funciona en web
    if (Platform.OS === 'web') {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
      // Si hay un submenú activo diferente, lo cerramos
      if (activeSubmenu && activeSubmenu !== itemId) {
        setActiveSubmenu(null);
      }
      // Medir posición del elemento antes de abrir el submenú
      if (menuItemRefs.current[itemId]) {
        menuItemRefs.current[itemId].measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          setSubmenuPosition({ left: x });
        });
      }
      setActiveSubmenu(itemId);
    }
  };

  const handleMouseLeave = () => {
    // Solo funciona en web
    if (Platform.OS === 'web') {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
      const timeout = setTimeout(() => {
        setActiveSubmenu(null);
      }, 200) as ReturnType<typeof setTimeout>;
      setHoverTimeout(timeout);
    }
  };

  const handleSubmenuMouseEnter = () => {
    // Solo funciona en web
    if (Platform.OS === 'web') {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
    }
  };

  const handleClickOutside = () => {
    setActiveSubmenu(null);
  };

  // Detectar si se hace click fuera del menú
  useEffect(() => {
    if (activeSubmenu) {
      const handleDocumentClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target && !target.closest('[data-menu-container]')) {
          setActiveSubmenu(null);
        }
      };
      
      if (Platform.OS === 'web') {
        document.addEventListener('click', handleDocumentClick);
        return () => {
          document.removeEventListener('click', handleDocumentClick);
        };
      }
    }
  }, [activeSubmenu]);

  // Efecto para animar el menú móvil
  useEffect(() => {
    if (mobileMenuOpen) {
      // Resetear animación al abrir
      slideAnim.setValue(-400);
      // Animar entrada desde la izquierda
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [mobileMenuOpen]);

  // Mobile: Hamburger Menu
  if (isMobile) {
    return (
      <>
        <TouchableOpacity
          style={[styles.hamburgerButton, { backgroundColor: colors.surface }]}
          onPress={() => setMobileMenuOpen(true)}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.hamburgerIcon}>☰</ThemedText>
        </TouchableOpacity>

        <Modal
          animationType="none"
          transparent={true}
          visible={mobileMenuOpen}
          onRequestClose={closeMobileMenu}
        >
          <Pressable
            style={styles.mobileMenuOverlay}
            onPress={closeMobileMenu}
          >
            <Animated.View
              style={[
                styles.mobileMenuContainer,
                { backgroundColor: colors.background },
                {
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              <Pressable
                onPress={(e) => e.stopPropagation()}
                style={{ flex: 1 }}
              >
              <View style={[styles.mobileMenuHeader, { borderBottomColor: colors.border }]}>
                <ThemedText type="h3">{t.menuLabel.menu}</ThemedText>
                <TouchableOpacity onPress={closeMobileMenu}>
                  <ThemedText type="h3">✕</ThemedText>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.mobileMenuContent}>
                {items.map((item) => (
                  <View key={item.id}>
                    {(() => {
                      // Función para comparar rutas de manera flexible
                      const isRouteMatch = (pathname: string, route: string): boolean => {
                        if (!route) return false;
                        const normalizedPath = pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
                        const normalizedRoute = route.toLowerCase().replace(/^\/+|\/+$/g, '');
                        if (normalizedPath === normalizedRoute) return true;
                        if (normalizedPath.startsWith(normalizedRoute + '/')) return true;
                        if (normalizedPath.endsWith('/' + normalizedRoute)) return true;
                        return normalizedPath.includes('/' + normalizedRoute + '/');
                      };
                      
                      // Verificar si algún subitem de este menú padre está activo
                      let hasActiveSubitem = false;
                      if (item.submenu) {
                        hasActiveSubitem = item.submenu.some(subitem => {
                          const isActive = activeSubmenuItem === subitem.id || 
                                         (subitem.route && pathname && isRouteMatch(pathname, subitem.route));
                          return isActive;
                        });
                      } else if (item.columns) {
                        hasActiveSubitem = item.columns.some(column =>
                          column.items.some(subitem => {
                            const isActive = activeSubmenuItem === subitem.id || 
                                           (subitem.route && pathname && isRouteMatch(pathname, subitem.route));
                            return isActive;
                          })
                        );
                      }
                      
                      return (
                        <TouchableOpacity
                          style={[
                            styles.mobileMenuItem,
                            { borderBottomColor: colors.border },
                            hasActiveSubitem && styles.activeMobileMenuItemParent,
                          ]}
                          onPress={() => handleItemPress(item)}
                        >
                          <ThemedText type="defaultSemiBold">{item.label}</ThemedText>
                          {(item.submenu || item.columns) && (
                            <ThemedText>{activeSubmenu === item.id ? '▲' : '▼'}</ThemedText>
                          )}
                        </TouchableOpacity>
                      );
                    })()}

                    {(item.submenu || item.columns) && activeSubmenu === item.id && (
                      <View style={[styles.submenuContainer, { backgroundColor: colors.surface }]}>
                        {item.submenu?.map((subitem) => {
                          // Función para comparar rutas de manera flexible
                          const isRouteMatch = (pathname: string, route: string): boolean => {
                            if (!route) return false;
                            const normalizedPath = pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
                            const normalizedRoute = route.toLowerCase().replace(/^\/+|\/+$/g, '');
                            if (normalizedPath === normalizedRoute) return true;
                            if (normalizedPath.startsWith(normalizedRoute + '/')) return true;
                            if (normalizedPath.endsWith('/' + normalizedRoute)) return true;
                            return normalizedPath.includes('/' + normalizedRoute + '/');
                          };
                          
                          // Verificar si este item debe estar activo basándose en la ruta actual
                          // Esto es más confiable que depender solo del estado activeSubmenuItem
                          const isActive = activeSubmenuItem === subitem.id || 
                                           (subitem.route && pathname && isRouteMatch(pathname, subitem.route));
                          
                          return (
                            <TouchableOpacity
                              key={subitem.id}
                              style={[
                                styles.submenuItem,
                                isActive && styles.activeSubmenuItem
                              ]}
                              onPress={() => handleSubmenuItemPress(subitem, item.id)}
                            >
                              <ThemedText type="body2" style={styles.submenuText}>
                                {subitem.label}
                              </ThemedText>
                            </TouchableOpacity>
                          );
                        })}
                        {item.columns?.map((column, colIdx) => (
                          <View key={colIdx} style={styles.mobileColumn}>
                            <ThemedText type="defaultSemiBold" style={styles.mobileColumnTitle}>
                              {column.title}
                            </ThemedText>
                            {column.items.map((subitem) => (
                              <TouchableOpacity
                                key={subitem.id}
                                style={[
                                  styles.submenuItem,
                                  activeSubmenuItem === subitem.id && styles.activeSubmenuItem
                                ]}
                                onPress={() => handleSubmenuItemPress(subitem, item.id)}
                              >
                                <ThemedText type="body2" style={styles.submenuText}>
                                  {subitem.label}
                                </ThemedText>
                              </TouchableOpacity>
                            ))}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
      </>
    );
  }

  // Desktop/Tablet: Horizontal Menu
  const activeItem = items.find(item => item.id === activeSubmenu);

  return (
    <View style={styles.desktopContainer} data-menu-container="true">
      {/* Menú horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalMenuContent}
        style={styles.horizontalMenuScroll}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            ref={(ref) => {
              if (ref) {
                menuItemRefs.current[item.id] = ref;
              }
            }}
            style={[
              styles.horizontalMenuItem,
              (activeMenuItem === item.id || activeSubmenu === item.id) && styles.activeMenuItem,
            ]}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.7}
          >
            <ThemedText type="defaultSemiBold" style={styles.menuItemText}>
              {item.label}
            </ThemedText>
            {(item.submenu || item.columns) && (
              <ThemedText style={styles.dropdownIndicator}>
                {activeSubmenu === item.id ? '▲' : '▼'}
              </ThemedText>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Mega Menu o Submenu - Renderizado fuera del ScrollView */}
      {activeSubmenu && activeItem && (
        <>
          {activeItem.columns && activeItem.columns.length > 0 && (
            <View
              style={[
                styles.megaMenu,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  ...(Platform.OS === 'web' ? { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' } : { shadowColor: colors.text }),
                  left: submenuPosition.left,
                },
              ]}
            >
              <View style={styles.megaMenuContent}>
                {activeItem.columns.map((column, colIdx) => (
                  <View key={colIdx} style={styles.megaMenuColumn}>
                    <ThemedText
                      type="h6"
                      style={[
                        styles.megaMenuColumnTitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {column.title}
                    </ThemedText>
                    <View
                      style={[styles.megaMenuColumnLine, { backgroundColor: colors.border }]}
                    />
                    {column.items.map((subitem) => (
                      <TouchableOpacity
                        key={subitem.id}
                        style={[
                          styles.megaMenuItem, 
                          { borderBottomColor: colors.border },
                          activeSubmenuItem === subitem.id && styles.activeMegaMenuItem
                        ]}
                        onPress={() => handleSubmenuItemPress(subitem, activeItem.id)}
                      >
                        <ThemedText type="body2" style={styles.megaMenuItemText}>
                          {subitem.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeItem.submenu && activeItem.submenu.length > 0 && (
            <View
              style={[
                styles.desktopSubmenu,
                {
                  backgroundColor: colors.background, // ← Agregado explícitamente
                  borderColor: colors.border,
                  ...(Platform.OS === 'web' ? { boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' } : { shadowColor: colors.text }),
                  left: submenuPosition.left, // ← Posición calculada
                },
              ]}
            >
              {activeItem.submenu.map((subitem) => {
                // Función para comparar rutas de manera flexible
                const isRouteMatch = (pathname: string, route: string): boolean => {
                  if (!route) return false;
                  const normalizedPath = pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
                  const normalizedRoute = route.toLowerCase().replace(/^\/+|\/+$/g, '');
                  if (normalizedPath === normalizedRoute) return true;
                  if (normalizedPath.startsWith(normalizedRoute + '/')) return true;
                  if (normalizedPath.endsWith('/' + normalizedRoute)) return true;
                  return normalizedPath.includes('/' + normalizedRoute + '/');
                };
                
                // Verificar si este item debe estar activo basándose en la ruta actual
                // Esto es más confiable que depender solo del estado activeSubmenuItem
                const isActive = activeSubmenuItem === subitem.id || 
                                 (subitem.route && pathname && isRouteMatch(pathname, subitem.route));
                
                return (
                  <TouchableOpacity
                    key={subitem.id}
                    style={[
                      styles.desktopSubmenuItem, 
                      { borderBottomColor: colors.border },
                      isActive && styles.activeSubmenuItem
                    ]}
                    onPress={() => handleSubmenuItemPress(subitem, activeItem.id)}
                  >
                    <ThemedText type="defaultSemiBold" style={styles.submenuItemTitle}>
                      {subitem.label}
                    </ThemedText>
                    {subitem.description && (
                      <ThemedText type="caption" style={styles.submenuItemDescription}>
                        {subitem.description}
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </>
      )}
    </View>
  );
}

// estilos movidos a src/styles/components/horizontal-menu.styles.ts
