import { Video, ResizeMode } from 'expo-av';
import { Platform, StyleSheet, View } from 'react-native';
import React, { useRef, useEffect, useState } from 'react';
import { Asset } from 'expo-asset';

interface VideoPlayerProps {
  readonly source: any;
  readonly style?: any;
  readonly autoPlay?: boolean;
  readonly loop?: boolean;
  readonly muted?: boolean;
}

export function VideoPlayer({ 
  source, 
  style, 
  autoPlay = true, 
  loop = true, 
  muted = true 
}: Readonly<VideoPlayerProps>) {
  const videoRef = useRef<Video>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideo = async () => {
      if (Platform.OS === 'web') {
        try {
          // Si es un string, usarlo directamente
          if (typeof source === 'string') {
            setVideoSrc(source);
            setLoading(false);
            return;
          }

          // Si es un require() o módulo, usar Asset para obtener la URL
          let assetSource = source;
          if (source?.default) {
            assetSource = source.default;
          }

          // Crear un Asset y obtener su URI local
          const asset = Asset.fromModule(assetSource);
          await asset.downloadAsync();
          
          if (asset.localUri) {
            setVideoSrc(asset.localUri);
          } else if (asset.uri) {
            setVideoSrc(asset.uri);
          } else {
            throw new Error('No se pudo obtener la URI del video');
          }
        } catch (e) {
          console.error('Error al cargar video:', e);
          setError('Error al cargar el video');
        } finally {
          setLoading(false);
        }
      } else {
        // En móvil, no necesitamos procesar el source
        setLoading(false);
      }
    };

    loadVideo();
  }, [source]);

  if (Platform.OS === 'web') {
    // Para web, usar elemento HTML5 video directamente
    if (loading) {
      return (
        <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }]}>
          <p style={{ color: '#666', margin: 0 }}>Cargando video...</p>
        </View>
      );
    }

    if (error || !videoSrc) {
      return (
        <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }]}>
          <p style={{ color: '#666', margin: 0 }}>{error || 'No se pudo cargar el video'}</p>
        </View>
      );
    }

    return (
      <View style={style}>
        {/* @ts-ignore - video element for web */}
        <video
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline
          onError={(e) => {
            console.error('Error al cargar video:', e);
            setError('No se pudo reproducir el video');
          }}
          onLoadedData={() => {
            console.log('Video cargado correctamente:', videoSrc);
          }}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        >
          <source src={videoSrc} type="video/mp4" />
          Tu navegador no soporta el elemento de video.
        </video>
      </View>
    );
  }

  // Para iOS/Android, usar expo-av
  return (
    <View style={style}>
      <Video
        ref={videoRef}
        source={source}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.CONTAIN}
        isLooping={loop}
        isMuted={muted}
        shouldPlay={autoPlay}
        useNativeControls={false}
        onError={(error) => {
          console.error('Error al reproducir video:', error);
        }}
        onLoad={() => {
          console.log('Video cargado en móvil');
        }}
      />
    </View>
  );
}
