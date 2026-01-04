import { StyleSheet } from 'react-native';

export function createCompanyConfigCarouselStyles() {
  return StyleSheet.create({
    container: {
      marginVertical: 16,
      height: 350,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    headerTitle: {
      fontWeight: '600',
    },
    headerIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    carouselContainer: {
      position: 'relative',
      marginBottom: 16,
    },
    scrollView: {
      flexGrow: 0,
    },
    scrollContent: {
      paddingHorizontal: 0,
    },
    slide: {
      paddingRight: 16,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    companyCard: {
      padding: 0,
      marginHorizontal: 0,
      minHeight: 380,
      borderRadius: 12,
      width: '100%',
    },
    cardContent: {
      paddingTop: 20,
      paddingHorizontal: 0,
    },
    companyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 24,
      paddingBottom: 20,
      borderBottomWidth: 2,
      borderBottomColor: 'rgba(59, 130, 246, 0.2)',
    },
    companyHeaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    companyHeaderText: {
      marginLeft: 12,
      flex: 1,
    },
    companyName: {
      fontWeight: '600',
      marginBottom: 4,
    },
    companyBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    companyBadgeText: {
      color: '#3b82f6',
      fontWeight: '600',
      fontSize: 11,
    },
    inputGroup: {
      marginBottom: 20,
    },
    emptyMessage: {
      marginTop: 8,
      fontStyle: 'italic',
    },
    navButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      opacity: 0.7,
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    paginationDotActive: {
      width: 24,
    },
  });
}

