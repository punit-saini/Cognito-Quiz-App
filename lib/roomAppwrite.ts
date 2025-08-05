import { Query } from 'react-native-appwrite';
// Fetch all rooms where user is host or guest and status is finished
export const getRoomsForUser = async (userId: string) => {
  const response = await roomDatabases.listDocuments(
    roomAppwriteConfig.databaseId,
    roomAppwriteConfig.collectionId,
    [
      Query.or([
        Query.equal('hostUserId', userId),
        Query.equal('guestUserId', userId),
      ]),
      Query.equal('status', 'finished'),
    ]
  );
  return response.documents;
};



import { fetchQuizQuestionsFromCategories } from '@/lib/quiz';
import { Client, Databases } from 'react-native-appwrite';

import { ENV } from '@/config';

export const roomAppwriteConfig = {
  endpoint: ENV.APPWRITE_ENDPOINT,
  projectId: ENV.APPWRITE_PROJECT_ID,
  platform: 'com.appsbypunit.cognito',
  databaseId: '688cd4ae0034680b4f52', // <-- set your room database ID here
  collectionId: '688cd4b9000125023803', // <-- set your room collection ID here
};

export const roomClient = new Client();
roomClient
  .setEndpoint(roomAppwriteConfig.endpoint)
  .setProject(roomAppwriteConfig.projectId)
  .setPlatform(roomAppwriteConfig.platform);

export const roomDatabases = new Databases(roomClient);

export const createRoom = async (hostUserId: string, hostName: string, quizCategories: string[] | string, roomId: string) => {
  console.log('Creating room with ID:', roomId);
  
  // Handle multiple categories or "All Categories"
  let formattedCategories: string[];
  const isAllCategories = Array.isArray(quizCategories) && quizCategories.includes('All Categories');
  
  if (isAllCategories) {
    // Will be handled separately in question fetching
    formattedCategories = ['All-Categories'];
  } else if (Array.isArray(quizCategories)) {
    // Format each category in the array
    formattedCategories = quizCategories.map(cat => cat.replace(/\s+/g, '-'));
  } else {
    // For backward compatibility, handle single category as string
    formattedCategories = [quizCategories.replace(/\s+/g, '-')];
  }
  
  console.log('Formatted categories:', formattedCategories);

  // Fetch questions based on selected categories
  let questions: string[] = [];
  try {
    const rawQuestions = await fetchQuizQuestionsFromCategories(formattedCategories, 10);
    // Convert each question object to a JSON string
    questions = rawQuestions.map((q: any) => JSON.stringify(q));
  } catch (e) {
    console.log('Error fetching quiz questions:', e);
  }

  const roomData = {
    roomId,
    hostUserId,
    hostName,
    guestUserId: '',
    guestName: '',
    status: 'waiting',
    quizCategories: formattedCategories, // Store as array instead of string
    questions,
    currentQuestionIndex: 0,
    answers: [],  // Initialize as empty array, will store answer objects as strings
    hostFinished: false,
    guestFinished: false,
    startTime: '',
    questionTimer: 30,
    createdAt: new Date().toISOString(),
  };
  return roomDatabases.createDocument(
    roomAppwriteConfig.databaseId,
    roomAppwriteConfig.collectionId,
    roomId, // Use the provided roomId as the document ID
    roomData,
  );
};

export const getRoomById = async (roomId: string) => {
  return roomDatabases.getDocument(
    roomAppwriteConfig.databaseId,
    roomAppwriteConfig.collectionId,
    roomId
  );
};

export const joinRoomAsGuest = async (roomId: string, guestUserId: string, guestName: string) => {
  return roomDatabases.updateDocument(
    roomAppwriteConfig.databaseId,
    roomAppwriteConfig.collectionId,
    roomId,
    { guestUserId, guestName, status: 'active' }
  );
};

export const submitAnswers = async (roomId: string, userId: string, answers: Record<string, string>) => {
  try {
    // Get current room to update answers array
    const room = await getRoomById(roomId);
    const currentAnswers = room.answers || [];
    
    // Initialize new answers array with existing answers
    let updatedAnswers = [...currentAnswers];
    
    // Convert answers object to array format where each element corresponds to a question
    Object.entries(answers).forEach(([questionId, userAnswer]) => {
      // Extract question index from questionId (assuming format like "q0", "q1" or question.$id)
      const questionIndex = questionId.startsWith('q') 
        ? parseInt(questionId.substring(1)) 
        : room.questions.findIndex((q: string) => {
            try {
              const parsed = JSON.parse(q);
              return parsed.$id === questionId;
            } catch {
              return false;
            }
          });
      
      if (questionIndex >= 0) {
        // Ensure there's an object at this index
        if (!updatedAnswers[questionIndex]) {
          updatedAnswers[questionIndex] = JSON.stringify({});
        }
        
        // Parse existing answer object
        const answerObj = JSON.parse(updatedAnswers[questionIndex] || '{}');
        
        // Add this user's answer
        answerObj[userId] = userAnswer;
        
        // Update answer string in array
        updatedAnswers[questionIndex] = JSON.stringify(answerObj);
      }
    });
    
    // Count how many users have submitted answers
    const userCount = new Set(
      updatedAnswers
        .filter(Boolean)
        .map(ansStr => Object.keys(JSON.parse(ansStr || '{}')))
        .flat()
    ).size;
    
    // Update the room document with the new answers
    return roomDatabases.updateDocument(
      roomAppwriteConfig.databaseId,
      roomAppwriteConfig.collectionId,
      roomId,
      { 
        answers: updatedAnswers,
        // If both users have answered, mark the game as finished
        status: userCount >= 2 ? 'finished' : room.status
      }
    );
  } catch (e) {
    console.log('Error submitting answers:', e);
    throw e;
  }
};

