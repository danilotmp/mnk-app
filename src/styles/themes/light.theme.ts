import { LightTheme as LightThemeFromConstants } from "../../../constants/theme";
import { baseTheme, BaseTheme } from "./base.theme";

// Tema claro: una sola fuente de verdad (constants/theme.ts).
// Extiende el tema base con colores, spacing, borderRadius y sombras centralizados.
export interface LightTheme extends BaseTheme {
  colors: typeof LightThemeFromConstants.colors;
}

export const lightTheme: LightTheme = {
  ...baseTheme,
  ...LightThemeFromConstants,
  colors: LightThemeFromConstants.colors,
};
