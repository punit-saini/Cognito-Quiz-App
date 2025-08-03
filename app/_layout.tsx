import { disconnectRealtime } from '@/lib/roomAppwrite';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AppState, View } from 'react-native';
import 'react-native-reanimated';
import "./global.css";

export default function RootLayout() {
  // const { fetchAuthenticatedUser } = useAuthStore();

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

  // const [fontsLoaded, error] = useFonts({
  //   SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  // });

  // useEffect(() => {
  //   if (error) throw error;
  // }, [error]);

  // useEffect(() => {
  //   if (fontsLoaded) {
  //     // Load user data in background, but don't block navigation
  //     fetchAuthenticatedUser();
  //     SplashScreen.hideAsync();
  //   }
  // }, [fontsLoaded, fetchAuthenticatedUser]);

  // if (!fontsLoaded) {
  //   // Keep showing the splash screen until fonts are loaded
  //   return null;
  // }

  return (
    <View className='bg-gray-900' style={{ flex: 1, backgroundColor: '#000' }}>
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none'
      }}
      />
      </View>
  );
};