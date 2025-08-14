import { QUIZ_CATEGORIES } from '@/constants/QuizCategories';
import useAuthStore from '@/store/auth.store';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QuizScreen from './QuizScreen';

const QuizStarter = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState(false);

  const handleCategoryPress = (category: string) => {
    if (category === 'All Categories') {
      if (selectedCategories.includes('All Categories')) {
        setSelectedCategories([]);
      } else {
        setSelectedCategories(['All Categories']);
      }
      return;
    }
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else if (selectedCategories.length < 5 && !selectedCategories.includes('All Categories')) {
      setSelectedCategories([...selectedCategories, category]);
    }
    // If any other category is selected, remove 'All Categories'
    if (selectedCategories.includes('All Categories')) {
      setSelectedCategories([category]);
    }
  };

  const canStart = true;

  if (gameStarted) {
    return (
      <QuizScreen
        name={isAuthenticated ? user?.name ?? '' : ''}
        categories={selectedCategories.map(cat => cat.replace(/\s+/g, '-'))}
      />
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#232442', '#1E1F35']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <View style={styles.contentContainer}>


          {/* Categories Section */}
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Select categories (max 5):</Text>
            <View style={styles.categoriesContainer}>
              {/* All Categories Option */}
              <TouchableOpacity
                key="All Categories"
                style={[
                  styles.categoryButton,
                  selectedCategories.includes('All Categories') ? styles.selectedCategory : {}
                ]}
                onPress={() => handleCategoryPress('All Categories')}
                disabled={selectedCategories.length > 0 && !selectedCategories.includes('All Categories')}
              >
                <LinearGradient
                  colors={
                    selectedCategories.includes('All Categories')
                      ? ['#37B6E9', '#6a3de8']
                      : ['#232442', '#1E1F35']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.categoryGradient}
                >
                  <Text style={styles.categoryText}>
                    All Categories
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              {/* Other Categories */}
              {QUIZ_CATEGORIES.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategories.includes(category) ? styles.selectedCategory : {}
                  ]}
                  onPress={() => handleCategoryPress(category)}
                  disabled={
                    (selectedCategories.includes('All Categories')) ||
                    (!selectedCategories.includes(category) && selectedCategories.length >= 5)
                  }
                >
                  <LinearGradient
                    colors={
                      selectedCategories.includes(category) 
                        ? ['#37B6E9', '#6a3de8'] 
                        : ['#232442', '#1E1F35']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.categoryGradient}
                  >
                    <Text style={styles.categoryText}>
                      {category}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Selected Categories */}
          {selectedCategories.length > 0 && (
            <View style={styles.selectedCategoriesContainer}>
              <Text style={styles.selectedCategoriesText}>
                Selected: {selectedCategories.join(', ')}
              </Text>
            </View>
          )}

          {/* Start Button */}
          <TouchableOpacity
            style={styles.startButtonContainer}
            disabled={!canStart || selectedCategories.length === 0}
            onPress={() => setGameStarted(true)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#37B6E9', '#6a3de8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.startButton,
                (!canStart || selectedCategories.length === 0) ? styles.disabledButton : {}
              ]}
            >
              <Text style={styles.startButtonText}>
                Start Challenge
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Hint Text */}
          {selectedCategories.length === 0 && (
            <Text style={styles.hintText}>
              Select at least one category to start
            </Text>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 24,
  },
  gradientContainer: {
    borderRadius: 20,
    borderTopLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(55, 182, 233, 0.15)',
    shadowColor: '#37B6E9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 24,
  },
  nameInputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    color: 'white',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: 'Inter',
    borderWidth: 1,
    borderColor: 'rgba(55, 182, 233, 0.2)',
  },
  categoriesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 8,
  },
  categoryButton: {
    margin: 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedCategory: {
    shadowColor: '#37B6E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  categoryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'Inter',
    fontSize: 14,
  },
  selectedCategoryText: {
    color: '#fff',
  },
  selectedCategoriesContainer: {
    marginBottom: 12,
  },
  selectedCategoriesText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontFamily: 'Inter',
  },
  startButtonContainer: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 30,
    marginTop: 16,
    elevation: 5,
  },
  startButton: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 30,
    shadowColor: '#37B6E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  disabledButton: {
    opacity: 0.6,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.5,
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 12,
  }
});

export default QuizStarter