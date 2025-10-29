import type { PropsWithChildren, ReactElement } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const backgroundColor = useThemeColor(
    { light: headerBackgroundColor.light, dark: headerBackgroundColor.dark },
    'background'
  );
  
  // En web, usar ScrollView estándar para evitar problemas con worklets
  if (Platform.OS === 'web') {
    return (
      <ThemedView style={{ backgroundColor, flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          <View
            style={[
              styles.header,
              { backgroundColor: headerBackgroundColor[colorScheme] },
            ]}>
            {headerImage}
          </View>
          <ThemedView style={styles.content}>{children}</ThemedView>
        </ScrollView>
      </ThemedView>
    );
  }

  // Para iOS/Android, usar reanimated
  const Animated = require('react-native-reanimated').default;
  const {
    interpolate,
    useAnimatedRef,
    useAnimatedStyle,
    useScrollOffset,
  } = require('react-native-reanimated');
  
  const scrollRef = useAnimatedRef();
  const scrollOffset = useScrollOffset(scrollRef);
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1]),
        },
      ],
    };
  });

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={{ backgroundColor, flex: 1 }}
      scrollEventThrottle={16}>
      <Animated.View
        style={[
          styles.header,
          { backgroundColor: headerBackgroundColor[colorScheme] },
          headerAnimatedStyle,
        ]}>
        {headerImage}
      </Animated.View>
      <ThemedView style={styles.content}>{children}</ThemedView>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'hidden',
  },
});
