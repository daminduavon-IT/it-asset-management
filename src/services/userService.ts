import { deleteApp, initializeApp } from 'firebase/app';
import {
    connectAuthEmulator,
    createUserWithEmailAndPassword,
    deleteUser,
    inMemoryPersistence,
    initializeAuth,
    updateProfile
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { OWNER_UID, isAccountRole } from '../constants/accounts';
import { logSystemActivity } from './logService';
import type { AccountRole, UserAccount } from '../types';

// users/{uid}: what each sign-in is allowed to do. An account without an active profile has no access at all.
const USERS_COLLECTION = 'users';

// Who is acting, for the audit log
const currentActor = () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in');
    return { uid: user.uid, userName: user.displayName || 'Unknown', email: user.email || 'Unknown' };
};

/** The role of a signed-in account, or null when it has no (active) profile. firestore.rules applies the same logic. */
export const getAccountRole = async (user: User): Promise<AccountRole | null> => {
    if (user.uid === OWNER_UID) return 'admin';
    const profile = (await getDoc(doc(db, USERS_COLLECTION, user.uid))).data();
    return profile?.active === true && isAccountRole(profile.role) ? profile.role : null;
};

export const getUserAccounts = async (): Promise<UserAccount[]> => {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    const accounts = snapshot.docs.map(d => ({ ...d.data(), uid: d.id }) as UserAccount);

    // The main administrator works without a profile; save one the first time so the list is complete
    const user = auth.currentUser;
    if (user?.uid === OWNER_UID && !accounts.some(account => account.uid === OWNER_UID)) {
        const profile = { name: user.displayName || 'Administrator', email: user.email || '', role: 'admin' as const, active: true };
        await setDoc(doc(db, USERS_COLLECTION, OWNER_UID), { ...profile, createdAt: serverTimestamp() });
        accounts.push({ ...profile, uid: OWNER_UID, createdAt: Date.now() });
    }

    return accounts.sort((a, b) => a.name.localeCompare(b.name));
};

export const createUserAccount = async (input: { name: string; email: string; role: AccountRole; password: string }) => {
    const actor = currentActor();

    // A second, memory-only Firebase app creates the sign-in, so the administrator stays signed in as themselves
    const creatorApp = initializeApp(auth.app.options, 'account-creator');
    try {
        const creatorAuth = initializeAuth(creatorApp, { persistence: inMemoryPersistence });
        const emulator = auth.emulatorConfig;
        if (emulator) {
            connectAuthEmulator(creatorAuth, `${emulator.protocol}://${emulator.host}:${emulator.port}`, { disableWarnings: true });
        }

        const { user } = await createUserWithEmailAndPassword(creatorAuth, input.email, input.password);
        try {
            await updateProfile(user, { displayName: input.name });
            await setDoc(doc(db, USERS_COLLECTION, user.uid), {
                name: input.name,
                email: input.email,
                role: input.role,
                active: true,
                createdAt: serverTimestamp(),
                createdByUid: actor.uid,
                createdByName: actor.userName
            });
        } catch (error) {
            // Without a profile the sign-in would have no access and would block the email address; take it back out
            await deleteUser(user).catch(() => undefined);
            throw error;
        }

        await logSystemActivity({
            ...actor,
            action: 'CREATE',
            module: 'Users',
            recordId: user.uid,
            recordName: input.email,
            newData: { name: input.name, email: input.email, role: input.role }
        });
    } finally {
        await deleteApp(creatorApp).catch(() => undefined);
    }
};

/** Change an account's role, or switch its access off or back on. */
export const updateUserAccount = async (account: UserAccount, changes: { role?: AccountRole; active?: boolean }) => {
    const actor = currentActor();
    await updateDoc(doc(db, USERS_COLLECTION, account.uid), changes);
    await logSystemActivity({
        ...actor,
        action: 'UPDATE',
        module: 'Users',
        recordId: account.uid,
        recordName: account.email,
        oldData: { role: account.role, active: account.active },
        newData: changes,
        changedFields: Object.keys(changes)
    });
};
