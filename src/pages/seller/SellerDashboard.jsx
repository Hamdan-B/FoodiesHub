import { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import {
  getStoreBySellerId,
  createStore,
  updateStore,
  getStoreFoodItems,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
} from '../../services/storeManagementService';
import { uploadStoreLogo, uploadFoodImage } from '../../services/storageService';
import { generateNutrition } from '../../services/gemini';
import { getStoreOrders, acceptOrder, rejectOrder, updateOrderStatus } from '../../services/orderService';
import { PAKISTAN_CITIES } from '../../constants/pakistanCities';
import { FOOD_CATEGORIES, getCategoryDisplayName } from '../../constants/foodCategories';
import { formatPrice } from '../../utils/formatPrice';

export default function SellerDashboard() {
  const { currentUser } = useAuth();
  const [store, setStore] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('store'); // 'store', 'food', 'orders'

  // Store form
  const [storeForm, setStoreForm] = useState({
    name: '',
    description: '',
    city: '',
    logoFile: null,
  });

  // Food form
  const [foodForm, setFoodForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    groupSize: '',
    imageFile: null,
    stockStatus: 'in_stock',
    useAINutrition: false,
    variants: [],
    nutrition: {
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
    },
  });
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [editingFood, setEditingFood] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadStore();
    }
  }, [currentUser]);

  useEffect(() => {
    if (store) {
      loadFoodItems();
      loadOrders();
    }
  }, [store]);

  const loadStore = async () => {
    try {
      setLoading(true);
      const storeData = await getStoreBySellerId(currentUser.uid);
      setStore(storeData);
      if (storeData) {
        setStoreForm({
          name: storeData.name || '',
          description: storeData.description || '',
          city: storeData.city || '',
          logoFile: null,
        });
      }
    } catch (error) {
      console.error('Error loading store:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFoodItems = async () => {
    try {
      const items = await getStoreFoodItems(store.storeId);
      setFoodItems(items);
    } catch (error) {
      console.error('Error loading food items:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const ordersList = await getStoreOrders(store.storeId);
      ordersList.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
      setOrders(ordersList);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    try {
      let logoUrl = '';
      if (storeForm.logoFile) {
        logoUrl = await uploadStoreLogo(storeForm.logoFile, currentUser.uid);
      }

      const storeId = await createStore({
        sellerId: currentUser.uid,
        name: storeForm.name,
        description: storeForm.description,
        city: storeForm.city,
        logoUrl,
      });

      await loadStore();
      alert('Store created successfully!');
    } catch (error) {
      console.error('Error creating store:', error);
      alert(error.message || 'Failed to create store');
    }
  };

  const handleUpdateStore = async (e) => {
    e.preventDefault();
    try {
      let logoUrl = store.logoUrl;
      if (storeForm.logoFile) {
        logoUrl = await uploadStoreLogo(storeForm.logoFile, store.storeId);
      }

      await updateStore(store.storeId, {
        name: storeForm.name,
        description: storeForm.description,
        city: storeForm.city,
        logoUrl,
      });

      await loadStore();
      alert('Store updated successfully!');
    } catch (error) {
      console.error('Error updating store:', error);
      alert('Failed to update store');
    }
  };

  const handleGenerateNutrition = async () => {
    if (!foodForm.name || !foodForm.description || !foodForm.category) {
      alert('Please fill in name, description, and category first');
      return;
    }

    try {
      const nutrition = await generateNutrition(
        foodForm.name,
        foodForm.description,
        foodForm.category
      );
      setFoodForm({
        ...foodForm,
        nutrition: {
          calories: nutrition.calories || '',
          protein: nutrition.protein || '',
          carbs: nutrition.carbs || '',
          fat: nutrition.fat || '',
        },
        useAINutrition: true,
      });
    } catch (error) {
      console.error('Error generating nutrition:', error);
      alert('Failed to generate nutrition. Please enter manually.');
    }
  };

  const handleCreateFood = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = '';
      if (foodForm.imageFile) {
        imageUrl = await uploadFoodImage(foodForm.imageFile, `temp_${Date.now()}`);
      }

      const nutrition = foodForm.useAINutrition
        ? {
            calories: parseFloat(foodForm.nutrition.calories) || 0,
            protein: parseFloat(foodForm.nutrition.protein) || 0,
            carbs: parseFloat(foodForm.nutrition.carbs) || 0,
            fat: parseFloat(foodForm.nutrition.fat) || 0,
            isAIGenerated: true,
          }
        : {
            calories: parseFloat(foodForm.nutrition.calories) || 0,
            protein: parseFloat(foodForm.nutrition.protein) || 0,
            carbs: parseFloat(foodForm.nutrition.carbs) || 0,
            fat: parseFloat(foodForm.nutrition.fat) || 0,
            isAIGenerated: false,
          };

      // Filter out empty variants
      const validVariants = foodForm.variants.filter(
        (v) => v.name && v.name.trim() && v.price && parseFloat(v.price) > 0
      );

      const foodId = await createFoodItem({
        storeId: store.storeId,
        name: foodForm.name,
        description: foodForm.description,
        price: parseFloat(foodForm.price),
        category: foodForm.category,
        groupSize: foodForm.groupSize,
        imageUrl,
        stockStatus: foodForm.stockStatus,
        variants: validVariants.length > 0 ? validVariants.map((v) => ({ name: v.name, price: parseFloat(v.price) })) : undefined,
        nutrition,
      });

      // Update image URL with actual foodId
      if (imageUrl) {
        const newImageUrl = await uploadFoodImage(foodForm.imageFile, foodId);
        await updateFoodItem(foodId, { imageUrl: newImageUrl });
      }

      setFoodForm({
        name: '',
        description: '',
        price: '',
        category: '',
        groupSize: '',
        imageFile: null,
        stockStatus: 'in_stock',
        useAINutrition: false,
        variants: [],
        nutrition: { calories: '', protein: '', carbs: '', fat: '' },
      });
      setShowFoodForm(false);
      await loadFoodItems();
      alert('Food item created successfully!');
    } catch (error) {
      console.error('Error creating food item:', error);
      alert('Failed to create food item');
    }
  };

  const handleUpdateFood = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = editingFood.imageUrl;
      if (foodForm.imageFile) {
        imageUrl = await uploadFoodImage(foodForm.imageFile, editingFood.foodId);
      }

      const nutrition = foodForm.useAINutrition
        ? {
            calories: parseFloat(foodForm.nutrition.calories) || 0,
            protein: parseFloat(foodForm.nutrition.protein) || 0,
            carbs: parseFloat(foodForm.nutrition.carbs) || 0,
            fat: parseFloat(foodForm.nutrition.fat) || 0,
            isAIGenerated: true,
          }
        : {
            calories: parseFloat(foodForm.nutrition.calories) || 0,
            protein: parseFloat(foodForm.nutrition.protein) || 0,
            carbs: parseFloat(foodForm.nutrition.carbs) || 0,
            fat: parseFloat(foodForm.nutrition.fat) || 0,
            isAIGenerated: false,
          };

      // Filter out empty variants
      const validVariants = foodForm.variants.filter(
        (v) => v.name && v.name.trim() && v.price && parseFloat(v.price) > 0
      );

      await updateFoodItem(editingFood.foodId, {
        name: foodForm.name,
        description: foodForm.description,
        price: parseFloat(foodForm.price),
        category: foodForm.category,
        groupSize: foodForm.groupSize,
        imageUrl,
        stockStatus: foodForm.stockStatus,
        variants: validVariants.length > 0 ? validVariants.map((v) => ({ name: v.name, price: parseFloat(v.price) })) : undefined,
        nutrition,
      });

      setShowFoodForm(false);
      setEditingFood(null);
      await loadFoodItems();
      alert('Food item updated successfully!');
    } catch (error) {
      console.error('Error updating food item:', error);
      alert('Failed to update food item');
    }
  };

  const handleDeleteFood = async (foodId) => {
    if (!confirm('Are you sure you want to delete this food item?')) return;

    try {
      await deleteFoodItem(foodId);
      await loadFoodItems();
      alert('Food item deleted successfully!');
    } catch (error) {
      console.error('Error deleting food item:', error);
      alert('Failed to delete food item');
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await acceptOrder(orderId);
      await loadOrders();
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Failed to accept order');
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      await rejectOrder(orderId);
      await loadOrders();
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Failed to reject order');
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      await loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const startEditFood = (food) => {
    setEditingFood(food);
    setFoodForm({
      name: food.name || '',
      description: food.description || '',
      price: food.price?.toString() || '',
      category: food.category || '',
      groupSize: food.groupSize || '',
      imageFile: null,
      stockStatus: food.stockStatus || 'in_stock',
      useAINutrition: food.nutrition?.isAIGenerated || false,
      variants: food.variants || [],
      nutrition: {
        calories: food.nutrition?.calories?.toString() || '',
        protein: food.nutrition?.protein?.toString() || '',
        carbs: food.nutrition?.carbs?.toString() || '',
        fat: food.nutrition?.fat?.toString() || '',
      },
    });
    setShowFoodForm(true);
  };

  // Variant management functions
  const addVariant = () => {
    setFoodForm({
      ...foodForm,
      variants: [...foodForm.variants, { name: '', price: '' }],
    });
  };

  const removeVariant = (index) => {
    setFoodForm({
      ...foodForm,
      variants: foodForm.variants.filter((_, i) => i !== index),
    });
  };

  const updateVariant = (index, field, value) => {
    const updatedVariants = [...foodForm.variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setFoodForm({ ...foodForm, variants: updatedVariants });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6">Seller Dashboard</h2>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('store')}
            className={`pb-2 px-4 ${activeTab === 'store' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-600'}`}
          >
            Store
          </button>
          <button
            onClick={() => setActiveTab('food')}
            className={`pb-2 px-4 ${activeTab === 'food' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-600'}`}
          >
            Food Items
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-2 px-4 ${activeTab === 'orders' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-600'}`}
          >
            Orders
          </button>
        </div>

        {/* Store Tab */}
        {activeTab === 'store' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">
              {store ? 'Update Store' : 'Create Store'}
            </h3>
            <form onSubmit={store ? handleUpdateStore : handleCreateStore} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input
                  type="text"
                  required
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  value={storeForm.description}
                  onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <select
                  required
                  value={storeForm.city}
                  onChange={(e) => setStoreForm({ ...storeForm, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                >
                  <option value="">Select city</option>
                  {PAKISTAN_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setStoreForm({ ...storeForm, logoFile: e.target.files[0] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
                {store?.logoUrl && (
                  <img src={store.logoUrl} alt="Store logo" className="mt-2 w-32 h-32 object-cover rounded" />
                )}
              </div>
              <button
                type="submit"
                className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700"
              >
                {store ? 'Update Store' : 'Create Store'}
              </button>
            </form>
          </div>
        )}

        {/* Food Items Tab */}
        {activeTab === 'food' && (
          <div>
            {!store ? (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                Please create a store first
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    setShowFoodForm(true);
                    setEditingFood(null);
                    setFoodForm({
                      name: '',
                      description: '',
                      price: '',
                      category: '',
                      groupSize: '',
                      imageFile: null,
                      stockStatus: 'in_stock',
                      useAINutrition: false,
                      variants: [],
                      nutrition: { calories: '', protein: '', carbs: '', fat: '' },
                    });
                  }}
                  className="mb-4 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                >
                  Add Food Item
                </button>

                {showFoodForm && (
                  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="text-xl font-semibold mb-4">
                      {editingFood ? 'Edit Food Item' : 'Create Food Item'}
                    </h3>
                    <form
                      onSubmit={editingFood ? handleUpdateFood : handleCreateFood}
                      className="space-y-4"
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            required
                            value={foodForm.name}
                            onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={foodForm.price}
                            onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          required
                          value={foodForm.description}
                          onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded"
                          rows="3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          required
                          value={foodForm.category}
                          onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded"
                        >
                          <option value="">Select category</option>
                          {FOOD_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                          {/* Show current category if it's not in the list (backward compatibility) */}
                          {foodForm.category && !FOOD_CATEGORIES.includes(foodForm.category) && (
                            <option value={foodForm.category}>{getCategoryDisplayName(foodForm.category)}</option>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Group Size <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={foodForm.groupSize}
                          onChange={(e) => setFoodForm({ ...foodForm, groupSize: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded"
                        >
                          <option value="">Select group size</option>
                          <option value="individual">Individual</option>
                          <option value="2-3">2-3 people</option>
                          <option value="4-6">4-6 people</option>
                          <option value="custom">Custom number</option>
                        </select>
                        {foodForm.groupSize === 'custom' && (
                          <input
                            type="number"
                            min="1"
                            placeholder="Enter number of people"
                            className="mt-2 w-full px-4 py-2 border border-gray-300 rounded"
                            onChange={(e) => setFoodForm({ ...foodForm, groupSize: e.target.value })}
                          />
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFoodForm({ ...foodForm, imageFile: e.target.files[0] })}
                          className="w-full px-4 py-2 border border-gray-300 rounded"
                        />
                        {editingFood?.imageUrl && !foodForm.imageFile && (
                          <img
                            src={editingFood.imageUrl}
                            alt="Food"
                            className="mt-2 w-32 h-32 object-cover rounded"
                          />
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                        <select
                          value={foodForm.stockStatus}
                          onChange={(e) => setFoodForm({ ...foodForm, stockStatus: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded"
                        >
                          <option value="in_stock">In Stock</option>
                          <option value="out_of_stock">Out of Stock</option>
                        </select>
                      </div>

                      {/* Nutrition Section */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Nutrition Information
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={foodForm.useAINutrition}
                              onChange={(e) =>
                                setFoodForm({ ...foodForm, useAINutrition: e.target.checked })
                              }
                              className="h-4 w-4"
                            />
                            <span className="text-sm">Generate with AI</span>
                            {foodForm.useAINutrition && (
                              <button
                                type="button"
                                onClick={handleGenerateNutrition}
                                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                              >
                                Generate
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
                            <input
                              type="number"
                              value={foodForm.nutrition.calories}
                              onChange={(e) =>
                                setFoodForm({
                                  ...foodForm,
                                  nutrition: { ...foodForm.nutrition, calories: e.target.value },
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={foodForm.nutrition.protein}
                              onChange={(e) =>
                                setFoodForm({
                                  ...foodForm,
                                  nutrition: { ...foodForm.nutrition, protein: e.target.value },
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={foodForm.nutrition.carbs}
                              onChange={(e) =>
                                setFoodForm({
                                  ...foodForm,
                                  nutrition: { ...foodForm.nutrition, carbs: e.target.value },
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fat (g)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={foodForm.nutrition.fat}
                              onChange={(e) =>
                                setFoodForm({
                                  ...foodForm,
                                  nutrition: { ...foodForm.nutrition, fat: e.target.value },
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Variants Section (Optional) */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Variants (Optional)
                          </label>
                          <button
                            type="button"
                            onClick={addVariant}
                            className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            + Add Variant
                          </button>
                        </div>
                        {foodForm.variants.length > 0 && (
                          <div className="space-y-3">
                            {foodForm.variants.map((variant, index) => (
                              <div key={index} className="flex gap-2 items-end">
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-600 mb-1">Variant Name</label>
                                  <input
                                    type="text"
                                    value={variant.name}
                                    onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                    placeholder="e.g., Small, Medium, Large"
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-600 mb-1">Price</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={variant.price}
                                    onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                    placeholder="Price"
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeVariant(index)}
                                  className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="submit"
                          className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700"
                        >
                          {editingFood ? 'Update' : 'Create'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowFoodForm(false);
                            setEditingFood(null);
                          }}
                          className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {foodItems.map((item) => (
                    <div key={item.foodId} className="bg-white rounded-lg shadow-md p-6">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-48 object-cover rounded mb-4"
                        />
                      )}
                      <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                      <p className="text-gray-600 mb-2">{item.description}</p>
                      <p className="text-lg font-bold text-orange-600 mb-2">{formatPrice(item.price)}</p>
                      <p className="text-sm text-gray-500 mb-4">
                        Status: {item.stockStatus === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditFood(item)}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteFood(item.foodId)}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            {!store ? (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                Please create a store first
              </div>
            ) : (
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                    No orders yet
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.orderId} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">Order #{order.orderId.slice(0, 8)}</h3>
                          <p className="text-sm text-gray-500">
                            {order.createdAt?.toDate?.()?.toLocaleString() || 'Date not available'}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Status:</span> {order.orderStatus}
                          </p>
                        </div>
                        <span className="text-lg font-bold">{formatPrice(order.total)}</span>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">Items:</h4>
                        <ul className="space-y-1">
                          {order.items?.map((item, idx) => (
                            <li key={idx} className="text-sm">
                              {item.foodName} x {item.quantity} - {formatPrice(item.price * item.quantity)}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm">
                          <span className="font-semibold">Delivery Address:</span> {order.deliveryAddress}
                        </p>
                      </div>

                      {order.orderStatus === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptOrder(order.orderId)}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectOrder(order.orderId)}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {order.orderStatus === 'accepted' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.orderId, 'preparing')}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                          Start Preparing
                        </button>
                      )}

                      {order.orderStatus === 'preparing' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.orderId, 'ready')}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                          Mark as Ready
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

