import { StyleSheet } from 'react-native';

export const createRegisterStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      gap: 12,
    },
    title: {
      marginBottom: 4,
    },
    subtitle: {
      marginBottom: 8,
    },
    form: {
      gap: 12,
    },
    error: {
      marginTop: 4,
    },
  });
