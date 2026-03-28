/**
 * Formato de visualización al estilo WhatsApp (solo presentación; el texto crudo se guarda igual).
 *
 * - *negrita*
 * - _cursiva_
 * - ~tachado~
 * - ```monoespaciado``` (bloque; admite salto de línea)
 * - Viñetas: línea que empieza por "* " o "- "
 * - Lista numerada: línea que empieza por "1. ", "2. ", etc.
 */

import React from "react";
import { Platform, Text, type TextStyle } from "react-native";

export interface WhatsAppTextFormatOptions {
  textColor: string;
  /** Fondo suave para bloques de código (opcional) */
  codeBackgroundColor?: string;
  fontSize?: number;
}

type CodePiece =
  | { kind: "text"; value: string }
  | { kind: "code"; value: string };

function splitFencedCode(input: string): CodePiece[] {
  const parts: CodePiece[] = [];
  let rest = input;
  while (rest.length > 0) {
    const start = rest.indexOf("```");
    if (start === -1) {
      parts.push({ kind: "text", value: rest });
      break;
    }
    if (start > 0) {
      parts.push({ kind: "text", value: rest.slice(0, start) });
    }
    const afterOpen = rest.slice(start + 3);
    const close = afterOpen.indexOf("```");
    if (close === -1) {
      parts.push({ kind: "text", value: rest.slice(start) });
      break;
    }
    let code = afterOpen.slice(0, close);
    const firstNl = code.indexOf("\n");
    if (firstNl >= 0) {
      const firstLine = code.slice(0, firstNl);
      if (/^\w{1,20}$/.test(firstLine.trim())) {
        code = code.slice(firstNl + 1);
      }
    }
    parts.push({ kind: "code", value: code });
    rest = afterOpen.slice(close + 3);
  }
  return parts;
}

/** Una línea de texto sin el marcador de lista (si aplica). */
function parseListLine(line: string): {
  prefix: React.ReactNode;
  content: string;
} {
  const bulletStar = line.match(/^\s*\*\s+(.*)$/);
  if (bulletStar) {
    return { prefix: "• ", content: bulletStar[1] };
  }
  const bulletDash = line.match(/^\s*-\s+(.*)$/);
  if (bulletDash) {
    return { prefix: "• ", content: bulletDash[1] };
  }
  const ordered = line.match(/^\s*(\d+)\.\s+(.*)$/);
  if (ordered) {
    return { prefix: `${ordered[1]}. `, content: ordered[2] };
  }
  return { prefix: null, content: line };
}

/**
 * Parsea formato inline * _ ~ en una sola línea (sin saltos).
 */
function parseInlineLine(
  line: string,
  baseStyle: TextStyle,
  boldStyle: TextStyle,
  italicStyle: TextStyle,
  strikeStyle: TextStyle,
  keyBase: string,
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let remaining = line;
  let k = 0;

  const pushPlain = (s: string) => {
    if (s.length > 0) out.push(s);
  };

  while (remaining.length > 0) {
    const plainMatch = remaining.match(/^([^*_~]+)/);
    if (plainMatch) {
      pushPlain(plainMatch[1]);
      remaining = remaining.slice(plainMatch[1].length);
      continue;
    }

    const bold = remaining.match(/^\*([^*\n]+)\*/);
    if (bold) {
      out.push(
        <Text
          key={`${keyBase}-b-${k++}`}
          style={[baseStyle, boldStyle]}
        >
          {bold[1]}
        </Text>,
      );
      remaining = remaining.slice(bold[0].length);
      continue;
    }

    const italic = remaining.match(/^_([^_\n]+)_/);
    if (italic) {
      out.push(
        <Text
          key={`${keyBase}-i-${k++}`}
          style={[baseStyle, italicStyle]}
        >
          {italic[1]}
        </Text>,
      );
      remaining = remaining.slice(italic[0].length);
      continue;
    }

    const strike = remaining.match(/^~([^~\n]+)~/);
    if (strike) {
      out.push(
        <Text
          key={`${keyBase}-s-${k++}`}
          style={[baseStyle, strikeStyle]}
        >
          {strike[1]}
        </Text>,
      );
      remaining = remaining.slice(strike[0].length);
      continue;
    }

    pushPlain(remaining[0]);
    remaining = remaining.slice(1);
  }

  return out;
}

