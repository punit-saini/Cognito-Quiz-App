import { account, getCurrentUser } from "@/lib/appwrite";
import { User } from "@/type";
import { create } from 'zustand';

type AuthState = {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;

    setIsAuthenticated: (value: boolean) => void;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;

    fetchAuthenticatedUser: () => Promise<void>;
}

// type User = {
//   name: string;
//   email: string;
//   avatar: string;
// };

const useAuthStore = create<AuthState>((set) => ({
    logout: async () => {
        try {
            // Remove current session from Appwrite
            await account.deleteSession('current');
        } catch (e) {
            console.log('Logout error', e);
        } finally {
            set({ isAuthenticated: false, user: null });
        }
    },
    isAuthenticated: false,
    user: null,
    isLoading: true,

    setIsAuthenticated: (value) => set({ isAuthenticated: value }),
    setUser: (user) => set({ user }),
    setLoading: (value) => set({isLoading: value}),

    fetchAuthenticatedUser: async () => {
        set({isLoading: true});

        try {
            const user = await getCurrentUser();
            console.log('Fetched user, inside auth store', user);
            if(user) set({ isAuthenticated: true, user: user as User })
            else set( { isAuthenticated: false, user: null } );
        } catch (e) {
            console.log('fetchAuthenticatedUser error', e);
            set({ isAuthenticated: false, user: null })
        } finally {
            set({ isLoading: false });
        }
    }
}))

export default useAuthStore;