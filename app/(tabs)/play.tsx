import { getRoomById, joinRoomAsGuest } from '@/lib/roomAppwrite';
import useAuthStore from '@/store/auth.store';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';


export default function Play() {
  const [showJoin, setShowJoin] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const { user } = useAuthStore();

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
      router.push({ pathname: '/game-screen', params: { roomId: roomCode.trim() } });
    } catch (e) {
      Alert.alert('Error', 'Failed to join room');
      console.log('Join room error:', e);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-slate-900">
      <Text className="text-3xl font-bold text-white mb-8">Choose Play Mode</Text>
      <TouchableOpacity
        className="mb-4 w-64 py-3 rounded-lg bg-blue-600"
        onPress={() => {router.push('/solo-play')}}
      >
        <Text className="text-white text-lg text-center font-semibold">Solo Play</Text>

      </TouchableOpacity>
      <View className="w-64">
        <Text className="text-white text-lg text-center font-semibold mb-2">Play with Friends</Text>
        <TouchableOpacity
          className="mb-2 py-3 rounded-lg bg-green-600"
          onPress={() => router.push('/create-room')}
        >
          <Text className="text-white text-lg text-center font-semibold">Create Room</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="mb-2 py-3 rounded-lg bg-yellow-600"
          onPress={() => setShowJoin((prev) => !prev)}
        >
          <Text className="text-white text-lg text-center font-semibold">Join Room</Text>
        </TouchableOpacity>
        {showJoin && (
          <View className="mt-2">
            <TextInput
              className="bg-slate-800 text-white rounded-lg px-4 py-2 text-lg mb-2"
              placeholder="Enter Room Code"
              placeholderTextColor="#888"
              value={roomCode}
              onChangeText={setRoomCode}
            />
            <TouchableOpacity
              className="w-full py-3 rounded-lg bg-green-700"
              onPress={handleJoinRoom}
            >
              <Text className="text-white text-lg text-center font-semibold">Join</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// Styles removed; using nativewind classes
