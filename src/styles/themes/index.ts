// Exportaciones de todos los temas
export * from './base.theme';
export * from './dark.theme';
export * from './light.theme';

// Factory para crear temas
export const createTheme = (variant: 'light' | 'dark') => {
  switch (variant) {
    case 'light':
      return require('./light.theme').lightTheme;
    case 'dark':
      return require('./dark.theme').darkTheme;
    default:
      return require('./light.theme').lightTheme;
  }
};
