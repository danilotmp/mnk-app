import { StyleSheet } from 'react-native';

export const messageAttachmentItemStyles = StyleSheet.create({
  attachment: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    width: 150,
    height: 150,
    marginBottom: 0,
  },
  attachmentMobile: {
    width: 100,
    height: 100,
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  attachmentPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
});
