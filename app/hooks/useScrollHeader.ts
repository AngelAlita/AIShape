import { Animated } from 'react-native';
import React from 'react';

export const useScrollHeader = () => {
  const scrollY = new Animated.Value(0);
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  return { headerOpacity, scrollY, handleScroll };
};

// 添加默认导出以满足Expo Router要求
export default function UseScrollHeaderPage() {
  return null;
}