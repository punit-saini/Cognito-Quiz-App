import { getRoomById, joinRoomAsGuest } from '@/lib/roomAppwrite';
import useAuthStore from '@/store/auth.store';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function Play() {
  const [roomCode, setRoomCode] = useState('');
  const { user } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) return;
    if (!user || !user.$id) {
      Alert.alert('User not authenticated');
      return;
    }
    
    try {
      // Check if room exists
      const room = await getRoomById(roomCode.trim());
      if (!room) {
        Alert.alert('Room not found');
        return;
      }
      // If guest not already joined, join as guest
      if (!room.guestUserId) {
        await joinRoomAsGuest(roomCode.trim(), user.$id, user.name);
      }
      // Navigate to game screen with roomId
      router.push({ pathname: '/game-screen' as any, params: { roomId: roomCode.trim() } });
    } catch (e) {
      Alert.alert('Error', 'Failed to join room');
      console.log('Join room error:', e);
    }
  };

  return (
    
    <LinearGradient
      colors={["#181C24", "#222834", "#10131A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 20}
      >
        <SafeAreaView className="flex-1">
          {/* Header with logo and title */}
          <View className="flex-row items-center justify-center px-6 pt-4 mb-6">
            <View className="flex-row items-center">
              <Image
                source={require('../../assets/images/cognito-logo.png')}
                className="w-10 h-10 mr-2"
                style={{ resizeMode: 'contain' }}
              />
              <Text className="text-2xl font-inter-bold text-white tracking-wide">Play Mode</Text>
            </View>
          </View>
          
          {/* Main content area */}
          <View className="flex-1 px-6">
          {/* Title */}
          <View className="items-center mb-10">
            <Text className="text-3xl font-poppins-bold text-white">Choose Your Challenge</Text>
            <View className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mt-2 rounded-full" />
          </View>
          
          {/* Solo Play Option */}
          <View className="mb-6">
            <View 
              style={{
                borderTopLeftRadius: 24,
                borderTopRightRadius: 8,
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 24,
                overflow: 'hidden',
                marginHorizontal: 4,
                shadowColor: '#37B6E9',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <LinearGradient
                colors={['rgba(55, 182, 233, 0.2)', 'rgba(55, 182, 233, 0.05)']}
                style={{ padding: 16, borderRadius: 16 }}
              >
                <Text className="text-xl font-poppins-semibold text-white mb-3">Solo Adventure</Text>
                <Text className="text-white/70 font-inter mb-4">Challenge yourself with brain teasers and expand your knowledge.</Text>
                <TouchableOpacity
                  onPress={() => {router.push('/solo-play' as any)}}
                  className="items-center"
                >
                  <LinearGradient
                    colors={['#37B6E9', '#6a3de8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="rounded-full w-[140px] py-2 px-4"
                  >
                    <Text className="text-white text-center font-poppins-semibold">Play Solo</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
          
          {/* Multiplayer Options */}
          <ScrollView 
            contentContainerStyle={{ paddingBottom: 160 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
          <View className="mb-4 mt-12">
            <Text className="text-xl font-poppins-semibold text-white mb-4">Play with Friends</Text>
            
            {user && user.$id ? (
              <>
                {/* Join Room Label - Now first */}
                <View className="mb-4">
                  <LinearGradient
                    colors={['rgba(55, 182, 233, 0.2)', 'rgba(55, 182, 233, 0.05)']}
                    style={{ 
                      borderTopLeftRadius: 24,
                      borderTopRightRadius: 8,
                      borderBottomLeftRadius: 8,
                      borderBottomRightRadius: 24,
                      padding: 16,
                      marginHorizontal: 4,
                    }}
                  >
                    <View>
                      <Text className="text-white font-poppins-semibold text-lg mb-2">Join Room</Text>
                      <Text className="text-white/70 font-inter text-sm">Enter a room code below to join an existing game</Text>
                      
                      {/* Room input field now directly in this section */}
                      <View className="flex-row space-x-2 items-center mt-4">
                        <TextInput
                          className="flex-1 bg-surface/40 text-white rounded-lg px-4 py-3 text-base"
                          placeholder="Enter Room Code"
                          placeholderTextColor="rgba(255, 255, 255, 0.4)"
                          value={roomCode}
                          onChangeText={setRoomCode}
                          keyboardType="number-pad"
                          returnKeyType="done"
                          style={{
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                          }}
                        />
                        <TouchableOpacity
                          onPress={handleJoinRoom}
                        >
                          <LinearGradient
                            colors={['#37B6E9', '#6a3de8']}
                            className="rounded-full h-12 w-12 items-center justify-center"
                          >
                            <Text className="text-white font-bold text-xl">→</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
                
                {/* Create Room Button - Now second */}
                <View className="mb-4">
                  <LinearGradient
                    colors={['rgba(106, 61, 232, 0.2)', 'rgba(106, 61, 232, 0.05)']}
                    style={{ 
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 24,
                      borderBottomLeftRadius: 24,
                      borderBottomRightRadius: 8,
                      padding: 16,
                      marginHorizontal: 4,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => router.push('/create-room' as any)}
                      className="flex-row justify-between items-center"
                    >
                      <View>
                        <Text className="text-white font-poppins-semibold text-lg">Create Room</Text>
                        <Text className="text-white/70 font-inter text-sm">Start a new game room</Text>
                      </View>
                      <LinearGradient
                        colors={['#6a3de8', '#37B6E9']}
                        className="rounded-full h-10 w-10 items-center justify-center"
                      >
                        <Text className="text-white font-bold text-xl">+</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              </>
            ) : (
              <View style={{
                backgroundColor: 'rgba(106, 61, 232, 0.1)',
                borderRadius: 16,
                padding: 20,
                marginHorizontal: 4,
                borderWidth: 1,
                borderColor: 'rgba(106, 61, 232, 0.2)',
              }}>
                <Text className="text-white font-poppins-semibold text-lg text-center mb-3">
                  Sign in to play with friends
                </Text>
                <Text className="text-white/70 font-inter text-center mb-6">
                  Create or join game rooms after signing in
                </Text>
                <View className="flex-row justify-center space-x-4">
                  <TouchableOpacity onPress={() => router.push('/sign-in' as any)}>
                    <LinearGradient
                      colors={['rgba(55, 182, 233, 0.8)', 'rgba(55, 182, 233, 0.4)']}
                      className="rounded-lg px-5 py-3"
                    >
                      <Text className="text-white font-poppins-semibold">Sign In</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push('/sign-up' as any)}>
                    <LinearGradient
                      colors={['rgba(106, 61, 232, 0.8)', 'rgba(106, 61, 232, 0.4)']}
                      className="rounded-lg px-5 py-3"
                    >
                      <Text className="text-white font-poppins-semibold">Sign Up</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
          </ScrollView>
          
          {/* Extra space to avoid bottom navigation overlap */}
          <View className="h-20" />
        </View>
      </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
    
  );
}

// Styles removed; using nativewind classes