import { CreateUserParams, SignInParams } from "@/type";
import { Account, Avatars, Client, Databases, ID, Query, Storage } from "react-native-appwrite";

// Utility function to handle retrying operations with exponential backoff
export const retryOperation = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
): Promise<T> => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            // Only retry if it's a rate limit error
            if (String(error).includes('rate limit') && attempt < maxRetries) {
                const delay = initialDelay * Math.pow(2, attempt - 1);
                console.log(`Rate limit hit. Retrying in ${delay}ms (Attempt ${attempt}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                break;
            }
        }
    }
    throw lastError;
};

// Utility function to convert Appwrite errors to user-friendly messages
const handleAppwriteError = (error: any): string => {
    const errorMessage = String(error) || "An unknown error occurred";
    
    // User creation/authentication errors
    if (errorMessage.includes("user already exists")) {
        return "This email address is already registered. Please try signing in instead.";
    }
    if (errorMessage.includes("Invalid credentials")) {
        return "Incorrect email or password. Please check your details and try again.";
    }
    if (errorMessage.includes("rate limit")) {
        return "Too many attempts. Please wait a moment before trying again.";
    }
    if (errorMessage.includes("User not found")) {
        return "Account not found. Please check your email or sign up for a new account.";
    }
    if (errorMessage.includes("Password must be")) {
        return "Your password doesn't meet the security requirements. Please use at least 8 characters including letters and numbers.";
    }
    if (errorMessage.includes("Invalid email")) {
        return "Please enter a valid email address.";
    }
    
    // Connection/network errors
    if (errorMessage.includes("Network error") || errorMessage.includes("Failed to fetch")) {
        return "Connection error. Please check your internet connection and try again.";
    }
    
    // Session errors
    if (errorMessage.includes("Session not found")) {
        return "Your session has expired. Please sign in again.";
    }
    
    // Multiplayer/game errors
    if (errorMessage.includes("Document not found") && errorMessage.includes("game")) {
        return "Game session not found or has ended.";
    }
    
    // If no specific error is matched, return a generic message
    console.log("Original Appwrite error:", errorMessage);
    return "Something went wrong. Please try again later.";
};

import { ENV } from '@/config';

export const appwriteConfig = {
    endpoint: ENV.APPWRITE_ENDPOINT,
    projectId: ENV.APPWRITE_PROJECT_ID,
    platform: "com.appsbypunit.cognito",
    databaseId: '688adc4b00070847c88e',
    userCollectionId: '688adc5e00088013392e',
    deletedUsersCollectionId: '689b685c00090036bb0f',
}

export const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform)

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
const avatars = new Avatars(client);

export const createUser = async ({ email, password, name }: CreateUserParams) => {
    try {
        const newAccount = await account.create(ID.unique(), email, password, name)
        if(!newAccount) throw Error;

        await signIn({ email, password });

        const avatarUrl = avatars.getInitialsURL(name);

        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            { email, name, userId: newAccount.$id, avatar: avatarUrl }
        );
    } catch (e) {
        const friendlyMessage = handleAppwriteError(e);
        throw new Error(friendlyMessage);
    }
}

export const signIn = async ({ email, password }: SignInParams) => {
    try {
        // First check if there's already a session and try to delete it
        try {
            await account.deleteSession('current');
            console.log('Deleted existing session before sign-in');
        } catch (sessionError) {
            // If there's no current session, this will fail - that's fine
            console.log('No existing session to delete or failed to delete');
        }
        
        // Now create a new session
        const session = await account.createEmailPasswordSession(email, password);
        return session;
    } catch (e) {
        const errorMessage = String(e);
        
        // Handle the specific case of "session already active"
        if (errorMessage.includes("prohibited when a session is active")) {
            console.log("Session already active error, trying to delete sessions and retry");
            
            try {
                // Try to delete all existing sessions
                const sessions = await account.listSessions();
                if (sessions && sessions.sessions) {
                    for (const session of sessions.sessions) {
                        try {
                            await account.deleteSession(session.$id);
                        } catch (deleteErr) {
                            console.log(`Failed to delete session ${session.$id}:`, deleteErr);
                        }
                    }
                }
                
                // Retry login after clearing sessions
                return await account.createEmailPasswordSession(email, password);
            } catch (retryError) {
                console.log("Failed to retry login after session error:", retryError);
                const friendlyRetryMessage = handleAppwriteError(retryError);
                throw new Error(friendlyRetryMessage);
            }
        }
        
        const friendlyMessage = handleAppwriteError(e);
        throw new Error(friendlyMessage);
    }
}

export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();
        if(!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('userId', currentAccount.$id)]
        )

        if(!currentUser) throw Error;

        return currentUser.documents[0];
    } catch (e) {
        // For getCurrentUser, we often want to handle the error silently or show a generic message
        console.log("Get current user error:", e);
        // In this case, we should handle session expiration gracefully
        const errorMessage = String(e);
        if (errorMessage.includes("Session not found") || errorMessage.includes("User not found")) {
            // We can either return null or throw a friendly error depending on how you want to handle it
            return null;
        }
        const friendlyMessage = handleAppwriteError(e);
        throw new Error(friendlyMessage);
    }
}

// Helper function for handling errors in game-specific functions
export const handleGameError = (error: any, context: string = "game"): Error => {
    let message = handleAppwriteError(error);
    
    // Add more specific game-related error messages based on context
    if (context === "matchmaking") {
        if (String(error).includes("not found")) {
            message = "No matching players found. Please try again.";
        }
    } else if (context === "game-join") {
        if (String(error).includes("permission denied")) {
            message = "You cannot join this game. It may be private or already full.";
        }
    } else if (context === "game-action") {
        if (String(error).includes("permission denied")) {
            message = "It's not your turn or you cannot perform this action.";
        }
    } else if (context === "connection") {
        message = "Connection to game server lost. Please check your internet connection.";
    }
    
    console.log(`${context.toUpperCase()} ERROR:`, error);
    return new Error(message);
}

// Example of how you might use the error handler in a game function
/*
export const joinMultiplayerGame = async (gameId: string) => {
    try {
        // Your game joining logic here
        const result = await someGameJoinFunction(gameId);
        return result;
    } catch (e) {
        throw handleGameError(e, "game-join");
    }
}
*/