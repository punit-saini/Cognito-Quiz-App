
import CustomButton from '@/components/customButton';
import useAuthStore from '@/store/auth.store';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function Profile() {
  const { isAuthenticated, user, logout } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>You must sign in to view this page.</Text>
        <Link href="/sign-in">Go to Sign In</Link>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
      <Text>This is profile page for {user?.name}</Text>
      <CustomButton title="Logout" onPress={logout} /> 
    </View>
  );
}
