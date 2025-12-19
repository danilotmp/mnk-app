import { StyleSheet } from 'react-native';

export const createRichTextEditorStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: '#FFFFFF',
    },
    webview: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    loadingContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.05)',
    },
  });
