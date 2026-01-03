/**
 * Componente para mostrar miniatura de adjunto en la cita del mensaje (imágenes y otros archivos)
 */
import { InteraccionesService } from '@/src/domains/interacciones';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { MessageQuoteImageThumbnail } from '../message-quote-image-thumbnail/message-quote-image-thumbnail';
import { messageQuoteAttachmentThumbnailStyles } from './message-quote-attachment-thumbnail.styles';
import type { MessageQuoteAttachmentThumbnailProps } from './message-quote-attachment-thumbnail.types';

export const MessageQuoteAttachmentThumbnail = React.memo(({
  attachment,
  messageId,
  onPress,
  getFileIcon
}: MessageQuoteAttachmentThumbnailProps) => {
  const { colors } = useTheme();
  const styles = messageQuoteAttachmentThumbnailStyles;
  const isImage = attachment.fileType.startsWith('image/');
  const fileIconInfo = getFileIcon(attachment.fileName, attachment.fileType);
  const attachmentUrl = InteraccionesService.getAttachmentUrl(messageId, attachment.id, attachment.filePath);

  // Si es imagen, usar el componente de imagen
  if (isImage) {
    return (
      <View style={styles.container}>
        <MessageQuoteImageThumbnail
          imageUrl={attachmentUrl}
          messageId={messageId}
          attachmentId={attachment.id}
          onPress={onPress}
        />
      </View>
    );
  }

  // Para otros tipos de archivo, mostrar icono
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceVariant,
          borderWidth: 1,
          borderColor: colors.border,
        }
      ]}
    >
      {fileIconInfo.iconSource ? (
        <Image
          source={fileIconInfo.iconSource}
          style={styles.fileIcon}
          resizeMode="contain"
        />
      ) : (
        <Ionicons 
          name={fileIconInfo.icon as any} 
          size={20} 
          color={fileIconInfo.color} 
        />
      )}
    </TouchableOpacity>
  );
});

MessageQuoteAttachmentThumbnail.displayName = 'MessageQuoteAttachmentThumbnail';
