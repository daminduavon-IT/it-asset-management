import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { logSystemActivity } from '../services/logService';
import type { Asset, DashboardStats } from '../types';

const ASSETS_COLLECTION = 'assets';

// Get all assets
export const getAssets = async (): Promise<Asset[]> => {
    const assetsRef = collection(db, ASSETS_COLLECTION);
    const q = query(assetsRef, orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Asset[];
};

// Get a single asset by ID
export const getAssetById = async (id: string): Promise<Asset | null> => {
    const docRef = doc(db, ASSETS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Asset;
    }
    return null;
};

// Add a new asset
export const createAsset = async (assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => {
    const assetsRef = collection(db, ASSETS_COLLECTION);
    const newAsset = {
        ...assetData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(assetsRef, newAsset);

    // Log the creation
    const currentUser = auth.currentUser;
    if (currentUser) {
        await logSystemActivity({
            uid: currentUser.uid,
            userName: currentUser.displayName || 'Unknown',
            email: currentUser.email || 'Unknown',
            action: 'CREATE',
            module: 'Assets',
            recordId: docRef.id,
            recordName: (assetData as any).assetName || 'Unknown Asset',
            newData: newAsset
        });
    }

    return docRef.id;
};

// Update an existing asset
export const updateAsset = async (id: string, assetData: Partial<Asset>) => {
    const docRef = doc(db, ASSETS_COLLECTION, id);
    const updatedData = {
        ...assetData,
        updatedAt: serverTimestamp()
    };

    // Get old asset data before updating for logging
    const oldAsset = await getAssetById(id);

    await updateDoc(docRef, updatedData);

    // Log the update
    const currentUser = auth.currentUser;
    if (currentUser && oldAsset) {
        // Simple check for changed fields
        const changedFields = Object.keys(assetData).filter(
            key => assetData[key as keyof Asset] !== oldAsset[key as keyof Asset]
        );

        // Determine specific action type based on changed fields
        let actionStatus: 'UPDATE' | 'ASSIGN' | 'TRANSFER' = 'UPDATE';
        if (changedFields.includes('assignedTo') && assetData.assignedTo) {
            actionStatus = 'ASSIGN';
        } else if (changedFields.includes('location')) {
            actionStatus = 'TRANSFER';
        }

        await logSystemActivity({
            uid: currentUser.uid,
            userName: currentUser.displayName || 'Unknown',
            email: currentUser.email || 'Unknown',
            action: actionStatus,
            module: 'Assets',
            recordId: id,
            recordName: updatedData.assetName || oldAsset.assetName || 'Unknown Asset',
            oldData: oldAsset,
            newData: updatedData,
            changedFields
        });
    }
};

// Delete an asset
export const deleteAsset = async (id: string) => {
    const docRef = doc(db, ASSETS_COLLECTION, id);
    // Get old asset data before deleting
    const oldAsset = await getAssetById(id);

    await deleteDoc(docRef);

    // Log the deletion
    const currentUser = auth.currentUser;
    if (currentUser && oldAsset) {
        await logSystemActivity({
            uid: currentUser.uid,
            userName: currentUser.displayName || 'Unknown',
            email: currentUser.email || 'Unknown',
            action: 'DELETE',
            module: 'Assets',
            recordId: id,
            recordName: oldAsset.assetName || 'Unknown Asset',
            oldData: oldAsset
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

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

        // Service Reminders
        if (asset.nextServiceDate) {
            const serviceDate = new Date(asset.nextServiceDate);
            serviceDate.setHours(0, 0, 0, 0);
            if (serviceDate <= thirtyDaysFromNow) {
                stats.serviceReminders.push(asset);
            }
        }
    });

    // Sort reminders by date (most urgent first)
    stats.serviceReminders.sort((a, b) => {
        return new Date(a.nextServiceDate as string).getTime() - new Date(b.nextServiceDate as string).getTime();
    });

    return stats;
};

// Bulk Import using Firebase Write Batch
export const bulkImportAssets = async (assetsList: any[]) => {
    const batch = writeBatch(db);
    const assetsRef = collection(db, ASSETS_COLLECTION);

    assetsList.forEach((assetData) => {
        const newDocRef = doc(assetsRef); // create a new id
        batch.set(newDocRef, {
            ...assetData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    });

    await batch.commit();
};
