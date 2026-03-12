import { collection, addDoc, updateDoc, doc, serverTimestamp, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getDeviceInfo } from '../utils/deviceInfo';

const LOGIN_LOGS_COLLECTION = 'login_logs';
const ACTIVITY_LOGS_COLLECTION = 'activity_logs';

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
    
    const logsRef = collection(db, LOGIN_LOGS_COLLECTION);
    const newDoc = await addDoc(logsRef, {
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
    const logsRef = collection(db, LOGIN_LOGS_COLLECTION);
    // Only filter by uid + loginStatus (no orderBy needed = no composite index required)
    const q = query(
      logsRef,
      where('uid', '==', uid),
      where('loginStatus', '==', 'SUCCESS'),
      orderBy('loginTime', 'desc'),
      limit(5) // Grab last 5, then pick the first one without a logout time
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Find the most recent session that has no logout time yet
      const activeSession = querySnapshot.docs.find(
        doc => !doc.data().logoutTime
      );

      if (activeSession) {
        await updateDoc(doc(db, LOGIN_LOGS_COLLECTION, activeSession.id), {
          logoutTime: serverTimestamp()
        });
      }
    }
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
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'TRANSFER';
  module: string;
  recordId: string;
  recordName: string;
  oldData?: any;
  newData?: any;
  changedFields?: string[];
  reason?: string;
  sessionId?: string;
}) => {
  try {
    const activityRef = collection(db, ACTIVITY_LOGS_COLLECTION);
    await addDoc(activityRef, {
      ...params,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging system activity:', error);
  }
};
