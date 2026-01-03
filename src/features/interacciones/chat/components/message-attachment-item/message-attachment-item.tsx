/**
 * Componente para renderizar un archivo adjunto
 */
import { ThemedText } from '@/components/themed-text';
import { API_CONFIG } from '@/src/infrastructure/api/config';
import { InteraccionesService } from '@/src/domains/interacciones';
import { getStorageAdapter } from '@/src/infrastructure/api/storage.adapter';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, TouchableOpacity, View } from 'react-native';
import { messageAttachmentItemStyles } from './message-attachment-item.styles';
import type { MessageAttachmentItemProps } from './message-attachment-item.types';

export const MessageAttachmentItem = React.memo(({ 
  attachment, 
  messageId, 
  colors,
  onPress,
  isMobile
}: MessageAttachmentItemProps) => {
  const [token, setToken] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const blobUrlRef = useRef<string | null>(null);
  const attachmentUrl = InteraccionesService.getAttachmentUrl(messageId, attachment.id, attachment.filePath);
  const isImage = attachment.fileType.startsWith('image/');
  const isVideo = attachment.fileType.startsWith('video/');
  const styles = messageAttachmentItemStyles;

  useEffect(() => {
    // Obtener token para headers de autenticación
    const loadToken = async () => {
      try {
        const storage = getStorageAdapter();
        const accessToken = await storage.getItem(API_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
        setToken(accessToken);
      } catch (error) {
        console.error('Error al obtener token:', error);
      }
    };
    loadToken();
  }, []);

  useEffect(() => {
    // Para web, necesitamos obtener la imagen como blob y crear una URL local
    // porque ExpoImage en web no maneja bien los headers de autenticación
    if (isImage && token && Platform.OS === 'web') {
      const loadImage = async () => {
        try {
          setLoading(true);
          setError(false);
          
          const response = await fetch(attachmentUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();
          
          // Verificar que el blob sea válido
          if (!blob || blob.size === 0) {
            throw new Error('Blob vacío o inválido');
          }
          
          // Limpiar URL anterior si existe
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
          }
          const localUrl = URL.createObjectURL(blob);
          blobUrlRef.current = localUrl;
          setImageUri(localUrl);
        } catch (err) {
          setError(true);
        } finally {
          setLoading(false);
        }
      };

      loadImage();

      // Limpiar URL cuando el componente se desmonte o cambie
      return () => {
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
      };
    } else if (isImage && token && Platform.OS !== 'web') {
      // En React Native, usar la URL directamente con headers
      setImageUri(attachmentUrl);
      setLoading(false);
    }
  }, [isImage, token, attachmentUrl, messageId, attachment.id, attachment.filePath]);

  if (isImage) {
    if (Platform.OS === 'web') {
      // En web, usar Image nativo con la URL local del blob
      return (
        <TouchableOpacity 
          style={[
            styles.attachment, 
            { borderColor: colors.border },
            isMobile && styles.attachmentMobile
          ]}
          onPress={onPress}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={[styles.attachmentPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : error ? (
            <View style={[styles.attachmentPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
              <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
                Error al cargar
              </ThemedText>
            </View>
          ) : imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.attachmentImage}
              resizeMode="cover"
              onError={() => {
                setError(true);
              }}
            />
          ) : (
            <View style={[styles.attachmentPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </TouchableOpacity>
      );
    }

    // En React Native, usar ExpoImage con headers
    return (
      <TouchableOpacity 
        style={[
          styles.attachment, 
          { borderColor: colors.border },
          isMobile && styles.attachmentMobile
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {token ? (
          <ExpoImage
            source={{
              uri: attachmentUrl,
              headers: { 
                Authorization: `Bearer ${token}`,
              },
            }}
            style={styles.attachmentImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            onError={() => {
              setError(true);
              setLoading(false);
            }}
            onLoad={() => {
              setLoading(false);
              setError(false);
            }}
          />
        ) : (
          <View style={[styles.attachmentPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (isVideo) {
    return (
      <View style={[styles.attachment, { borderColor: colors.border }]}>
        <View style={[styles.attachmentPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
          <Ionicons name="videocam" size={32} color={colors.textSecondary} />
          <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
            {attachment.fileName}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.attachment, { borderColor: colors.border }]}>
      <TouchableOpacity
        style={[styles.attachmentPlaceholder, { backgroundColor: colors.surfaceVariant }]}
        activeOpacity={0.7}
        onPress={() => {
          // Descargar o abrir documento
          if (Platform.OS === 'web') {
            // En web, descargar archivo con token
            fetch(attachmentUrl, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
              .then((response) => response.blob())
              .then((blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = attachment.fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              })
              .catch((error) => {
                console.error('Error al descargar archivo:', error);
              });
          }
        }}
      >
        <Ionicons name="document" size={32} color={colors.textSecondary} />
        <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
          {attachment.fileName}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
});

MessageAttachmentItem.displayName = 'MessageAttachmentItem';
