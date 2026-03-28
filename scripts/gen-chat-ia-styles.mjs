import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const extractPath = path.join(
  root,
  "src/features/interacciones/chat/_styles_extract.txt",
);
const outPath = path.join(
  root,
  "src/features/interacciones/chat/chat-ia.screen.styles.ts",
);

let body = fs.readFileSync(extractPath, "utf8");
body = body.replace(/^const styles = StyleSheet.create\(\{/, "return StyleSheet.create({");

const header = `import { StyleSheet } from "react-native";
import type { LightTheme } from "@/constants/theme";

export const SPECIALIST_RING_SIZE = 62;
export const SPECIALIST_RING_RADIUS = SPECIALIST_RING_SIZE / 2;

export type ChatThemeColors = typeof LightTheme.colors;

/** Estilos de la pantalla Chat IA (\`createStyles(colors)\` según CONTEXTO.md). */
export function createChatIaScreenStyles(colors: ChatThemeColors, isDark: boolean) {
  const rowDivider = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)";
  void colors;

`;

body = body.replace(
  'borderBottomColor: "rgba(0, 0, 0, 0.05)",',
  "borderBottomColor: rowDivider,",
);
body = body.replace(
  'borderBottomColor: "rgba(0,0,0,0.1)",',
  'borderBottomColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0,0,0,0.1)",',
);

const out = `${header}${body}\n}\n`;
fs.writeFileSync(outPath, out);
console.log("Wrote", outPath);
