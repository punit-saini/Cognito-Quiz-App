import useAuthStore from '@/store/auth.store';
import { Link } from 'expo-router';
import { Image, Text, View } from 'react-native';



export default function HomeScreen() {
  const { isAuthenticated } = useAuthStore();

  const { user } = useAuthStore();
  return (
    <View className="flex-1 justify-center items-center bg-slate-900 w-full">
      {!isAuthenticated ? (
        <>
          <Text className="text-3xl font-bold text-white mb-6">Welcome to the Home Screen!</Text>
          <Link href="/sign-in" className="text-blue-400 text-lg mb-2">Go to Sign In</Link>
          <Link href="/sign-up" className="text-blue-400 text-lg">Go to Sign Up</Link>
        </>
      ) : (
        <>
        <Image source={{ uri: user?.avatar || 'https://via.placeholder.com/150' }}
          className="w-32 h-32 mb-4 rounded-full"
          style={{ resizeMode: 'cover' }}
        />
        <Text className="text-3xl font-bold text-white">Welcome {user?.name}</Text>
        </>
      )}
    </View>
  );
};


// Styles removed; using nativewind classes
