import { QUIZ_DATA } from '@/constants/quizdata';
import { databases } from '@/lib/appwrite'; // or your Appwrite setup
import { Query } from 'react-native-appwrite';


export async function uploadAllQuizQuestions() {
  for (let i = 0; i < QUIZ_DATA.length; i++) {
    try {
      const res = await addQuizQuestion(QUIZ_DATA[i]);
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





export async function fetchQuizQuestions(category: string, limit: number = 10) {
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
    return response.documents; // Array of question objects
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
}

// Function to fetch questions from multiple categories or random categories
export async function fetchQuizQuestionsFromCategories(categories: string[], totalQuestions: number = 10) {
  try {
    // If "All Categories" is selected, fetch random questions
    if (categories.includes('All-Categories')) {
      const response = await databases.listDocuments(
        '688b2719001d231d87fe',
        '688b2730002233d28407',
        [Query.limit(totalQuestions)]
      );
      
      // Shuffle the results
      const shuffledResults = response.documents.sort(() => Math.random() - 0.5);
      return shuffledResults;
    }
    
    // Calculate how many questions to fetch from each category
    const questionsPerCategory = Math.ceil(totalQuestions / categories.length);
    
    // Fetch questions from each category
    const allQuestions = [];
    
    for (const category of categories) {
      const response = await databases.listDocuments(
        '688b2719001d231d87fe',
        '688b2730002233d28407',
        [
          Query.equal('category', category),
          Query.limit(questionsPerCategory)
        ]
      );
      
      allQuestions.push(...response.documents);
    }
    
    // Trim to desired total and shuffle
    const trimmedQuestions = allQuestions.slice(0, totalQuestions);
    const shuffledQuestions = trimmedQuestions.sort(() => Math.random() - 0.5);
    
    return shuffledQuestions;
  } catch (error) {
    console.error('Error fetching questions from categories:', error);
    return [];
  }
}

export async function addQuizQuestion(data: any) {
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