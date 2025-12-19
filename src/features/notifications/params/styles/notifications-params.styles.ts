import { StyleSheet } from 'react-native';

export const createNotificationsParamsStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      gap: 8,
    },
    title: {
      marginBottom: 4,
    },
    subtitle: {
      marginBottom: 8,
    },
    filtersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    filterInput: {
      flex: 1,
      padding: 10,
      borderRadius: 6,
      borderWidth: 1,
    },
    list: {
      gap: 6,
    },
    card: {
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    meta: {
      opacity: 0.7,
      fontSize: 12,
    },
    empty: {
      textAlign: 'center',
      opacity: 0.7,
      marginTop: 12,
    },
  });
