import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout & Auth
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute, { AdminRoute, EditorRoute } from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages — the login page loads eagerly; the rest are split into their own chunks (charts, forms, etc.)
import LoginPage from './pages/auth/LoginPage';
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const AssetsPage = lazy(() => import('./pages/assets/AssetsPage'));
const AddAssetPage = lazy(() => import('./pages/assets/AddAssetPage'));
const EditAssetPage = lazy(() => import('./pages/assets/EditAssetPage'));
const AssetDetailsPage = lazy(() => import('./pages/assets/AssetDetailsPage'));
const StickersPage = lazy(() => import('./pages/stickers/StickersPage'));
const LogsPage = lazy(() => import('./pages/audit-logs'));
const ChangePasswordPage = lazy(() => import('./pages/account/ChangePasswordPage'));
const UsersPage = lazy(() => import('./pages/users/UsersPage'));

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Toast Notifications Provider */}
        <Toaster position="top-right" />

        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected Routes inside the Layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/assets" element={<AssetsPage />} />
                <Route element={<EditorRoute />}>
                  <Route path="/assets/add" element={<AddAssetPage />} />
                  <Route path="/assets/edit/:id" element={<EditAssetPage />} />
                </Route>
                <Route path="/assets/:id" element={<AssetDetailsPage />} />
                <Route path="/stickers" element={<StickersPage />} />
                <Route path="/audit-logs" element={<LogsPage />} />
                <Route element={<AdminRoute />}>
                  <Route path="/users" element={<UsersPage />} />
                </Route>
                <Route path="/change-password" element={<ChangePasswordPage />} />
              </Route>
            </Route>

            {/* Catch all route - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
