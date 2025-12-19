import { StyleSheet } from 'react-native';

export const createNotificationsTemplatesStyles = () =>
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
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      gap: 8,
    },
    list: {
      gap: 6,
    },
    card: {
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    code: {
      fontWeight: '600',
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
