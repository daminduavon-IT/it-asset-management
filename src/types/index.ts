import type { Timestamp } from 'firebase/firestore';

/** Firestore stores record times as Timestamps; older or hand-made documents may hold epoch ms or an ISO string. */
export type StoredTime = Timestamp | number | string | null | undefined;

export type AssetStatus = 'Available' | 'Assigned' | 'Under Repair' | 'Retired';
export type AssetCondition = 'New' | 'Good' | 'Fair' | 'Poor';

// Company departments
export type Department = 'HR' | 'FINANCE' | 'ADMIN' | 'IT' | 'MARKETING' | 'COORDINATION & CUSTOMER CARE';

// Company locations
export type Location = 'BioSafe' | 'Greenlab' | 'Stores1' | 'Stores2' | 'Head Office';

export interface Asset {
    id: string;
    assetName: string;
    category: string;
    brand: string;
    model: string;
    serialNumber: string;
    refNumber: string;
    quantity: number;
    unitPrice: number;
    totalValue: number;
    // Imported master-sheet rows use values outside the Location/Department lists (e.g. "1 st Floor", blank department)
    location: string;
    assignedTo?: string | null;
    department: string;
    status: AssetStatus;
    condition: AssetCondition;
    purchaseDate: string; // "YYYY-MM-DD" or ''
    warrantyEnd: string; // "YYYY-MM-DD" or ''
    nextServiceDate?: string | null; // "YYYY-MM-DD"
    remarks?: string | null;
    // Laptop/Desktop spec fields (optional — other categories leave these null)
    processorType?: string | null;
    ram?: string | null;
    storage?: string | null;
    os?: string | null;
    createdAt: StoredTime;
    updatedAt: StoredTime;
}

/** Asset fields a user can enter (everything except id and timestamps). */
export type AssetInput = Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>;

export interface DashboardStats {
    totalAssets: number;
    assignedAssets: number;
    availableAssets: number;
    underRepair: number;
    byCategory: Record<string, number>;
    byLocation: Record<string, number>;
    byDepartment: Record<string, number>;
    serviceReminders: Asset[];
}

export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
}

export type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'TRANSFER' | 'IMPORT';

export interface ServiceLog {
    id: string;
    assetId: string;
    assetName: string;
    assetCategory: string;
    serviceDate: string;        // ISO date string e.g. "2026-03-13"
    serviceType: string;
    serviceDetails?: string | null;
    partsReplaced?: string | null;     // Plain string e.g. "Battery, Cooling Fan"
    technicianName?: string | null;
    serviceProvider?: string | null;
    serviceCost?: number | null;
    nextServiceDate?: string | null;   // ISO date string
    remarks?: string | null;
    createdAt: StoredTime;
    updatedAt: StoredTime;
    createdByUid: string;
    createdByName: string;
}

export interface LoginLog {
    id: string;
    uid: string;
    userName: string;
    email: string;
    loginStatus: 'SUCCESS' | 'FAILED';
    loginTime: StoredTime;
    logoutTime?: StoredTime;
    sessionId?: string | null;
    deviceInfo?: string | null;
    browser?: string | null;
    os?: string | null;
}

export interface ActivityLog {
    id: string;
    uid: string;
    userName: string;
    email: string;
    action: ActivityAction;
    module: string;
    recordId: string;
    recordName: string;
    oldData?: Record<string, unknown> | null;
    newData?: Record<string, unknown> | null;
    changedFields?: string[] | null;
    reason?: string | null;
    timestamp: StoredTime;
}
