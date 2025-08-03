
import CustomButton from '@/components/customButton';
import useAuthStore from '@/store/auth.store';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

const Profile = () => {
  const { isAuthenticated, user, logout } = useAuthStore() as any;
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f0f0f0' }} contentContainerStyle={{ alignItems: 'center', padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>
        {isAuthenticated ? `Profile for ${user?.name}` : 'Profile'}
      </Text>
      
      {isAuthenticated ? (
        <View style={{ width: '100%' }}>
          <CustomButton title="Logout" onPress={logout} />
          
          <View style={{ marginTop: 24, padding: 16, backgroundColor: '#fff', borderRadius: 8, width: '100%' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>User Information</Text>
            <Text>Name: {user?.name}</Text>
            <Text>Email: {user?.email}</Text>
          </View>
        </View>
      ) : (
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ textAlign: 'center', marginBottom: 16 }}>
            Please login to view your profile information
          </Text>
          <CustomButton title="Login" onPress={() => router.push("/sign-in" as any)} />
        </View>
      )}
    </ScrollView>
  );
};

export default Profile;
