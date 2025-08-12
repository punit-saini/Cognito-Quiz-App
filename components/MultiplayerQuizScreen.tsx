import { disconnectRealtime, markUserFinished, submitAnswers, subscribeToRoom } from '@/lib/roomAppwrite';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { width } = Dimensions.get('window');
  
  // Animation for timer
  const timerAnim = useRef(new Animated.Value(1)).current;
  
  // Animation for option selection
  const optionAnim = useRef(new Animated.Value(1)).current;

  // Handle back button press
  const handleBackPress = useCallback(() => {
    Alert.alert(
      "Exit Quiz?",
      "Are you sure you want to exit? Your progress will be lost.",
      [
        { text: "Cancel", style: "cancel" },
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
  }, []);

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
        // Quiz completed by timer running out on the last question
        // Make sure to submit answers to database and mark user as finished
        submitAnswersToDatabase(responses);
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
    
    // Update responses state immediately to reflect selection
    setResponses(updatedResponses);
    
    // Animate the selection
    Animated.sequence([
      Animated.timing(optionAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(optionAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
    
    // Add a small delay before navigating to next question for visual feedback
    setTimeout(() => {
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
    }, 300); // 300ms delay for visual feedback
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

  // Update answered questions count
  useEffect(() => {
    setAnsweredQuestions(Object.keys(responses).length);
  }, [responses]);
  
  // Animation for timer warning
  useEffect(() => {
    if (timer <= 10) {
      Animated.sequence([
        Animated.timing(timerAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(timerAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [timer, timerAnim]);
  
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
          <Text style={styles.loadingText}>Loading multiplayer quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#181C24", "#222834", "#10131A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No questions available</Text>
          <TouchableOpacity style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#181C24", "#222834", "#10131A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="chevron-back" size={24} color="#37B6E9" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Multiplayer Quiz</Text>
            <Text style={styles.headerSubtitle}>Playing against {roomData.hostUserId === userId ? roomData.guestName : roomData.hostName}</Text>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {answeredQuestions}/{questions.length} answered
          </Text>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${(answeredQuestions / questions.length) * 100}%` }
              ]} 
            />
          </View>
        </View>
      </View>
      
      <View style={styles.quizContainer}>
        <Animated.View 
          style={[
            styles.questionCardContainer,
            { 
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }] 
            }
          ]}
        >
          <LinearGradient
            colors={["rgba(24, 28, 36, 0.95)", "rgba(34, 40, 52, 0.95)", "rgba(16, 19, 26, 0.95)"]}
            style={styles.questionCard}
          >
            <View style={styles.questionHeader}>
              <View style={styles.questionNumber}>
                <Text style={styles.questionNumberText}>{currentIdx + 1}</Text>
              </View>
              <Text style={styles.categoryLabel}>
                {currentQuestion.category || 'Multiplayer Quiz'}
              </Text>
              <Animated.View 
                style={[
                  styles.timerContainer,
                  timer <= 10 ? styles.timerWarning : {},
                  { transform: [{ scale: timerAnim }] }
                ]}
              >
                <Text style={styles.timerText}>{timer}s</Text>
              </Animated.View>
            </View>
            
            <Text style={styles.questionText}>
              {currentQuestion.question}
            </Text>
            
            <View style={styles.optionsContainer}>
              {currentQuestion.options && currentQuestion.options.map((opt: string, i: number) => {
                // Check if this option is selected for the current question
                const questionId = currentQuestion.$id || `q${currentIdx}`;
                const isSelected = responses[questionId] === opt;
                
                return (
                  <Animated.View
                    key={i}
                    style={{
                      transform: [
                        { scale: isSelected ? optionAnim : 1 }
                      ]
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        isSelected ? styles.selectedOption : {}
                      ]}
                      onPress={() => handleOptionSelect(opt)}
                    >
                      <LinearGradient
                        colors={
                          isSelected ?
                            ['#37B6E9', '#6a3de8'] :
                            ['rgba(55, 182, 233, 0.1)', 'rgba(106, 61, 232, 0.05)']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.optionGradient}
                      >
                        <View style={styles.optionTextContainer}>
                          <Text 
                            style={[
                              styles.optionText,
                              isSelected ? styles.selectedOptionText : {}
                            ]}
                          >
                            {opt}
                          </Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </LinearGradient>
        </Animated.View>
        
        <SafeAreaView style={styles.bottomSafeArea}>
          <View style={styles.infoContainer}>
            <View style={styles.infoBox}>
              <Ionicons name="people" size={18} color="#37B6E9" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Your opponent is answering the same questions!
              </Text>
            </View>
            <View style={styles.indicator}>
              <View style={[styles.dot, currentIdx === currentIdx && styles.activeDot]} />
              <Text style={styles.indicatorText}>
                {currentIdx + 1} / {questions.length}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter',
    marginTop: 1,
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  progressBarBg: {
    width: 100,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#37B6E9',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  quizContainer: {
    flex: 1,
    padding: 12,
  },
  questionCardContainer: {
    flex: 0.85, // Reduced from 1 to make the card more compact
    marginBottom: 12,
    shadowColor: '#37B6E9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  questionCard: {
    borderRadius: 16,
    borderTopLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 16, // Reduced padding from 20 to 16
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(55, 182, 233, 0.18)',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, // Reduced from 16
  },
  questionNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(55, 182, 233, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  questionNumberText: {
    color: '#37B6E9',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  categoryLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontFamily: 'Inter',
    flex: 1,
  },
  timerContainer: {
    paddingHorizontal: 12,
    paddingVertical: 5, // Reduced from 6
    borderRadius: 12,
    backgroundColor: 'rgba(55, 182, 233, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
  },
  timerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  questionText: {
    fontSize: 17, // Reduced from 18
    color: 'white',
    marginBottom: 16, // Reduced from 24
    lineHeight: 24, // Reduced from 26
    fontFamily: 'Poppins-SemiBold',
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'flex-start', // Changed from center to flex-start
  },
  optionButton: {
    marginBottom: 10, // Reduced from 12
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(55, 182, 233, 0.15)',
  },
  selectedOption: {
    shadowColor: '#37B6E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(55, 182, 233, 0.6)',
    borderRadius: 12,
  },
  optionGradient: {
    padding: 14, // Reduced from 16
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionTextContainer: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  optionText: {
    color: '#37B6E9',
    fontSize: 15,
    fontFamily: 'Inter',
    backgroundColor: 'transparent',
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  bottomSafeArea: {
    marginTop: 'auto',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(55, 182, 233, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6, // Reduced from 8
    borderRadius: 8,
    maxWidth: '70%',
  },
  infoIcon: {
    marginRight: 6,
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontFamily: 'Inter',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#37B6E9',
    marginRight: 6,
  },
  activeDot: {
    backgroundColor: '#6a3de8',
  },
  indicatorText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter',
  },
});

export default MultiplayerQuizScreen;