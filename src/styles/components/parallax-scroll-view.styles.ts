import { StyleSheet } from 'react-native';

export const createParallaxScrollViewStyles = (headerHeight: number) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: { height: headerHeight, overflow: 'hidden' },
    content: { flex: 1, padding: 32, gap: 16, overflow: 'hidden' },
  });


