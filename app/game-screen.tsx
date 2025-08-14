import MultiplayerQuizScreen from '@/components/MultiplayerQuizScreen';
import ResultsScreen from '@/components/ResultsScreen';
import { disconnectRealtime, getRoomById, joinRoomAsGuest, subscribeToRoom, updateRoomStatus } from '@/lib/roomAppwrite';
import useAuthStore from '@/store/auth.store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Text, TouchableOpacity, View } from 'react-native';

const GameScreen = () => {
  const { user } = useAuthStore();
  const { roomId } = useLocalSearchParams();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Handle back button press and hardware back button
  const handleBackPress = useCallback(() => {
    // Only show confirmation when quiz is in progress
    if (showQuiz && !quizCompleted) {
      Alert.alert(
        "Exit Quiz?",
        "Are you sure you want to exit? Your progress will be lost.",
        [
          { text: "Cancel", style: "cancel", onPress: () => {} },
          { 
            text: "Exit", 
            style: "destructive", 
            onPress: () => {
              disconnectRealtime();
              router.back();
            } 
          }
        ]
      );
      return true; // Prevent default back action
    }
    return false; // Allow default back action
  }, [showQuiz, quizCompleted]);

  // Set up hardware back button handler
  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackPress
      );
      return () => backHandler.remove();
    }, [handleBackPress])
  );

  useEffect(() => {
    const fetchAndSubscribe = async () => {
      setLoading(true);
      try {
        // Fetch room document
        const roomDoc = await getRoomById(roomId as string);
        if (!roomDoc) {
          setError('Room not found');
          setLoading(false);
          return;
        }
        // If guest and not already joined, join room
        if (roomDoc.guestUserId === '' && user && user.$id !== roomDoc.hostUserId) {
          await joinRoomAsGuest(roomId as string, user.$id, user.name);
        }
        
        setRoom(roomDoc);
        
        // If room is already finished, show results
        if (roomDoc.status === 'finished') {
          setQuizCompleted(true);
        } else if (roomDoc.status === 'active') {
          // If room status is 'active', automatically show the quiz for both players
          setShowQuiz(true);
        }
        
        // Subscribe to realtime updates
        const unsubscribe = subscribeToRoom(roomId as string, (updatedRoom: any) => {
          setRoom(updatedRoom);
          
          // Check if quiz has finished
          if (updatedRoom.status === 'finished') {
            setQuizCompleted(true);
          } else if (updatedRoom.status === 'active') {
            // Auto-start the quiz when the status changes to 'active'
            setShowQuiz(true);
          }
        });
        
        setLoading(false);
        return () => {
          unsubscribe();
          disconnectRealtime(); // Ensure all connections are closed when component unmounts
        };
      } catch (e) {
        setError('Error joining room');
        setLoading(false);
      }
    };
    
    fetchAndSubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user?.$id]);

  // Handle quiz completion
  const handleQuizComplete = async (answers: Record<string, string>) => {
    console.log('User answers submitted:', answers);
    
    // Fetch the latest room state before transitioning to results
    try {
      const latestRoom = await getRoomById(roomId as string);
      setRoom(latestRoom); // Update with latest room data
      
      // No need for an alert here - the ResultsScreen will show appropriate waiting UI
      // The waiting state is handled in the ResultsScreen component
    } catch (e) {
      console.log('Error fetching latest room state:', e);
    }
    
    // Set quiz completed for this user - this will show the results or waiting screen
    setQuizCompleted(true);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-900">
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white mt-4">Loading room...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-900">
        <Text className="text-red-500 text-lg">{error}</Text>
      </View>
    );
  }
  
  if (!room) {
    return null;
  }

  // Waiting for guest to join
  if (!room.guestUserId) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-900">
        <View style={{
          borderRadius: 32,
          backgroundColor: 'rgba(30,40,60,0.55)',
          padding: 6,
          marginBottom: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.22,
          shadowRadius: 32,
          elevation: 16,
        }}>
          <BlurView intensity={50} tint="dark" style={{
            borderRadius: 28,
            paddingVertical: 36,
            paddingHorizontal: 28,
            alignItems: 'center',
            width: 320,
            backgroundColor: 'rgba(55, 182, 233, 0.10)',
          }}>
            <MaterialCommunityIcons name="account-clock" size={60} color="#37B6E9" style={{ marginBottom: 18 }} />
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, fontFamily: 'Poppins-Bold' }}>
              Waiting for friend to join...
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, textAlign: 'center', marginBottom: 8, fontFamily: 'Inter' }}>
              Share this Room ID:
            </Text>
            <Text style={{ color: '#37B6E9', fontSize: 28, fontFamily: 'Poppins-Bold', letterSpacing: 2, textAlign: 'center', marginBottom: 8 }}>
              {room.$id}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', fontFamily: 'Inter' }}>
              Host User ID: {room.hostUserId}
            </Text>
            
            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Cancel Game",
                  "Are you sure you want to exit this game?",
                  [
                    { text: "No", style: "cancel" },
                    { 
                      text: "Yes", 
                      style: "destructive", 
                      onPress: () => {
                        disconnectRealtime();
                        router.back();
                      }
                    }
                  ]
                );
              }}
              style={{
                marginTop: 24,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }}
            >
              <Text style={{ 
                color: '#FFF', 
                fontFamily: 'Poppins-SemiBold',
                fontSize: 16,
              }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </View>
    );
  }

  // Show results if quiz is completed
  if (quizCompleted) {
    // Pass the most up-to-date room information to ResultsScreen
    return <ResultsScreen room={room} userId={user?.$id || ''} />;
  }

  // Show quiz if started
  if (showQuiz) {
    return <MultiplayerQuizScreen room={room} userId={user?.$id || ''} onComplete={handleQuizComplete} />;
  }

  // Both users present, show joined info with Start Quiz button
  return (
    <View className="flex-1 justify-center items-center bg-slate-900">
      <Text className="text-green-400 text-xl mb-4">Both users joined!</Text>
      <Text className="text-white">Host User ID: {room.hostUserId}</Text>
      <Text className="text-white mb-8">Guest User ID: {room.guestUserId}</Text>
      
      <TouchableOpacity
        className="mt-4 bg-green-600 py-3 px-6 rounded-lg"
        onPress={async () => {
          try {
            // Update room status to 'active' to trigger auto-start for both players
            // This value must be one of the allowed enum values: 'waiting', 'active', 'finished'
            await updateRoomStatus(roomId as string, 'active');
            // Local state update (will also happen via subscription)
            setShowQuiz(true);
          } catch (e) {
            console.error('Error starting quiz:', e);
            // Fallback to local-only start if the update fails
            setShowQuiz(true);
          }
        }}
      >
        <Text className="text-white text-lg font-bold">Start Quiz</Text>
      </TouchableOpacity>
    </View>
  );
};

export default GameScreen;
