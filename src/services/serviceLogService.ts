import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { logSystemActivity } from './logService';
import type { ServiceLog } from '../types';

const SERVICE_LOGS_COLLECTION = 'service_logs';

/** Fetch all service records for a given asset, newest first */
export const getServiceLogsByAsset = async (assetId: string): Promise<ServiceLog[]> => {
    const logsRef = collection(db, SERVICE_LOGS_COLLECTION);
    const q = query(
        logsRef,
        where('assetId', '==', assetId)
    );
    const snap = await getDocs(q);
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as ServiceLog[];
    
    // Sort client-side to avoid needing a Firestore composite index
    return logs.sort((a, b) => {
        return new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime();
    });
};

/** Add a new service record */
export const addServiceLog = async (
    data: Omit<ServiceLog, 'id' | 'createdAt' | 'updatedAt' | 'createdByUid' | 'createdByName'>
): Promise<string> => {
    const currentUser = auth.currentUser;
    const newDoc = {
        ...data,
        createdByUid: currentUser?.uid || 'unknown',
        createdByName: currentUser?.displayName || 'Unknown',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    // Strip undefined values so Firestore doesn't complain
    const cleanDoc = Object.fromEntries(
        Object.entries(newDoc).filter(([, v]) => v !== undefined && v !== '')
    );

    const docRef = await addDoc(collection(db, SERVICE_LOGS_COLLECTION), cleanDoc);

    if (currentUser) {
        await logSystemActivity({
            uid: currentUser.uid,
            userName: currentUser.displayName || 'Unknown',
            email: currentUser.email || 'unknown',
            action: 'CREATE',
            module: 'ServiceLogs',
            recordId: docRef.id,
            recordName: `${data.serviceType} – ${data.assetName}`,
            newData: cleanDoc
        });
    }

    return docRef.id;
};

/** Update an existing service record */
export const updateServiceLog = async (
    id: string,
    data: Partial<ServiceLog>,
    oldData?: ServiceLog
): Promise<void> => {
    const docRef = doc(db, SERVICE_LOGS_COLLECTION, id);
    const updatedDoc = {
        ...data,
        updatedAt: serverTimestamp()
    };
    await updateDoc(docRef, updatedDoc);

    const currentUser = auth.currentUser;
    if (currentUser) {
        await logSystemActivity({
            uid: currentUser.uid,
            userName: currentUser.displayName || 'Unknown',
            email: currentUser.email || 'unknown',
            action: 'UPDATE',
            module: 'ServiceLogs',
            recordId: id,
            recordName: data.assetName || 'Service Record',
            oldData,
            newData: updatedDoc
        });
    }
};

/** Delete a service record */
export const deleteServiceLog = async (id: string, log?: ServiceLog): Promise<void> => {
    await deleteDoc(doc(db, SERVICE_LOGS_COLLECTION, id));

    const currentUser = auth.currentUser;
    if (currentUser) {
        await logSystemActivity({
            uid: currentUser.uid,
            userName: currentUser.displayName || 'Unknown',
            email: currentUser.email || 'unknown',
            action: 'DELETE',
            module: 'ServiceLogs',
            recordId: id,
            recordName: log ? `${log.serviceType} – ${log.assetName}` : 'Service Record',
            oldData: log
        });
    }
};
