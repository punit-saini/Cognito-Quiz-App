import { account, getCurrentUser } from "@/lib/appwrite";
import { User } from "@/type";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

// Keys for AsyncStorage
const USER_STORAGE_KEY = '@cognito_user_data';
const USER_TIMESTAMP_KEY = '@cognito_user_timestamp';
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

type AuthState = {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;

    setIsAuthenticated: (value: boolean) => void;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;

    fetchAuthenticatedUser: () => Promise<void>;
    loadCachedUser: () => Promise<boolean>;
    clearUserCache: () => Promise<void>;
}

// type User = {
//   name: string;
//   email: string;
//   avatar: string;
// };

// Helper functions for user data caching
const saveUserToCache = async (user: User | null) => {
    try {
        if (user) {
            await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
            await AsyncStorage.setItem(USER_TIMESTAMP_KEY, Date.now().toString());
        } else {
            await AsyncStorage.removeItem(USER_STORAGE_KEY);
            await AsyncStorage.removeItem(USER_TIMESTAMP_KEY);
        }
    } catch (error) {
        console.log('Error saving user data to cache:', error);
    }
};

const isCacheValid = async (): Promise<boolean> => {
    try {
        const timestamp = await AsyncStorage.getItem(USER_TIMESTAMP_KEY);
        if (!timestamp) return false;
        
        const savedTime = parseInt(timestamp);
        const now = Date.now();
        return now - savedTime < CACHE_DURATION;
    } catch (error) {
        console.log('Error checking cache validity:', error);
        return false;
    }
};

const useAuthStore = create<AuthState>((set) => ({
    logout: async () => {
        try {
            // First try to delete the current session
            await account.deleteSession('current');
        } catch (e) {
            console.log('Failed to delete current session:', e);
            
            // If deleting the current session fails, try to get all sessions and delete them
            try {
                const sessions = await account.listSessions();
                if (sessions && sessions.sessions) {
                    // Delete each session one by one
                    for (const session of sessions.sessions) {
                        try {
                            await account.deleteSession(session.$id);
                        } catch (sessionError) {
                            console.log(`Failed to delete session ${session.$id}:`, sessionError);
                        }
                    }
                }
            } catch (sessionsError) {
                console.log('Failed to list or delete sessions:', sessionsError);
            }
        } finally {
            // Clear the cached user data and update the store
            await saveUserToCache(null);
            set({ isAuthenticated: false, user: null });
        }
    },
    isAuthenticated: false,
    user: null,
    isLoading: true,

    setIsAuthenticated: (value) => set({ isAuthenticated: value }),
    setUser: (user) => {
        saveUserToCache(user);
        set({ user });
    },
    setLoading: (value) => set({isLoading: value}),

    // Load cached user data
    loadCachedUser: async () => {
        try {
            // Check if cache is still valid
            const valid = await isCacheValid();
            if (!valid) {
                console.log('User cache expired or not found');
                return false;
            }

            // Load user from cache
            const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
            if (userJson) {
                const user = JSON.parse(userJson) as User;
                console.log('Loaded user from cache:', user.name);
                set({ user, isAuthenticated: true, isLoading: false });
                return true;
            }
            return false;
        } catch (error) {
            console.log('Error loading cached user:', error);
            return false;
        }
    },

    // Clear user cache
    clearUserCache: async () => {
        await saveUserToCache(null);
        console.log('User cache cleared');
    },

    // Fetch user from server and update cache
    fetchAuthenticatedUser: async () => {
        set({isLoading: true});

        try {
            const userData = await getCurrentUser();
            console.log('Fetched user from server');
            
            if (userData) {
                // Convert to User type and ensure it has the necessary fields
                const user = {
                    name: userData.name,
                    email: userData.email,
                    avatar: userData.avatar,
                    // Include any other fields from userData that match User type
                    ...userData
                } as unknown as User;
                
                // Save to store and cache
                set({ isAuthenticated: true, user });
                await saveUserToCache(user);
            } else {
                set({ isAuthenticated: false, user: null });
                await saveUserToCache(null);
            }
        } catch (e) {
            console.log('fetchAuthenticatedUser error', e);
            set({ isAuthenticated: false, user: null });
            await saveUserToCache(null);
        } finally {
            set({ isLoading: false });
        }
    }
}));

export default useAuthStore;