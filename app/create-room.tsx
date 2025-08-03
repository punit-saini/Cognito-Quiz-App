import { QUIZ_CATEGORIES } from '@/constants/QuizCategories';
import { createRoom } from '@/lib/roomAppwrite';
import useAuthStore from '@/store/auth.store';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';

const ALL_CATEGORIES = 'All Categories';

const CreateRoom = () => {
  const { user } = useAuthStore();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [roomId, setRoomId] = useState('');

  const generateSixDigitRoomId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleCategorySelect = (category: string) => {
    if (category === ALL_CATEGORIES) {
      // If "All Categories" is selected, clear other selections
      setSelectedCategories([ALL_CATEGORIES]);
      return;
    }
    
    // If selecting a specific category when "All Categories" is already selected, remove "All Categories"
    if (selectedCategories.includes(ALL_CATEGORIES)) {
      setSelectedCategories([category]);
      return;
    }

    // Toggle the selected category
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(cat => cat !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleCreateRoom = async () => {
    if (selectedCategories.length === 0) {
      Alert.alert('Select at least one category');
      return;
    }
    if (!user || !user.$id) {
      Alert.alert('User not authenticated');
      return;
    }
    setLoading(true);
    try {
      const generatedRoomId = generateSixDigitRoomId();
      const response = await createRoom(user.$id, user.name, selectedCategories, generatedRoomId);
      setRoomId(generatedRoomId); // Use the generated roomId
      router.replace({ pathname: '/game-screen', params: { roomId: generatedRoomId } });
    } catch (e) {
      Alert.alert('Error', 'Failed to create room');
      console.log('Create room error:', e);
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: '#f0f0f0' }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Create Multiplayer Room</Text>
      <Text style={{ fontSize: 16, marginBottom: 8 }}>Select Categories (choose one or more):</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
        <TouchableOpacity
          key={ALL_CATEGORIES}
          style={{
            backgroundColor: selectedCategories.includes(ALL_CATEGORIES) ? '#2563eb' : '#e5e7eb',
            padding: 10,
            borderRadius: 20,
            margin: 4,
          }}
          onPress={() => handleCategorySelect(ALL_CATEGORIES)}
        >
          <Text style={{ color: selectedCategories.includes(ALL_CATEGORIES) ? '#fff' : '#222' }}>{ALL_CATEGORIES}</Text>
        </TouchableOpacity>
        {QUIZ_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={{
              backgroundColor: selectedCategories.includes(cat) ? '#2563eb' : '#e5e7eb',
              padding: 10,
              borderRadius: 20,
              margin: 4,
            }}
            onPress={() => handleCategorySelect(cat)}
          >
            <Text style={{ color: selectedCategories.includes(cat) ? '#fff' : '#222' }}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={{ backgroundColor: '#22c55e', padding: 14, borderRadius: 10, marginBottom: 16 }}
        onPress={handleCreateRoom}
        disabled={loading}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Create Room</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator size="large" color="#2563eb" />}
      {roomId ? (
        <View style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 16 }}>Share this Room ID with your friend:</Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2563eb', marginTop: 8 }}>{roomId}</Text>
        </View>
      ) : null}
    </View>
  );
};

export default CreateRoom;
