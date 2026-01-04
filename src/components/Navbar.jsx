import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../services/authService';

export function Navbar() {
  const { currentUser, userData, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOutUser();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-orange-600">
              FoodiesHub
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                {userData?.roles?.includes('buyer') && (
                  <>
                    <Link to="/buyer" className="text-gray-700 hover:text-orange-600">
                      Browse
                    </Link>
                    <Link to="/cart" className="text-gray-700 hover:text-orange-600">
                      Cart
                    </Link>
                    <Link to="/orders" className="text-gray-700 hover:text-orange-600">
                      Orders
                    </Link>
                  </>
                )}
                {userData?.roles?.includes('seller') && (
                  <Link to="/seller" className="text-gray-700 hover:text-orange-600">
                    Seller
                  </Link>
                )}
                {userData?.roles?.includes('rider') && (
                  <Link to="/rider" className="text-gray-700 hover:text-orange-600">
                    Rider
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin" className="text-red-600 hover:text-red-700 font-semibold">
                    Admin
                  </Link>
                )}
                <span className="text-gray-600">{userData?.displayName || currentUser.email}</span>
                <button
                  onClick={handleSignOut}
                  className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-orange-600">
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

