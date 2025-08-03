import { disconnectRealtime, markUserFinished, submitAnswers, subscribeToRoom } from '@/lib/roomAppwrite';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';

type MultiplayerQuizScreenProps = {
  room: any;
  userId: string;
  onComplete: (answers: Record<string, string>) => void;
};

const MultiplayerQuizScreen: React.FC<MultiplayerQuizScreenProps> = ({ room, userId, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timer, setTimer] = useState(room.questionTimer || 30);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomData, setRoomData] = useState(room);

  useEffect(() => {
    // Parse questions from room data (they are stored as stringified objects)
    try {
      const parsedQuestions = room.questions.map((q: string) => JSON.parse(q));
      setQuestions(parsedQuestions);
      if (parsedQuestions.length > 0) {
        setCurrentQuestion(parsedQuestions[currentIdx]);
      }
      setLoading(false);
    } catch (e) {
      console.log('Error parsing questions:', e);
      setLoading(false);
    }

    // Subscribe to room updates
    const unsubscribe = subscribeToRoom(room.$id, (updatedRoom) => {
      // Only update room data without affecting question index or timer
      // to prevent disrupting the user's quiz flow when the other user finishes
      setRoomData(updatedRoom);
      
      // We're not using the global currentQuestionIndex anymore
      // Each user maintains their own local index
    });

    return () => {
      unsubscribe();
      disconnectRealtime(); // Ensure all connections are closed when component unmounts
    };
  }, [room.$id]); // Only depend on room ID to prevent unnecessary re-renders

  // Timer effect
  useEffect(() => {
    // To ensure we don't run the timer if the quiz is done
    if (questions.length === 0) return;
    
    if (timer <= 0) {
      // Time's up for this question, move to next if possible
      if (currentIdx < questions.length - 1) {
        const nextIdx = currentIdx + 1;
        setCurrentIdx(nextIdx);
        if (questions[nextIdx]) { // Guard against invalid index
          setCurrentQuestion(questions[nextIdx]);
        }
        setTimer(roomData.questionTimer || 30);
      } else {
        // Quiz completed, submit answers
        onComplete(responses);
      }
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev: number) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, currentIdx, questions]);

  const handleOptionSelect = (option: string) => {
    // Save the response for this question
    const questionId = currentQuestion.$id || `q${currentIdx}`;
    const updatedResponses = {
      ...responses,
      [questionId]: option
    };
    setResponses(updatedResponses);

    // Move to next question if there is one
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setCurrentQuestion(questions[nextIdx]);
      setTimer(roomData.questionTimer || 30);
    } else {
      // Quiz completed - submit answers to database
      submitAnswersToDatabase(updatedResponses);
    }
  };
  
  const submitAnswersToDatabase = async (finalAnswers: Record<string, string>) => {
    try {
      // Submit answers to Appwrite
      await submitAnswers(room.$id, userId, finalAnswers);
      
      // Mark user as finished
      await markUserFinished(room.$id, userId);
      
      // Disconnect realtime after all operations are complete
      // This helps ensure we don't have lingering connections
      disconnectRealtime();
      
      // Call onComplete to notify parent component
      onComplete(finalAnswers);
    } catch (error) {
      console.error('Error submitting answers:', error);
      Alert.alert('Error', 'Failed to submit answers');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-900">
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white mt-4">Loading questions...</Text>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-900">
        <Text className="text-red-500">No questions available</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-900 px-4 pt-8">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-xl text-white">Question {currentIdx + 1}/{questions.length}</Text>
        <View className={`px-4 py-2 rounded ${timer <= 10 ? 'bg-red-600' : 'bg-blue-600'}`}>
          <Text className="text-white font-bold">{timer}s</Text>
        </View>
      </View>
      
      <View className="mb-6 p-4 rounded-lg bg-slate-800">
        <Text className="text-white text-lg font-semibold mb-4">{currentQuestion.question}</Text>
        {currentQuestion.options && currentQuestion.options.map((opt: string, i: number) => (
          <TouchableOpacity
            key={i}
            className={`mb-2 py-3 px-4 rounded bg-blue-700`}
            onPress={() => handleOptionSelect(opt)}
          >
            <Text className="text-white text-base">{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text className="text-yellow-400 text-center mt-4">
        Your opponent is also answering these questions!
      </Text>
    </View>
  );
};

export default MultiplayerQuizScreen;
