// Exportaciones principales del sistema de estilos
export * from './components';
export * from './global.styles';
export * from './themes';

// Hook principal para usar el tema
export { useTheme } from '../hooks/use-theme.hook';

// Factory para crear el sistema de estilos completo
export const createStyleSystem = (themeVariant: 'light' | 'dark' = 'light') => {
  const { createTheme } = require('./themes');
  const { createGlobalStyles } = require('./global.styles');
  const { createComponentStyles } = require('./components');
  
  const theme = createTheme(themeVariant);
  const globalStyles = createGlobalStyles(theme);
  const componentStyles = createComponentStyles(theme);
  
  return {
    theme,
    globalStyles,
    componentStyles,
  };
};
