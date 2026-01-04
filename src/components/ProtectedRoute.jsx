import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Protected route component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {boolean} props.requireAuth - Whether authentication is required
 * @param {string[]} props.allowedRoles - Roles allowed to access (optional)
 * @param {boolean} props.requireAdmin - Whether admin access is required
 */
export function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  allowedRoles = null,
  requireAdmin = false 
}) {
  const { currentUser, userData, isAdmin: userIsAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Admin-only routes
  if (requireAdmin) {
    if (!currentUser || !userIsAdmin) {
      return <Navigate to="/" replace />;
    }
    return children;
  }

  // Auth required routes
  if (requireAuth && !currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Role-based access
  if (allowedRoles && currentUser && userData) {
    const userRoles = userData.roles || [];
    const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role));
    
    if (!hasAllowedRole) {
      return <Navigate to="/" replace />;
    }

    // Check approval status for seller/rider
    if (allowedRoles.includes('seller') && !userData.sellerApproved) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Pending Approval</h2>
            <p>Your seller account is pending admin approval.</p>
          </div>
        </div>
      );
    }

    if (allowedRoles.includes('rider') && !userData.riderApproved) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Pending Approval</h2>
            <p>Your rider account is pending admin approval.</p>
          </div>
        </div>
      );
    }
  }

  return children;
}

