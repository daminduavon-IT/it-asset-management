import { Navigate, Outlet } from 'react-router-dom';
import { LogOut, RefreshCw, ShieldOff } from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import AuthShell from '../layout/AuthShell';

/** Shown to a signed-in account that has no access profile (never added by an administrator, or access removed). */
function NoAccess() {
    const { currentUser, logout } = useAuth();

    return (
        <AuthShell subtitle="IT Asset Management System">
            <div className="space-y-5 text-center">
                <ShieldOff className="mx-auto h-10 w-10 text-amber-500" aria-hidden="true" />
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">This account does not have access</h3>
                    <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium text-gray-800">{currentUser?.email}</span> is signed in, but an administrator
                        has not given it access to the system, or the access was removed.
                    </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Try again
                    </button>
                    <button
                        type="button"
                        onClick={() => { void logout(); }}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#005500] px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                    >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Sign out
                    </button>
                </div>
            </div>
        </AuthShell>
    );
}

export default function ProtectedRoute() {
    const { currentUser, role, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // If there's no logged in user, redirect to login page
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (!role) {
        return <NoAccess />;
    }

    // If user is logged in, show the child components (the protected pages)
    return <Outlet />;
}

/** Pages that change data (add/edit asset); read-only auditors are sent back to the asset list */
export function EditorRoute() {
    const { isAuditor } = useAuth();
    return isAuditor ? <Navigate to="/assets" replace /> : <Outlet />;
}

/** Pages for administrators only (user accounts) */
export function AdminRoute() {
    const { isAdmin } = useAuth();
    return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}
