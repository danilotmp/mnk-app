/**
 * Sistema de colores centralizado basado en la paleta de la imagen
 * Colores principales: Azules, Verdes y Naranjas
 */

import { Platform } from "react-native";
import { baseTheme } from "../src/styles/themes/base.theme";

// Colores base de la paleta - Estilo Hapi Trade (Dark Finance UI)
export const BrandColors = {
  // Cyan/Turquesa - Color principal (inspirado en Hapi)
  blue: {
    50: "#E6FBFF",
    100: "#B3F2FF",
    200: "#80E9FF",
    300: "#4DD4FF", // Cyan brillante principal
    400: "#1AC8FF",
    500: "#00B8F0",
    600: "#00A8CC",
    700: "#0088A3",
    800: "#006175",
    900: "#003947",
  },
  // Verde brillante para valores positivos
  green: {
    50: "#E6FFF5",
    100: "#B3FFE0",
    200: "#80FFCB",
    300: "#4DFFB6",
    400: "#1AFFA1",
    500: "#00D98D", // Verde brillante (estilo Hapi)
    600: "#00B377",
    700: "#008D5E",
    800: "#006745",
    900: "#00412C",
  },
  // Amarillo/Naranja para warnings
  orange: {
    50: "#FFFDE6",
    100: "#FFFAB3",
    200: "#FFF780",
    300: "#FFF44D",
    400: "#FFD93D", // Amarillo brillante
    500: "#FFC700",
    600: "#E6B000",
    700: "#CC9900",
    800: "#997300",
    900: "#664D00",
  },
  // Grises
  gray: {
    50: "#F8F9FA",
    100: "#F1F3F4",
    200: "#E8EAED",
    300: "#DADCE0",
    400: "#BDC1C6",
    500: "#9AA0A6",
    600: "#80868B",
    700: "#5F6368",
    800: "#3C4043",
    900: "#202124",
  },
  // Colores de estado - Estilo Hapi Trade
  status: {
    success: "#00D98D", // Verde brillante (valores positivos)
    warning: "#FFD93D", // Amarillo brillante
    error: "#FF3366", // Rojo/Rosa brillante (valores negativos)
    info: "#4DD4FF", // Cyan brillante
  },
};

