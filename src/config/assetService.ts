import {
    addDoc,
    collection,
    doc,
    getCountFromServer,
    getDoc,
    getDocs,
    limit,
    query,
    serverTimestamp,
    updateDoc,
    where,
    writeBatch,
    type DocumentSnapshot
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { logSystemActivity } from '../services/logService';
import { isComputerCategory } from '../constants/assets';
import { parseDate, startOfToday, toMillis } from '../utils/format';
import type { ActivityAction, Asset, AssetInput, DashboardStats } from '../types';

const ASSETS_COLLECTION = 'assets';
const SERVICE_LOGS_COLLECTION = 'service_logs';

type AssetPatch = Partial<AssetInput>;

// Who is acting, for the audit log
const currentActor = () => {
    const user = auth.currentUser;
    return user ? { uid: user.uid, userName: user.displayName || 'Unknown', email: user.email || 'Unknown' } : null;
};

const toAsset = (snapshot: DocumentSnapshot) => ({ ...snapshot.data(), id: snapshot.id }) as Asset;

const text = (value: unknown) => (value === null || value === undefined ? '' : String(value)).trim();
const optionalText = (value: unknown) => text(value) || null;
const numberOr = (value: unknown, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

/**
 * Map form/import input onto an asset document: trims text, stores blanks as null in optional fields,
 * fills fields the form may leave empty, and drops laptop specs from non-computer categories.
 */
function toAssetFields(data: AssetInput): AssetInput {
    const isComputer = isComputerCategory(data.category);
    const quantity = numberOr(data.quantity, 1);
    const unitPrice = numberOr(data.unitPrice, 0);

    return {
        assetName: text(data.assetName),
        category: text(data.category),
        brand: text(data.brand),
        model: text(data.model),
        serialNumber: text(data.serialNumber),
        refNumber: text(data.refNumber),
        quantity,
        unitPrice,
        totalValue: Math.round(quantity * unitPrice * 100) / 100,
        location: text(data.location),
        assignedTo: optionalText(data.assignedTo),
        department: text(data.department),
        status: data.status || 'Available',
        condition: data.condition || 'Good',
        purchaseDate: text(data.purchaseDate),
        warrantyEnd: text(data.warrantyEnd),
        nextServiceDate: optionalText(data.nextServiceDate),
        remarks: optionalText(data.remarks),
        processorType: isComputer ? optionalText(data.processorType) : null,
        ram: isComputer ? optionalText(data.ram) : null,
        storage: isComputer ? optionalText(data.storage) : null,
        os: isComputer ? optionalText(data.os) : null
    };
}

// '' / null / undefined all mean "no value", so they must not show up as a change in the audit log
const sameValue = (a: unknown, b: unknown) => {
    const normalize = (v: unknown) => (v === '' || v === undefined ? null : v);
    return normalize(a) === normalize(b);
};

// Get all assets, newest first
export const getAssets = async (): Promise<Asset[]> => {
    const snapshot = await getDocs(collection(db, ASSETS_COLLECTION));
    return snapshot.docs
        .map(toAsset)
        .sort((a, b) => (toMillis(b.createdAt) ?? 0) - (toMillis(a.createdAt) ?? 0));
};

// Get a single asset by ID (null when it does not exist)
export const getAssetById = async (id: string): Promise<Asset | null> => {
    const snapshot = await getDoc(doc(db, ASSETS_COLLECTION, id));
    return snapshot.exists() ? toAsset(snapshot) : null;
};

// Is this Internal Ref Number already used by another asset?
export const isRefNumberTaken = async (refNumber: string, excludeId?: string): Promise<boolean> => {
    const snapshot = await getDocs(
        query(collection(db, ASSETS_COLLECTION), where('refNumber', '==', refNumber.trim()), limit(2))
    );
    return snapshot.docs.some(d => d.id !== excludeId);
};

const serviceLogsQuery = (assetId: string) =>
    query(collection(db, SERVICE_LOGS_COLLECTION), where('assetId', '==', assetId));

// Number of service records attached to an asset
export const countServiceRecords = async (assetId: string): Promise<number> => {
    const snapshot = await getCountFromServer(serviceLogsQuery(assetId));
    return snapshot.data().count;
};

// Add a new asset
export const createAsset = async (assetData: AssetInput) => {
    const newAsset = {
        ...toAssetFields(assetData),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, ASSETS_COLLECTION), newAsset);

    // Log the creation
    const actor = currentActor();
    if (actor) {
        await logSystemActivity({
            ...actor,
            action: 'CREATE',
            module: 'Assets',
            recordId: docRef.id,
            recordName: newAsset.assetName || 'Unknown Asset',
            newData: newAsset
        });
    }

    return docRef.id;
};

// Apply a change to an asset and write an audit entry listing the fields that really changed
const patchAsset = async (id: string, patch: AssetPatch) => {
    // Get old asset data before updating for logging
    const oldAsset = await getAssetById(id);
    const updatedData = {
        ...patch,
        updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, ASSETS_COLLECTION, id), updatedData);

    const actor = currentActor();
    if (!actor || !oldAsset) return;

    const changedFields = (Object.keys(patch) as (keyof AssetPatch)[]).filter(
        key => !sameValue(patch[key], oldAsset[key as keyof Asset])
    );
    if (changedFields.length === 0) return;

    // Determine specific action type based on changed fields
    let actionStatus: ActivityAction = 'UPDATE';
    if (changedFields.includes('assignedTo') && patch.assignedTo) {
        actionStatus = 'ASSIGN';
    } else if (changedFields.includes('location')) {
        actionStatus = 'TRANSFER';
    }

    await logSystemActivity({
        ...actor,
        action: actionStatus,
        module: 'Assets',
        recordId: id,
        recordName: patch.assetName || oldAsset.assetName || 'Unknown Asset',
        oldData: oldAsset,
        newData: updatedData,
        changedFields
    });
};

