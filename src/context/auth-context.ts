import { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';
import type { AccountRole } from '../types';

export interface AuthContextType {
    currentUser: User | null;
    /** From the account's profile (users/{uid}); null = signed in but not given access, or access removed */
    role: AccountRole | null;
    /** Can manage user accounts */
    isAdmin: boolean;
    /** Read-only account: can view everything, change nothing */
    isAuditor: boolean;
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