// Tema claro - Actualizado con colores Hapi
export const LightTheme = {
  colors: {
    // Colores principales
    primary: baseTheme.brand.primary, //'#0087FF',      // Mismo color que buttonTheme.brand.primary
    primaryLight: BrandColors.blue[100],
    primaryDark: BrandColors.blue[800],
    secondary: BrandColors.green[600], // Verde más oscuro para modo claro
    secondaryLight: BrandColors.green[100],
    accent: BrandColors.blue[500], // Cyan para acentos
    accentLight: BrandColors.blue[100],

    // Colores de fondo
    background: "#FFFFFF",
    surface: "#f8f9fa", // rgb(248, 249, 250) - Color del botón de tema
    surfaceVariant: BrandColors.gray[100],
    surfaceMid: "#F5F7F8", // Color intermedio entre background y surfaceVariant (para header/footer de tabla)

    // Colores de texto
    text: "#1e2538", // rgb(30, 41, 59) - Color oscuro para modo claro
    textSecondary: BrandColors.gray[700],
    textTertiary: BrandColors.gray[500],
    subtitle: BrandColors.gray[700], // Color estándar para subtítulos (gris)

    // Colores de borde
    border: BrandColors.gray[300], // Cambiado de gray[200] a gray[300] para mejor visibilidad
    borderLight: BrandColors.gray[200],

    // Colores de estado - alineados con uso en código
    success: "#10b981", // Verde para ACTIVE
    warning: "#f59e0b", // Amarillo para PENDING
    error: "#ef4444", // Rojo para INACTIVE
    info: BrandColors.status.info,
    suspended: "#f97316", // Naranja para SUSPENDED
    deleted: "#6b7280", // Gris para DELETED

    // Texto sobre botones de color (primary/success/error)
    contrastText: "#FFFFFF",
    overlay: "rgba(0, 0, 0, 0.5)",

    // Colores de navegación
    tabIconDefault: BrandColors.gray[500],
    tabIconSelected: BrandColors.blue[500],
    tint: BrandColors.blue[500],
    icon: "#1e2538", // Iconos oscuros en modo claro
    iconSecondary: BrandColors.gray[600],
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: BrandColors.gray[900],
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: BrandColors.gray[900],
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: BrandColors.gray[900],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

// ─── Paleta Dark: única fuente de valores hex/rgba para el tema oscuro.
// Cada color se define una vez; los colores semánticos (colors.xxx) referencian esta paleta.
// Así se puede cambiar un uso (p. ej. botón) sin afectar otro (p. ej. icono) y cada tema es independiente.
const DarkPalette = {
  primary: "#0087FF",
  primaryLight: "#7ee0ff",
  primaryDark: "#00a8cc",
  secondary: "#00d4aa",
  secondaryLight: "#33e0bb",
  accent: "#4dd4ff",
  background: "#1e2538",
  surface: "rgba(188,197,239,.2)",
  surfaceVariant: "#151b2e",
  surfaceMid: "#1a1f33", // Color intermedio entre background y surfaceVariant (para header/footer de tabla)
  border: "#1e2538",
  borderLight: "#2a3142",
  text: "#ffffff",
  textSecondary: "#a0a8c1",
  textTertiary: "#6b7588",
  success: "#10b981", // Verde para ACTIVE - alineado con uso en código
  warning: "#f59e0b", // Amarillo para PENDING - alineado con uso en código
  error: "#ef4444", // Rojo para INACTIVE - alineado con uso en código
  suspended: "#f97316", // Naranja para SUSPENDED - alineado con uso en código
  deleted: "#6b7280", // Gris para DELETED - alineado con uso en código
  contrastText: "#FFFFFF",
  overlay: "rgba(0, 0, 0, 0.5)",
  tabIconDefault: "#6b7588",
  shadow: "#000000",
} as const;

// Tema oscuro - Inspirado en Hapi Trade. Colores administrados por paleta; variables por uso.
export const DarkTheme = {
  colors: {
    primary: DarkPalette.primary,
    primaryLight: DarkPalette.primaryLight,
    primaryDark: DarkPalette.primaryDark,
    secondary: DarkPalette.secondary,
    secondaryLight: DarkPalette.secondaryLight,
    accent: DarkPalette.accent,
    accentLight: DarkPalette.primaryLight,

    background: DarkPalette.background,
    surface: DarkPalette.surface,
    surfaceVariant: DarkPalette.surfaceVariant,
    surfaceMid: DarkPalette.surfaceMid,

    text: DarkPalette.text,
    textSecondary: DarkPalette.textSecondary,
    textTertiary: DarkPalette.textTertiary,
    subtitle: DarkPalette.textSecondary,

    border: DarkPalette.border,
    borderLight: DarkPalette.borderLight,

    success: DarkPalette.success,
    warning: DarkPalette.warning,
    error: DarkPalette.error,
    info: DarkPalette.accent,
    suspended: DarkPalette.suspended,
    contrastText: DarkPalette.contrastText,
    overlay: DarkPalette.overlay,

    tabIconDefault: DarkPalette.tabIconDefault,
    tabIconSelected: DarkPalette.accent,
    tint: DarkPalette.accent,
    icon: DarkPalette.text,
    iconSecondary: DarkPalette.textSecondary,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: DarkPalette.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: DarkPalette.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: DarkPalette.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

// Exportar colores para compatibilidad
export const Colors = {
  light: LightTheme.colors,
  dark: DarkTheme.colors,
};

// Fuentes
export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Tipografía
export const Typography = {
  /** Título de página (desktop). Usar en todas las pantallas. */
  pageTitle: {
    fontSize: 32,
    fontWeight: "bold" as const,
    lineHeight: 40,
  },
  /** Título de página (smartphone). Usar en todas las pantallas en vista móvil. */
  pageTitleMobile: {
    fontSize: 25,
    fontWeight: "bold" as const,
    lineHeight: 32,
  },
  /** Subtítulo / párrafo bajo el título (desktop). Usar en todas las pantallas. */
  pageSubtitle: {
    fontSize: 14,
    fontWeight: "normal" as const,
    lineHeight: 22,
  },
  /** Subtítulo / párrafo bajo el título (smartphone). */
  pageSubtitleMobile: {
    fontSize: 13,
    fontWeight: "normal" as const,
    lineHeight: 20,
  },
  /** Texto de contenido / cuerpo (desktop). Descripciones, listas, cards. */
  pageBody: {
    fontSize: 14,
    fontWeight: "normal" as const,
    lineHeight: 22,
  },
  /** Texto de contenido / cuerpo (smartphone). */
  pageBodyMobile: {
    fontSize: 13,
    fontWeight: "normal" as const,
    lineHeight: 20,
  },
  h1: {
    fontSize: 32,
    fontWeight: "bold" as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: "bold" as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: "bold" as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  h6: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 22,
  },
  body1: {
    fontSize: 16,
    fontWeight: "normal" as const,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: "normal" as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: "normal" as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
};

/** Espaciado y iconos globales de página (usar en todas las pantallas). */
export const PageLayout = {
  /** Espacio entre título principal y subtítulo/descripción (desktop). */
  titleSubtitleGap: 24,
  /** Espacio entre título principal y subtítulo/descripción (smartphone). */
  titleSubtitleGapMobile: 16,
  /** Espacio entre subtítulo y contenido principal de la página (desktop). */
  subtitleContentGap: 10,
  /** Espacio entre subtítulo y contenido principal de la página (smartphone). Más unido que desktop para páginas de administración. */
  subtitleContentGapMobile: 0,
  /** Espacio entre header y título de página (desktop). */
  headerTitleGap: 48,
  /** Espacio entre header y título de página (smartphone). */
  headerTitleGapMobile: 32,
  /** Tamaño de icono junto al título de página (desktop). */
  iconTitle: 36,
  /** Tamaño de icono junto al título de página (smartphone). */
  iconTitleMobile: 28,
  /** Tamaño de icono junto a subtítulo/cuerpo (desktop). */
  iconSubtitle: 20,
  /** Tamaño de icono junto a subtítulo/cuerpo (smartphone). */
  iconSubtitleMobile: 18,
};

/**
 * Estándar para modales de administración (SideModal, CenteredModal).
 * Basado en el modal "Create User": título y subtítulo correctos; padding de cabecera como referencia.
 */
export const ModalLayout = {
  /** Padding de la cabecera del modal (titulo + subtitulo). Mismo en web y smartphone. */
  headerPadding: 25,
  /** Padding de la cabecera en móvil (si se quiere distinto; por defecto igual que headerPadding). */
  headerPaddingMobile: 25,
  /** Espacio entre título y subtítulo del modal. */
  titleSubtitleGap: 4,
  /** Espacio entre bloque título/subtítulo y botón cerrar. */
  headerGap: 16,
  /** Padding del botón cerrar. */
  closeButtonPadding: 8,
  /** Border radius del botón cerrar. */
  closeButtonBorderRadius: 8,
  /** Padding del footer del modal. */
  footerPadding: 25,
  /** Gap entre elementos del footer. */
  footerGap: 12,
  /** Padding del área de contenido del modal (entre cabecera y primer campo). Estandarizado para Users y Roles (SideModal). */
  contentPadding: 0,
  /** Padding del área de contenido en móvil. */
  contentPaddingMobile: 0,
  /** Padding del área de contenido en modales centrados (CenteredModal). */
  contentPaddingCentered: 24,
  /** Padding del área de contenido en modales centrados en móvil. */
  contentPaddingCenteredMobile: 16,
};
