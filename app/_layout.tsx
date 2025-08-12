import { disconnectRealtime } from '@/lib/roomAppwrite';
import useAuthStore from '@/store/auth.store';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
// import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AppState, Image, StatusBar, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "./global.css";


export default function RootLayout() {
  const { fetchAuthenticatedUser, loadCachedUser } = useAuthStore();
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
  
  // Fetch fresh user data in background after fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      if (!loadedFromCache) {
        fetchAuthenticatedUser().catch(error => {
          console.log('Error fetching user data:', error);
        });
      } else {
        const refreshTimer = setTimeout(() => {
          fetchAuthenticatedUser().catch(error => {
            console.log('Error refreshing user data:', error);
          });
        }, 10000);
        return () => clearTimeout(refreshTimer);
      }
    }
  }, [fontsLoaded, fetchAuthenticatedUser, loadedFromCache]);
  
  // Keep showing nothing until fonts are loaded
  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#10131A"
        translucent={true}
      />
      <LinearGradient
        colors={["#181C24", "#222834", "#10131A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' }
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </LinearGradient>
    </SafeAreaProvider>
  );
};

