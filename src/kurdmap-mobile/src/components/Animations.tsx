import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

export function FadeInView({ children, delay = 0, duration = 400, style }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delay, duration]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

export function ScaleOnPress({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[{ transform: [{ scale }] }, style]}
      onTouchStart={onPressIn}
      onTouchEnd={onPressOut}
      onTouchCancel={onPressOut}
    >
      {children}
    </Animated.View>
  );
}

export function StaggerChildren({
  children,
  stagger = 80,
}: {
  children: React.ReactNode[];
  stagger?: number;
}) {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <FadeInView delay={index * stagger} key={index}>
          {child}
        </FadeInView>
      ))}
    </>
  );
}
