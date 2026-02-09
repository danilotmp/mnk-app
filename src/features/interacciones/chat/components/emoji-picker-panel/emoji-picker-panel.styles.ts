import { StyleSheet } from 'react-native';

export const emojiPickerPanelStyles = StyleSheet.create({
  container: {
    width: '100%',
    maxHeight: 350,
    borderTopWidth: 1,
    position: 'relative',
  },
  containerMobile: {
    maxHeight: 175, // Mitad de altura en móvil
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  filterContainer: {
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    maxHeight: 300,
  },
  scrollMobile: {
    maxHeight: 130, // Altura reducida para móvil
  },
  content: {
    padding: 12,
  },
  contentMobile: {
    padding: 12,
    flexDirection: 'row',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  gridMobile: {
    flexDirection: 'row',
    flexWrap: 'nowrap', // Sin wrap para scroll horizontal
  },
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 4,
  },
});
