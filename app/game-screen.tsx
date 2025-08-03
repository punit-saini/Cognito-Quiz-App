import MultiplayerQuizScreen from '@/components/MultiplayerQuizScreen';
import ResultsScreen from '@/components/ResultsScreen';
import { disconnectRealtime, getRoomById, joinRoomAsGuest, subscribeToRoom } from '@/lib/roomAppwrite';
import useAuthStore from '@/store/auth.store';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';

const GameScreen = () => {
  const { user } = useAuthStore();
  const { roomId } = useLocalSearchParams();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

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
        }
        
        // Subscribe to realtime updates
        const unsubscribe = subscribeToRoom(roomId as string, (updatedRoom: any) => {
          setRoom(updatedRoom);
          
          // Check if quiz has finished
          if (updatedRoom.status === 'finished') {
            setQuizCompleted(true);
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
      
      // Only show the waiting alert if the other player hasn't finished yet
      const isHost = user?.$id === latestRoom.hostUserId;
      const otherPlayerFinished = isHost ? latestRoom.guestFinished : latestRoom.hostFinished;
      const gameFinished = latestRoom.status === 'finished';
      
      if (!otherPlayerFinished && !gameFinished) {
        Alert.alert('Quiz completed', 'Your answers have been submitted. Waiting for other player to finish...');
      }
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
        <Text className="text-white text-xl">Waiting for friend to join...</Text>
        <Text className="text-white mt-2">Room ID: {room.$id}</Text>
        <Text className="text-white mt-2">Host User ID: {room.hostUserId}</Text>
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
        onPress={() => setShowQuiz(true)}
      >
        <Text className="text-white text-lg font-bold">Start Quiz</Text>
      </TouchableOpacity>
    </View>
  );
};

export default GameScreen;