export const markUserFinished = async (roomId: string, userId: string) => {
  try {
    // Get current room state
    const room = await getRoomById(roomId);
    
    // Determine if this is the host or guest
    const isHost = userId === room.hostUserId;
    const isGuest = userId === room.guestUserId;
    
    if (!isHost && !isGuest) {
      throw new Error('User is not part of this room');
    }
    
    // Update the appropriate flag
    const updateData = isHost 
      ? { hostFinished: true }
      : { guestFinished: true };
      
    // Calculate if both users will be finished after this update
    let bothFinished;
    if (isHost) {
      // If host is finishing, check if guest was already finished
      bothFinished = room.guestFinished; // true if guest was already finished
    } else {
      // If guest is finishing, check if host was already finished
      bothFinished = room.hostFinished; // true if host was already finished
    }
    
    // Prepare update data with proper type
    const finalUpdateData: Record<string, any> = {
      ...updateData,
      ...(bothFinished ? { status: 'finished' } : {})
    };
    
    // Update the room document
    return roomDatabases.updateDocument(
      roomAppwriteConfig.databaseId,
      roomAppwriteConfig.collectionId,
      roomId,
      finalUpdateData
    );
  } catch (e) {
    console.log('Error marking user as finished:', e);
    throw e;
  }
};

export const subscribeToRoom = (roomId: string, callback: (room: any) => void) => {
  const channel = `databases.${roomAppwriteConfig.databaseId}.collections.${roomAppwriteConfig.collectionId}.documents.${roomId}`;
  const unsubscribe = roomClient.subscribe(channel, (event: any) => {
    if (event.payload) {
      callback(event.payload);
    }
  });
  return unsubscribe;
};

/**
 * Explicitly close all realtime connections.
 * Call this when navigating away from the game completely.
 * 
 * This function doesn't actually close all connections as Appwrite client doesn't
 * provide a direct method for that. Instead, you should ensure each component
 * properly calls the unsubscribe function returned by subscribeToRoom.
 */
export const closeRoomConnections = () => {
  try {
    console.log('Reminder: Make sure to call unsubscribe functions when components unmount');
    // Note: Appwrite client doesn't provide a direct method to unsubscribe from all channels
    // Each component should properly clean up its own subscriptions
  } catch (e) {
    console.log('Error with realtime connections:', e);
  }
};

// Add a function to update the room status
export const updateRoomStatus = async (roomId: string, status: string) => {
  try {
    return await roomDatabases.updateDocument(
      roomAppwriteConfig.databaseId,
      roomAppwriteConfig.collectionId,
      roomId,
      { status }
    );
  } catch (e) {
    console.log('Error updating room status:', e);
    throw e;
  }
};

export const disconnectRealtime = () => {
  try {
    // First try to close using standard method
    // @ts-ignore
    if (roomClient && roomClient.realtime && typeof roomClient.realtime.close === 'function') {
      // @ts-ignore
      roomClient.realtime.close();
      console.log('Appwrite realtime connection closed');
    }
    
    // Force clean up any lingering WebSocket connections
    // @ts-ignore
    if (roomClient && roomClient.realtime && roomClient.realtime.connection) {
      // @ts-ignore
      if (roomClient.realtime.connection.socket) {
        try {
          // @ts-ignore
          roomClient.realtime.connection.socket.close();
          console.log('Forced WebSocket connection closed');
        } catch (wsErr) {
          console.log('Error closing WebSocket connection:', wsErr);
        }
      }
      
      // @ts-ignore
      // Remove all event listeners
      if (roomClient.realtime.connection.listeners) {
        // @ts-ignore
        roomClient.realtime.connection.listeners = {};
        console.log('Removed all realtime event listeners');
      }
      
      // @ts-ignore
      // Clear any reconnect timers
      if (roomClient.realtime.connection.timeout) {
        // @ts-ignore
        clearTimeout(roomClient.realtime.connection.timeout);
        console.log('Cleared realtime reconnection timers');
      }
    }
    
    // Create a new client to ensure clean state
    // This is drastic but ensures no lingering connections
    roomClient.setEndpoint(roomAppwriteConfig.endpoint)
              .setProject(roomAppwriteConfig.projectId)
              .setPlatform(roomAppwriteConfig.platform);
              
    console.log('Appwrite client reset to ensure clean state');
  } catch (e) {
    console.log('Error disconnecting Appwrite realtime:', e);
  }
};