// Update an existing asset from the edit form
export const updateAsset = async (id: string, assetData: AssetInput) => {
    await patchAsset(id, toAssetFields(assetData));
};

// Record the next due service date (set from a service record)
export const setAssetNextServiceDate = async (id: string, nextServiceDate: string) => {
    await patchAsset(id, { nextServiceDate });
};

// Delete an asset together with its service records (Firestore has no cascading deletes)
export const deleteAsset = async (id: string) => {
    // Get old asset data before deleting
    const oldAsset = await getAssetById(id);
    const serviceLogs = await getDocs(serviceLogsQuery(id));

    const batch = writeBatch(db);
    serviceLogs.docs.forEach(log => batch.delete(log.ref));
    batch.delete(doc(db, ASSETS_COLLECTION, id));
    await batch.commit();

    // Log the deletion
    const actor = currentActor();
    if (actor && oldAsset) {
        await logSystemActivity({
            ...actor,
            action: 'DELETE',
            module: 'Assets',
            recordId: id,
            recordName: oldAsset.assetName || 'Unknown Asset',
            oldData: oldAsset,
            reason: serviceLogs.size > 0 ? `Also deleted ${serviceLogs.size} service record(s)` : undefined
        });
    }
};

// Get Dashboard Statistics
export const getDashboardStats = async (): Promise<DashboardStats> => {
    const assets = await getAssets();

    const stats: DashboardStats = {
        totalAssets: assets.length,
        assignedAssets: 0,
        availableAssets: 0,
        underRepair: 0,
        byCategory: {},
        byLocation: {},
        byDepartment: {},
        serviceReminders: []
    };

    const thirtyDaysFromNow = startOfToday();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    assets.forEach(asset => {
        // Status counts
        if (asset.status === 'Assigned') stats.assignedAssets++;
        else if (asset.status === 'Available') stats.availableAssets++;
        else if (asset.status === 'Under Repair') stats.underRepair++;

        // Category counts
        if (asset.category) {
            stats.byCategory[asset.category] = (stats.byCategory[asset.category] || 0) + 1;
        }

        // Location counts
        if (asset.location) {
            stats.byLocation[asset.location] = (stats.byLocation[asset.location] || 0) + 1;
        }

        // Department counts
        if (asset.department) {
            stats.byDepartment[asset.department] = (stats.byDepartment[asset.department] || 0) + 1;
        }

        // Service Reminders (overdue or due within 30 days; retired assets are no longer serviced)
        const serviceDate = parseDate(asset.nextServiceDate);
        if (serviceDate && asset.status !== 'Retired' && serviceDate <= thirtyDaysFromNow) {
            stats.serviceReminders.push(asset);
        }
    });

    // Sort reminders by date (most urgent first)
    stats.serviceReminders.sort((a, b) =>
        (parseDate(a.nextServiceDate)?.getTime() ?? 0) - (parseDate(b.nextServiceDate)?.getTime() ?? 0)
    );

    return stats;
};

// Bulk import in one batch, so either every asset is added or none is
export const bulkImportAssets = async (assetsList: AssetInput[]) => {
    const batch = writeBatch(db);
    const assetsRef = collection(db, ASSETS_COLLECTION);
    const formattedAssets = assetsList.map(assetData => toAssetFields(assetData));
    formattedAssets.forEach(asset => {
        batch.set(doc(assetsRef), { ...asset, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    });
    await batch.commit();

    const actor = currentActor();
    if (actor) {
        await logSystemActivity({
            ...actor,
            action: 'IMPORT',
            module: 'Assets',
            recordId: `import-${Date.now()}`,
            recordName: `Master sheet import (${formattedAssets.length} assets)`,
            newData: { count: formattedAssets.length, refNumbers: formattedAssets.map(asset => asset.refNumber) }
        });
    }
};
