/**
 * Componente para mostrar miniatura de imagen en la cita del mensaje
 */
import { API_CONFIG } from '@/src/infrastructure/api/config';
import { getStorageAdapter } from '@/src/infrastructure/api/storage.adapter';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, TouchableOpacity, View } from 'react-native';
import { messageQuoteImageThumbnailStyles } from './message-quote-image-thumbnail.styles';
import type { MessageQuoteImageThumbnailProps } from './message-quote-image-thumbnail.types';

export const MessageQuoteImageThumbnail = React.memo(({
  imageUrl,
  messageId,
  attachmentId,
  onPress
}: MessageQuoteImageThumbnailProps) => {
  const [token, setToken] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const blobUrlRef = useRef<string | null>(null);
  const { colors } = useTheme();
  const styles = messageQuoteImageThumbnailStyles;

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storage = getStorageAdapter();
        const accessToken = await storage.getItem(API_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
        setToken(accessToken);
      } catch (error) {
        // Silenciar error
      }
    };
    loadToken();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && token) {
      const loadImage = async () => {
        try {
          setLoading(true);
          setError(false);
          const response = await fetch(imageUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();
          
          if (!blob || blob.size === 0) {
            throw new Error('Blob vacío o inválido');
          }
          
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
            blobUrlRef.current = null;
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

      return () => {
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
      };
    } else if (Platform.OS !== 'web' && token) {
      setImageUri(imageUrl);
      setLoading(false);
    }
  }, [imageUrl, token, messageId, attachmentId]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.touchable}
    >
      {Platform.OS === 'web' ? (
        loading ? (
          <View style={[styles.content, { backgroundColor: colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={[styles.content, { backgroundColor: colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
          </View>
        ) : imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.content}
            resizeMode="cover"
            onError={() => {
              setError(true);
            }}
          />
        ) : (
          <View style={[styles.content, { backgroundColor: colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )
      ) : (
        token ? (
          <ExpoImage
            source={{
              uri: imageUrl,
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }}
            style={styles.content}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
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
          <View style={[styles.content, { backgroundColor: colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )
      )}
    </TouchableOpacity>
  );
});

MessageQuoteImageThumbnail.displayName = 'MessageQuoteImageThumbnail';
