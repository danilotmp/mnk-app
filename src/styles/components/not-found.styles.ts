import { Platform, StyleSheet } from 'react-native';

export const createNotFoundStyles = (screenWidth: number = 400) => {
  let fontSize = 64;
  let lineHeight = 70;
  let marginBottom = 32;
  let paddingTop = 0;
  let justifyContent: 'center' | 'flex-start' = 'center';

  if (screenWidth < 400) {
    fontSize = 20;
    lineHeight = 24;
    marginBottom = 18;
    paddingTop = 52;
    justifyContent = 'flex-start';
  } else if (screenWidth < 600) {
    fontSize = 32;
    lineHeight = 38;
    marginBottom = 24;
    paddingTop = 52;
    justifyContent = 'flex-start';
  }

  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent,
      padding: 20,
      paddingTop,
    },
    iconContainer: { marginBottom: 40 },
    iconStack: { width: 140, height: 160, position: 'relative', alignItems: 'center', justifyContent: 'center' },
    documentBack: { position: 'absolute', width: 100, height: 120, borderRadius: 8, opacity: 0.6 },
    documentLeft: { left: 0, top: 15, transform: [{ rotate: '-8deg' }] },
    documentRight: { right: 0, top: 15, transform: [{ rotate: '8deg' }] },
    documentFront: {
      width: 100,
      height: 120,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        web: {
          boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.2)',
        },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 3,
        },
      }),
      zIndex: 3,
    },
    questionMark: { fontSize: 120, fontWeight: 'bold', opacity: 0.9 },
    title: {
      fontSize,
      lineHeight,
      fontWeight: 'bold',
      letterSpacing: 0,
      marginBottom,
      textAlign: 'center',
    },
    message: { textAlign: 'center', marginBottom: 40, fontSize: 14, opacity: 0.8 },
    linksContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', maxWidth: 600 },
    leftSection: { flex: 1, alignItems: 'flex-start' },
    centerSection: { flex: 1, alignItems: 'center' },
    rightSection: { flex: 1, alignItems: 'flex-end' },
    linkButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    linkText: { fontSize: 16, fontWeight: '500' },
  });
};


