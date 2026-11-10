import type { AccountRole } from '../types';

/** Sign-in emails for new accounts are always on the company domain. */
export const ACCOUNT_EMAIL_DOMAIN = 'avonpc.com';

/**
 * The main administrator account (admin@avonpc.com). It is always an administrator, even without a profile,
 * so the system can never be left without one. firestore.rules names the same account id: change both together.
 */
export const OWNER_UID = 'UUE8izuqOKfHicvF08dbZwrhTAx2';

export const ACCOUNT_ROLES: { value: AccountRole; label: string; description: string }[] = [
    { value: 'editor', label: 'Editor', description: 'Can view, add and edit assets and service records.' },
    { value: 'auditor', label: 'Auditor (read-only)', description: 'Can view everything but cannot change anything.' },
    { value: 'admin', label: 'Administrator', description: 'Everything an editor can do, plus managing user accounts.' },
];

export const isAccountRole = (value: unknown): value is AccountRole =>
    ACCOUNT_ROLES.some(role => role.value === value);
