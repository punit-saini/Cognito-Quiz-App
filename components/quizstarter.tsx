import { QUIZ_CATEGORIES } from '@/constants/QuizCategories';
import useAuthStore from '@/store/auth.store';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import QuizScreen from './QuizScreen';

const QuizStarter = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [name, setName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState(false);

  const handleCategoryPress = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else if (selectedCategories.length < 5) {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const canStart = isAuthenticated || name.trim().length > 0;

  return (
    <View className="flex-1 items-center justify-start bg-slate-900 px-4 pt-8">
      {!gameStarted ? (
        <>
          {isAuthenticated ? (
            <Text className="text-2xl font-bold text-white mb-4">Welcome {user?.name}</Text>
          ) : (
            <View className="w-full mb-4">
              <Text className="text-lg text-white mb-2">Enter your name to play:</Text>
              <TextInput
                className="bg-slate-800 text-white rounded-lg px-4 py-2 text-lg"
                placeholder="Your Name"
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
              />
            </View>
          )}
          <Text className="text-lg text-white mb-2">Select up to 5 categories:</Text>
          <ScrollView className="w-full mb-4" contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {QUIZ_CATEGORIES.map(category => (
              <TouchableOpacity
                key={category}
                className={`px-4 py-2 rounded-full mb-2 mr-2 ${selectedCategories.includes(category) ? 'bg-blue-600' : 'bg-slate-700'} `}
                onPress={() => handleCategoryPress(category)}
                disabled={
                  !selectedCategories.includes(category) && selectedCategories.length >= 5
                }
              >
                <Text className="text-white text-base">{category}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            className={`w-full py-3 rounded-lg ${canStart ? 'bg-green-600' : 'bg-gray-600'} mb-2`}
            disabled={!canStart}
            onPress={() => setGameStarted(true)}
          >
            <Text className="text-white text-lg text-center font-semibold">Start Game</Text>
          </TouchableOpacity>
          <Text className="text-white text-sm mt-2">Selected: {selectedCategories.join(', ')} </Text>
        </>
      ) : (
        <QuizScreen
          name={isAuthenticated ? user?.name ?? '' : name}
          categories={selectedCategories.map(cat => cat.replace(/\s+/g, '-'))}
        />
      )}
    </View>
  );
}

export default QuizStarter