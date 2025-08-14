import { useFocusEffect } from '@react-navigation/native';
import React, { useRef } from 'react';
import { Animated, StyleSheet, ViewProps } from 'react-native';

type TabContentAnimatorProps = ViewProps & {
  focused: boolean;
};

/**
 * A wrapper component that animates tab content when the tab is focused
 */
const TabContentAnimator: React.FC<TabContentAnimatorProps> = ({ 
  focused, 
  children, 
  style,
  ...props 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  // Run animation when tab focus changes
  useFocusEffect(
    React.useCallback(() => {
      // When tab is focused, fade in and slide up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      return () => {
        // Reset animations when tab loses focus
        fadeAnim.setValue(0);
        slideAnim.setValue(20);
      };
    }, [])
  );
  
  return (
    <Animated.View
      style={[
        styles.container,
        style,
        { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TabContentAnimator;
