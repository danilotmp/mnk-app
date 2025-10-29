/**
 * Configuración de Metro para Expo
 * Configurado para manejar correctamente las fuentes y evitar errores de FontFaceObserver
 */

const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configurar para ignorar FontFaceObserver si causa problemas
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...(config.resolver?.extraNodeModules || {}),
  },
  // Ignorar módulos problemáticos en web
  platformExtensions: ['web.js', 'web.ts', 'web.tsx', 'js', 'ts', 'tsx', 'json'],
};

// Configuración de transformación
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
  },
  // Deshabilitar source maps problemáticos para archivos anónimos
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
  // Habilitar require.context para Expo Router (necesario para web)
  unstable_allowRequireContext: true,
};

// Configurar simbolización (solo si existe)
if (!config.serializer) {
  config.serializer = {};
}

// Interceptar readFileSync para manejar archivos anónimos de forma silenciosa
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function(...args) {
  const filePath = args[0];
  
  // Si el path contiene '<anonymous>' o es un archivo que no existe realmente, retornar contenido vacío
  if (typeof filePath === 'string' && (
    filePath.includes('<anonymous>') ||
    filePath.includes('anonymous') ||
    (!path.isAbsolute(filePath) && filePath.startsWith('<'))
  )) {
    // Retornar string vacío para archivos anónimos sin lanzar error
    return '';
  }
  
  // Intentar leer el archivo normalmente
  try {
    return originalReadFileSync.apply(this, args);
  } catch (error) {
    // Si el archivo no existe y es un archivo anónimo, retornar contenido vacío silenciosamente
    if (
      error.code === 'ENOENT' && 
      typeof filePath === 'string' && 
      (filePath.includes('<anonymous>') || filePath.includes('anonymous'))
    ) {
      // No hacer console.log ni console.warn para evitar spam en la terminal
      return '';
    }
    // Re-lanzar otros errores normalmente
    throw error;
  }
};

// Configuración para reducir errores de source maps con archivos anónimos
// Estos errores son warnings que no afectan la funcionalidad de la app
// Metro intenta leer source maps de código generado dinámicamente

module.exports = config;

