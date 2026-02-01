import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { isMobileDevice } from '@/constants/breakpoints';
import { useTheme } from '@/hooks/use-theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { AppConfig } from '@/src/config';
import { DynamicIcon } from '@/src/domains/shared/components';
import { useBranches, useCompany, useMultiCompany } from '@/src/domains/shared/hooks/use-multi-company.hook';
import { Branch, BranchAccess } from '@/src/domains/shared/types';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { useSession } from '@/src/infrastructure/session';
import { LanguageSelector, useTranslation } from '@/src/infrastructure/i18n';
import { createHorizontalMenuStyles } from '@/src/styles/components/horizontal-menu.styles';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { createHorizontalMenuAdditionalStyles } from './horizontal-menu.styles';
import type { HorizontalMenuProps, MenuColumn, MenuItem } from './horizontal-menu.types';

/**
 * Menú de navegación horizontal responsive con mega menú
 * - Desktop/Tablet: Menú horizontal con mega menú de columnas
 * - Mobile: Menú hamburger con drawer
 */
export function HorizontalMenu({ 
  items, 
  onItemPress,
}: HorizontalMenuProps) {
  const { colors } = useTheme();
  const { isDark } = useThemeMode();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const isMobile = isMobileDevice(width);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const { t } = useTranslation();
  const { user, company, branch: currentBranch } = useCompany();
  const { switchBranch } = useBranches();
  const { clearContext } = useMultiCompany();
  const { clearSession } = useSession();
  const alert = useAlert();
  const router = useRouter();
  const [branches, setBranches] = React.useState<BranchAccess[]>([]);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isMenuHovered, setIsMenuHovered] = useState(false); // Estado para hover del menú (solo Web)

  // Función helper para inferir tipo de sucursal
  const inferBranchType = (code: string): 'headquarters' | 'branch' | 'warehouse' | 'store' => {
    const upperCode = code.toUpperCase();
    if (upperCode.includes('HQ') || upperCode.includes('HEADQUARTERS') || upperCode.includes('CASA MATRIZ')) {
      return 'headquarters';
    }
    if (upperCode.includes('WAREHOUSE') || upperCode.includes('ALMACEN') || upperCode.includes('BODEGA')) {
      return 'warehouse';
    }
    if (upperCode.includes('STORE') || upperCode.includes('TIENDA') || upperCode.includes('LOCAL')) {
      return 'store';
    }
    return 'branch';
  };

  // Cargar branches cuando cambia la empresa o usuario
  React.useEffect(() => {
    const loadBranches = async () => {
      if (!company || !user) {
        setBranches([]);
        return;
      }
      
      const { UserSessionService } = await import('@/src/domains/shared/services/user-session.service');
      const { UserContextService } = await import('@/src/domains/shared/services/user-context.service');
      const userSessionService = UserSessionService.getInstance();
      const userContextService = UserContextService.getInstance();
      
      const userResponse = await userSessionService.getUser();
      if (!userResponse) {
        setBranches([]);
        return;
      }
      
      const branchInfos = userContextService.getBranchesForCompany(company.id, userResponse);
      
      const branchAccesses: BranchAccess[] = branchInfos.map(branchInfo => {
        const branchObj: Branch = {
          id: branchInfo.id,
          code: branchInfo.code,
          name: branchInfo.name,
          type: inferBranchType(branchInfo.code) as any,
          companyId: company.id,
          address: {
            street: '',
            city: '',
            state: '',
            country: '',
            postalCode: '',
          },
          contactInfo: {
            phone: '',
            email: '',
          },
          settings: {
            timezone: 'America/Guayaquil',
            workingHours: {
              monday: { isOpen: false },
              tuesday: { isOpen: false },
              wednesday: { isOpen: false },
              thursday: { isOpen: false },
              friday: { isOpen: false },
              saturday: { isOpen: false },
              sunday: { isOpen: false },
            },
            services: [],
            features: [],
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        return {
          branchId: branchInfo.id,
          branch: branchObj,
        };
      });
      
      setBranches(branchAccesses);
    };
    
    loadBranches();
  }, [company?.id, user]);

  // Obtener iniciales del nombre para el avatar
  const getInitials = () => {
    const firstName = user?.firstName?.trim() || '';
    const lastName = user?.lastName?.trim() || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
    }
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (lastName) return lastName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };
  
  // Obtener nombre completo para mostrar
  const getDisplayName = () => {
    const firstName = user?.firstName?.trim() || '';
    const lastName = user?.lastName?.trim() || '';
    
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return user?.email || 'Usuario';
  };

  const handleBranchSwitch = (newBranch: Branch) => {
    if (currentBranch && newBranch.id === currentBranch.id) {
      return;
    }
    switchBranch(newBranch);
  };

  const handleLogout = async () => {
    setProfileModalVisible(false);
    closeMobileMenu();
    
    try {
      const { authService } = await import('@/src/infrastructure/services/auth.service');
      await authService.logout();
    } catch (error) {
      // Error handling
    }
    
    await clearSession();
    clearContext();
    alert.showSuccess('auth.logoutSuccess');
    
    requestAnimationFrame(() => {
      setTimeout(() => {
        router.replace('/');
      }, 150);
    });
  };

  const handleProfile = () => {
    setProfileModalVisible(false);
    closeMobileMenu();
    // TODO: Navegar a pantalla de perfil
  };

  const handleSettings = () => {
    setProfileModalVisible(false);
    closeMobileMenu();
    // TODO: Navegar a pantalla de configuración
  };
  
  // Obtener el color para items activos según la configuración
  // Si es 'red', usar '#ff3366'; si es 'blue', usar colors.primary; si no, usar el valor directamente
  const getActiveItemColor = (): string => {
    const configColor = AppConfig.navigation.activeItemColor;
    if (configColor === 'red') return '#ff3366';
    if (configColor === 'blue') return colors.primary;
    return configColor; // Cualquier otro color se usa directamente
  };
  const activeItemColor = getActiveItemColor();
  const styles = createHorizontalMenuStyles(activeItemColor);
  const [submenuPosition, setSubmenuPosition] = useState({ left: 0 });
  const [activeMenuItem, setActiveMenuItem] = useState<string | null>(null); // Para rastrear opción activa del menú principal
  const [activeSubmenuItem, setActiveSubmenuItem] = useState<string | null>(null); // Para rastrear opción activa del submenú
  const [searchValue, setSearchValue] = useState<string>(''); // Estado para búsqueda (móvil)
  const [desktopSearchExpanded, setDesktopSearchExpanded] = useState<boolean>(false); // Estado para búsqueda expandida (desktop)
  const [desktopSearchValue, setDesktopSearchValue] = useState<string>(''); // Estado para búsqueda (desktop)
  const menuItemRefs = useRef<any>({});
  const slideAnim = useRef(new Animated.Value(-400)).current; // Animación para deslizar desde la izquierda
  const pendingRouteRef = useRef<string | null>(null); // Para rastrear la ruta que estamos navegando
  const pendingItemIdRef = useRef<string | null>(null); // Para rastrear el itemId que estamos navegando
  const justClickedRef = useRef<boolean>(false); // Flag para indicar que acabamos de hacer click
  const pendingSubmenuItemRef = useRef<string | null>(null); // Para almacenar el itemId del submenú que debe activarse después del render
  const hasInitializedExpandedState = useRef<boolean>(false); // Flag para rastrear si ya se inicializó el estado expandido

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
      // Si no hay item activo en este menú, verificar si debemos limpiar
      // Primero verificar si el pathname actual corresponde a algún item de este menú
      // Si no corresponde, limpiar el estado activo (puede que el item activo esté en otro menú)
      
      // Verificar si hay algún item en este menú que coincida con el pathname
      const hasMatchingItem = (() => {
        for (const item of items) {
          if (item.route && isRouteMatch(pathname, item.route)) {
            return true;
          }
          if (item.submenu) {
            for (const subItem of item.submenu) {
              if (subItem.route && isRouteMatch(pathname, subItem.route)) {
                return true;
              }
            }
          }
          if (item.columns) {
            for (const column of item.columns) {
              for (const colItem of column.items) {
                if (colItem.route && isRouteMatch(pathname, colItem.route)) {
                  return true;
                }
              }
            }
          }
        }
        return false;
      })();
      
      // Si no hay item que coincida en este menú, limpiar el estado activo
      // Esto asegura que cuando se selecciona un item en otro menú, este menú se desactive
      if (!hasMatchingItem) {
        // Limpiar las banderas pendientes si existen
        if (pendingRouteRef.current && pendingItemIdRef.current) {
          // Solo limpiar si la ruta pendiente definitivamente no coincide
          if (!isRouteMatch(pathname, pendingRouteRef.current)) {
            pendingRouteRef.current = null;
            pendingItemIdRef.current = null;
            justClickedRef.current = false;
          }
        }
        
        // Limpiar el estado activo solo si no hay ruta pendiente o si la ruta pendiente no coincide
        if (!pendingRouteRef.current) {
          setActiveMenuItem(null);
          setActiveSubmenuItem(null);
          setActiveSubmenu(null);
        } else if (!isRouteMatch(pathname, pendingRouteRef.current)) {
          setActiveMenuItem(null);
          setActiveSubmenuItem(null);
          setActiveSubmenu(null);
        }
      } else if (!pendingRouteRef.current) {
        // Hay un item que coincide pero no lo encontramos en findActiveItem
        // Esto puede pasar en casos edge, pero no deberíamos limpiar aquí
        // El estado se actualizará en la próxima ejecución
      }
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

  // Expandir automáticamente el primer item con submenu o columns cuando el menú se carga
  useEffect(() => {
    // Solo ejecutar si:
    // 1. Ya no se ha inicializado el estado expandido
    // 2. Hay items disponibles
    // 3. No hay un submenú activo ya establecido (para no interferir con la detección de rutas activas)
    // 4. No hay una ruta pendiente (para no interferir con la navegación)
    // 5. No hay un item activo ya establecido (para no interferir con la detección de rutas activas)
    if (
      !hasInitializedExpandedState.current &&
      items &&
      items.length > 0 &&
      !activeSubmenu &&
      !activeMenuItem &&
      !pendingRouteRef.current
    ) {
      // Buscar el primer item que tenga submenu o columns
      const firstItemWithSubmenu = items.find(
        (item) => (item.submenu && item.submenu.length > 0) || (item.columns && item.columns.length > 0)
      );

      if (firstItemWithSubmenu) {
        // Expandir el primer item con submenu o columns
        setActiveSubmenu(firstItemWithSubmenu.id);
        setActiveMenuItem(firstItemWithSubmenu.id);
        hasInitializedExpandedState.current = true;
      }
    }
  }, [items]); // Solo se ejecuta cuando items cambian, para evitar interferir con la detección de rutas

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

  // Función auxiliar recursiva para renderizar solo los hijos de un item (sin el botón principal)
  // Se usa cuando un item tiene hijos y queremos renderizarlos recursivamente
  const renderMobileMenuItemChildren = (item: MenuItem, level: number, parentId: string): React.ReactNode => {
    const isRouteMatch = (pathname: string, route: string): boolean => {
      if (!route) return false;
      const normalizedPath = pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
      const normalizedRoute = route.toLowerCase().replace(/^\/+|\/+$/g, '');
      if (normalizedPath === normalizedRoute) return true;
      if (normalizedPath.startsWith(normalizedRoute + '/')) return true;
      if (normalizedPath.endsWith('/' + normalizedRoute)) return true;
      return normalizedPath.includes('/' + normalizedRoute + '/');
    };

    return (
      <View style={{ marginLeft: 16 }}>
        {item.submenu && item.submenu.length > 0 && (
          <View style={[styles.submenuContainer, { backgroundColor: colors.surface }]}>
            {item.submenu.map((subItem) => {
              const subIsActive = activeSubmenuItem === subItem.id || 
                                 (subItem.route && pathname && isRouteMatch(pathname, subItem.route));
              return (
                <View key={subItem.id}>
                  <TouchableOpacity
                    style={[
                      styles.submenuItem,
                      subIsActive && styles.activeSubmenuItem
                    ]}
                    onPress={() => handleSubmenuItemPress(subItem, parentId)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                      {subItem.icon && (
                        <DynamicIcon
                          name={subItem.icon}
                          size={16}
                          color={subIsActive ? activeItemColor : colors.textSecondary}
                        />
                      )}
                      <ThemedText 
                        type="body2" 
                        style={{ 
                          color: subIsActive ? activeItemColor : colors.text,
                          opacity: subIsActive ? 1 : 0.8,
                        }}
                      >
                        {subItem.label}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                  {/* Renderizar recursivamente si tiene hijos */}
                  {(subItem.submenu || subItem.columns) && renderMobileMenuItemChildren(subItem, level + 1, subItem.id)}
                </View>
              );
            })}
          </View>
        )}
        {item.columns && item.columns.length > 0 && (
          <View style={[styles.submenuContainer, { backgroundColor: colors.surface }]}>
            {item.columns.map((column, colIdx) => (
              <View key={colIdx} style={styles.mobileColumn}>
                <ThemedText type="defaultSemiBold" style={styles.mobileColumnTitle}>
                  {column.title}
                </ThemedText>
                {column.items.map((colItem) => {
                  const colIsActive = activeSubmenuItem === colItem.id || 
                                     (colItem.route && pathname && isRouteMatch(pathname, colItem.route));
                  return (
                    <View key={colItem.id}>
                      <TouchableOpacity
                        style={[
                          styles.submenuItem,
                          colIsActive && styles.activeSubmenuItem
                        ]}
                        onPress={() => handleSubmenuItemPress(colItem, parentId)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                          {colItem.icon && (
                            <DynamicIcon
                              name={colItem.icon}
                              size={16}
                              color={colIsActive ? activeItemColor : colors.textSecondary}
                            />
                          )}
                          <ThemedText 
                            type="body2" 
                            style={{ 
                              color: colIsActive ? activeItemColor : colors.text,
                              opacity: colIsActive ? 1 : 0.8,
                            }}
                          >
                            {colItem.label}
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                      {/* Renderizar recursivamente si tiene hijos */}
                      {(colItem.submenu || colItem.columns) && renderMobileMenuItemChildren(colItem, level + 1, colItem.id)}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Función recursiva para renderizar items del menú móvil
  // Soporta items con submenu y columns anidados a cualquier nivel
  const renderMobileMenuItem = (item: MenuItem, level: number = 0, parentId?: string): React.ReactNode => {
    const isRouteMatch = (pathname: string, route: string): boolean => {
      if (!route) return false;
      const normalizedPath = pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
      const normalizedRoute = route.toLowerCase().replace(/^\/+|\/+$/g, '');
      if (normalizedPath === normalizedRoute) return true;
      if (normalizedPath.startsWith(normalizedRoute + '/')) return true;
      if (normalizedPath.endsWith('/' + normalizedRoute)) return true;
      return normalizedPath.includes('/' + normalizedRoute + '/');
    };
    
    const isActive = activeMenuItem === item.id || 
                     (item.route && pathname && isRouteMatch(pathname, item.route));
    
    // Verificar si algún hijo está activo (recursivamente)
    const hasActiveChild = (() => {
      if (item.submenu && item.submenu.length > 0) {
        return item.submenu.some(subItem => {
          const subIsActive = activeSubmenuItem === subItem.id || 
                             (subItem.route && pathname && isRouteMatch(pathname, subItem.route));
          return subIsActive || (subItem.submenu && subItem.submenu.some(s => hasActiveChild.call({ submenu: [s] }))) ||
                 (subItem.columns && subItem.columns.some(col => col.items.some(i => hasActiveChild.call({ submenu: [i] }))));
        });
      }
      if (item.columns && item.columns.length > 0) {
        return item.columns.some(column =>
          column.items.some(subItem => {
            const subIsActive = activeSubmenuItem === subItem.id || 
                               (subItem.route && pathname && isRouteMatch(pathname, subItem.route));
            return subIsActive || (subItem.submenu && subItem.submenu.some(s => hasActiveChild.call({ submenu: [s] }))) ||
                   (subItem.columns && subItem.columns.some(col => col.items.some(i => hasActiveChild.call({ submenu: [i] }))));
          })
        );
      }
      return false;
    })();
    
    const hasActiveChildSimplified = (() => {
      const checkItem = (it: MenuItem): boolean => {
        const itemActive = activeSubmenuItem === it.id || 
                          (it.route && pathname && isRouteMatch(pathname, it.route));
        if (itemActive) return true;
        if (it.submenu && it.submenu.length > 0) {
          return it.submenu.some(checkItem);
        }
        if (it.columns && it.columns.length > 0) {
          return it.columns.some(col => col.items.some(checkItem));
        }
        return false;
      };
      return checkItem(item);
    })();
    
    const hasChildren = (item.submenu && item.submenu.length > 0) || (item.columns && item.columns.length > 0);
    const isExpanded = activeSubmenu === item.id;
    const isItemActive = isActive || hasActiveChildSimplified;
    
    return (
      <View key={item.id} style={{ marginLeft: level * 16 }}>
        <TouchableOpacity
          style={[
            styles.mobileMenuItem,
            { borderBottomColor: colors.border },
            isItemActive && { 
              backgroundColor: activeItemColor + '15',
              borderLeftWidth: 3,
              borderLeftColor: activeItemColor,
              paddingLeft: 13,
            },
          ]}
          onPress={() => handleItemPress(item)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <DynamicIcon
              name={item.icon || 'ellipse-outline'}
              size={20}
              color={isItemActive ? activeItemColor : colors.textSecondary}
            />
            <ThemedText 
              type="body2"
              style={{ 
                color: isItemActive ? activeItemColor : colors.text,
                flex: 1,
              }}
            >
              {item.label}
            </ThemedText>
            {hasChildren && (
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textSecondary}
                style={{ opacity: 0.6 }}
              />
            )}
          </View>
        </TouchableOpacity>

        {/* Renderizar submenu recursivamente si está expandido */}
        {isExpanded && item.submenu && item.submenu.length > 0 && (
          <View style={[styles.submenuContainer, { backgroundColor: colors.surface }]}>
            {item.submenu.map((subItem) => {
              const subIsActive = activeSubmenuItem === subItem.id || 
                                 (subItem.route && pathname && isRouteMatch(pathname, subItem.route));
              return (
                <View key={subItem.id}>
                  <TouchableOpacity
                    style={[
                      styles.submenuItem,
                      subIsActive && styles.activeSubmenuItem
                    ]}
                    onPress={() => handleSubmenuItemPress(subItem, parentId || item.id)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                      {subItem.icon && (
                        <DynamicIcon
                          name={subItem.icon}
                          size={16}
                          color={subIsActive ? activeItemColor : colors.textSecondary}
                        />
                      )}
                      <ThemedText 
                        type="body2" 
                        style={{ 
                          color: subIsActive ? activeItemColor : colors.text,
                          opacity: subIsActive ? 1 : 0.8,
                        }}
                      >
                        {subItem.label}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                  {/* Renderizar recursivamente si tiene hijos - cuando el padre está expandido, mostrar hijos directamente */}
                  {isExpanded && (subItem.submenu || subItem.columns) && (
                    <View style={{ marginLeft: 16 }}>
                      {subItem.submenu && subItem.submenu.length > 0 && (
                        <View style={[styles.submenuContainer, { backgroundColor: colors.surface }]}>
                          {subItem.submenu.map((nestedItem) => {
                            const nestedIsActive = activeSubmenuItem === nestedItem.id || 
                                                   (nestedItem.route && pathname && isRouteMatch(pathname, nestedItem.route));
                            return (
                              <View key={nestedItem.id}>
                                <TouchableOpacity
                                  style={[
                                    styles.submenuItem,
                                    nestedIsActive && styles.activeSubmenuItem
                                  ]}
                                  onPress={() => handleSubmenuItemPress(nestedItem, subItem.id)}
                                >
                                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                                    {nestedItem.icon && (
                                      <DynamicIcon
                                        name={nestedItem.icon}
                                        size={16}
                                        color={nestedIsActive ? activeItemColor : colors.textSecondary}
                                      />
                                    )}
                                    <ThemedText 
                                      type="body2" 
                                      style={{ 
                                        color: nestedIsActive ? activeItemColor : colors.text,
                                        opacity: nestedIsActive ? 1 : 0.8,
                                      }}
                                    >
                                      {nestedItem.label}
                                    </ThemedText>
                                  </View>
                                </TouchableOpacity>
                                {/* Continuar recursivamente si tiene más hijos */}
                                {(nestedItem.submenu || nestedItem.columns) && (
                                  <View style={{ marginLeft: 16 }}>
                                    {nestedItem.submenu && nestedItem.submenu.length > 0 && (
                                      <View style={[styles.submenuContainer, { backgroundColor: colors.surface }]}>
                                        {nestedItem.submenu.map((deepItem) => renderMobileMenuItem(deepItem, level + 3, nestedItem.id))}
                                      </View>
                                    )}
                                    {nestedItem.columns && nestedItem.columns.length > 0 && (
                                      <View style={[styles.submenuContainer, { backgroundColor: colors.surface }]}>
                                        {nestedItem.columns.map((deepColumn, deepColIdx) => (
                                          <View key={deepColIdx} style={styles.mobileColumn}>
                                            <ThemedText type="defaultSemiBold" style={styles.mobileColumnTitle}>
                                              {deepColumn.title}
                                            </ThemedText>
                                            {deepColumn.items.map((deepColItem) => renderMobileMenuItem(deepColItem, level + 3, nestedItem.id))}
                                          </View>
                                        ))}
                                      </View>
                                    )}
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      )}
                      {subItem.columns && subItem.columns.length > 0 && (
                        <View style={[styles.submenuContainer, { backgroundColor: colors.surface }]}>
                          {subItem.columns.map((nestedColumn, nestedColIdx) => (
                            <View key={nestedColIdx} style={styles.mobileColumn}>
                              <ThemedText type="defaultSemiBold" style={styles.mobileColumnTitle}>
                                {nestedColumn.title}
                              </ThemedText>
                              {nestedColumn.items.map((nestedColItem) => {
                                const nestedColIsActive = activeSubmenuItem === nestedColItem.id || 
                                                          (nestedColItem.route && pathname && isRouteMatch(pathname, nestedColItem.route));
                                return (
                                  <View key={nestedColItem.id}>
                                    <TouchableOpacity
                                      style={[
                                        styles.submenuItem,
                                        nestedColIsActive && styles.activeSubmenuItem
                                      ]}
                                      onPress={() => handleSubmenuItemPress(nestedColItem, subItem.id)}
                                    >
                                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                                        {nestedColItem.icon && (
                                          <DynamicIcon
                                            name={nestedColItem.icon}
                                            size={16}
                                            color={nestedColIsActive ? activeItemColor : colors.textSecondary}
                                          />
                                        )}
                                        <ThemedText 
                                          type="body2" 
                                          style={{ 
                                            color: nestedColIsActive ? activeItemColor : colors.text,
                                            opacity: nestedColIsActive ? 1 : 0.8,
                                          }}
                                        >
                                          {nestedColItem.label}
                                        </ThemedText>
                                      </View>
                                    </TouchableOpacity>
                                    {/* Continuar recursivamente si tiene más hijos */}
                                    {(nestedColItem.submenu || nestedColItem.columns) && (
                                      <View style={{ marginLeft: 16 }}>
                                        {nestedColItem.submenu && nestedColItem.submenu.length > 0 && (
                                          <View style={[styles.submenuContainer, { backgroundColor: colors.surface }]}>
                                            {nestedColItem.submenu.map((deepItem) => renderMobileMenuItem(deepItem, level + 3, nestedColItem.id))}
                                          </View>
                                        )}
                                        {nestedColItem.columns && nestedColItem.columns.length > 0 && (
                                          <View style={[styles.submenuContainer, { backgroundColor: colors.surface }]}>
                                            {nestedColItem.columns.map((deepColumn, deepColIdx) => (
                                              <View key={deepColIdx} style={styles.mobileColumn}>
                                                <ThemedText type="defaultSemiBold" style={styles.mobileColumnTitle}>
                                                  {deepColumn.title}
                                                </ThemedText>
                                                {deepColumn.items.map((deepColItem) => renderMobileMenuItem(deepColItem, level + 3, nestedColItem.id))}
                                              </View>
                                            ))}
                                          </View>
                                        )}
                                      </View>
                                    )}
                                  </View>
                                );
                              })}
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Renderizar columns recursivamente si está expandido - mostrar todos los niveles cuando está expandido */}
        {isExpanded && item.columns && item.columns.length > 0 && (
          <View style={[styles.submenuContainer, { backgroundColor: colors.surface }]}>
            {item.columns.map((column, colIdx) => (
              <View key={colIdx} style={styles.mobileColumn}>
                <ThemedText type="defaultSemiBold" style={styles.mobileColumnTitle}>
                  {column.title}
                </ThemedText>
                {column.items.map((colItem) => {
                  const colIsActive = activeSubmenuItem === colItem.id || 
                                     (colItem.route && pathname && isRouteMatch(pathname, colItem.route));
                  return (
                    <View key={colItem.id}>
                      <TouchableOpacity
                        style={[
                          styles.submenuItem,
                          colIsActive && styles.activeSubmenuItem
                        ]}
                        onPress={() => handleSubmenuItemPress(colItem, parentId || item.id)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                          {colItem.icon && (
                            <DynamicIcon
                              name={colItem.icon}
                              size={16}
                              color={colIsActive ? activeItemColor : colors.textSecondary}
                            />
                          )}
                          <ThemedText 
                            type="body2" 
                            style={{ 
                              color: colIsActive ? activeItemColor : colors.text,
                              opacity: colIsActive ? 1 : 0.8,
                            }}
                          >
                            {colItem.label}
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                      {/* Renderizar recursivamente si tiene hijos - cuando el padre principal está expandido, mostrar todos los niveles */}
                      {(colItem.submenu || colItem.columns) && renderMobileMenuItemChildren(colItem, level + 1, colItem.id)}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

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
              {/* Header con avatar e idioma */}
              <View style={[styles.mobileMenuHeader, { borderBottomColor: colors.border }]}>
                {/* Avatar del usuario - Clickable */}
                {user ? (
                  <TouchableOpacity 
                    style={[
                      styles.mobileHeaderAvatarContainer,
                      Platform.OS === 'web' && {
                        outline: 'none',
                        outlineStyle: 'none',
                        outlineWidth: 0,
                        outlineColor: 'transparent',
                        borderWidth: 0,
                        borderColor: 'transparent',
                      },
                    ]}
                    onPress={() => {
                      setProfileModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.mobileAvatar, { backgroundColor: colors.primary }]}>
                      <ThemedText style={[styles.mobileAvatarText, { color: '#FFFFFF' }]}>
                        {getInitials()}
                      </ThemedText>
                    </View>
                    <View style={{ marginLeft: 8, flex: 1 }}>
                      <ThemedText type="body2" style={{ fontWeight: '600', color: colors.text }} numberOfLines={1}>
                        {getDisplayName()}
                      </ThemedText>
                      {user?.email && (
                        <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                          {user.email}
                        </ThemedText>
                      )}
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={{ flex: 1 }} />
                )}
                
                {/* Selector de idioma */}
                <View style={styles.mobileHeaderIcon}>
                  <LanguageSelector />
                </View>
                
                {/* Botón cerrar */}
                <TouchableOpacity onPress={closeMobileMenu} style={{ padding: 4, marginLeft: 8 }}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Input de búsqueda para móvil */}
              <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <View style={{ position: 'relative' }}>
                  <Ionicons
                    name="search"
                    size={18}
                    color={colors.textSecondary}
                    style={{ position: 'absolute', left: 10, top: 10, zIndex: 1 }}
                  />
                  {searchValue.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchValue('')}
                      style={{ position: 'absolute', right: 10, top: 8, zIndex: 1, padding: 4 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  )}
                  <InputWithFocus
                    containerStyle={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 6,
                      backgroundColor: colors.background,
                      paddingLeft: 36,
                      paddingRight: searchValue.length > 0 ? 36 : 10,
                      height: 36,
                    }}
                    primaryColor={colors.primary}
                  >
                    <TextInput
                      placeholder="Buscar..."
                      value={searchValue}
                      onChangeText={setSearchValue}
                      style={{
                        padding: 8,
                        color: colors.text,
                        fontSize: 14,
                      }}
                      placeholderTextColor={colors.textSecondary}
                    />
                  </InputWithFocus>
                </View>
              </View>

              <ScrollView style={styles.mobileMenuContent}>
                {(() => {
                  // Función para filtrar recursivamente items y sus hijos
                  const filterItemRecursively = (item: MenuItem, searchLower: string): MenuItem | null => {
                    const itemMatches = 
                      item.label.toLowerCase().includes(searchLower) ||
                      item.route?.toLowerCase().includes(searchLower) ||
                      item.description?.toLowerCase().includes(searchLower);
                    
                    let filteredSubmenu: MenuItem[] | undefined;
                    if (item.submenu && item.submenu.length > 0) {
                      filteredSubmenu = item.submenu
                        .map(subItem => filterItemRecursively(subItem, searchLower))
                        .filter((subItem): subItem is MenuItem => subItem !== null);
                    }
                    
                    let filteredColumns: MenuColumn[] | undefined;
                    if (item.columns && item.columns.length > 0) {
                      filteredColumns = item.columns
                        .map(col => {
                          const filteredColItems = col.items
                            .map(colItem => filterItemRecursively(colItem, searchLower))
                            .filter((colItem): colItem is MenuItem => colItem !== null);
                          
                          if (filteredColItems.length > 0) {
                            return {
                              ...col,
                              items: filteredColItems,
                            };
                          }
                          return null;
                        })
                        .filter((col): col is MenuColumn => col !== null);
                      
                      if (filteredColumns.length === 0) {
                        filteredColumns = undefined;
                      }
                    }
                    
                    if (itemMatches || (filteredSubmenu && filteredSubmenu.length > 0) || (filteredColumns && filteredColumns.length > 0)) {
                      return {
                        ...item,
                        submenu: filteredSubmenu && filteredSubmenu.length > 0 ? filteredSubmenu : undefined,
                        columns: filteredColumns,
                      };
                    }
                    
                    return null;
                  };

                  // Filtrar items
                  const filteredItems = items
                    .map(item => {
                      if (!searchValue) return item;
                      const searchLower = searchValue.toLowerCase();
                      return filterItemRecursively(item, searchLower);
                    })
                    .filter((item): item is MenuItem => item !== null);

                  // Usar función recursiva para renderizar todos los items
                  return filteredItems.map((item) => renderMobileMenuItem(item, 0));
                })()}
              </ScrollView>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>

        {/* Modal del perfil para móvil */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={profileModalVisible}
          onRequestClose={() => setProfileModalVisible(false)}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            activeOpacity={1}
            onPress={() => setProfileModalVisible(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={{
                width: '90%',
                maxWidth: 400,
                maxHeight: '80%',
              }}
            >
              <ThemedView
                style={{
                  borderRadius: 16,
                  padding: 24,
                  backgroundColor: colors.background,
                  ...Platform.select({
                    web: {
                      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.25)',
                    },
                    default: {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 8,
                      elevation: 5,
                    },
                  }),
                }}
              >
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Encabezado del modal */}
                  <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <View style={[{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 12,
                      backgroundColor: colors.primary,
                    }]}>
                      <ThemedText style={{ fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' }}>
                        {getInitials()}
                      </ThemedText>
                    </View>
                    <ThemedText type="h3" style={{ marginBottom: 4 }}>
                      {getDisplayName()}
                    </ThemedText>
                    {user?.email && (
                      <ThemedText type="body2" variant="secondary">
                        {user.email}
                      </ThemedText>
                    )}
                    {company && (
                      <View style={{
                        marginTop: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 12,
                        backgroundColor: 'transparent',
                      }}>
                        <ThemedText type="caption" variant="primary">
                          {company.name}
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }} />

                  {/* Selector de sucursales */}
                  {branches && branches.length > 0 && (
                    <>
                      <View style={{ marginBottom: 16 }}>
                        <ThemedText type="defaultSemiBold" style={{ marginBottom: 12 }}>
                          {t.user.changeBranch || 'Sucursales'}
                        </ThemedText>
                        {branches
                          .filter((branchAccess) => branchAccess?.branch != null)
                          .map((branchAccess, index) => {
                            const branchItem = branchAccess.branch;
                            if (!branchItem || !branchItem.id) {
                              return null;
                            }
                            const isSelected = currentBranch && branchItem.id === currentBranch.id;
                            return (
                              <TouchableOpacity
                                key={branchItem.id || index}
                                style={{
                                  flexDirection: 'row',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: 16,
                                  borderRadius: 12,
                                  marginBottom: 8,
                                  backgroundColor: isSelected ? colors.surface : 'transparent',
                                }}
                                onPress={() => handleBranchSwitch(branchItem)}
                                disabled={isSelected}
                              >
                                <View style={{ flex: 1 }}>
                                  <ThemedText
                                    type="defaultSemiBold"
                                    variant={isSelected ? undefined : 'primary'}
                                  >
                                    {branchItem.name || `OPCIÓN ${index + 1}`}
                                  </ThemedText>
                                </View>
                                {isSelected && (
                                  <ThemedText style={{ color: colors.text }}>✓</ThemedText>
                                )}
                              </TouchableOpacity>
                            );
                          })
                          .filter((item) => item !== null)}
                      </View>
                      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }} />
                    </>
                  )}

                  {/* Opciones del menú */}
                  <View style={{ marginBottom: 16 }}>
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 16,
                        gap: 12,
                      }}
                      onPress={handleProfile}
                    >
                      <ThemedText style={{ fontSize: 20 }}>👤</ThemedText>
                      <ThemedText type="defaultSemiBold">{t.user.myProfile}</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 16,
                        gap: 12,
                      }}
                      onPress={handleSettings}
                    >
                      <ThemedText style={{ fontSize: 20 }}>⚙️</ThemedText>
                      <ThemedText type="defaultSemiBold">{t.user.configuration}</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 16,
                        gap: 12,
                      }}
                      onPress={handleLogout}
                    >
                      <ThemedText style={{ fontSize: 20 }}>🚪</ThemedText>
                      <ThemedText type="defaultSemiBold" variant="error">
                        {t.user.logout}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>

                  {/* Botón cerrar */}
                  <TouchableOpacity
                    style={{
                      marginTop: 16,
                      padding: 16,
                      borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: colors.surface,
                    }}
                    onPress={() => setProfileModalVisible(false)}
                  >
                    <ThemedText type="defaultSemiBold">{t.common.close}</ThemedText>
                  </TouchableOpacity>
                </ScrollView>
              </ThemedView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }

  // Desktop/Tablet: Horizontal Menu
  // Filtrar items para desktop primero
  const filterItemRecursivelyDesktop = (item: MenuItem, searchLower: string): MenuItem | null => {
    const itemMatches = 
      item.label.toLowerCase().includes(searchLower) ||
      item.route?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower);
    
    let filteredSubmenu: MenuItem[] | undefined;
    if (item.submenu && item.submenu.length > 0) {
      filteredSubmenu = item.submenu
        .map(subItem => filterItemRecursivelyDesktop(subItem, searchLower))
        .filter((subItem): subItem is MenuItem => subItem !== null);
    }
    
    let filteredColumns: MenuColumn[] | undefined;
    if (item.columns && item.columns.length > 0) {
      filteredColumns = item.columns
        .map(col => {
          const filteredColItems = col.items
            .map(colItem => filterItemRecursivelyDesktop(colItem, searchLower))
            .filter((colItem): colItem is MenuItem => colItem !== null);
          
          if (filteredColItems.length > 0) {
            return {
              ...col,
              items: filteredColItems,
            };
          }
          return null;
        })
        .filter((col): col is MenuColumn => col !== null);
      
      if (filteredColumns.length === 0) {
        filteredColumns = undefined;
      }
    }
    
    if (itemMatches || (filteredSubmenu && filteredSubmenu.length > 0) || (filteredColumns && filteredColumns.length > 0)) {
      return {
        ...item,
        submenu: filteredSubmenu && filteredSubmenu.length > 0 ? filteredSubmenu : undefined,
        columns: filteredColumns,
      };
    }
    
    return null;
  };

  const filteredItemsDesktop = items
    .map(item => {
      if (!desktopSearchValue) return item;
      const searchLower = desktopSearchValue.toLowerCase();
      return filterItemRecursivelyDesktop(item, searchLower);
    })
    .filter((item): item is MenuItem => item !== null);

  const activeItem = filteredItemsDesktop.find(item => item.id === activeSubmenu) || items.find(item => item.id === activeSubmenu);

  const searchWidthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(searchWidthAnim, {
      toValue: desktopSearchExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [desktopSearchExpanded, searchWidthAnim]);

  return (
    <View 
      style={[styles.desktopContainer, { flexDirection: 'row', alignItems: 'center' }]} 
      data-menu-container="true"
    >
      {/* Icono de búsqueda expandible */}
      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 40,
          marginRight: 8,
          overflow: 'hidden',
          width: searchWidthAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [40, 250],
          }),
        }}
      >
        {desktopSearchExpanded ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
            <Ionicons
              name="search"
              size={18}
              color={colors.textSecondary}
              style={{ position: 'absolute', left: 10, top: 11, zIndex: 1 }}
            />
            {desktopSearchValue.length > 0 && (
              <TouchableOpacity
                onPress={() => setDesktopSearchValue('')}
                style={{ position: 'absolute', right: 10, top: 9, zIndex: 1, padding: 4 }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
            <InputWithFocus
              containerStyle={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 6,
                backgroundColor: colors.background,
                paddingLeft: 36,
                paddingRight: desktopSearchValue.length > 0 ? 36 : 10,
                height: 36,
                flex: 1,
              }}
              primaryColor={colors.primary}
            >
              <TextInput
                placeholder="Buscar..."
                value={desktopSearchValue}
                onChangeText={setDesktopSearchValue}
                style={{
                  padding: 8,
                  color: colors.text,
                  fontSize: 14,
                }}
                placeholderTextColor={colors.textSecondary}
                autoFocus
                onBlur={() => {
                  if (!desktopSearchValue) {
                    setDesktopSearchExpanded(false);
                  }
                }}
              />
            </InputWithFocus>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setDesktopSearchExpanded(true)}
            style={{
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="search"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Menú horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalMenuContent}
        style={[styles.horizontalMenuScroll, { flex: 1 }]}
      >
        {filteredItemsDesktop.map((item) => (
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
          {/* Si tiene tanto submenu como columns, mostrar estilo vertical combinado */}
          {activeItem.submenu && activeItem.submenu.length > 0 && activeItem.columns && activeItem.columns.length > 0 ? (
            <View
              style={[
                styles.megaMenu,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  ...(Platform.OS === 'web' ? { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' } : { shadowColor: colors.text }),
                  left: submenuPosition.left,
                  maxWidth: 400,
                },
              ]}
            >
              <ScrollView style={{ maxHeight: 600 }}>
                {/* Primero mostrar los subitems como items individuales */}
                {activeItem.submenu.map((subitem) => {
                  const isRouteMatch = (pathname: string, route: string): boolean => {
                    if (!route) return false;
                    const normalizedPath = pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
                    const normalizedRoute = route.toLowerCase().replace(/^\/+|\/+$/g, '');
                    if (normalizedPath === normalizedRoute) return true;
                    if (normalizedPath.startsWith(normalizedRoute + '/')) return true;
                    if (normalizedPath.endsWith('/' + normalizedRoute)) return true;
                    return normalizedPath.includes('/' + normalizedRoute + '/');
                  };
                  
                  const isActive = activeSubmenuItem === subitem.id || 
                                   (subitem.route && pathname && isRouteMatch(pathname, subitem.route));
                  
                  return (
                    <TouchableOpacity
                      key={subitem.id}
                      style={[
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                        },
                        isActive && styles.activeSubmenuItem
                      ]}
                      onPress={() => handleSubmenuItemPress(subitem, activeItem.id)}
                    >
                      {subitem.icon && (
                        <DynamicIcon
                          name={subitem.icon}
                          size={18}
                          color={isActive ? activeItemColor : colors.textSecondary}
                          style={{ marginRight: 12 }}
                        />
                      )}
                      <ThemedText 
                        type="body2" 
                        style={{ 
                          color: isActive ? activeItemColor : colors.text,
                          fontWeight: isActive ? '600' : '400',
                        }}
                      >
                        {subitem.label}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}

                {/* Luego mostrar las columns como agrupamientos */}
                {activeItem.columns.map((column, colIdx) => (
                  <View key={colIdx} style={{ marginTop: colIdx === 0 ? 8 : 16 }}>
                    {/* Título del agrupamiento en mayúsculas */}
                    <ThemedText
                      type="caption"
                      style={{
                        color: colors.textSecondary,
                        fontWeight: '700',
                        fontSize: 11,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        paddingHorizontal: 16,
                        paddingTop: 8,
                        paddingBottom: 4,
                      }}
                    >
                      {column.title}
                    </ThemedText>
                    
                    {/* Items del agrupamiento */}
                    {column.items.map((subitem) => {
                      const isRouteMatch = (pathname: string, route: string): boolean => {
                        if (!route) return false;
                        const normalizedPath = pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
                        const normalizedRoute = route.toLowerCase().replace(/^\/+|\/+$/g, '');
                        if (normalizedPath === normalizedRoute) return true;
                        if (normalizedPath.startsWith(normalizedRoute + '/')) return true;
                        if (normalizedPath.endsWith('/' + normalizedRoute)) return true;
                        return normalizedPath.includes('/' + normalizedRoute + '/');
                      };
                      
                      const isActive = activeSubmenuItem === subitem.id || 
                                       (subitem.route && pathname && isRouteMatch(pathname, subitem.route));
                      
                      return (
                        <TouchableOpacity
                          key={subitem.id}
                          style={[
                            {
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingVertical: 10,
                              paddingHorizontal: 16,
                              paddingLeft: 24,
                              borderBottomWidth: colIdx === activeItem.columns!.length - 1 && subitem === column.items[column.items.length - 1] ? 0 : 1,
                              borderBottomColor: colors.border,
                            },
                            isActive && styles.activeSubmenuItem
                          ]}
                          onPress={() => handleSubmenuItemPress(subitem, activeItem.id)}
                        >
                          {subitem.icon && (
                            <DynamicIcon
                              name={subitem.icon}
                              size={16}
                              color={isActive ? activeItemColor : colors.textSecondary}
                              style={{ marginRight: 12 }}
                            />
                          )}
                          <ThemedText 
                            type="body2" 
                            style={{ 
                              color: isActive ? activeItemColor : colors.text,
                              fontWeight: isActive ? '600' : '400',
                            }}
                          >
                            {subitem.label}
                          </ThemedText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : (
            <>
              {/* Si solo tiene columns, mostrar como mega menú tradicional */}
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
                        {column.items.map((subitem) => {
                          const isRouteMatch = (pathname: string, route: string): boolean => {
                            if (!route) return false;
                            const normalizedPath = pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
                            const normalizedRoute = route.toLowerCase().replace(/^\/+|\/+$/g, '');
                            if (normalizedPath === normalizedRoute) return true;
                            if (normalizedPath.startsWith(normalizedRoute + '/')) return true;
                            if (normalizedPath.endsWith('/' + normalizedRoute)) return true;
                            return normalizedPath.includes('/' + normalizedRoute + '/');
                          };
                          
                          const isActive = activeSubmenuItem === subitem.id || 
                                           (subitem.route && pathname && isRouteMatch(pathname, subitem.route));
                          
                          return (
                            <TouchableOpacity
                              key={subitem.id}
                              style={[
                                styles.megaMenuItem, 
                                { borderBottomColor: colors.border },
                                isActive && styles.activeMegaMenuItem
                              ]}
                              onPress={() => handleSubmenuItemPress(subitem, activeItem.id)}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                                {subitem.icon && (
                                  <DynamicIcon
                                    name={subitem.icon}
                                    size={16}
                                    color={isActive ? activeItemColor : colors.textSecondary}
                                  />
                                )}
                                <ThemedText 
                                  type="body2" 
                                  style={[
                                    styles.megaMenuItemText,
                                    { color: isActive ? activeItemColor : colors.text }
                                  ]}
                                >
                                  {subitem.label}
                                </ThemedText>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Si solo tiene submenu, mostrar como submenu tradicional */}
              {activeItem.submenu && activeItem.submenu.length > 0 && (
                <View
                  style={[
                    styles.desktopSubmenu,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      ...(Platform.OS === 'web' ? { boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' } : { shadowColor: colors.text }),
                      left: submenuPosition.left,
                    },
                  ]}
                >
                  {activeItem.submenu.map((subitem) => {
                    const isRouteMatch = (pathname: string, route: string): boolean => {
                      if (!route) return false;
                      const normalizedPath = pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
                      const normalizedRoute = route.toLowerCase().replace(/^\/+|\/+$/g, '');
                      if (normalizedPath === normalizedRoute) return true;
                      if (normalizedPath.startsWith(normalizedRoute + '/')) return true;
                      if (normalizedPath.endsWith('/' + normalizedRoute)) return true;
                      return normalizedPath.includes('/' + normalizedRoute + '/');
                    };
                    
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
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                          {subitem.icon && (
                            <DynamicIcon
                              name={subitem.icon}
                              size={18}
                              color={isActive ? activeItemColor : colors.textSecondary}
                            />
                          )}
                          <View style={{ flex: 1 }}>
                            <ThemedText 
                              type="defaultSemiBold" 
                              style={[
                                styles.submenuItemTitle,
                                { color: isActive ? activeItemColor : colors.text }
                              ]}
                            >
                              {subitem.label}
                            </ThemedText>
                            {subitem.description && (
                              <ThemedText type="caption" style={styles.submenuItemDescription}>
                                {subitem.description}
                              </ThemedText>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}

  // Desktop/Tablet: Horizontal Menu
