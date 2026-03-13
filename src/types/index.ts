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
    location: Location;
    assignedTo?: string;
    department: Department;
    status: AssetStatus;
    condition: AssetCondition;
    purchaseDate: string; // ISO string format
    warrantyEnd: string; // ISO string format
    nextServiceDate?: string; // ISO string format
    remarks?: string;
    // Laptop/Desktop spec fields (optional — other categories leave these undefined)
    processorType?: string;
    ram?: string;
    storage?: string;
    os?: string;
    createdAt: number;
    updatedAt: number;
}

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

export interface ServiceLog {
    id: string;
    assetId: string;
    assetName: string;
    assetCategory: string;
    serviceDate: string;        // ISO date string e.g. "2026-03-13"
    serviceType: string;
    serviceDetails?: string;
    partsReplaced?: string;     // Plain string e.g. "Battery, Cooling Fan"
    technicianName?: string;
    serviceProvider?: string;
    serviceCost?: number;
    nextServiceDate?: string;   // ISO date string
    remarks?: string;
    createdAt: number;
    updatedAt: number;
    createdByUid: string;
    createdByName: string;
}
