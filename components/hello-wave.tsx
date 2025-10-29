import { Platform, StyleSheet, Text } from 'react-native';

export function HelloWave() {
  // En web, usar animación CSS simple para evitar problemas con worklets
  if (Platform.OS === 'web') {
    return (
      <Text
        style={[
          styles.waveText,
          {
            // @ts-ignore - propiedades web CSS animation
            animationName: {
              '0%, 100%': { transform: [{ rotate: '0deg' }] },
              '50%': { transform: [{ rotate: '25deg' }] },
            },
            animationDuration: '1.2s',
            animationIterationCount: 4,
            animationTimingFunction: 'ease-in-out',
          },
        ]}>
        👋
      </Text>
    );
  }

  // Para iOS/Android, usar reanimated solo si está disponible
  try {
    const Animated = require('react-native-reanimated').default;
    
    return (
      <Animated.Text
        style={[
          styles.waveText,
          {
            animationName: {
              '50%': { transform: [{ rotate: '25deg' }] },
            },
            animationIterationCount: 4,
            animationDuration: '300ms',
          },
        ]}>
        👋
      </Animated.Text>
    );
  } catch {
    // Fallback si reanimated no está disponible
    return <Text style={styles.waveText}>👋</Text>;
  }
}

const styles = StyleSheet.create({
  waveText: {
    fontSize: 28,
    lineHeight: 32,
    marginTop: -6,
  },
});
