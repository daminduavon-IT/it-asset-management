export type AssetStatus = 'Available' | 'Assigned' | 'Under Repair' | 'Retired';
export type AssetCondition = 'New' | 'Good' | 'Fair' | 'Poor';

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
    location: string;
    assignedTo?: string;
    department: string;
    status: AssetStatus;
    condition: AssetCondition;
    purchaseDate: string; // ISO string format
    warrantyEnd: string; // ISO string format
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
}

export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
}
