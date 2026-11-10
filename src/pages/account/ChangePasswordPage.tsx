import { useState } from 'react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { KeyRound, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/auth-context';
import { usePageTitle } from '../../hooks/usePageTitle';
import PasswordChecklist from '../../components/common/PasswordChecklist';
import { meetsPasswordRules } from '../../utils/passwordRules';

const INPUT_CLASS = 'mt-2 block w-full rounded-xl border-0 px-3 py-2.5 text-slate-900 bg-white/50 backdrop-blur-sm shadow-sm ring-1 ring-inset ring-slate-200 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 transition-all aria-[invalid=true]:ring-red-400';
const LABEL_CLASS = 'block text-sm font-medium leading-6 text-gray-900';
const ERROR_CLASS = 'text-red-500 text-xs mt-1';

type FieldErrors = { current?: string; next?: string; confirm?: string; form?: string };

// Firebase reports a wrong current password under different codes depending on the project settings
const WRONG_PASSWORD_CODES = ['auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-login-credentials'];

const failureMessage = (code: string | undefined): FieldErrors => {
    if (code && WRONG_PASSWORD_CODES.includes(code)) return { current: 'The current password is not correct.' };
    if (code === 'auth/too-many-requests') return { form: 'Too many attempts. Wait a few minutes and try again.' };
    if (code === 'auth/network-request-failed') return { form: 'No connection. Check your internet and try again.' };
    if (code === 'auth/weak-password' || code === 'auth/password-does-not-meet-requirements') {
        return { next: 'This password was rejected as too weak. Choose a stronger one.' };
    }
    return { form: 'The password could not be changed. Please try again.' };
};

/** Lets the signed-in account (including the read-only auditor) change its own password. */
export default function ChangePasswordPage() {
    usePageTitle('Change Password');
    const { currentUser } = useAuth();
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [saving, setSaving] = useState(false);

    const email = currentUser?.email ?? '';
    const inputType = showPasswords ? 'text' : 'password';

    const validate = (): FieldErrors => {
        const found: FieldErrors = {};
        if (!current) found.current = 'Enter your current password.';
        if (!meetsPasswordRules(next)) found.next = 'The new password does not meet the requirements below.';
        else if (next === current) found.next = 'Choose a password that is different from the current one.';
        if (next !== confirm) found.confirm = 'The two passwords do not match.';
        return found;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !email) return;

        const found = validate();
        setErrors(found);
        if (Object.keys(found).length > 0) return;

        setSaving(true);
        try {
            // Firebase only accepts a password change from a recent sign-in, so confirm the current password first
            await reauthenticateWithCredential(currentUser, EmailAuthProvider.credential(email, current));
            await updatePassword(currentUser, next);
            setCurrent('');
            setNext('');
            setConfirm('');
            toast.success('Password changed. Use the new password the next time you sign in.');
        } catch (error) {
            console.error('Password change error:', error);
            setErrors(failureMessage((error as { code?: string }).code));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Change Password</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Signed in as <span className="font-medium text-slate-700">{email}</span>
                </p>
            </div>

            <div className="glass-card rounded-3xl max-w-xl animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8 space-y-5">
                    {/* Lets password managers attach the new password to the right account */}
                    <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />

                    <div>
                        <label htmlFor="current-password" className={LABEL_CLASS}>Current password</label>
                        <input
                            id="current-password"
                            type={inputType}
                            autoComplete="current-password"
                            value={current}
                            onChange={(e) => setCurrent(e.target.value)}
                            aria-invalid={Boolean(errors.current)}
                            aria-describedby={errors.current ? 'current-password-error' : undefined}
                            className={INPUT_CLASS}
                        />
                        {errors.current && <p id="current-password-error" className={ERROR_CLASS}>{errors.current}</p>}
                    </div>

                    <div>
                        <label htmlFor="new-password" className={LABEL_CLASS}>New password</label>
                        <input
                            id="new-password"
                            type={inputType}
                            autoComplete="new-password"
                            value={next}
                            onChange={(e) => setNext(e.target.value)}
                            aria-invalid={Boolean(errors.next)}
                            aria-describedby={errors.next ? 'new-password-error' : undefined}
                            className={INPUT_CLASS}
                        />
                        {errors.next && <p id="new-password-error" className={ERROR_CLASS}>{errors.next}</p>}
                        <div className="mt-2">
                            <PasswordChecklist password={next} />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirm-password" className={LABEL_CLASS}>Confirm new password</label>
                        <input
                            id="confirm-password"
                            type={inputType}
                            autoComplete="new-password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            aria-invalid={Boolean(errors.confirm)}
                            aria-describedby={errors.confirm ? 'confirm-password-error' : undefined}
                            className={INPUT_CLASS}
                        />
                        {errors.confirm && <p id="confirm-password-error" className={ERROR_CLASS}>{errors.confirm}</p>}
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={showPasswords}
                            onChange={(e) => setShowPasswords(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Show passwords
                    </label>

                    {errors.form && <p role="alert" className="text-sm text-red-600">{errors.form}</p>}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                        <p className="text-xs text-slate-500">Other devices signed in with this account will be signed out.</p>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex flex-shrink-0 items-center gap-2 justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
                            Change password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
