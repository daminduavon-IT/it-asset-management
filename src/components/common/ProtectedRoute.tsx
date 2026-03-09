import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute() {
    const { currentUser, loading } = useAuth();

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

    // If user is logged in, show the child components (the protected pages)
    return <Outlet />;
}