function formatPlainSegment(
  segment: string,
  opts: WhatsAppTextFormatOptions,
  baseStyle: TextStyle,
  boldStyle: TextStyle,
  italicStyle: TextStyle,
  strikeStyle: TextStyle,
  pieceKey: string,
): React.ReactNode[] {
  const lines = segment.split("\n");
  const nodes: React.ReactNode[] = [];

  lines.forEach((rawLine, lineIdx) => {
    if (lineIdx > 0) {
      nodes.push("\n");
    }
    const { prefix, content } = parseListLine(rawLine);
    const lineKey = `${pieceKey}-L${lineIdx}`;
    if (prefix != null) {
      nodes.push(
        <Text key={`${lineKey}-p`} style={baseStyle}>
          {prefix}
        </Text>,
      );
    }
    nodes.push(
      ...parseInlineLine(
        content,
        baseStyle,
        boldStyle,
        italicStyle,
        strikeStyle,
        lineKey,
      ),
    );
  });

  return nodes;
}

const monoFont = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

/**
 * Nodos listos para usar como hijos de un único `<Text>` / `<ThemedText>`.
 */
export function renderWhatsAppFormattedText(
  raw: string | null | undefined,
  options: WhatsAppTextFormatOptions,
): React.ReactNode {
  if (raw == null || raw === "") {
    return null;
  }

  const {
    textColor,
    codeBackgroundColor = "rgba(128,128,128,0.15)",
    fontSize,
  } = options;

  const baseStyle: TextStyle = {
    color: textColor,
    ...(fontSize != null ? { fontSize } : {}),
  };
  const boldStyle: TextStyle = { fontWeight: "700" };
  const italicStyle: TextStyle = { fontStyle: "italic" };
  const strikeStyle: TextStyle = { textDecorationLine: "line-through" };
  const codeStyle: TextStyle = {
    fontFamily: monoFont,
    color: textColor,
    backgroundColor: codeBackgroundColor,
    ...(fontSize != null ? { fontSize: fontSize - 1 } : {}),
  };

  const pieces = splitFencedCode(raw);
  const children: React.ReactNode[] = [];
  let pi = 0;

  for (const piece of pieces) {
    if (piece.kind === "code") {
      const codeText = piece.value.replace(/\n$/, "");
      children.push(
        <Text key={`code-${pi++}`} style={[baseStyle, codeStyle]}>
          {codeText}
        </Text>,
      );
    } else {
      children.push(
        ...formatPlainSegment(
          piece.value,
          options,
          baseStyle,
          boldStyle,
          italicStyle,
          strikeStyle,
          `t-${pi++}`,
        ),
      );
    }
  }

  if (children.length === 0) {
    return null;
  }
  return children.length === 1 ? children[0] : children;
}

/**
 * Versión en una sola línea (preview en lista de contactos, chips, etc.).
 * Quita saltos y colapsa espacios; aplica solo * _ ~ (sin bloques ```).
 */
export function renderWhatsAppFormattedTextSingleLine(
  raw: string | null | undefined,
  options: WhatsAppTextFormatOptions,
): React.ReactNode {
  if (raw == null || raw === "") {
    return null;
  }
  const oneLine = raw.replace(/\s+/g, " ").trim();
  const baseStyle: TextStyle = {
    color: options.textColor,
    ...(options.fontSize != null ? { fontSize: options.fontSize } : {}),
  };
  const boldStyle: TextStyle = { fontWeight: "700" };
  const italicStyle: TextStyle = { fontStyle: "italic" };
  const strikeStyle: TextStyle = { textDecorationLine: "line-through" };
  const nodes = parseInlineLine(
    oneLine,
    baseStyle,
    boldStyle,
    italicStyle,
    strikeStyle,
    "sl",
  );
  if (nodes.length === 0) {
    return null;
  }
  return nodes.length === 1 ? nodes[0] : nodes;
}
