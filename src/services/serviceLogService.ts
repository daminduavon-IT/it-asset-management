import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { logSystemActivity } from './logService';
import { getAssetById, setAssetNextServiceDate } from '../config/assetService';
import { parseDate } from '../utils/format';
import type { ServiceLog } from '../types';

const SERVICE_LOGS_COLLECTION = 'service_logs';

// Who is acting, for the record and the audit log
const currentActor = () => {
    const user = auth.currentUser;
    return user ? { uid: user.uid, userName: user.displayName || 'Unknown', email: user.email || 'unknown' } : null;
};

// Blank optional fields are left out of the document, like the existing records
const optionalText = (value?: string | null) => value?.trim() || undefined;

/** Fetch all service records for a given asset, newest first */
export const getServiceLogsByAsset = async (assetId: string): Promise<ServiceLog[]> => {
    // Single-field filter and client-side sort, so no composite index is needed
    const snapshot = await getDocs(query(collection(db, SERVICE_LOGS_COLLECTION), where('assetId', '==', assetId)));
    return snapshot.docs
        .map(d => ({ ...d.data(), id: d.id }) as ServiceLog)
        .sort((a, b) => (parseDate(b.serviceDate)?.getTime() ?? 0) - (parseDate(a.serviceDate)?.getTime() ?? 0));
};

/** Add a new service record */
export const addServiceLog = async (
    data: Omit<ServiceLog, 'id' | 'createdAt' | 'updatedAt' | 'createdByUid' | 'createdByName'>
): Promise<string> => {
    const actor = currentActor();

    const newDoc = {
        assetId: data.assetId,
        assetName: data.assetName,
        assetCategory: data.assetCategory,
        serviceDate: data.serviceDate,
        serviceType: data.serviceType,
        serviceDetails: optionalText(data.serviceDetails),
        partsReplaced: optionalText(data.partsReplaced),
        technicianName: optionalText(data.technicianName),
        serviceProvider: optionalText(data.serviceProvider),
        serviceCost: typeof data.serviceCost === 'number' && Number.isFinite(data.serviceCost) ? data.serviceCost : undefined,
        nextServiceDate: optionalText(data.nextServiceDate),
        remarks: optionalText(data.remarks),
        createdByUid: actor?.uid || 'unknown',
        createdByName: actor?.userName || 'Unknown',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, SERVICE_LOGS_COLLECTION), newDoc);

    if (actor) {
        await logSystemActivity({
            ...actor,
            action: 'CREATE',
            module: 'ServiceLogs',
            recordId: docRef.id,
            recordName: `${data.serviceType} – ${data.assetName}`,
            newData: newDoc
        });
    }

    // Carry the next due date over to the asset so dashboard reminders follow the latest service —
    // earlier or later than the current date — but a back-dated record must not override a newer one
    if (newDoc.nextServiceDate) {
        const [asset, logs] = await Promise.all([getAssetById(data.assetId), getServiceLogsByAsset(data.assetId)]);
        const servicedAt = parseDate(newDoc.serviceDate)?.getTime() ?? 0;
        const isLatestService = logs.every(log => log.id === docRef.id || (parseDate(log.serviceDate)?.getTime() ?? 0) <= servicedAt);
        if (asset && isLatestService && asset.nextServiceDate !== newDoc.nextServiceDate) {
            await setAssetNextServiceDate(data.assetId, newDoc.nextServiceDate);
        }
    }

    return docRef.id;
};

/** Update an existing service record */
export const updateServiceLog = async (
    id: string,
    data: Partial<ServiceLog>,
    oldData?: ServiceLog
): Promise<void> => {
    const { id: _id, ...fields } = data;
    void _id; // the document id is not stored as a field
    const updatedDoc = {
        ...fields,
        updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, SERVICE_LOGS_COLLECTION, id), updatedDoc);

    const actor = currentActor();
    if (actor) {
        await logSystemActivity({
            ...actor,
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

    const actor = currentActor();
    if (actor) {
        await logSystemActivity({
            ...actor,
            action: 'DELETE',
            module: 'ServiceLogs',
            recordId: id,
            recordName: log ? `${log.serviceType} – ${log.assetName}` : 'Service Record',
            oldData: log
        });
    }
};
