import { disconnectRealtime } from '@/lib/roomAppwrite';
import useAuthStore from '@/store/auth.store';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AppState, Image, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import "./global.css";


export default function RootLayout() {
  const { fetchAuthenticatedUser, loadCachedUser } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);
  const [loadedFromCache, setLoadedFromCache] = useState(false);

  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Inter-Regular': require('../assets/fonts/Inter-Regular.otf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.otf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.otf'),
  });

  // Handle app state changes - disconnect realtime when app goes to background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // When app goes to background or is inactive
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('App going to background - disconnecting realtime');
        disconnectRealtime();
      }
    });

    return () => {
      subscription.remove();
      // Also ensure disconnect on app unmount
      disconnectRealtime();
    };
  }, []);

  // Try to load user data from cache first
  useEffect(() => {
    if (fontsLoaded) {
      const loadUserData = async () => {
        try {
          // First attempt to load from cache (fast)
          const loaded = await loadCachedUser();
          setLoadedFromCache(loaded);
          console.log(loaded ? 'User loaded from cache' : 'No valid cached user data');
        } catch (error) {
          console.log('Error loading cached user:', error);
        }
      };
      
      loadUserData();
    }
  }, [fontsLoaded, loadCachedUser]);
  
  // Handle splash screen and efficient data loading
  useEffect(() => {
    if (fontsLoaded) {
      // Hide the native splash screen
      SplashScreen.hideAsync().catch((error) => {
        console.log('Error hiding splash screen:', error);
      });
      
      // Show custom splash screen for 2 seconds
      const splashTimer = setTimeout(() => {
        setShowSplash(false);
      }, 2000);
      
      // Fetch fresh user data in background after splash screen disappears
      // Only if we couldn't load from cache or to refresh data
      const dataTimer = setTimeout(() => {
        // Skip immediate fetch if we loaded from cache (can refresh later)
        if (!loadedFromCache) {
          console.log('Fetching fresh user data from server');
          fetchAuthenticatedUser().catch(error => {
            console.log('Error fetching user data:', error);
          });
        } else {
          // For cached users, we can still refresh data but with lower priority
          console.log('User loaded from cache, will refresh later');
          const refreshTimer = setTimeout(() => {
            fetchAuthenticatedUser().catch(error => {
              console.log('Error refreshing user data:', error);
            });
          }, 10000); // Refresh after 10 seconds, won't block UI
          return () => clearTimeout(refreshTimer);
        }
      }, 2500); // Wait until after splash screen is gone
      
      return () => {
        clearTimeout(splashTimer);
        clearTimeout(dataTimer);
      };
    }
  }, [fontsLoaded, fetchAuthenticatedUser, loadedFromCache]);
  
  // Keep showing native splash screen until fonts are loaded
  if (!fontsLoaded) {
    return null;
  }

  // Show our simple splash screen for 3 seconds
  if (showSplash) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#181C24', '#10131A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Image
          source={require('../assets/images/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#10131A' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: '#10131A' }
        }}
      />
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
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  }
});