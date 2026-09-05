import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import ProductsPage from './pages/ProductsPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import SuppliersPage from './pages/SuppliersPage';
import StockPage from './pages/StockPage';

function PrivateRoute({ children, roles }) {
  const user = useAuthStore(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontSize: '14px' } }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="pos" element={<POSPage />} />
          <Route path="products" element={<PrivateRoute roles={['admin','manager']}><ProductsPage /></PrivateRoute>} />
          <Route path="stock" element={<PrivateRoute roles={['admin','manager']}><StockPage /></PrivateRoute>} />
          <Route path="suppliers" element={<PrivateRoute roles={['admin','manager']}><SuppliersPage /></PrivateRoute>} />
          <Route path="reports" element={<PrivateRoute roles={['admin','manager']}><ReportsPage /></PrivateRoute>} />
          <Route path="users" element={<PrivateRoute roles={['admin']}><UsersPage /></PrivateRoute>} />
          <Route path="settings" element={<PrivateRoute roles={['admin']}><SettingsPage /></PrivateRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
