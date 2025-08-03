import { disconnectRealtime, subscribeToRoom } from '@/lib/roomAppwrite';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type ResultsScreenProps = {
  room: {
    $id: string;
    hostUserId: string;
    guestUserId: string;
    questions: string[];
    answers: string[];
    hostFinished: boolean;
    guestFinished: boolean;
    [key: string]: any;
  };
  userId: string;
};

const ResultsScreen: React.FC<ResultsScreenProps> = ({ room, userId }) => {
  const [loading, setLoading] = useState(true);
  const [hostScore, setHostScore] = useState(0);
  const [guestScore, setGuestScore] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [hostAnswers, setHostAnswers] = useState<Record<string, string>>({});
  const [guestAnswers, setGuestAnswers] = useState<Record<string, string>>({});
  // Initialize waiting state based on current room status - don't wait if game is finished
  const initialWaitingState = !(room.hostFinished && room.guestFinished) && room.status !== 'finished';
  const [waitingForOpponent, setWaitingForOpponent] = useState(initialWaitingState);
  const [roomState, setRoomState] = useState(room);

  useEffect(() => {
    const calculateResults = () => {
      try {
        setLoading(true);
        // Use the latest room state
        const currentRoom = roomState || room;
        
  // Move useEffect to the top level of the component
        // Parse questions from strings
        const parsedQuestions = currentRoom.questions.map((q: string) => JSON.parse(q));
        setQuestions(parsedQuestions);
        
        // Check if both users have finished the quiz OR if the status is 'finished'
        const bothFinished = (currentRoom.hostFinished && currentRoom.guestFinished) || currentRoom.status === 'finished';
        
        // If both users are finished or game status is 'finished', don't show the waiting screen
        // This prevents showing the waiting message when the game is already complete
        if (!bothFinished) {
          setWaitingForOpponent(true);
          setLoading(false);
          return;
        }
        
        // Parse answers from array format
        const answers = currentRoom.answers || [];
        let hostAns: Record<string, string> = {};
        let guestAns: Record<string, string> = {};
        
        // Process each answer (one per question)
        answers.forEach((answerStr: string, idx: number) => {
          if (!answerStr) return;
          
          try {
            const answerObj = JSON.parse(answerStr);
            const questionId = parsedQuestions[idx].$id || `q${idx}`;
            
            // Extract host and guest answers for this question
            if (answerObj[currentRoom.hostUserId]) {
              hostAns[questionId] = answerObj[currentRoom.hostUserId];
            }
            
            if (answerObj[currentRoom.guestUserId]) {
              guestAns[questionId] = answerObj[currentRoom.guestUserId];
            }
          } catch (e) {
            console.log('Error parsing answer:', e);
          }
        });
        
        setHostAnswers(hostAns);
        setGuestAnswers(guestAns);
        
        // Calculate host score
        let hostPoints = 0;
        parsedQuestions.forEach((q: any, idx: number) => {
          const questionId = q.$id || `q${idx}`;
          const userAns = hostAns[questionId];
          if (!userAns) return; // skipped
          
          const correctAnsIndex = parseInt(q.answer);
          const correctAns = q.options[correctAnsIndex];
          
          if (userAns === correctAns) {
            hostPoints += 1;
          } else {
            hostPoints -= 0.25; // penalty for wrong
          }
        });
        setHostScore(Math.max(0, hostPoints));
        
        // Calculate guest score
        let guestPoints = 0;
        parsedQuestions.forEach((q: any, idx: number) => {
          const questionId = q.$id || `q${idx}`;
          const userAns = guestAns[questionId];
          if (!userAns) return; // skipped
          
          const correctAnsIndex = parseInt(q.answer);
          const correctAns = q.options[correctAnsIndex];
          
          if (userAns === correctAns) {
            guestPoints += 1;
          } else {
            guestPoints -= 0.25; // penalty for wrong
          }
        });
        setGuestScore(Math.max(0, guestPoints));
        
        setLoading(false);
      } catch (e) {
        console.log('Error calculating results:', e);
        setLoading(false);
      }
    };

    calculateResults();
    
    // Subscribe to room updates to detect when both players have finished
    const unsubscribe = subscribeToRoom(room.$id, (updatedRoom: any) => {
      // Always update the room state when we get updates
      setRoomState(updatedRoom);
      
      // If the room status is finished or both players have completed,
      // transition from waiting to results view
      if ((updatedRoom.hostFinished && updatedRoom.guestFinished) || 
          updatedRoom.status === 'finished') {
        setWaitingForOpponent(false);
        calculateResults();
      }
    });
    
    return () => unsubscribe();
  }, [room, roomState, waitingForOpponent]);

  // Disconnect realtime as soon as both users have finished and results are shown
  useEffect(() => {
    const currentRoom = roomState || room;
    const bothFinished = (currentRoom.hostFinished && currentRoom.guestFinished) || currentRoom.status === 'finished';
    if (bothFinished && !waitingForOpponent) {
      console.log('Both users finished, disconnecting realtime');
      disconnectRealtime();
    }
    
    // Always ensure we disconnect when the component unmounts
    return () => {
      console.log('ResultsScreen unmounting, ensuring realtime is disconnected');
      disconnectRealtime();
    };
  }, [roomState, room, waitingForOpponent]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-900">
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white mt-4">Calculating results...</Text>
      </View>
    );
  }
  
  if (waitingForOpponent) {
    const currentRoom = roomState || room;
    const isHost = userId === currentRoom.hostUserId;
    const isUserFinished = isHost ? currentRoom.hostFinished : currentRoom.guestFinished;
    const isOpponentFinished = isHost ? currentRoom.guestFinished : currentRoom.hostFinished;
    const waitingForRole = isHost ? 'Guest' : 'Host';
    
    return (
      <View className="flex-1 justify-center items-center bg-slate-900">
        <Text className="text-3xl font-bold text-white text-center mb-6">Quiz Complete!</Text>
        <ActivityIndicator size="large" color="#4F46E5" />
        
        {isUserFinished && !isOpponentFinished && (
          <Text className="text-white text-lg mt-6 text-center">
            Waiting for {waitingForRole} to finish the quiz...
          </Text>
        )}
        
        {!isUserFinished && isOpponentFinished && (
          <Text className="text-white text-lg mt-6 text-center">
            {waitingForRole} has finished! Please complete your quiz.
          </Text>
        )}
        
        {!isUserFinished && !isOpponentFinished && (
          <Text className="text-white text-lg mt-6 text-center">
            Please complete your quiz. {waitingForRole} is still answering questions.
          </Text>
        )}
        
        <Text className="text-gray-400 text-sm mt-2 text-center px-6">
          Results will be displayed once both players have completed the quiz.
        </Text>
      </View>
    );
  }

  // Determine winner
  const isHost = userId === room.hostUserId;
  const yourScore = isHost ? hostScore : guestScore;
  const opponentScore = isHost ? guestScore : hostScore;
  const didWin = (isHost && hostScore > guestScore) || (!isHost && guestScore > hostScore);
  const isTie = hostScore === guestScore;

  // Show 'You' and the other user's name
  const yourName = 'You';
  const opponentName = isHost ? (room.guestName || 'Guest') : (room.hostName || 'Host');
  const yourUserId = userId;
  const opponentUserId = isHost ? room.guestUserId : room.hostUserId;
  const yourDisplayName = yourName;
  const opponentDisplayName = opponentName;

  return (
    <View className="flex-1 bg-slate-900 px-4 pt-8">
      <Text className="text-3xl font-bold text-white text-center mb-2">Quiz Results</Text>
      
      {isTie ? (
        <Text className="text-2xl text-yellow-400 text-center mb-4">It's a tie!</Text>
      ) : (
        <Text className={`text-2xl ${didWin ? 'text-green-400' : 'text-red-400'} text-center mb-4`}>
          {didWin ? 'You won!' : 'You lost!'}
        </Text>
      )}
      
      <View className="flex-row justify-around mb-6 p-4 bg-slate-800 rounded-lg">
        <View className="items-center">
          <Text className="text-white text-lg">{yourName}</Text>
          <Text className={`text-2xl font-bold ${yourScore >= opponentScore ? 'text-green-400' : 'text-white'}`}>
            {yourScore.toFixed(1)}
          </Text>
        </View>
        <View className="items-center">
          <Text className="text-white text-lg">{opponentName}</Text>
          <Text className={`text-2xl font-bold ${opponentScore >= yourScore ? 'text-green-400' : 'text-white'}`}>
            {opponentScore.toFixed(1)}
          </Text>
        </View>
      </View>
      
      <ScrollView className="flex-1">
        <Text className="text-xl font-bold text-white mb-4">Question Analysis:</Text>
        {questions.map((q, idx) => {
          const questionId = q.$id || `q${idx}`;
          const hostAns = hostAnswers[questionId];
          const guestAns = guestAnswers[questionId];
          const correctAnsIndex = parseInt(q.answer);
          const correctAns = q.options[correctAnsIndex];
          
          return (
            <View key={idx} className="mb-6 p-4 rounded-lg bg-slate-800">
              <Text className="text-white text-lg font-semibold mb-2">Q{idx + 1}: {q.question}</Text>
              
              {q.options.map((opt: string, i: number) => {
                const isCorrect = i === correctAnsIndex;
                // Determine which user selected this option
                const yourSelected = (isHost ? hostAns : guestAns) === opt;
                const opponentSelected = (isHost ? guestAns : hostAns) === opt;
                let bg = 'bg-slate-700';
                if (isCorrect) {
                  bg = 'bg-green-700';
                } else if (yourSelected || opponentSelected) {
                  bg = 'bg-red-700';
                }
                return (
                  <View key={i} className={`mb-2 py-2 px-4 rounded ${bg}`}>
                    <Text className="text-white text-base">{opt}</Text>
                    <View className="flex-row justify-between">
                      {yourSelected && <Text className="text-xs text-yellow-300">Your answer</Text>}
                      {opponentSelected && <Text className="text-xs text-blue-300">{opponentDisplayName}'s answer</Text>}
                      {isCorrect && <Text className="text-xs text-green-300">Correct</Text>}
                    </View>
                  </View>
                );
              })}
              {!hostAns && isHost && <Text className="text-yellow-300 mt-1">You skipped</Text>}
              {!guestAns && !isHost && <Text className="text-yellow-300 mt-1">You skipped</Text>}
              {!hostAns && !isHost && <Text className="text-blue-300 mt-1">{opponentDisplayName} skipped</Text>}
              {!guestAns && isHost && <Text className="text-blue-300 mt-1">{opponentDisplayName} skipped</Text>}
            </View>
          );
        })}
      </ScrollView>
      
      <TouchableOpacity
        className="w-full py-3 rounded-lg bg-blue-600 my-4"
        onPress={() => {
          // Make sure to disconnect before navigating away
          disconnectRealtime();
          // Navigate back to home screen
          router.replace('/(tabs)');
        }}
      >
        <Text className="text-white text-lg text-center font-semibold">Return to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ResultsScreen;
