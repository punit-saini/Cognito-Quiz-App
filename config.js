import Constants from 'expo-constants';

// Access environment variables safely
export const ENV = {
  APPWRITE_ENDPOINT: Constants.expoConfig?.extra?.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID: Constants.expoConfig?.extra?.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
};
