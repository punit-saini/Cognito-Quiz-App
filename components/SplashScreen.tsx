import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';

// Keep the splash screen visible while we prepare resources
// This ensures it doesn't auto-hide too quickly
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

type SplashScreenProps = {
  onFinish: () => void;
};

const AnimatedSplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isAppReady, setAppReady] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const pulseAnim = React.useRef(new Animated.Value(0.8)).current;

  // Pulsing animation for the logo
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Prepare any resources or fetch data
  useEffect(() => {
    async function prepare() {
      try {
        // Artificially delay for 3 seconds to make splash screen stay longer
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppReady(true);
      }
    }

    prepare();
  }, []);

  // When ready, hide the splash screen after fade-out animation
  const onLayoutRootView = useCallback(async () => {
    if (isAppReady) {
      try {
        // Hide the native splash screen first
        await SplashScreen.hideAsync();
        
        // Create a more elaborate exit animation
        Animated.parallel([
          // Fade out
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          // Scale up slightly
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          })
        ]).start(() => {
          // Signal to parent component that animation is done
          onFinish();
        });
      } catch (e) {
        // Handle any errors that might occur when hiding the splash screen
        console.warn("Error hiding splash screen:", e);
        onFinish(); // Still notify parent that we're done
      }
    }
  }, [isAppReady, fadeAnim, scaleAnim, onFinish]);

  if (!isAppReady) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]} 
      onLayout={onLayoutRootView}
    >
      <View style={styles.innerContainer}>
        <Animated.View 
          style={[
            styles.imageContainer,
            { 
              transform: [
                { scale: pulseAnim },
              ]
            }
          ]}
        >
          <Image
            source={require('../assets/images/splash-icon.png')}
            style={styles.image}
            resizeMode="contain"
          />
          <View style={styles.glow} />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#10131A',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  innerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    width: 200,
    height: 200,
    zIndex: 2,
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(55, 182, 233, 0.1)',
    top: -10,
    left: -10,
    zIndex: 1,
    shadowColor: '#37B6E9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
});

export default AnimatedSplashScreen;
