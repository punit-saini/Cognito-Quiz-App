
import useAuthStore from '@/store/auth.store';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function Friends() {
  const { isAuthenticated } = useAuthStore();
  const { user } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>You must sign in to view this page.</Text>
        <Link href="/sign-in">Go to Sign In</Link>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Text>This is friends page for {user?.name}</Text>
    </View>
  );
}
