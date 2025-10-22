import { useTheme } from '@/hooks/use-theme';
import { StyleSheet } from 'react-native';

// Estilos globales que se pueden reutilizar en toda la aplicación
export const createGlobalStyles = () => {
  const { colors, spacing, borderRadius, shadows } = useTheme();

  return StyleSheet.create({
    // Contenedores
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
    },
    
    // Centrado
    center: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerHorizontal: {
      alignItems: 'center',
    },
    centerVertical: {
      justifyContent: 'center',
    },
    
    // Espaciado
    marginTop: {
      marginTop: spacing.md,
    },
    marginBottom: {
      marginBottom: spacing.md,
    },
    marginLeft: {
      marginLeft: spacing.md,
    },
    marginRight: {
      marginRight: spacing.md,
    },
    padding: {
      padding: spacing.md,
    },
    paddingHorizontal: {
      paddingHorizontal: spacing.md,
    },
    paddingVertical: {
      paddingVertical: spacing.md,
    },
    
    // Bordes
    border: {
      borderWidth: 1,
      borderColor: colors.border,
    },
    borderTop: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    borderBottom: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    borderLeft: {
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
    },
    borderRight: {
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    
    // Bordes redondeados
    rounded: {
      borderRadius: borderRadius.md,
    },
    roundedSmall: {
      borderRadius: borderRadius.sm,
    },
    roundedLarge: {
      borderRadius: borderRadius.lg,
    },
    roundedFull: {
      borderRadius: borderRadius.full,
    },
    
    // Sombras
    shadow: {
      ...shadows.sm,
    },
    shadowMedium: {
      ...shadows.md,
    },
    shadowLarge: {
      ...shadows.lg,
    },
    
    // Flex
    flex1: {
      flex: 1,
    },
    flexRow: {
      flexDirection: 'row',
    },
    flexColumn: {
      flexDirection: 'column',
    },
    flexWrap: {
      flexWrap: 'wrap',
    },
    flexGrow: {
      flexGrow: 1,
    },
    flexShrink: {
      flexShrink: 1,
    },
    
    // Alineación
    alignStart: {
      alignItems: 'flex-start',
    },
    alignEnd: {
      alignItems: 'flex-end',
    },
    alignCenter: {
      alignItems: 'center',
    },
    justifyStart: {
      justifyContent: 'flex-start',
    },
    justifyEnd: {
      justifyContent: 'flex-end',
    },
    justifyCenter: {
      justifyContent: 'center',
    },
    justifyBetween: {
      justifyContent: 'space-between',
    },
    justifyAround: {
      justifyContent: 'space-around',
    },
    justifyEvenly: {
      justifyContent: 'space-evenly',
    },
    
    // Texto
    textCenter: {
      textAlign: 'center',
    },
    textLeft: {
      textAlign: 'left',
    },
    textRight: {
      textAlign: 'right',
    },
    
    // Posicionamiento
    absolute: {
      position: 'absolute',
    },
    relative: {
      position: 'relative',
    },
    
    // Tamaños
    fullWidth: {
      width: '100%',
    },
    fullHeight: {
      height: '100%',
    },
    halfWidth: {
      width: '50%',
    },
    halfHeight: {
      height: '50%',
    },
    
    // Opacidad
    opacity50: {
      opacity: 0.5,
    },
    opacity75: {
      opacity: 0.75,
    },
    opacity90: {
      opacity: 0.9,
    },
  });
};

