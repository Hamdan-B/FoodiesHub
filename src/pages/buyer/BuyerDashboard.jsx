import { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { useCart } from '../../contexts/CartContext';
import { getStores, getFoodItemsByStore } from '../../services/storeService';
import { ShoppingCart } from 'lucide-react';
import { PAKISTAN_CITIES, getCityDisplayName } from '../../constants/pakistanCities';
import { FOOD_CATEGORIES } from '../../constants/foodCategories';
import { formatPrice } from '../../utils/formatPrice';

export default function BuyerDashboard() {
  const { groupSize, setGroupSize, addToCart } = useCart();
  const [stores, setStores] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedStore, setSelectedStore] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [allFoodItems, setAllFoodItems] = useState([]);
  const [filteredFoodItems, setFilteredFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCalories, setFilterCalories] = useState('');
  const [priceSort, setPriceSort] = useState('');

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (selectedCity) {
      loadStores(selectedCity);
    } else {
      loadStores();
    }
  }, [selectedCity]);

  useEffect(() => {
    if (selectedStore) {
      loadFoodItems(selectedStore.storeId);
    }
  }, [selectedStore]);

  // Load all food items when stores change
  useEffect(() => {
    if (stores.length > 0) {
      loadAllFoodItems();
    }
  }, [stores]);

  // Filter food items when filters change
  useEffect(() => {
    filterFoodItems();
  }, [allFoodItems, groupSize, filterCategory, filterCalories, priceSort]);

  const loadStores = async (city = null) => {
    try {
      setLoading(true);
      const storesList = await getStores(city);
      setStores(storesList);
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFoodItems = async (storeId) => {
    try {
      const items = await getFoodItemsByStore(storeId);
      setFoodItems(items);
    } catch (error) {
      console.error('Error loading food items:', error);
    }
  };

  const loadAllFoodItems = async () => {
    try {
      const allItems = [];
      for (const store of stores) {
        const items = await getFoodItemsByStore(store.storeId);
        allItems.push(...items.map((item) => ({ ...item, storeName: store.name, storeId: store.storeId })));
      }
      setAllFoodItems(allItems);
    } catch (error) {
      console.error('Error loading all food items:', error);
    }
  };

  const filterFoodItems = () => {
    if (!groupSize) {
      setFilteredFoodItems([]);
      return;
    }

    let filtered = [...allFoodItems];

    // Filter by group size (primary filter)
    filtered = filtered.filter((item) => {
      // Backward compatibility: if item has no groupSize, include it
      if (!item.groupSize) return true;
      
      // Normalize group size for comparison
      const itemGroupSize = item.groupSize.toString().toLowerCase().trim();
      const selectedGroupSize = groupSize.toString().toLowerCase().trim();

      if (selectedGroupSize === 'individual') {
        return itemGroupSize === 'individual';
      } else if (selectedGroupSize === '2-3') {
        return itemGroupSize === '2-3' || itemGroupSize === 'individual';
      } else if (selectedGroupSize === '4-6') {
        return itemGroupSize === '4-6' || itemGroupSize === '2-3' || itemGroupSize === 'individual';
      } else {
        // Custom number - match if item's group size can accommodate the selected number
        const customNum = parseInt(selectedGroupSize);
        if (!isNaN(customNum) && customNum > 0) {
          // If item has a numeric group size, check if it can accommodate
          const itemNum = parseInt(itemGroupSize);
          if (!isNaN(itemNum)) {
            return itemNum >= customNum;
          }
          // If item has predefined sizes, check compatibility
          if (itemGroupSize === 'individual' && customNum === 1) return true;
          if (itemGroupSize === '2-3' && customNum >= 2 && customNum <= 3) return true;
          if (itemGroupSize === '4-6' && customNum >= 4 && customNum <= 6) return true;
          // For larger custom numbers, allow 4-6 items
          if (itemGroupSize === '4-6' && customNum > 6) return true;
        }
        return itemGroupSize === selectedGroupSize;
      }
    });

    // Filter by category (secondary filter)
    if (filterCategory) {
      filtered = filtered.filter((item) => item.category === filterCategory);
    }

    // Filter by calories (optional)
    if (filterCalories) {
      const maxCalories = parseFloat(filterCalories);
      if (!isNaN(maxCalories) && maxCalories > 0) {
        filtered = filtered.filter((item) => {
          const calories = item.nutrition?.calories || 0;
          return calories <= maxCalories;
        });
      }
    }

    // Sort by price
    if (priceSort === 'low-high') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (priceSort === 'high-low') {
      filtered.sort((a, b) => b.price - a.price);
    }

    setFilteredFoodItems(filtered);
  };

  const handleAddToCart = (foodItem) => {
    addToCart(foodItem, 1);
    alert(`${foodItem.name} added to cart!`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Group Size Selection */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Group Size</h2>
          <div className="flex flex-wrap gap-4">
            {['individual', '2-3', '4-6'].map((size) => (
              <button
                key={size}
                onClick={() => setGroupSize(size)}
                className={`px-4 py-2 rounded ${
                  groupSize === size
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {size === 'individual' ? 'Individual' : `${size} people`}
              </button>
            ))}
            <input
              type="number"
              placeholder="Custom"
              min="1"
              className="px-4 py-2 border border-gray-300 rounded"
              onChange={(e) => {
                if (e.target.value) setGroupSize(e.target.value);
              }}
            />
          </div>
        </div>

        {/* Filters */}
        {groupSize && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Filters</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                >
                  <option value="">All Categories</option>
                  {FOOD_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Calories</label>
                <input
                  type="number"
                  value={filterCalories}
                  onChange={(e) => setFilterCalories(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort by Price</label>
                <select
                  value={priceSort}
                  onChange={(e) => setPriceSort(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                >
                  <option value="">None</option>
                  <option value="low-high">Low to High</option>
                  <option value="high-low">High to Low</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Filtered Food Items */}
        {groupSize && filteredFoodItems.length > 0 && (
          <div className="bg-blue-50 p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Recommended Items ({filteredFoodItems.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFoodItems.map((item) => (
                <div key={item.foodId} className="bg-white p-4 rounded shadow">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-xs text-gray-500">{item.storeName}</p>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  <p className="text-sm text-orange-600 font-semibold mt-2">
                    {formatPrice(item.price)}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedStore(stores.find((s) => s.storeId === item.storeId));
                    }}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    View Store →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* City Filter */}
        <div className="mb-6">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded"
          >
            <option value="">All Cities</option>
            {PAKISTAN_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Stores List */}
        {!selectedStore ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">Restaurants</h2>
            {loading ? (
              <div className="text-center py-8">Loading stores...</div>
            ) : stores.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No stores found</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((store) => (
                  <div
                    key={store.storeId}
                    onClick={() => setSelectedStore(store)}
                    className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition"
                  >
                    {store.logoUrl && (
                      <img
                        src={store.logoUrl}
                        alt={store.name}
                        className="w-full h-32 object-cover rounded mb-4"
                      />
                    )}
                    <h3 className="text-xl font-semibold mb-2">{store.name}</h3>
                    <p className="text-gray-600 mb-2">{store.description}</p>
                    <p className="text-sm text-gray-500">{getCityDisplayName(store.city)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <button
              onClick={() => setSelectedStore(null)}
              className="mb-4 text-orange-600 hover:text-orange-700"
            >
              ← Back to Stores
            </button>
            <h2 className="text-2xl font-bold mb-4">{selectedStore.name}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {foodItems.map((item) => (
                <div key={item.foodId} className="bg-white p-6 rounded-lg shadow-md">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-48 object-cover rounded mb-4"
                    />
                  )}
                  <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                  <p className="text-gray-600 mb-2">{item.description}</p>
                  {item.nutrition && (
                    <div className="text-sm text-gray-500 mb-2">
                      <span>Calories: {item.nutrition.calories}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-orange-600">{formatPrice(item.price)}</span>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 flex items-center gap-2"
                    >
                      <ShoppingCart size={18} />
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

