import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { logLogout } from '../services/logService';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fires once with the restored session (or null), then on every sign-in/out
        return onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });
    }, []);

    const logout = async () => {
        if (currentUser) {
            await logLogout(currentUser.uid);
        }
        await signOut(auth);
    };

    const value = {
        currentUser,
        loading,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
