
import { QUIZ_CATEGORIES } from '@/constants/QuizCategories';
import { createRoom } from '@/lib/roomAppwrite';
import useAuthStore from '@/store/auth.store';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

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
    // Special handling for "All Categories" option
    if (category === ALL_CATEGORIES) {
      setSelectedCategories([ALL_CATEGORIES]);
      return;
    }
    
    // If "All Categories" is already selected and user selects another category
    if (selectedCategories.includes(ALL_CATEGORIES)) {
      setSelectedCategories([category]);
      return;
    }
    
    // If the category is already selected, remove it
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(cat => cat !== category));
      return;
    }
    
    // Add category if we haven't reached the limit of 5
    if (selectedCategories.length < 5) {
      setSelectedCategories([...selectedCategories, category]);
    } else {
      // Alert user when trying to select more than 5 categories
      Alert.alert('Maximum Categories', 'You can select a maximum of 5 categories.');
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
      await createRoom(user.$id, user.name, selectedCategories, generatedRoomId);
      setRoomId(generatedRoomId);
      router.replace({ pathname: '/game-screen' as any, params: { roomId: generatedRoomId } });
    } catch (e) {
      Alert.alert('Error', 'Failed to create room');
      console.log('Create room error:', e);
    }
    setLoading(false);
  };

  return (
    <LinearGradient
      colors={["#181C24", "#222834", "#10131A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', fontFamily: 'Poppins-Bold', marginBottom: 4 }}>
            Create Multiplayer Room
          </Text>
          <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter', textAlign: 'center' }}>
            Select Categories (max 5)
          </Text>
        </View>

        <View style={{
          backgroundColor: 'rgba(55, 182, 233, 0.10)',
          borderRadius: 20,
          borderTopLeftRadius: 32,
          borderBottomRightRadius: 32,
          padding: 16,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: 'rgba(55, 182, 233, 0.15)',
          shadowColor: '#37B6E9',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
            <TouchableOpacity
              key={ALL_CATEGORIES}
              style={{
                backgroundColor: selectedCategories.includes(ALL_CATEGORIES)
                  ? 'linear-gradient(90deg, #37B6E9 60%, #6a3de8 100%)'
                  : 'rgba(55, 182, 233, 0.08)',
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 16,
                margin: 4,
                borderWidth: selectedCategories.includes(ALL_CATEGORIES) ? 2 : 1,
                borderColor: selectedCategories.includes(ALL_CATEGORIES) ? '#37B6E9' : 'rgba(55, 182, 233, 0.15)',
                shadowColor: selectedCategories.includes(ALL_CATEGORIES) ? '#37B6E9' : 'transparent',
                shadowOpacity: selectedCategories.includes(ALL_CATEGORIES) ? 0.15 : 0,
                shadowRadius: 6,
                elevation: selectedCategories.includes(ALL_CATEGORIES) ? 2 : 0,
              }}
              onPress={() => handleCategorySelect(ALL_CATEGORIES)}
            >
              <Text style={{ color: selectedCategories.includes(ALL_CATEGORIES) ? '#fff' : '#37B6E9', fontWeight: 'bold', fontFamily: 'Inter', fontSize: 14 }}>{ALL_CATEGORIES}</Text>
            </TouchableOpacity>
            {QUIZ_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={{
                  backgroundColor: selectedCategories.includes(cat)
                    ? 'linear-gradient(90deg, #37B6E9 60%, #6a3de8 100%)'
                    : 'rgba(55, 182, 233, 0.08)',
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 16,
                  margin: 4,
                  borderWidth: selectedCategories.includes(cat) ? 2 : 1,
                  borderColor: selectedCategories.includes(cat) ? '#37B6E9' : 'rgba(55, 182, 233, 0.15)',
                  shadowColor: selectedCategories.includes(cat) ? '#37B6E9' : 'transparent',
                  shadowOpacity: selectedCategories.includes(cat) ? 0.15 : 0,
                  shadowRadius: 6,
                  elevation: selectedCategories.includes(cat) ? 2 : 0,
                }}
                onPress={() => handleCategorySelect(cat)}
              >
                <Text style={{ color: selectedCategories.includes(cat) ? '#fff' : '#37B6E9', fontWeight: 'bold', fontFamily: 'Inter', fontSize: 14 }}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={{
            width: '100%',
            overflow: 'hidden',
            borderRadius: 25,
            marginTop: 8,
            marginBottom: 8,
            elevation: 4,
          }}
          onPress={handleCreateRoom}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#37B6E9', '#6a3de8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              padding: 16,
              alignItems: 'center',
              borderRadius: 25,
              shadowColor: '#37B6E9',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6
            }}
          >
            <Text style={{ color: '#fff', fontSize: 17, fontFamily: 'Poppins-SemiBold' }}>Create Room</Text>
          </LinearGradient>
        </TouchableOpacity>
        {loading && <ActivityIndicator size="large" color="#37B6E9" style={{ marginTop: 12 }} />}

        {roomId ? (
          <View style={{
            marginTop: 32,
            alignItems: 'center',
            backgroundColor: 'rgba(55, 182, 233, 0.10)',
            borderRadius: 20,
            borderTopRightRadius: 32,
            borderBottomLeftRadius: 32,
            padding: 20,
            borderWidth: 1,
            borderColor: 'rgba(55, 182, 233, 0.15)',
            shadowColor: '#37B6E9',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <Text style={{ fontSize: 16, color: '#fff', fontFamily: 'Inter', marginBottom: 8 }}>Share this Room ID with your friend:</Text>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#37B6E9', fontFamily: 'Poppins-Bold', letterSpacing: 2 }}>{roomId}</Text>
          </View>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
};

export default CreateRoom;
