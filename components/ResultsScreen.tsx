import { disconnectRealtime, subscribeToRoom } from '@/lib/roomAppwrite';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  onModalClose?: () => void; // Optional callback for closing modal in Results tab
};

const ResultsScreen: React.FC<ResultsScreenProps> = ({ room, userId, onModalClose }) => {
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
  
  // If onModalClose is provided, we're in a modal view from the results tab
  const isInModal = !!onModalClose;

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
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#181C24", "#222834", "#10131A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#37B6E9" />
          <Text style={styles.loadingText}>Calculating results...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (waitingForOpponent) {
    const currentRoom = roomState || room;
    const isHost = userId === currentRoom.hostUserId;
    const isUserFinished = isHost ? currentRoom.hostFinished : currentRoom.guestFinished;
    const isOpponentFinished = isHost ? currentRoom.guestFinished : currentRoom.hostFinished;
    const waitingForRole = isHost ? 'Guest' : 'Host';
    
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#181C24", "#222834", "#10131A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.waitingContainer}>
          <LinearGradient
            colors={['rgba(55, 182, 233, 0.2)', 'rgba(106, 61, 232, 0.1)']}
            style={styles.waitingCard}
          >
            <Text style={styles.waitingTitle}>Quiz Complete!</Text>
            <ActivityIndicator size="large" color="#37B6E9" style={styles.waitingSpinner} />
            
            {isUserFinished && !isOpponentFinished && (
              <Text style={styles.waitingMessage}>
                Waiting for {waitingForRole} to finish the quiz...
              </Text>
            )}
            
            {!isUserFinished && isOpponentFinished && (
              <Text style={styles.waitingMessage}>
                {waitingForRole} has finished! Please complete your quiz.
              </Text>
            )}
            
            {!isUserFinished && !isOpponentFinished && (
              <Text style={styles.waitingMessage}>
                Please complete your quiz. {waitingForRole} is still answering questions.
              </Text>
            )}
            
            <Text style={styles.waitingSubtext}>
              Results will be displayed once both players have completed the quiz.
            </Text>
            
            <View style={styles.waitingIconsContainer}>
              <Ionicons name="trophy" size={24} color="rgba(255, 255, 255, 0.3)" style={styles.waitingIcon} />
              <Ionicons name="stats-chart" size={24} color="rgba(255, 255, 255, 0.3)" style={styles.waitingIcon} />
              <Ionicons name="ribbon" size={24} color="rgba(255, 255, 255, 0.3)" style={styles.waitingIcon} />
            </View>
          </LinearGradient>
        </View>
      </SafeAreaView>
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
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#181C24", "#222834", "#10131A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quiz Results</Text>
        
        {isTie ? (
          <View style={styles.resultBanner}>
            <Ionicons name="trophy" size={24} color="#FFC107" style={styles.resultIcon} />
            <Text style={[styles.resultText, styles.tieText]}>It's a tie!</Text>
          </View>
        ) : (
          <View style={[
            styles.resultBanner, 
            didWin ? styles.winBanner : styles.loseBanner
          ]}>
            <Ionicons 
              name={didWin ? "trophy" : "sad"} 
              size={24} 
              color={didWin ? "#4ade80" : "#ef4444"} 
              style={styles.resultIcon} 
            />
            <Text style={[
              styles.resultText, 
              didWin ? styles.winText : styles.loseText
            ]}>
              {didWin ? 'You won!' : 'You lost!'}
            </Text>
          </View>
        )}
      </View>
      
      <LinearGradient
        colors={['rgba(55, 182, 233, 0.2)', 'rgba(106, 61, 232, 0.1)']}
        style={styles.scoreCard}
      >
        <View style={styles.scoreRow}>
          <View style={styles.playerScore}>
            <Text style={styles.playerName}>{yourName}</Text>
            <Text style={[
              styles.scoreValue,
              yourScore >= opponentScore ? styles.winningScore : {}
            ]}>
              {yourScore.toFixed(1)}
            </Text>
          </View>
          
          <View style={styles.scoreDivider}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          
          <View style={styles.playerScore}>
            <Text style={styles.playerName}>{opponentName}</Text>
            <Text style={[
              styles.scoreValue,
              opponentScore >= yourScore ? styles.winningScore : {}
            ]}>
              {opponentScore.toFixed(1)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.analysisTitleContainer}>
        <Ionicons name="analytics" size={18} color="#37B6E9" />
        <Text style={styles.analysisTitle}>Question Analysis</Text> 
      </View>
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {questions.map((q, idx) => {
          const questionId = q.$id || `q${idx}`;
          const hostAns = hostAnswers[questionId];
          const guestAns = guestAnswers[questionId];
          const correctAnsIndex = parseInt(q.answer);
          const correctAns = q.options[correctAnsIndex];
          
          return (
            <View key={idx} style={styles.questionCard}>
              <LinearGradient
                colors={["rgba(24, 28, 36, 0.95)", "rgba(34, 40, 52, 0.95)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.questionCardGradient}
              >
                <View style={styles.questionHeader}>
                  <View style={styles.questionNumber}>
                    <Text style={styles.questionNumberText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.questionText} numberOfLines={2}>{q.question}</Text>
                </View>
                
                <View style={styles.optionsContainer}>
                  {q.options.map((opt: string, i: number) => {
                    const isCorrect = i === correctAnsIndex;
                    // Determine which user selected this option
                    const yourSelected = (isHost ? hostAns : guestAns) === opt;
                    const opponentSelected = (isHost ? guestAns : hostAns) === opt;
                    
                    return (
                      <LinearGradient
                        key={i}
                        colors={
                          isCorrect 
                            ? ['rgba(74, 222, 128, 0.3)', 'rgba(74, 222, 128, 0.1)']
                            : yourSelected || opponentSelected
                              ? ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.1)'] 
                              : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
                        }
                        style={[
                          styles.optionItem,
                          isCorrect && styles.correctOption,
                          yourSelected && styles.yourSelected,
                          opponentSelected && !yourSelected && styles.opponentSelected
                        ]}
                      >
                        <Text style={styles.optionText}>{opt}</Text>
                        <View style={styles.optionLabels}>
                          {yourSelected && (
                            <View style={styles.answerBadge}>
                              <Ionicons name="person" size={12} color="#fbbf24" />
                              <Text style={styles.yourAnswerText}>You</Text>
                            </View>
                          )}
                          {opponentSelected && (
                            <View style={styles.answerBadge}>
                              <Ionicons name="person-outline" size={12} color="#60a5fa" />
                              <Text style={styles.opponentAnswerText}>Opponent</Text>
                            </View>
                          )}
                          {isCorrect && (
                            <View style={styles.answerBadge}>
                              <Ionicons name="checkmark-circle" size={12} color="#4ade80" />
                              <Text style={styles.correctText}>Correct</Text>
                            </View>
                          )}
                        </View>
                      </LinearGradient>
                    );
                  })}
                </View>
                
                <View style={styles.skippedContainer}>
                  {!hostAns && isHost && (
                    <Text style={styles.skippedText}>
                      <Ionicons name="alert-circle" size={14} color="#fbbf24" /> You skipped this question
                    </Text>
                  )}
                  {!guestAns && !isHost && (
                    <Text style={styles.skippedText}>
                      <Ionicons name="alert-circle" size={14} color="#fbbf24" /> You skipped this question
                    </Text>
                  )}
                  {!hostAns && !isHost && (
                    <Text style={styles.skippedText}>
                      <Ionicons name="alert-circle-outline" size={14} color="#60a5fa" /> {opponentDisplayName} skipped this question
                    </Text>
                  )}
                  {!guestAns && isHost && (
                    <Text style={styles.skippedText}>
                      <Ionicons name="alert-circle-outline" size={14} color="#60a5fa" /> {opponentDisplayName} skipped this question
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </View>
          );
        })}
      </ScrollView>
      
      {/* Only show action buttons when not in a modal */}
      {!isInModal && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.viewResultsButton}
            onPress={() => {
              // Make sure to disconnect before navigating away
              disconnectRealtime();
              // Navigate to results page
              router.push('/tabs/Results' as any);
            }}
          >
            <LinearGradient
              colors={['#6a3de8', '#37B6E9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="trophy" size={18} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.buttonText}>View Results</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => {
              // Make sure to disconnect before navigating away
              disconnectRealtime();
              // Navigate back to home screen
              router.replace('/tabs' as any);
            }}
          >
            <LinearGradient
              colors={['#37B6E9', '#6a3de8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="home" size={18} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.buttonText}>Home</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontFamily: 'Inter',
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  waitingCard: {
    width: '100%',
    borderRadius: 20,
    borderTopLeftRadius: 28,
    borderBottomRightRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(55, 182, 233, 0.15)',
    shadowColor: '#37B6E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  waitingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 24,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
  },
  waitingSpinner: {
    marginVertical: 16,
  },
  waitingMessage: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'Inter',
  },
  waitingSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Inter',
  },
  waitingIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  waitingIcon: {
    marginHorizontal: 12,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    marginBottom: 16,
  },
  winBanner: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
  },
  loseBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  resultIcon: {
    marginRight: 8,
  },
  resultText: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  tieText: {
    color: '#FFC107',
  },
  winText: {
    color: '#4ade80',
  },
  loseText: {
    color: '#ef4444',
  },
  scoreCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderTopLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(55, 182, 233, 0.15)',
    shadowColor: '#37B6E9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 24,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerScore: {
    flex: 1,
    alignItems: 'center',
  },
  scoreDivider: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  vsText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  playerName: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Poppins-Bold',
  },
  winningScore: {
    color: '#37B6E9',
    textShadowColor: 'rgba(55, 182, 233, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  analysisTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginHorizontal: 16,
    paddingLeft: 4,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  questionCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#37B6E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  questionCardGradient: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(55, 182, 233, 0.15)',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  questionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(55, 182, 233, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  questionNumberText: {
    color: '#37B6E9',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
  },
  optionsContainer: {
    marginVertical: 8,
  },
  optionItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  correctOption: {
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  yourSelected: {
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  opponentSelected: {
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  optionText: {
    fontSize: 15,
    color: 'white',
    fontFamily: 'Inter',
  },
  optionLabels: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  answerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginRight: 6,
  },
  yourAnswerText: {
    fontSize: 12,
    color: '#fbbf24',
    marginLeft: 4,
    fontFamily: 'Inter',
  },
  opponentAnswerText: {
    fontSize: 12,
    color: '#60a5fa',
    marginLeft: 4,
    fontFamily: 'Inter',
  },
  correctText: {
    fontSize: 12,
    color: '#4ade80',
    marginLeft: 4,
    fontFamily: 'Inter',
  },
  skippedContainer: {
    marginTop: 8,
  },
  skippedText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontFamily: 'Inter',
  },
  buttonContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 24,
    gap: 12,
  },
  viewResultsButton: {
    overflow: 'hidden',
    borderRadius: 25,
    shadowColor: '#37B6E9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  homeButton: {
    overflow: 'hidden',
    borderRadius: 25,
    shadowColor: '#37B6E9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    padding: 14,
    alignItems: 'center',
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-SemiBold',
  },
  homeButtonGradient: {
    padding: 14,
    alignItems: 'center',
    borderRadius: 25,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default ResultsScreen;