// Estilos estáticos que no dependen del tema
export const staticStyles = StyleSheet.create({
  // Espaciado fijo
  gap4: { gap: 4 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  gap16: { gap: 16 },
  gap20: { gap: 20 },
  gap24: { gap: 24 },
  gap32: { gap: 32 },
  
  // Márgenes fijos
  m4: { margin: 4 },
  m8: { margin: 8 },
  m12: { margin: 12 },
  m16: { margin: 16 },
  m20: { margin: 20 },
  m24: { margin: 24 },
  m32: { margin: 32 },
  
  // Padding fijo
  p4: { padding: 4 },
  p8: { padding: 8 },
  p12: { padding: 12 },
  p16: { padding: 16 },
  p20: { padding: 20 },
  p24: { padding: 24 },
  p32: { padding: 32 },
  
  // Márgenes específicos
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  mt20: { marginTop: 20 },
  mt24: { marginTop: 24 },
  mt32: { marginTop: 32 },
  
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
  mb20: { marginBottom: 20 },
  mb24: { marginBottom: 24 },
  mb32: { marginBottom: 32 },
  
  ml4: { marginLeft: 4 },
  ml8: { marginLeft: 8 },
  ml12: { marginLeft: 12 },
  ml16: { marginLeft: 16 },
  ml20: { marginLeft: 20 },
  ml24: { marginLeft: 24 },
  ml32: { marginLeft: 32 },
  
  mr4: { marginRight: 4 },
  mr8: { marginRight: 8 },
  mr12: { marginRight: 12 },
  mr16: { marginRight: 16 },
  mr20: { marginRight: 20 },
  mr24: { marginRight: 24 },
  mr32: { marginRight: 32 },
  
  // Padding específico
  pt4: { paddingTop: 4 },
  pt8: { paddingTop: 8 },
  pt12: { paddingTop: 12 },
  pt16: { paddingTop: 16 },
  pt20: { paddingTop: 20 },
  pt24: { paddingTop: 24 },
  pt32: { paddingTop: 32 },
  
  pb4: { paddingBottom: 4 },
  pb8: { paddingBottom: 8 },
  pb12: { paddingBottom: 12 },
  pb16: { paddingBottom: 16 },
  pb20: { paddingBottom: 20 },
  pb24: { paddingBottom: 24 },
  pb32: { paddingBottom: 32 },
  
  pl4: { paddingLeft: 4 },
  pl8: { paddingLeft: 8 },
  pl12: { paddingLeft: 12 },
  pl16: { paddingLeft: 16 },
  pl20: { paddingLeft: 20 },
  pl24: { paddingLeft: 24 },
  pl32: { paddingLeft: 32 },
  
  pr4: { paddingRight: 4 },
  pr8: { paddingRight: 8 },
  pr12: { paddingRight: 12 },
  pr16: { paddingRight: 16 },
  pr20: { paddingRight: 20 },
  pr24: { paddingRight: 24 },
  pr32: { paddingRight: 32 },
  
  // Padding horizontal y vertical
  px4: { paddingHorizontal: 4 },
  px8: { paddingHorizontal: 8 },
  px12: { paddingHorizontal: 12 },
  px16: { paddingHorizontal: 16 },
  px20: { paddingHorizontal: 20 },
  px24: { paddingHorizontal: 24 },
  px32: { paddingHorizontal: 32 },
  
  py4: { paddingVertical: 4 },
  py8: { paddingVertical: 8 },
  py12: { paddingVertical: 12 },
  py16: { paddingVertical: 16 },
  py20: { paddingVertical: 20 },
  py24: { paddingVertical: 24 },
  py32: { paddingVertical: 32 },
  
  // Márgenes horizontal y vertical
  mx4: { marginHorizontal: 4 },
  mx8: { marginHorizontal: 8 },
  mx12: { marginHorizontal: 12 },
  mx16: { marginHorizontal: 16 },
  mx20: { marginHorizontal: 20 },
  mx24: { marginHorizontal: 24 },
  mx32: { marginHorizontal: 32 },
  
  my4: { marginVertical: 4 },
  my8: { marginVertical: 8 },
  my12: { marginVertical: 12 },
  my16: { marginVertical: 16 },
  my20: { marginVertical: 20 },
  my24: { marginVertical: 24 },
  my32: { marginVertical: 32 },
});
