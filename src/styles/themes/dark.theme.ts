import { DarkTheme as DarkThemeFromConstants } from "../../../constants/theme";
import { baseTheme, BaseTheme } from "./base.theme";

// Tema oscuro: una sola fuente de verdad (constants/theme.ts).
// Extiende el tema base con colores, spacing, borderRadius y sombras centralizados.
export interface DarkTheme extends BaseTheme {
  colors: typeof DarkThemeFromConstants.colors;
}

export const darkTheme: DarkTheme = {
  ...baseTheme,
  ...DarkThemeFromConstants,
  colors: DarkThemeFromConstants.colors,
};
