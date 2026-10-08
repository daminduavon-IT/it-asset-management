import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getDeviceInfo } from '../utils/deviceInfo';
import { toMillis } from '../utils/format';
import type { ActivityAction } from '../types';

const LOGIN_LOGS_COLLECTION = 'login_logs';
const ACTIVITY_LOGS_COLLECTION = 'activity_logs';

// Document id of this browser's login_logs entry, so logout closes this session and not another device's
const LOGIN_LOG_KEY = 'itam.loginLogId';

const rememberLoginLog = (id: string | null) => {
  try {
    if (id) localStorage.setItem(LOGIN_LOG_KEY, id);
    else localStorage.removeItem(LOGIN_LOG_KEY);
  } catch {
    // storage unavailable — logout falls back to the most recent open session
  }
};

const storedLoginLog = () => {
  try {
    return localStorage.getItem(LOGIN_LOG_KEY);
  } catch {
    return null;
  }
};

/**
 * 1. Log a new login attempt (both successful and failed)
 */
export const logLoginAttempt = async (
  uid: string | null,
  userName: string,
  email: string,
  status: 'SUCCESS' | 'FAILED',
  sessionId: string = crypto.randomUUID()
) => {
  try {
    const { browser, os, userAgent } = getDeviceInfo();

    const newDoc = await addDoc(collection(db, LOGIN_LOGS_COLLECTION), {
      uid: uid || 'UNKNOWN',
      userName,
      email,
      loginTime: serverTimestamp(),
      logoutTime: null,
      loginStatus: status,
      sessionId,
      deviceInfo: userAgent,
      browser,
      os,
      createdAt: serverTimestamp()
    });

    if (status === 'SUCCESS') rememberLoginLog(newDoc.id);
    return { docId: newDoc.id, sessionId };
  } catch (error) {
    console.error('Error logging login attempt:', error);
    return null;
  }
};

/**
 * 2. Update logout time for a specific session
 */
export const logLogout = async (uid: string) => {
  try {
    let sessionDocId = storedLoginLog();

    if (!sessionDocId) {
      // Single-field filter only, so no composite index is needed; newest open session wins
      const snapshot = await getDocs(query(collection(db, LOGIN_LOGS_COLLECTION), where('uid', '==', uid)));
      const openSession = snapshot.docs
        .filter(d => d.data().loginStatus === 'SUCCESS' && !d.data().logoutTime)
        .sort((a, b) => (toMillis(b.data().loginTime) ?? 0) - (toMillis(a.data().loginTime) ?? 0))[0];
      sessionDocId = openSession?.id ?? null;
    }

    if (sessionDocId) {
      await updateDoc(doc(db, LOGIN_LOGS_COLLECTION, sessionDocId), { logoutTime: serverTimestamp() });
    }
    rememberLoginLog(null);
  } catch (error) {
    console.error('Error logging logout:', error);
  }
};

/**
 * 3. Log user activity within the system
 */
export const logSystemActivity = async (params: {
  uid: string;
  userName: string;
  email: string;
  action: ActivityAction;
  module: string;
  recordId: string;
  recordName: string;
  oldData?: object | null;
  newData?: object | null;
  changedFields?: string[];
  reason?: string;
  sessionId?: string;
}) => {
  try {
    await addDoc(collection(db, ACTIVITY_LOGS_COLLECTION), {
      ...params,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging system activity:', error);
  }
};
