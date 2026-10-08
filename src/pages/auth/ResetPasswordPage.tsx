import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { usePageTitle } from '../../hooks/usePageTitle';
import AuthShell from '../../components/layout/AuthShell';

const INPUT_CLASS = 'appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#005500] focus:border-[#005500] sm:text-sm transition-colors';
const MIN_PASSWORD_LENGTH = 8;

/**
 * Landing page for the emailed reset link (?mode=resetPassword&oobCode=…). Used when the Firebase
 * password-reset email template's action URL points here; otherwise Firebase's own hosted page handles the reset.
 */
export default function ResetPasswordPage() {
    usePageTitle('Set New Password');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const oobCode = searchParams.get('oobCode') ?? '';
    const [email, setEmail] = useState<string | null>(null);
    const [checking, setChecking] = useState(Boolean(oobCode));
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!oobCode) return;
        let ignore = false;
        verifyPasswordResetCode(auth, oobCode)
            .then(accountEmail => { if (!ignore) setEmail(accountEmail); })
            .catch(() => { if (!ignore) setEmail(null); })
            .finally(() => { if (!ignore) setChecking(false); });
        return () => { ignore = true; };
    }, [oobCode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setError('');
        setSaving(true);
        try {
            await confirmPasswordReset(auth, oobCode, password);
            toast.success('Password updated. Sign in with your new password.');
            navigate('/login', { replace: true });
        } catch (updateError) {
            console.error('Password update error:', updateError);
            setError('The password could not be updated. The link may have expired — request a new one.');
        } finally {
            setSaving(false);
        }
    };

    if (checking) {
        return (
            <AuthShell subtitle="Reset your password">
                <div className="flex justify-center py-6">
                    <Loader2 className="animate-spin h-6 w-6 text-[#005500]" />
                </div>
            </AuthShell>
        );
    }

    if (!email) {
        return (
            <AuthShell subtitle="Reset your password">
                <div className="space-y-4 text-center">
                    <h3 className="text-lg font-semibold text-gray-900">This reset link is invalid or has expired</h3>
                    <p className="text-sm text-gray-600">Request a new link from the sign-in page.</p>
                    <Link to="/login" className="inline-block font-medium text-[#005500] hover:text-emerald-700">
                        Back to sign in
                    </Link>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell subtitle="Reset your password">
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Choose a new password</h3>
                    <p className="mt-1 text-sm text-gray-600">For {email}</p>
                </div>
                <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">New password</label>
                    <input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`mt-1 ${INPUT_CLASS}`}
                    />
                </div>
                <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Confirm new password</label>
                    <input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`mt-1 ${INPUT_CLASS}`}
                    />
                </div>
                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-[#005500] hover:bg-emerald-800 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin h-5 w-5" /> : (
                        <>
                            <KeyRound className="h-5 w-5 mr-2" />
                            Update password
                        </>
                    )}
                </button>
            </form>
        </AuthShell>
    );
}
