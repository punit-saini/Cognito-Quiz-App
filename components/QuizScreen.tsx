import { fetchQuizQuestionsFromCategories } from '@/lib/quiz';
import useAuthStore from '@/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';


type QuizScreenProps = {
  name: string;
  categories: string[];
};

const QuizScreen: React.FC<QuizScreenProps> = ({ name, categories }) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState<{ [key: number]: string }>({});
  const [showResult, setShowResult] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<number>(0);
  const { isAuthenticated, user } = useAuthStore();
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { width } = Dimensions.get('window');
  
  // Store solo play result in AsyncStorage
  const saveSoloResult = async () => {
    const result = {
      score: getScore(),
      total: questions.length,
      categories,
      date: new Date().toISOString(),
      userId: user?.$id || null, // Associate result with user ID
      userEmail: user?.email || null, // Also store email for easier identification
    };
    
    try {
      // Get user-specific storage key
      const storageKey = isAuthenticated && user?.$id ? 
        `solo_results_${user.$id}` : 'solo_results_guest';
      
      // Save to user-specific storage
      const prev = await AsyncStorage.getItem(storageKey);
      let arr = [];
      if (prev) arr = JSON.parse(prev);
      arr.push(result);
      await AsyncStorage.setItem(storageKey, JSON.stringify(arr));
      
      // For easier transition, also save to the global storage temporarily
      // This ensures existing code still works while we migrate
      const globalPrev = await AsyncStorage.getItem('solo_results');
      let globalArr = [];
      if (globalPrev) globalArr = JSON.parse(globalPrev);
      globalArr.push(result);
      await AsyncStorage.setItem('solo_results', JSON.stringify(globalArr));
    } catch (e) {
      console.log('Error saving solo result:', e);
    }
  };
  // Calculate score
  const getScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      const userAns = responses[idx];
      if (!userAns) return; // skipped
      
      // Get correct answer using the index stored in q.answer
      const correctAnsIndex = parseInt(q.answer);
      const correctAns = q.options[correctAnsIndex];
      
      if (userAns === correctAns) {
        score += 1; // correct answer
      } else {
        score -= 0.25; // penalty for wrong answer
      }
    });
    // Ensure score doesn't go below 0
    return Math.max(0, score).toFixed(2);
  };

  useEffect(() => {
    const getQuestions = async () => {
      setLoading(true);
      setError('');
      try {
        // If "All Categories" is selected, pass ['All-Categories']
        const selected = categories.includes('All Categories') ? ['All-Categories'] : categories;
        const totalQuestions = 20;
        let allQuestions = await fetchQuizQuestionsFromCategories(selected, totalQuestions);
        // Shuffle so questions from different categories are mixed
        allQuestions = allQuestions.sort(() => Math.random() - 0.5);
        setQuestions(allQuestions);
      } catch (e) {
        setError('Failed to fetch questions');
      } finally {
        setLoading(false);
      }
    };
    getQuestions();
  }, [categories]);

  // Log responses when they change
