import type { AssetCondition, AssetStatus, Department, Location } from '../types';

export const CATEGORIES = [
    'Laptop', 'Desktop', 'Monitor', 'Printer', 'UPS', 'Scanner', 'Photocopier',
    'Networking', 'Telecom', 'Security System', 'Projector', 'Accessories', 'Other',
];

export const LOCATIONS: Location[] = ['Head Office', 'BioSafe', 'Greenlab', 'Stores1', 'Stores2'];

export const DEPARTMENTS: Department[] = ['HR', 'FINANCE', 'ADMIN', 'IT', 'MARKETING', 'COORDINATION & CUSTOMER CARE'];

export const STATUSES: AssetStatus[] = ['Available', 'Assigned', 'Under Repair', 'Retired'];

export const CONDITIONS: AssetCondition[] = ['New', 'Good', 'Fair', 'Poor'];

// Master-sheet categories are compound ("Desktop/Workstation", "UPS/Power Backup"), so match on keywords
export const isComputerCategory = (category?: string | null) =>
    /\b(laptop|desktop|workstation)\b/i.test(category ?? '');

export const isServiceableCategory = (category?: string | null) =>
    /\b(laptop|desktop|workstation|printer|photocopier|scanner|ups)\b/i.test(category ?? '');

/** Dropdown options that always include the record's current value, so legacy/imported values are shown and kept. */
export const withCurrent = (options: readonly string[], current?: string | null) =>
    current && !options.includes(current) ? [...options, current] : [...options];
