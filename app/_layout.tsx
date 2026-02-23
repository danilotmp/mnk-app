import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Platform } from "react-native";

// Solo importar reanimated en plataformas nativas para evitar problemas con worklets en web
if (Platform.OS !== "web") {
  require("react-native-reanimated");
}

import { MainLayout, MenuItem } from "@/components/layouts";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemeProvider as CustomThemeProvider } from "@/hooks/use-theme-mode";
import { MultiCompanyProvider, useMultiCompany } from "@/src/domains/shared";
import { useScrollbarStyles } from "@/src/hooks/use-scrollbar-styles.hook";
import { LanguageProvider, useTranslation } from "@/src/infrastructure/i18n";
import { useMenu } from "@/src/infrastructure/menu";
import { ToastContainer, ToastProvider } from "@/src/infrastructure/messages";
import { useSession } from "@/src/infrastructure/session";

// Suprimir errores de FontFaceObserver timeout en web
// Este error no afecta la funcionalidad, solo es un warning de carga de fuentes
if (typeof window !== "undefined") {
  // Interceptar errores no capturados de FontFaceObserver
  const originalError = window.console?.error;
  if (originalError) {
    window.console.error = (...args: any[]) => {
      const errorMessage = args[0]?.toString() || "";
      const fullMessage = args.map((arg) => String(arg)).join(" ");
      // Ignorar errores específicos de FontFaceObserver timeout
      if (
        errorMessage.includes("fontfaceobserver") ||
        errorMessage.includes("FontFaceObserver") ||
        errorMessage.includes("6000ms timeout exceeded") ||
        errorMessage.includes("timeout exceeded") ||
        fullMessage.includes("fontfaceobserver") ||
        fullMessage.includes("FontFaceObserver") ||
        fullMessage.includes("6000ms timeout exceeded")
      ) {
        // Este es un error conocido y no afecta la funcionalidad
        // Las fuentes del sistema se cargan correctamente sin necesidad de FontFaceObserver
        return;
      }
      originalError(...args);
    };
  }

  // También capturar errores no capturados globalmente
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const errorString = message?.toString() || "";
    const errorMsg = error?.message?.toString() || "";
    const errorStack = error?.stack?.toString() || "";
    const combined = `${errorString} ${errorMsg} ${errorStack} ${source ?? ""}`;
    if (/fontfaceobserver|6000ms timeout exceeded|timeout exceeded/i.test(combined)) {
      return true; // Suprimir: no mostrar en consola ni en overlay
    }
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }
    return false;
  };

  // Capturar errores no manejados con addEventListener (capture phase)
  // stopImmediatePropagation evita que el overlay de Expo/React muestre el error
  window.addEventListener(
    "error",
    (event) => {
      const errorMessage = event.message?.toString() || "";
      const errorSource = event.filename?.toString() || "";
      const errorStack = event.error?.stack?.toString() || "";
      if (
        errorMessage.includes("fontfaceobserver") ||
        errorMessage.includes("FontFaceObserver") ||
        errorMessage.includes("6000ms timeout exceeded") ||
        errorMessage.includes("timeout exceeded") ||
        errorSource.includes("fontfaceobserver") ||
        errorSource.includes("FontFaceObserver") ||
        errorStack.includes("fontfaceobserver") ||
        errorStack.includes("FontFaceObserver") ||
        errorStack.includes("timeout exceeded")
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return true;
      }
    },
    true,
  );

  // Capturar promesas rechazadas no manejadas (event.reason puede ser Error o string)
  window.addEventListener(
    "unhandledrejection",
    (event) => {
      const reasonStr =
        typeof event.reason === "object" && event.reason?.message
          ? event.reason.message + (event.reason.stack || "")
          : String(event.reason ?? "");
      if (
        reasonStr.includes("fontfaceobserver") ||
        reasonStr.includes("FontFaceObserver") ||
        reasonStr.includes("6000ms timeout exceeded") ||
        reasonStr.includes("timeout exceeded")
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    },
    true,
  );

  // Agregar estilos globales para eliminar outline/border de elementos con foco en web
  if (Platform.OS === "web" && typeof document !== "undefined") {
    // Verificar si ya se agregaron los estilos para evitar duplicados
    if (!document.getElementById("remove-focus-outline-styles")) {
      const style = document.createElement("style");
      style.id = "remove-focus-outline-styles";
      style.textContent = `
        button:focus,
        button:focus-visible,
        button:active,
        [role="button"]:focus,
        [role="button"]:focus-visible,
        [role="button"]:active,
        div[class*="TouchableOpacity"]:focus,
        div[class*="TouchableOpacity"]:focus-visible,
        div[class*="TouchableOpacity"]:active {
          outline: none !important;
          outline-style: none !important;
          outline-width: 0 !important;
          outline-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }
}

function LayoutContent() {
  const { t, interpolate } = useTranslation();
  const pathname = usePathname();
  const segments = useSegments();
  const router = useRouter();
  const { isLoading: isSessionLoading, clearSession } = useSession();
  const { menu, loading: menuLoading } = useMenu();
  const { clearContext } = useMultiCompany();

  // Escuchar evento de token expirado para cerrar sesión y redirigir
  useEffect(() => {
    const handleTokenExpired = async () => {
      try {
        // Limpiar sesión completa
        await clearSession();
        clearContext();

        // Redirigir al inicio
        router.replace("/");
      } catch (error) {
        // Fallar silenciosamente y redirigir de todas formas
        router.replace("/");
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("tokenExpired", handleTokenExpired);
      return () => {
        window.removeEventListener("tokenExpired", handleTokenExpired);
      };
    }
  }, [clearSession, clearContext, router]);

  // Aplicar estilos de scrollbar adaptados al tema
  useScrollbarStyles();

  // Título de la pestaña del navegador en web
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.title = "AIBox";
    }
  }, []);

  // Determinar si estamos en una ruta de autenticación
  const isAuthRoute = pathname?.startsWith("/auth") || segments[0] === "auth";

  // Convertir menú del backend al formato del componente
  // El menú viene del backend y ya tiene la estructura correcta
  // Si el menú está vacío (durante la carga), usar un array vacío
  const menuItems: MenuItem[] =
    menu.length > 0
      ? menu.map((item) => {
          // Mapear submenu del backend al formato del componente
          const mappedItem: MenuItem = {
            id: item.id,
            label: item.label,
            route: item.route,
            description: item.description,
            isPublic: item.isPublic, // Incluir propiedad isPublic del backend
          };

          // Si tiene submenu, mapearlo
          if (item.submenu && item.submenu.length > 0) {
            mappedItem.submenu = item.submenu.map((subItem) => ({
              id: subItem.id,
              label: subItem.label,
              route: subItem.route,
              description: subItem.description,
              icon: subItem.icon,
              isPublic: subItem.isPublic, // Incluir propiedad isPublic del backend
            }));
          }

          // Si tiene columns, mapearlas
          if (item.columns && item.columns.length > 0) {
            mappedItem.columns = item.columns.map((column) => ({
              title: column.title,
              items: column.items.map((colItem) => ({
                id: colItem.id,
                label: colItem.label,
                route: colItem.route,
                description: colItem.description,
                icon: colItem.icon,
                isPublic: colItem.isPublic, // Incluir propiedad isPublic del backend
              })),
            }));
          }

          return mappedItem;
        })
      : [];

  const colorScheme = useColorScheme();

  // La sesión se rehidrata automáticamente en useSession
  // IMPORTANTE: No bloquear la renderización durante la carga del menú
  // Esto previene redirecciones al home cuando se refresca la página
  // Solo esperar si la sesión está cargando (necesario para autenticación)
  // El menú puede cargarse en segundo plano sin bloquear la navegación
  if (isSessionLoading) {
    // Solo esperar si la sesión está cargando (necesario para determinar autenticación)
    return null;
  }

  // Si el menú está cargando, usar un menú vacío temporalmente
  // Esto permite que la página actual se renderice mientras el menú carga
  // El menú se actualizará automáticamente cuando termine de cargar
  const menuItemsToUse: MenuItem[] = menuLoading ? [] : menuItems;

  // Si es una ruta de autenticación, no usar MainLayout
  if (isAuthRoute) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }
  // Para otras rutas, usar MainLayout
  // Usar menuItemsToUse que puede estar vacío durante la carga inicial
  // Esto permite que la página actual se renderice mientras el menú carga
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <MainLayout title="AIBox" menuItems={menuItemsToUse}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
          <Stack.Screen name="+not-found" options={{ title: "404" }} />
        </Stack>
      </MainLayout>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <LanguageProvider>
      <CustomThemeProvider>
        <MultiCompanyProvider>
          <ToastProvider>
            <LayoutContent />
            <ToastContainer />
          </ToastProvider>
        </MultiCompanyProvider>
      </CustomThemeProvider>
    </LanguageProvider>
  );
}
