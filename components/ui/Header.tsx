import useAuthStore from '@/store/auth.store';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface HeaderProps {
  heading: string;
  showUser?: boolean;
}

const Header: React.FC<HeaderProps> = ({ heading, showUser = false }) => {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 2, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image
          source={require('../../assets/images/cognito-logo.png')}
          style={{ width: 64, height: 64, marginRight: 0, resizeMode: 'contain' }}
        />
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', fontFamily: 'Poppins-Bold' }}>{heading}</Text>
      </View>
      {showUser && (
        isAuthenticated ? (
          <TouchableOpacity onPress={() => router.push('/profile' as any)}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(55,182,233,0.3)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => router.push('/sign-in' as any)}>
              <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 8 }}>
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Sign In</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/sign-up' as any)}>
              <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#37B6E9' }}>
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Sign Up</Text>
              </View>
            </TouchableOpacity>
          </View>
        )
      )}
    </View>
  );
};

export default Header;
