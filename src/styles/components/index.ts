// Exportaciones de todos los estilos de componentes
export * from './button.styles';
export * from './card.styles';
export * from './input.styles';
export * from './table.styles';

// Factory para crear estilos de componentes
export const createComponentStyles = (theme: any) => {
  return {
    button: require('./button.styles').createButtonStyles(theme),
    card: require('./card.styles').createCardStyles(theme),
    input: require('./input.styles').createInputStyles(theme),
    table: require('./table.styles').createTableStyles(theme),
  };
};
