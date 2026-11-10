import { useEffect, useState } from 'react';
import { Check, Copy, Loader2, RefreshCw, RotateCw, UserPlus, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/auth-context';
import { usePageTitle } from '../../hooks/usePageTitle';
import PasswordChecklist from '../../components/common/PasswordChecklist';
import { ACCOUNT_EMAIL_DOMAIN, ACCOUNT_ROLES, OWNER_UID } from '../../constants/accounts';
import { createUserAccount, getUserAccounts, updateUserAccount } from '../../services/userService';
import { formatDateTime } from '../../utils/format';
import { generatePassword, meetsPasswordRules } from '../../utils/passwordRules';
import type { AccountRole, UserAccount } from '../../types';

const INPUT_CLASS = 'block w-full rounded-xl border-0 px-3 py-2.5 text-slate-900 bg-white/50 backdrop-blur-sm shadow-sm ring-1 ring-inset ring-slate-200 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 transition-all aria-[invalid=true]:ring-red-400';
const LABEL_CLASS = 'block text-sm font-medium leading-6 text-gray-900';
const ERROR_CLASS = 'text-red-500 text-xs mt-1';
const TH_CLASS = 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
const TD_CLASS = 'px-4 py-3 text-sm text-slate-700';

type FieldErrors = { name?: string; email?: string; password?: string; form?: string };
type CreatedAccount = { name: string; email: string; password: string };

const EMAIL_SUFFIX = `@${ACCOUNT_EMAIL_DOMAIN}`;
const EMAIL_NAME_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

const roleLabel = (role: AccountRole) => ACCOUNT_ROLES.find(option => option.value === role)?.label ?? role;

const RULES_NOT_PUBLISHED = 'The database refused this. The security rules for user accounts (firestore.rules) may not be published in Firebase yet.';

const createFailureMessage = (code: string | undefined): FieldErrors => {
    switch (code) {
        case 'auth/email-already-in-use':
            return { email: 'A sign-in with this email already exists. If it is not in the list, delete it in Firebase Console → Authentication first.' };
        case 'auth/invalid-email':
            return { email: 'This is not a valid email address.' };
        case 'auth/weak-password':
        case 'auth/password-does-not-meet-requirements':
            return { password: 'This password was rejected as too weak. Generate a new one.' };
        case 'auth/operation-not-allowed':
        case 'auth/admin-restricted-operation':
            return { form: 'Creating accounts is switched off in the Firebase project. Allow sign-up under Authentication → Settings → User actions.' };
        case 'auth/too-many-requests':
            return { form: 'Too many attempts. Wait a few minutes and try again.' };
        case 'auth/network-request-failed':
            return { form: 'No connection. Check your internet and try again.' };
        case 'permission-denied':
            return { form: RULES_NOT_PUBLISHED };
        default:
            return { form: 'The account could not be created. Please try again.' };
    }
};

/** Administrators add sign-ins here, choose what each one may do, and switch access off or back on. */
export default function UsersPage() {
    usePageTitle('Users');
    const { currentUser } = useAuth();

    const [accounts, setAccounts] = useState<UserAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [busyUid, setBusyUid] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [emailName, setEmailName] = useState('');
    const [role, setRole] = useState<AccountRole>('editor');
    const [password, setPassword] = useState(generatePassword);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [saving, setSaving] = useState(false);
    const [created, setCreated] = useState<CreatedAccount | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let ignore = false;

        const fetchAccounts = async () => {
            setLoading(true);
            setLoadError(null);
            try {
                const data = await getUserAccounts();
                if (!ignore) setAccounts(data);
            } catch (error) {
                console.error('Error loading user accounts:', error);
                if (!ignore) {
                    setLoadError((error as { code?: string }).code === 'permission-denied'
                        ? RULES_NOT_PUBLISHED
                        : 'The user accounts could not be loaded.');
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        fetchAccounts();
        return () => {
            ignore = true;
        };
    }, [reloadKey]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanName = name.trim();
        // Accept "hasini" as well as a pasted "hasini@avonpc.com"
        const typed = emailName.trim().toLowerCase();
        const local = typed.endsWith(EMAIL_SUFFIX) ? typed.slice(0, -EMAIL_SUFFIX.length) : typed;

        const found: FieldErrors = {};
        if (!cleanName) found.name = 'Enter the person\'s name.';
        if (!local) found.email = 'Enter the first part of the email address.';
        else if (local.includes('@')) found.email = `Accounts must use an ${EMAIL_SUFFIX} email address.`;
        else if (!EMAIL_NAME_PATTERN.test(local)) found.email = 'Use letters and numbers, separated by a dot, dash or underscore.';
        if (!meetsPasswordRules(password)) found.password = 'The password does not meet the requirements below.';
        setErrors(found);
        if (Object.keys(found).length > 0) return;

        const email = `${local}${EMAIL_SUFFIX}`;
        setSaving(true);
        try {
            await createUserAccount({ name: cleanName, email, role, password });
            setCreated({ name: cleanName, email, password });
            setCopied(false);
            setName('');
            setEmailName('');
            setRole('editor');
            setPassword(generatePassword());
            setReloadKey(key => key + 1);
            toast.success(`Account created for ${cleanName}.`);
        } catch (error) {
            console.error('Error creating user account:', error);
            setErrors(createFailureMessage((error as { code?: string }).code));
        } finally {
            setSaving(false);
        }
    };

    const applyChange = async (account: UserAccount, changes: { role?: AccountRole; active?: boolean }, done: string) => {
        setBusyUid(account.uid);
        try {
            await updateUserAccount(account, changes);
            setAccounts(list => list.map(item => (item.uid === account.uid ? { ...item, ...changes } : item)));
            toast.success(done);
        } catch (error) {
            console.error('Error updating user account:', error);
            toast.error((error as { code?: string }).code === 'permission-denied' ? RULES_NOT_PUBLISHED : 'The change could not be saved. Please try again.');
        } finally {
            setBusyUid(null);
        }
    };

    const changeRole = (account: UserAccount, newRole: AccountRole) => {
        if (newRole === account.role) return;
        if (!window.confirm(`Change ${account.name} (${account.email}) from ${roleLabel(account.role)} to ${roleLabel(newRole)}?`)) return;
        void applyChange(account, { role: newRole }, `${account.name} is now ${roleLabel(newRole)}.`);
    };

    const toggleAccess = (account: UserAccount) => {
        const question = account.active
            ? `Remove access for ${account.name} (${account.email})?\n\nThey will no longer be able to open the system. You can restore the access later.`
            : `Restore access for ${account.name} (${account.email}) as ${roleLabel(account.role)}?`;
        if (!window.confirm(question)) return;
        void applyChange(account, { active: !account.active }, account.active ? `Access removed for ${account.name}.` : `Access restored for ${account.name}.`);
    };

    const copyDetails = async () => {
        if (!created) return;
        try {
            await navigator.clipboard.writeText(`Email: ${created.email}\nPassword: ${created.password}`);
            setCopied(true);
        } catch {
            toast.error('Could not copy. Select the details and copy them by hand.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                    <Users className="h-7 w-7 text-emerald-600" aria-hidden="true" />
                    Users
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Add the people who may sign in and choose what each of them can do.
                </p>
            </div>

            {created && (
                <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 animate-fade-in-up">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <h2 className="text-sm font-semibold text-emerald-900">Account created — give these sign-in details to {created.name}</h2>
                            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                                <dt className="text-emerald-800">Email</dt>
                                <dd className="font-mono text-slate-900 break-all">{created.email}</dd>
                                <dt className="text-emerald-800">Password</dt>
                                <dd className="font-mono text-slate-900 break-all">{created.password}</dd>
                            </dl>
                            <p className="mt-3 text-xs text-emerald-800">
                                The password is not shown again after you close this box. Ask them to set their own under Change Password after the first sign-in.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setCreated(null)}
                            className="flex-shrink-0 rounded-lg p-1.5 text-emerald-800 hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                            <span className="sr-only">Close sign-in details</span>
                            <X className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => { void copyDetails(); }}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-emerald-800 ring-1 ring-inset ring-emerald-300 hover:bg-emerald-100"
                    >
                        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                        {copied ? 'Copied' : 'Copy email and password'}
                    </button>
                </div>
            )}

            <div className="glass-card rounded-3xl animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <form onSubmit={handleCreate} noValidate className="p-6 sm:p-8 space-y-5">
                    <h2 className="text-lg font-semibold text-slate-900">Add user</h2>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <label htmlFor="user-name" className={LABEL_CLASS}>Name</label>
                            <input
                                id="user-name"
                                type="text"
                                autoComplete="off"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                aria-invalid={Boolean(errors.name)}
                                aria-describedby={errors.name ? 'user-name-error' : undefined}
                                className={`mt-2 ${INPUT_CLASS}`}
                            />
                            {errors.name && <p id="user-name-error" className={ERROR_CLASS}>{errors.name}</p>}
                        </div>

                        <div>
                            <label htmlFor="user-email" className={LABEL_CLASS}>Sign-in email</label>
                            <div className="mt-2 flex items-center gap-2">
                                <input
                                    id="user-email"
                                    type="text"
                                    inputMode="email"
                                    autoComplete="off"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    value={emailName}
                                    onChange={(e) => setEmailName(e.target.value)}
                                    aria-invalid={Boolean(errors.email)}
                                    aria-describedby={errors.email ? 'user-email-error' : undefined}
                                    className={`min-w-0 flex-1 ${INPUT_CLASS}`}
                                />
                                <span className="flex-shrink-0 text-sm font-medium text-slate-600">{EMAIL_SUFFIX}</span>
                            </div>
                            {errors.email && <p id="user-email-error" className={ERROR_CLASS}>{errors.email}</p>}
                        </div>

                        <div>
                            <label htmlFor="user-role" className={LABEL_CLASS}>Role</label>
                            <select
                                id="user-role"
                                value={role}
                                onChange={(e) => setRole(e.target.value as AccountRole)}
                                aria-describedby="user-role-help"
                                className={`mt-2 ${INPUT_CLASS}`}
                            >
                                {ACCOUNT_ROLES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                            <p id="user-role-help" className="mt-1 text-xs text-slate-500">
                                {ACCOUNT_ROLES.find(option => option.value === role)?.description}
                            </p>
                        </div>

                        <div>
                            <label htmlFor="user-password" className={LABEL_CLASS}>Starting password</label>
                            <div className="mt-2 flex items-center gap-2">
                                <input
                                    id="user-password"
                                    type="text"
                                    autoComplete="off"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    aria-invalid={Boolean(errors.password)}
                                    aria-describedby={errors.password ? 'user-password-error' : undefined}
                                    className={`min-w-0 flex-1 font-mono ${INPUT_CLASS}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setPassword(generatePassword())}
                                    className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200 bg-white/50 hover:bg-white"
                                >
                                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                                    Generate
                                </button>
                            </div>
                            {errors.password && <p id="user-password-error" className={ERROR_CLASS}>{errors.password}</p>}
                            <div className="mt-2">
                                <PasswordChecklist password={password} />
                            </div>
                        </div>
                    </div>

                    {errors.form && <p role="alert" className="text-sm text-red-600">{errors.form}</p>}

                    <div className="flex justify-end pt-1">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <UserPlus className="h-5 w-5" aria-hidden="true" />}
                            Create account
                        </button>
                    </div>
                </form>
            </div>

            <div className="glass-card rounded-3xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="px-6 py-4 sm:px-8 border-b border-slate-200/50">
                    <h2 className="text-lg font-semibold text-slate-900">Accounts with access</h2>
                </div>

                {loading ? (
                    <div className="flex justify-center p-10">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-label="Loading user accounts" />
                    </div>
                ) : loadError ? (
                    <div className="p-8 text-center">
                        <p role="alert" className="text-sm text-red-600">{loadError}</p>
                        <button
                            type="button"
                            onClick={() => setReloadKey(key => key + 1)}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200 bg-white/50 hover:bg-white"
                        >
                            <RotateCw className="h-4 w-4" aria-hidden="true" />
                            Try again
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200/50">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className={TH_CLASS}>Name</th>
                                    <th scope="col" className={TH_CLASS}>Sign-in email</th>
                                    <th scope="col" className={TH_CLASS}>Role</th>
                                    <th scope="col" className={TH_CLASS}>Status</th>
                                    <th scope="col" className={TH_CLASS}>Added</th>
                                    <th scope="col" className={TH_CLASS}><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/50">
                                {accounts.map(account => {
                                    const isOwner = account.uid === OWNER_UID;
                                    const isSelf = account.uid === currentUser?.uid;
                                    const locked = isOwner || isSelf;
                                    const busy = busyUid === account.uid;
                                    return (
                                        <tr key={account.uid} className={account.active ? undefined : 'bg-slate-50/60'}>
                                            <td className={`${TD_CLASS} font-medium text-slate-900 whitespace-nowrap`}>
                                                {account.name}
                                                {isSelf && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}
                                            </td>
                                            <td className={`${TD_CLASS} whitespace-nowrap`}>{account.email}</td>
                                            <td className={TD_CLASS}>
                                                {locked ? (
                                                    <span title={isOwner ? 'The main administrator account cannot be changed' : 'You cannot change your own role'}>
                                                        {roleLabel(account.role)}
                                                    </span>
                                                ) : (
                                                    <select
                                                        aria-label={`Role for ${account.name}`}
                                                        value={account.role}
                                                        disabled={busy}
                                                        onChange={(e) => changeRole(account, e.target.value as AccountRole)}
                                                        className="rounded-lg border-0 py-1.5 pl-2 pr-8 text-sm text-slate-900 bg-white/70 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                                                    >
                                                        {ACCOUNT_ROLES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                                    </select>
                                                )}
                                            </td>
                                            <td className={`${TD_CLASS} whitespace-nowrap`}>
                                                {account.active ? (
                                                    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Active</span>
                                                ) : (
                                                    <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">Access removed</span>
                                                )}
                                            </td>
                                            <td className={`${TD_CLASS} whitespace-nowrap text-slate-500`}>
                                                {formatDateTime(account.createdAt)}
                                                {account.createdByName && <span className="block text-xs">by {account.createdByName}</span>}
                                            </td>
                                            <td className={`${TD_CLASS} whitespace-nowrap text-right`}>
                                                {!locked && (
                                                    <button
                                                        type="button"
                                                        disabled={busy}
                                                        onClick={() => toggleAccess(account)}
                                                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-inset disabled:opacity-50 ${account.active
                                                            ? 'text-red-700 ring-red-200 hover:bg-red-50'
                                                            : 'text-emerald-700 ring-emerald-200 hover:bg-emerald-50'
                                                        }`}
                                                    >
                                                        {account.active ? 'Remove access' : 'Restore access'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {accounts.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">No user accounts yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <p className="px-6 py-4 sm:px-8 border-t border-slate-200/50 text-xs text-slate-500">
                    Removing access blocks a sign-in completely and can be undone. Sign-ins cannot be deleted from this page: to delete one
                    for good, use Firebase Console → Authentication. Someone who forgot their password can use "Forgot your password?" on the sign-in page.
                </p>
            </div>
        </div>
    );
}
