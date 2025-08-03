import { fetchQuizQuestions } from '@/lib/quiz';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, PanResponder, ScrollView, Text, TouchableOpacity, View } from 'react-native';

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
  // Store solo play result in AsyncStorage
  const saveSoloResult = async () => {
    const result = {
      score: getScore(),
      total: questions.length,
      categories,
      date: new Date().toISOString(),
    };
    try {
      const prev = await AsyncStorage.getItem('solo_results');
      let arr = [];
      if (prev) arr = JSON.parse(prev);
      arr.push(result);
      await AsyncStorage.setItem('solo_results', JSON.stringify(arr));
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
        // Split 20 questions as evenly as possible across selected categories
        const totalQuestions = 20;
        const counts = Array(categories.length).fill(Math.floor(totalQuestions / categories.length));
        let remainder = totalQuestions % categories.length;
        for (let i = 0; i < remainder; i++) {
          counts[i] += 1;
        }
        let allQuestions: any[] = [];
        for (let i = 0; i < categories.length; i++) {
          if (counts[i] > 0) {
            const data = await fetchQuizQuestions(categories[i], counts[i]);
            // Ensure each question has its category
            const withCategory = data.map((q: any) => ({ ...q, category: categories[i] }));
            allQuestions = allQuestions.concat(withCategory);
          }
        }
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

  // PanResponder for swipe navigation
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 20,
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -50 && currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1);
      } else if (gestureState.dx > 50 && currentIdx > 0) {
        setCurrentIdx(currentIdx - 1);
      }
    },
  });

  return (
    <View className="flex-1 bg-slate-900 px-4 pt-8" {...panResponder.panHandlers}>
      <Text className="text-2xl font-bold text-white mb-4">Quiz for {name}</Text>
      <Text className="text-lg text-white mb-4">Categories: {categories.join(', ')}</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : error ? (
        <Text className="text-red-500 text-lg">{error}</Text>
      ) : (questions && questions.length > 0 ? (
        showResult ? (
          <View className="flex-1">
            <Text className="text-2xl font-bold text-green-400 mb-4">Your Score: {getScore()} / {questions.length}</Text>
            <View className="flex-1">
              <ScrollView>
                {questions.map((q, idx) => {
                  const userAns = responses[idx];
                  return (
                    <View key={q.$id || idx} className="mb-6 p-4 rounded-lg bg-slate-800">
                      <Text className="text-white text-lg font-semibold mb-2">Q{idx + 1}: {q.question}</Text>
                      <Text className="text-sm text-blue-300 mb-2">Category: {q.category || 'Unknown'}</Text>
                      {q.options && q.options.map((opt: string, i: number) => {
                        // The answer field contains the index of the correct option
                        const correctAnsIndex = parseInt(q.answer);
                        const isCorrect = i === correctAnsIndex;
                        const isSelected = userAns === opt;
                        // Default background for unselected, incorrect answers
                        let bg = 'bg-slate-700';
                        
                        // Set background colors based on correctness and selection
                        if (isCorrect && isSelected) {
                          // Correct answer that user selected
                          bg = 'bg-green-700';
                        } else if (isCorrect) {
                          // Correct answer user didn't select
                          bg = 'bg-green-600';
                        } else if (isSelected) {
                          // Wrong answer user selected
                          bg = 'bg-red-700';
                        }
                        
                        return (
                          <View key={i} className={`mb-2 py-2 px-4 rounded ${bg}`}>
                            <Text className="text-white text-base">{opt}</Text>
                            <View className="flex-row justify-between">
                              {isSelected && (
                                <Text className="text-xs text-yellow-300">Your answer</Text>
                              )}
                              {isCorrect && (
                                <Text className="text-xs text-green-300">Correct answer</Text>
                              )}
                            </View>
                          </View>
                        );
                      })}
                      {!userAns && (
                        <Text className="text-yellow-300 mt-2">Skipped</Text>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        ) : (
          <View className="flex-1 justify-center">
            <View className="mb-6 p-4 rounded-lg bg-slate-800">
              <Text className="text-white text-lg font-semibold mb-2">Q{currentIdx + 1}: {questions[currentIdx].question}</Text>
              <Text className="text-sm text-blue-300 mb-2">Category: {questions[currentIdx].category || 'Unknown'}</Text>
              {questions[currentIdx].options && questions[currentIdx].options.map((opt: string, i: number) => (
                <TouchableOpacity
                  key={i}
                  className={`mb-2 py-2 px-4 rounded ${responses[currentIdx] === opt ? 'bg-green-700' : 'bg-blue-700'}`}
                  onPress={() => setResponses({ ...responses, [currentIdx]: opt })}
                >
                  <Text className="text-white text-base">{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row justify-between mt-4">
              <TouchableOpacity
                className="px-4 py-2 rounded bg-slate-700"
                disabled={currentIdx === 0}
                onPress={() => setCurrentIdx(currentIdx - 1)}
              >
                <Text className="text-white">Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-4 py-2 rounded bg-slate-700"
                disabled={currentIdx === questions.length - 1}
                onPress={() => setCurrentIdx(currentIdx + 1)}
              >
                <Text className="text-white">Next</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              className="w-full py-3 rounded-lg bg-green-600 mt-6"
              onPress={async () => {
                await saveSoloResult();
                setShowResult(true);
              }}
              disabled={Object.keys(responses).length === 0}
            >
              <Text className="text-white text-lg text-center font-semibold">Submit Test</Text>
            </TouchableOpacity>
          </View>
        )
      ) : null)}
    </View>
  );
};

export default QuizScreen;
