import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, View } from 'react-native';

interface CustomSplashScreenProps {
  onFinish: () => void;
}

const { width } = Dimensions.get('window');

const CustomSplashScreen = ({ onFinish }: CustomSplashScreenProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    
    // Set a timer to finish after 3 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#181C24', '#10131A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Content container with glass effect */}
      <View style={styles.contentContainer}>
        <LinearGradient
          colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glassContainer}
        >
          {/* Logo */}
          <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
            <Image
              source={require('../assets/images/splash-icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
          
          {/* App name */}
          <Animated.Text style={[styles.appName, { opacity: fadeAnim }]}>
            Cognito
          </Animated.Text>
          
          {/* Tagline */}
          <Animated.Text style={[styles.tagline, { opacity: fadeAnim }]}>
            Train your brain with multiplayer quizzes
          </Animated.Text>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#10131A',
  },
  contentContainer: {
    width: width * 0.85,
    aspectRatio: 1,
    maxWidth: 380,
    maxHeight: 380,
    borderRadius: 24,
    overflow: 'hidden',
  },
  glassContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logoContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 36,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    maxWidth: width * 0.7,
    textAlign: 'center',
  },
});

export default CustomSplashScreen;
