import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { logLogout } from '../services/logService';
import { getAccountRole } from '../services/userService';
import { AuthContext } from './auth-context';
import type { AccountRole } from '../types';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [role, setRole] = useState<AccountRole | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fires once with the restored session (or null), then on every sign-in/out
        return onAuthStateChanged(auth, async (user) => {
            let accountRole: AccountRole | null = null;
            try {
                accountRole = user ? await getAccountRole(user) : null;
            } catch (error) {
                // The database rules still enforce the role; this only drives what the UI offers
                console.error('Could not read account role:', error);
            }
            // A sign-out or another sign-in happened while the role was loading: that event sets the state instead
            if (auth.currentUser?.uid !== user?.uid) return;
            setCurrentUser(user);
            setRole(accountRole);
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
        role,
        isAdmin: role === 'admin',
        isAuditor: role === 'auditor',
        loading,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
