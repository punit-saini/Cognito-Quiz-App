import { QUIZ_DATA } from '@/constants/quizdata';
import { databases } from '@/lib/appwrite'; // or your Appwrite setup
import { Query } from 'react-native-appwrite';

// Define QuizQuestion type for better type safety
export interface QuizQuestion {
  $id?: string;
  question: string;
  options: string[];
  answer: string;
  category: string;
  difficulty?: string;
  [key: string]: any; // For any additional properties that might be present
}


export async function uploadAllQuizQuestions(): Promise<void> {
  for (let i = 0; i < QUIZ_DATA.length; i++) {
    try {
      const res = await addQuizQuestion(QUIZ_DATA[i] as Omit<QuizQuestion, '$id'>);
      if (res) {
        console.log(`Successfully uploaded question at index ${i}`);
      } else {
        console.log(`Failed to upload question at index ${i}`);
      }
    } catch (error) {
      console.error(`Error uploading question at index ${i}:`, error);
    }
  }
}





export async function fetchQuizQuestions(category: string, limit: number = 10): Promise<QuizQuestion[]> {
  try {
    const response = await databases.listDocuments(
      '688b2719001d231d87fe',
      '688b2730002233d28407',
      [
        Query.equal('category', category),
        Query.limit(limit)
      ]
    );
    // console.log('Fetched questions:', response.documents);
    return response.documents as unknown as QuizQuestion[]; // Array of question objects
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
}

// Function to fetch questions from multiple categories or random categories
export async function fetchQuizQuestionsFromCategories(categories: string[], totalQuestions: number = 10): Promise<QuizQuestion[]> {
  try {
    // If "All Categories" is selected, fetch questions from General Knowledge category
    if (categories.includes('All-Categories') || categories.includes('All Categories')) {
      // Try both possible formats of the General Knowledge category name
      const selectedQuestions: QuizQuestion[] = [];
      const selectedQuestionsText = new Set<string>(); // Track question text to avoid duplicates
      
      // Try both formats of General Knowledge - with hyphen and with space
      const response = await databases.listDocuments(
        '688b2719001d231d87fe',
        '688b2730002233d28407',
        [
          Query.equal('category', ['General-Knowledge', 'General Knowledge']),
          Query.limit(totalQuestions * 3) // Get more than needed to account for duplicates
        ]
      );
      
      console.log(`Fetched ${response.documents.length} questions from General Knowledge category`);
      
      // Shuffle the results for variety
      const shuffled = [...response.documents].sort(() => Math.random() - 0.5);
      
      // Add non-duplicate questions
      for (const question of shuffled) {
        if (!selectedQuestionsText.has(question.question)) {
          selectedQuestionsText.add(question.question);
          selectedQuestions.push(question as unknown as QuizQuestion);
          
          if (selectedQuestions.length >= totalQuestions) {
            break;
          }
        }
      }
      
      // If we still don't have enough questions from General Knowledge category,
      // get random questions from any category to fill the gap
      if (selectedQuestions.length < totalQuestions) {
        const remainingNeeded = totalQuestions - selectedQuestions.length;
        console.log(`Need ${remainingNeeded} more questions from any category`);
        
        const additionalResponse = await databases.listDocuments(
          '688b2719001d231d87fe',
          '688b2730002233d28407',
          [
            Query.notEqual('category', ['General-Knowledge', 'General Knowledge']), // Exclude General Knowledge to avoid duplicates
            Query.limit(remainingNeeded * 3)
          ]
        );
        
        // Shuffle all results
        const additionalShuffled = [...additionalResponse.documents].sort(() => Math.random() - 0.5);
        
        for (const question of additionalShuffled) {
          if (!selectedQuestionsText.has(question.question)) {
            selectedQuestionsText.add(question.question);
            selectedQuestions.push(question as unknown as QuizQuestion);
            
            if (selectedQuestions.length >= totalQuestions) {
              break;
            }
          }
        }
      }
      
      // Change the category property of each question to "All Categories"
      // so the UI will display "All Categories" instead of "General Knowledge"
      selectedQuestions.forEach(question => {
        question.category = 'All Categories';
      });
      
      // Final shuffle of selected questions
      return selectedQuestions.sort(() => Math.random() - 0.5);
    }
    
    // For specific categories
    // First get counts for each category to know how many questions are available
    const categoryCounts: Record<string, number> = {};
    for (const category of categories) {
      const countResponse = await databases.listDocuments(
        '688b2719001d231d87fe',
        '688b2730002233d28407',
        [Query.equal('category', category)]
      );
      categoryCounts[category] = countResponse.total;
    }
    
    // Calculate how many questions to fetch from each category
    // Distribute questions proportionally based on available counts
    const totalAvailable = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
    const questionsDistribution: Record<string, number> = {};
    
    for (const category of categories) {
      const proportion = categoryCounts[category] / totalAvailable;
      // Ensure at least one question per selected category
      questionsDistribution[category] = Math.max(1, Math.floor(totalQuestions * proportion));
    }
    
    // Adjust distribution if the total doesn't match the requested count
    const distributedTotal = Object.values(questionsDistribution).reduce((a, b) => a + b, 0);
    
    if (distributedTotal < totalQuestions) {
      // Add remaining questions to categories with more available questions
      let remaining = totalQuestions - distributedTotal;
      const sortedCategories = [...categories].sort((a, b) => categoryCounts[b] - categoryCounts[a]);
      
      for (const category of sortedCategories) {
        if (remaining <= 0) break;
        if (questionsDistribution[category] < categoryCounts[category]) {
          questionsDistribution[category]++;
          remaining--;
        }
      }
    }
    
    // Fetch questions from each category
    const allQuestions: QuizQuestion[] = [];
    const selectedQuestionsText = new Set<string>(); // Track question text to avoid duplicates
    
    for (const category of categories) {
      const targetCount = questionsDistribution[category];
      const categoryQuestions: QuizQuestion[] = [];
      
      // If we need most or all questions in the category, just fetch them all and pick randomly
      if (targetCount > categoryCounts[category] * 0.7) {
        const response = await databases.listDocuments(
          '688b2719001d231d87fe',
          '688b2730002233d28407',
          [Query.equal('category', category)]
        );
        
        // Shuffle the results for this category
        const shuffled = response.documents.sort(() => Math.random() - 0.5);
        
        // Add non-duplicate questions
        for (const question of shuffled) {
          if (!selectedQuestionsText.has(question.question)) {
            selectedQuestionsText.add(question.question);
            categoryQuestions.push(question as unknown as QuizQuestion);
            
            if (categoryQuestions.length >= targetCount) {
              break;
            }
          }
        }
      } 
      // Otherwise, get random questions with offsets
      else {
        while (categoryQuestions.length < targetCount) {
          // Get a batch with random offset
          const batchSize = Math.min(targetCount * 2, 20);
          const maxOffset = Math.max(0, categoryCounts[category] - batchSize);
          const offset = Math.floor(Math.random() * Math.max(1, maxOffset));
          
          const response = await databases.listDocuments(
            '688b2719001d231d87fe',
            '688b2730002233d28407',
            [
              Query.equal('category', category),
              Query.limit(batchSize),
              Query.offset(offset)
            ]
          );
          
          // Process questions in this batch
          for (const question of response.documents) {
            if (!selectedQuestionsText.has(question.question)) {
              selectedQuestionsText.add(question.question);
              categoryQuestions.push(question as unknown as QuizQuestion);
              
              if (categoryQuestions.length >= targetCount) {
                break;
              }
            }
          }
          
          // Safety break to avoid infinite loops if we can't find enough unique questions
          if (response.documents.length < batchSize) {
            break;
          }
        }
      }
      
      allQuestions.push(...categoryQuestions);
    }
    
    // Shuffle all questions together
    return allQuestions.sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error('Error fetching questions from categories:', error);
    return [];
  }
}

export async function addQuizQuestion(data: Omit<QuizQuestion, '$id'>) {
  try {
    // Ensure category uses dashes instead of spaces
    const formattedData = {
      ...data,
      category: typeof data.category === 'string' ? data.category.replace(/\s+/g, '-') : data.category,
    };
    const response = await databases.createDocument(
      '688b2719001d231d87fe', // databaseId
      '688b2730002233d28407', // collectionId
      'unique()', // documentId
      formattedData // { question, options, answer, category, ... }
    );
    console.log('Added question:', response);
    return response;
  } catch (error) {
    console.error('Error adding question:', error);
    return null;
  }
}