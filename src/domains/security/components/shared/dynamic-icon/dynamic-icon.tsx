/**
 * Componente que renderiza iconos de cualquier familia de @expo/vector-icons
 * Detecta automáticamente la familia o permite especificarla con formato "familia:nombre"
 * 
 * Formatos soportados:
 * - "home-outline" -> intenta en Ionicons (por defecto)
 * - "FontAwesome:money" -> usa FontAwesome
 * - "AntDesign:money-collect" -> usa AntDesign
 * - "MaterialIcons:payment" -> usa MaterialIcons
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Feather from '@expo/vector-icons/Feather';
import Entypo from '@expo/vector-icons/Entypo';
import React from 'react';
import { StyleProp, TextStyle } from 'react-native';

interface DynamicIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

type IconComponent = React.ComponentType<{
  name: any;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}>;

/**
 * Mapeo de familias de iconos disponibles
 */
const ICON_FAMILIES: Record<string, IconComponent> = {
  Ionicons,
  FontAwesome,
  AntDesign,
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
  Entypo,
};

/**
 * Lista de familias a probar en orden de prioridad si no se especifica familia
 */
const DEFAULT_FAMILIES = [
  'Ionicons',
  'FontAwesome',
  'MaterialIcons',
  'AntDesign',
  'MaterialCommunityIcons',
  'Feather',
  'Entypo',
];

/**
 * Parsea el nombre del icono para extraer familia y nombre
 * Formato: "Familia:nombre" o solo "nombre"
 */
function parseIconName(iconName: string): { family: string | null; name: string } {
  const parts = iconName.split(':');
  if (parts.length === 2) {
    return {
      family: parts[0].trim(),
      name: parts[1].trim(),
    };
  }
  return {
    family: null,
    name: iconName.trim(),
  };
}

/**
 * Componente que renderiza iconos de cualquier familia de @expo/vector-icons
 * 
 * Si se especifica familia (formato "familia:nombre"), usa esa familia directamente.
 * Si no, intenta en el orden de prioridad: Ionicons -> FontAwesome -> MaterialIcons -> etc.
 * 
 * Nota: Si un icono no existe en una familia, el componente de iconos mostrará
 * un icono por defecto o un espacio vacío (comportamiento estándar de @expo/vector-icons).
 */
export function DynamicIcon({ name, size = 24, color, style }: DynamicIconProps) {
  if (!name || !name.trim()) {
    // Si no hay nombre, retornar un icono por defecto
    return <Ionicons name="image-outline" size={size} color={color} style={style} />;
  }

  const { family, name: iconName } = parseIconName(name);

  // Si se especificó una familia, usarla directamente
  if (family) {
    const IconComponent = ICON_FAMILIES[family];
    if (IconComponent) {
      return (
        <IconComponent
          name={iconName as any}
          size={size}
          color={color}
          style={style}
        />
      );
    }
    // Si la familia especificada no existe, usar Ionicons como fallback
    return <Ionicons name="image-outline" size={size} color={color} style={style} />;
  }

  // Si no se especificó familia, intentar en orden de prioridad
  // Por ahora, intentamos solo en Ionicons (comportamiento por defecto)
  // Si el usuario necesita otro icono, debe especificar la familia: "FontAwesome:money"
  const IconComponent = ICON_FAMILIES[DEFAULT_FAMILIES[0]]; // Ionicons
  if (IconComponent) {
    return (
      <IconComponent
        name={iconName as any}
        size={size}
        color={color}
        style={style}
      />
    );
  }

  // Fallback final
  return <Ionicons name="image-outline" size={size} color={color} style={style} />;
}

/**
 * Obtener lista de familias disponibles
 */
export function getIconFamilies(): string[] {
  return Object.keys(ICON_FAMILIES);
}

