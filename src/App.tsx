import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout & Auth
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AssetsPage from './pages/assets/AssetsPage';
import AddAssetPage from './pages/assets/AddAssetPage';
import EditAssetPage from './pages/assets/EditAssetPage';
import AssetDetailsPage from './pages/assets/AssetDetailsPage';
import LogsPage from './pages/audit-logs';

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Toast Notifications Provider */}
        <Toaster position="top-right" />

        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes inside the Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/assets/add" element={<AddAssetPage />} />
              <Route path="/assets/edit/:id" element={<EditAssetPage />} />
              <Route path="/assets/:id" element={<AssetDetailsPage />} />
              <Route path="/audit-logs" element={<LogsPage />} />
            </Route>
          </Route>

          {/* Catch all route - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
