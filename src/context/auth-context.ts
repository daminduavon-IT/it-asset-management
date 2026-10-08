import { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';

export interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
