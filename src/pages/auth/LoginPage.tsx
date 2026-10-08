import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
    browserLocalPersistence,
    browserSessionPersistence,
    sendPasswordResetEmail,
    setPersistence,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import { LogIn, Loader2, Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { logLoginAttempt } from '../../services/logService';
import { useAuth } from '../../context/auth-context';
import { usePageTitle } from '../../hooks/usePageTitle';
import AuthShell from '../../components/layout/AuthShell';

const INPUT_CLASS = 'appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#005500] focus:border-[#005500] sm:text-sm transition-colors';
const PRIMARY_BUTTON_CLASS = 'w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-[#005500] hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005500] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5';

export default function LoginPage() {
    const { currentUser } = useAuth();
    const [mode, setMode] = useState<'login' | 'reset'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMeChecked] = useState(true);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    usePageTitle(mode === 'login' ? 'Sign In' : 'Reset Password');

    // Already signed in — nothing to do here
    if (currentUser) {
        return <Navigate to="/" replace />;
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // "Remember me" keeps the session across browser restarts; otherwise it ends with the browser session
            await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
            const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);

            // Log successful login
            await logLoginAttempt(user.uid, user.displayName || 'Unknown', email, 'SUCCESS');

            toast.success('Login successful!');
            navigate('/');
        } catch (error: unknown) {
            console.error('Login error:', error);

            // Log failed login
            await logLoginAttempt(
                null, // No UID for failed login usually
                'Unknown',
                email,
                'FAILED'
            );

            toast.error('Failed to log in. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Same message whether or not the account exists
        const sent = () => {
            toast.success('If an account exists for this email, a password reset link has been sent.');
            setMode('login');
        };
        try {
            await sendPasswordResetEmail(auth, email.trim());
            sent();
        } catch (error: unknown) {
            if ((error as { code?: string }).code === 'auth/user-not-found') {
                sent();
                return;
            }
            console.error('Password reset error:', error);
            toast.error('Could not send the reset email. Please try again in a few minutes.');
        } finally {
            setLoading(false);
        }
    };

    if (mode === 'reset') {
        return (
            <AuthShell subtitle="IT Asset Management System">
                <form className="space-y-6" onSubmit={handleResetRequest}>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Reset your password</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Enter your work email and we'll send you a link to choose a new password.
                        </p>
                    </div>
                    <div>
                        <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
                            Email address
                        </label>
                        <div className="mt-1">
                            <input
                                id="reset-email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={INPUT_CLASS}
                                placeholder="Enter your email"
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className={PRIMARY_BUTTON_CLASS}>
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                            <>
                                <Mail className="h-5 w-5 mr-2" />
                                Send reset link
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="w-full flex items-center justify-center gap-2 text-sm font-medium text-[#005500] hover:text-emerald-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to sign in
                    </button>
                </form>
            </AuthShell>
        );
    }

    return (
        <AuthShell subtitle="IT Asset Management System">
            <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                    <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
                        Email address
                    </label>
                    <div className="mt-1">
                        <input
                            id="login-email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={INPUT_CLASS}
                            placeholder="Enter your email"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <div className="mt-1 relative">
                        <input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`${INPUT_CLASS} pr-10`}
                            placeholder="Enter your password"
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:text-gray-700"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            aria-pressed={showPassword}
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" aria-hidden="true" />
                            ) : (
                                <Eye className="h-5 w-5" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMeChecked(e.target.checked)}
                            className="h-4 w-4 text-[#005500] focus:ring-[#005500] border-gray-300 rounded"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                            Remember me
                        </label>
                    </div>

                    <div className="text-sm">
                        <button
                            type="button"
                            onClick={() => setMode('reset')}
                            className="font-medium text-[#005500] hover:text-emerald-700"
                        >
                            Forgot your password?
                        </button>
                    </div>
                </div>

                <div>
                    <button type="submit" disabled={loading} className={PRIMARY_BUTTON_CLASS}>
                        {loading ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                        ) : (
                            <>
                                <LogIn className="h-5 w-5 mr-2" />
                                Sign In
                            </>
                        )}
                    </button>
                </div>
            </form>
        </AuthShell>
    );
}
