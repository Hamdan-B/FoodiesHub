import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { createOrder } from '../../services/orderService';
import { getStoreById } from '../../services/storeService';
import { formatPrice } from '../../utils/formatPrice';

export default function CartPage() {
  const { cartItems, groupSize, updateQuantity, removeFromCart, getCartTotal, clearCart } =
    useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);

  const deliveryFee = 5.0;
  const subtotal = getCartTotal();
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    if (!deliveryAddress.trim()) {
      alert('Please enter delivery address');
      return;
    }

    if (cartItems.length === 0) {
      alert('Cart is empty');
      return;
    }

    setLoading(true);

    try {
      // Get store info for first item (assuming all items are from same store)
      const storeId = cartItems[0].storeId;
      const store = await getStoreById(storeId);

      const orderData = {
        buyerId: currentUser.uid,
        storeId: storeId,
        items: cartItems.map((item) => ({
          foodId: item.foodId,
          foodName: item.foodName,
          quantity: item.quantity,
          price: item.price,
          variants: item.variants || {},
        })),
        groupSize,
        subtotal,
        deliveryFee,
        total,
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
        orderStatus: 'pending',
        deliveryAddress,
      };

      const orderId = await createOrder(orderData);
      clearCart();
      alert('Order placed successfully!');
      navigate(`/orders`);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
            <button
              onClick={() => navigate('/buyer')}
              className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700"
            >
              Browse Restaurants
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6">Shopping Cart</h2>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {cartItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-4 border-b last:border-b-0">
              <div className="flex items-center gap-4">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.foodName} className="w-20 h-20 object-cover rounded" />
                )}
                <div>
                  <h3 className="font-semibold">{item.foodName}</h3>
                  <p className="text-sm text-gray-600">{formatPrice(item.price)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.foodId, item.quantity - 1, item.variants)}
                    className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.foodId, item.quantity + 1, item.variants)}
                    className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <span className="font-semibold w-20 text-right">
                  {formatPrice(item.price * item.quantity)}
                </span>
                <button
                  onClick={() => removeFromCart(item.foodId, item.variants)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Delivery Information</h3>
          <textarea
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Enter delivery address"
            className="w-full px-4 py-2 border border-gray-300 rounded mb-4"
            rows="3"
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-2"
              />
              Cash on Delivery
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="online"
                checked={paymentMethod === 'online'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-2"
              />
              Online Payment (Demo)
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee:</span>
              <span>{formatPrice(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2 border-t">
              <span>Total:</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