//   useEffect(() => {
//     console.log('User responses:', responses);
//   }, [responses]);

  // Update answeredQuestions count
  useEffect(() => {
    setAnsweredQuestions(Object.keys(responses).length);
  }, [responses]);
  
  // Add back button confirmation dialog
  useEffect(() => {
    // Handle hardware back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Show confirmation dialog
      Alert.alert(
        "Exit Quiz",
        "Are you sure you want to exit the quiz? Your progress will be lost.",
        [
          { text: "Cancel", style: "cancel", onPress: () => {} },
          { text: "Exit", style: "destructive", onPress: () => router.back() }
        ]
      );
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, []);
  
  // Animate when changing questions
  const animateQuestionTransition = (direction: 'next' | 'prev') => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start(() => {
      // Change question index
      if (direction === 'next') {
        setCurrentIdx(currentIdx + 1);
      } else {
        setCurrentIdx(currentIdx - 1);
      }
      
      // Slide in from correct direction
      slideAnim.setValue(direction === 'next' ? width * 0.2 : -width * 0.2);
      
      // Fade & slide in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true
        })
      ]).start();
    });
  };

  // PanResponder for swipe navigation
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 20,
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -50 && currentIdx < questions.length - 1) {
        animateQuestionTransition('next');
      } else if (gestureState.dx > 50 && currentIdx > 0) {
        animateQuestionTransition('prev');
      }
    },
  });

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <LinearGradient
        colors={["#181C24", "#222834", "#10131A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Quiz Challenge</Text>
          <Text style={styles.headerSubtitle}>{name}'s Session</Text>
        </View>
        {!showResult && questions.length > 0 && (
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
        )}
      </View>
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#37B6E9" />
          <Text style={styles.loadingText}>Loading quiz questions...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (questions && questions.length > 0 ? (
        showResult ? (
          <View style={styles.resultContainer}>
            <LinearGradient
              colors={['rgba(55, 182, 233, 0.2)', 'rgba(106, 61, 232, 0.1)']}
              style={styles.resultScoreCard}
            >
              <Text style={styles.resultScoreTitle}>Your Final Score</Text>
              <Text style={styles.resultScoreValue}>{getScore()}</Text>
              <Text style={styles.resultScoreMax}>out of {questions.length}</Text>
            </LinearGradient>
            
            <View style={styles.resultListContainer}>
              <ScrollView>
                {questions.map((q, idx) => {
                  const userAns = responses[idx];
                  return (
                    <View key={q.$id || idx} style={styles.resultQuestionCard}>
                      <Text style={styles.resultQuestionText}>Q{idx + 1}: {q.question}</Text>
                      <Text style={styles.resultQuestionCategory}>Category: {q.category || 'Unknown'}</Text>
                      {q.options && q.options.map((opt: string, i: number) => {
                        // The answer field contains the index of the correct option
                        const correctAnsIndex = parseInt(q.answer);
                        const isCorrect = i === correctAnsIndex;
                        const isSelected = userAns === opt;
                        
                        let optionStyle = [styles.resultOption];
                        let iconName = '';
                        
                        if (isCorrect && isSelected) {
                          // Correct answer that user selected
                          optionStyle.push(styles.resultOptionCorrect as any);
                          iconName = 'checkmark-circle';
                        } else if (isCorrect) {
                          // Correct answer user didn't select
                          optionStyle.push(styles.resultOptionCorrectUnselected as any);
                          iconName = 'checkmark-circle-outline';
                        } else if (isSelected) {
                          // Wrong answer user selected
                          optionStyle.push(styles.resultOptionWrong as any);
                          iconName = 'close-circle';
                        }
                        
                        return (
                          <View key={i} style={optionStyle}>
                            <Text style={styles.resultOptionText}>{opt}</Text>
                            <View style={styles.resultOptionLabels}>
                              {iconName && (
                                <Ionicons 
                                  name={iconName as any} 
                                  size={18} 
                                  color={isCorrect ? '#4ade80' : '#ef4444'} 
                                  style={styles.resultOptionIcon}
                                />
                              )}
                              {isSelected && (
                                <Text style={styles.resultYourAnswer}>Your answer</Text>
                              )}
                              {isCorrect && (
                                <Text style={styles.resultCorrectAnswer}>Correct</Text>
                              )}
                            </View>
                          </View>
                        );
                      })}
                      {!userAns && (
                        <Text style={styles.resultSkipped}>Question skipped</Text>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
              
              <TouchableOpacity
                style={styles.backToHomeButton}
                onPress={() => {
                  router.replace('/' as any);
                }}
              >
                <LinearGradient
                  colors={['#37B6E9', '#6a3de8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.backToHomeGradient}
                >
                  <Text style={styles.backToHomeText}>Back to Home</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
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
                    {questions[currentIdx].category || 'General Knowledge'}
                  </Text>
                </View>
                
                <Text style={styles.questionText}>
                  {questions[currentIdx].question}
                </Text>
                
                <View style={styles.optionsContainer}>
                  {questions[currentIdx].options && questions[currentIdx].options.map((opt: string, i: number) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.optionButton,
                        responses[currentIdx] === opt ? styles.selectedOption : {}
                      ]}
                      onPress={() => setResponses({ ...responses, [currentIdx]: opt })}
                    >
                      <LinearGradient
                        colors={responses[currentIdx] === opt ?
                          ['#37B6E9', '#6a3de8'] :
                          ['#232442', '#1E1F35']}
                        start={{ x: 0, y: 0 }}
                        end={responses[currentIdx] === opt ? { x: 1, y: 0 } : { x: 1, y: 1 }}
                        style={styles.optionGradient}
                      >
                        <View style={styles.optionTextContainer}>
                          <Text style={styles.optionText}>{opt}</Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </LinearGradient>
            </Animated.View>
            
            <View style={styles.navigationContainer}>
              <TouchableOpacity
                style={[styles.navButton, currentIdx === 0 ? styles.disabledButton : {}]}
                disabled={currentIdx === 0}
                onPress={() => animateQuestionTransition('prev')}
              >
                <Ionicons name="chevron-back" size={24} color={currentIdx === 0 ? "#555" : "#fff"} />
                <Text style={[styles.navButtonText, currentIdx === 0 ? styles.disabledText : {}]}>Prev</Text>
              </TouchableOpacity>
              
              <Text style={styles.pageIndicator}>
                {currentIdx + 1} / {questions.length}
              </Text>
              
              <TouchableOpacity
                style={[styles.navButton, currentIdx === questions.length - 1 ? styles.disabledButton : {}]}
                disabled={currentIdx === questions.length - 1}
                onPress={() => animateQuestionTransition('next')}
              >
                <Text style={[styles.navButtonText, currentIdx === questions.length - 1 ? styles.disabledText : {}]}>Next</Text>
                <Ionicons name="chevron-forward" size={24} color={currentIdx === questions.length - 1 ? "#555" : "#fff"} />
              </TouchableOpacity>
            </View>
            
            {/* Show submit button only on last question */}
            {currentIdx === questions.length - 1 && (
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  answeredQuestions === 0 ? styles.disabledSubmit : {}
                ]}
                onPress={async () => {
                  await saveSoloResult();
                  setShowResult(true);
                }}
                disabled={answeredQuestions === 0}
              >
                <LinearGradient
                  colors={['#37B6E9', '#6a3de8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  <Text style={styles.submitText}>Submit Answers</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )
      ) : null)}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter',
    marginTop: 2,
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
  
  // Results screen styles
  resultContainer: {
    flex: 1,
    padding: 16,
  },
  resultScoreCard: {
    borderRadius: 16,
    borderTopLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(55, 182, 233, 0.15)',
  },
  resultScoreTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  resultScoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#37B6E9',
    fontFamily: 'Poppins-Bold',
  },
  resultScoreMax: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter',
  },
  resultListContainer: {
    flex: 1,
  },
  resultQuestionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#37B6E9',
  },
  resultQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  resultQuestionCategory: {
    fontSize: 12,
    color: '#37B6E9',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  resultOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  resultOptionCorrect: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.4)',
  },
  resultOptionCorrectUnselected: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.2)',
  },
  resultOptionWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  resultOptionText: {
    fontSize: 14,
    color: 'white',
    fontFamily: 'Inter',
  },
  resultOptionLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  resultOptionIcon: {
    marginRight: 4,
  },
  resultYourAnswer: {
    fontSize: 12,
    color: '#fbbf24',
    fontFamily: 'Inter',
    marginRight: 8,
  },
  resultCorrectAnswer: {
    fontSize: 12,
    color: '#4ade80',
    fontFamily: 'Inter',
  },
  resultSkipped: {
    fontSize: 13,
    color: '#fbbf24',
    fontFamily: 'Inter',
    marginTop: 8,
  },
  backToHomeButton: {
    overflow: 'hidden',
    borderRadius: 25,
    marginTop: 20,
    marginBottom: 20,
  },
  backToHomeGradient: {
    padding: 14,
    alignItems: 'center',
    borderRadius: 25,
  },
  backToHomeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-SemiBold',
  },
  
  // Quiz screen styles
  quizContainer: {
    flex: 1,
    padding: 16,
  },
  questionCardContainer: {
    flex: 1,
    marginBottom: 16,
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
    padding: 20,
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(55, 182, 233, 0.18)',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
  },
  questionText: {
    fontSize: 18,
    color: 'white',
    marginBottom: 24,
    lineHeight: 26,
    fontFamily: 'Poppins-SemiBold',
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  optionButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedOption: {
    shadowColor: '#37B6E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(55, 182, 233, 0.4)',
    borderRadius: 12,
  },
  optionGradient: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionTextContainer: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  optionText: {
    color: 'white',
    fontSize: 15,
    fontFamily: 'Inter',
    backgroundColor: 'transparent',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  disabledButton: {
    opacity: 0.4,
  },
  navButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  disabledText: {
    color: '#555',
  },
  pageIndicator: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  submitButton: {
    overflow: 'hidden',
    borderRadius: 25,
    marginBottom: 8,
    shadowColor: '#37B6E9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledSubmit: {
    opacity: 0.6,
  },
  submitGradient: {
    padding: 14,
    alignItems: 'center',
    borderRadius: 25,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default QuizScreen;
