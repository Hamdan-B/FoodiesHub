import { Navbar } from '../components/Navbar';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

export default function HomePage() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to FoodiesHub
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your favorite food, delivered to your door
          </p>
          {!currentUser && (
            <div className="space-x-4">
              <Link
                to="/signup"
                className="bg-orange-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-orange-700"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="bg-white text-orange-600 px-8 py-3 rounded-lg text-lg font-semibold border-2 border-orange-600 hover:bg-orange-50"
              >
                Login
              </Link>
            </div>
          )}
          {currentUser && (
            <Link
              to="/buyer"
              className="bg-orange-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-orange-700 inline-block"
            >
              Browse Restaurants
            </Link>
          )}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Browse Stores</h3>
            <p className="text-gray-600">
              Discover restaurants in your city with our city-based filtering
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Personalized Recommendations</h3>
            <p className="text-gray-600">
              Get personalized food recommendations based on your group size and preferences
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Eat Informed</h3>
            <p className="text-gray-600">
              Real-time nutritional insights for every item on your plate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

