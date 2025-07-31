import { databases } from '@/lib/appwrite'; // or your Appwrite setup
import { Query } from 'react-native-appwrite';


// export async function uploadAllQuizQuestions() {
//   for (let i = 0; i < QUIZ_DATA.length; i++) {
//     try {
//       const res = await addQuizQuestion(QUIZ_DATA[i]);
//       if (res) {
//         console.log(`Successfully uploaded question at index ${i}`);
//       } else {
//         console.log(`Failed to upload question at index ${i}`);
//       }
//     } catch (error) {
//       console.error(`Error uploading question at index ${i}:`, error);
//     }
//   }
// }

// uploadAllQuizQuestions().then(() => {
//   console.log('All questions processed');
// });
// lib/quiz.ts


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

export async function addQuizQuestion(data: any) {
  try {
    const response = await databases.createDocument(
      '688b2719001d231d87fe', // databaseId
      '688b2730002233d28407', // collectionId
      'unique()', // documentId
      data // { question, options, answer, category, ... }
    );
    console.log('Added question:', response);
    return response;
  } catch (error) {
    console.error('Error adding question:', error);
    return null;
  }
}