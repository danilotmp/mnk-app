import React, { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  View,
  type ViewStyle,
} from "react-native";

export interface ContactSpecialistAvatarRingProps {
  wrapStyle: ViewStyle;
  ringAnimatedBaseStyle: ViewStyle;
  borderColor: string;
  borderRadius: number;
  children: React.ReactNode;
}

/**
 * Anillo más grueso; titila avatar y borde a la vez (misma opacidad, useNativeDriver).
 * Sin animación si el usuario tiene “reducir movimiento” activado.
 */
export function ContactSpecialistAvatarRing({
  wrapStyle,
  ringAnimatedBaseStyle,
  borderColor,
  borderRadius,
  children,
}: ContactSpecialistAvatarRingProps) {
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    let mounted = true;
    const runLoop = () => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.58,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      );
      loopRef.current = loop;
      loop.start();
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => {
        if (mounted && !reduce) runLoop();
      })
      .catch(() => {
        if (mounted) runLoop();
      });

    return () => {
      mounted = false;
      loopRef.current?.stop();
      loopRef.current = null;
    };
  }, [opacityAnim]);

  return (
    <View style={wrapStyle}>
      <Animated.View style={{ opacity: opacityAnim }}>{children}</Animated.View>
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          ringAnimatedBaseStyle,
          {
            borderColor,
            borderRadius,
            opacity: opacityAnim,
          },
        ]}
      />
    </View>
  );
}
