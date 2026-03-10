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
