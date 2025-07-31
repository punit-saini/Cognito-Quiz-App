import { Stack } from 'expo-router';
import { View } from 'react-native';
import 'react-native-reanimated';
import "./global.css";

export default function RootLayout() {
  // const { fetchAuthenticatedUser } = useAuthStore();

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