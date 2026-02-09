/**
 * Componente auxiliar para cargar imagen con token en RN
 */
import { API_CONFIG } from '@/src/infrastructure/api/config';
import { getStorageAdapter } from '@/src/infrastructure/api/storage.adapter';
import { Image as ExpoImage } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { ImageWithTokenProps } from './image-with-token.types';

export const ImageWithToken = React.memo(({ uri, style }: ImageWithTokenProps) => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
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

  if (!token) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <ExpoImage
      source={{
        uri,
        headers: { Authorization: `Bearer ${token}` },
      }}
      style={style}
      contentFit="contain"
      cachePolicy="memory-disk"
    />
  );
});

ImageWithToken.displayName = 'ImageWithToken';
