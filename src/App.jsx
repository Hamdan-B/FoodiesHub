import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AIChatbot } from './components/AIChatbot';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import SellerDashboard from './pages/seller/SellerDashboard';
import RiderDashboard from './pages/rider/RiderDashboard';
import AdminPanel from './pages/admin/AdminPanel';
import CartPage from './pages/buyer/CartPage';
import OrdersPage from './pages/buyer/OrdersPage';

function App() {
  const { currentUser, isAdmin } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/signup" element={currentUser ? <Navigate to="/" replace /> : <SignupPage />} />
        <Route path="/" element={<HomePage />} />

        {/* Buyer routes */}
        <Route
          path="/buyer"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['buyer']}>
              <BuyerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['buyer']}>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['buyer']}>
              <OrdersPage />
            </ProtectedRoute>
          }
        />

        {/* Seller routes */}
        <Route
          path="/seller"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['seller']}>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Rider routes */}
        <Route
          path="/rider"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['rider']}>
              <RiderDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAuth={true} requireAdmin={true}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AIChatbot />
    </Router>
  );
}

export default App;
