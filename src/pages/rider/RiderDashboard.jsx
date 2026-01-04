import { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAvailableOrders,
  getRiderOrders,
  assignRiderToOrder,
  updateOrderStatusByRider,
} from '../../services/orderService';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { uploadRiderProfileImage } from '../../services/storageService';
import { formatPrice } from '../../utils/formatPrice';

export default function RiderDashboard() {
  const { currentUser, userData } = useAuth();
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [riderStatus, setRiderStatus] = useState('offline');
  const [riderAvailability, setRiderAvailability] = useState('available');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [activeTab, setActiveTab] = useState('available'); // 'available', 'my-orders', 'profile'

  useEffect(() => {
    if (currentUser && userData?.riderApproved) {
      loadRiderData();
      loadAvailableOrders();
      loadMyOrders();
    }
  }, [currentUser, userData]);

  const loadRiderData = async () => {
    try {
      const riderDoc = await doc(db, 'riders', currentUser.uid);
      const riderData = (await getDoc(riderDoc)).data();
      if (riderData) {
        setRiderStatus(riderData.status || 'offline');
        setRiderAvailability(riderData.availability || 'available');
      }
    } catch (error) {
      console.error('Error loading rider data:', error);
    }
  };

  const loadAvailableOrders = async () => {
    try {
      const orders = await getAvailableOrders();
      setAvailableOrders(orders);
    } catch (error) {
      console.error('Error loading available orders:', error);
    }
  };

  const loadMyOrders = async () => {
    try {
      const orders = await getRiderOrders(currentUser.uid);
      orders.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
      setMyOrders(orders);
    } catch (error) {
      console.error('Error loading my orders:', error);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus = riderStatus === 'online' ? 'offline' : 'online';
      await updateDoc(doc(db, 'riders', currentUser.uid), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setRiderStatus(newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const newAvailability = riderAvailability === 'available' ? 'busy' : 'available';
      await updateDoc(doc(db, 'riders', currentUser.uid), {
        availability: newAvailability,
        updatedAt: serverTimestamp(),
      });
      setRiderAvailability(newAvailability);
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Failed to update availability');
    }
  };

  const handleAcceptOrder = async (orderId) => {
    if (riderStatus !== 'online' || riderAvailability !== 'available') {
      alert('Please set status to Online and Availability to Available first');
      return;
    }

    try {
      await assignRiderToOrder(orderId, currentUser.uid);
      await updateDoc(doc(db, 'riders', currentUser.uid), {
        availability: 'busy',
        currentOrderId: orderId,
        updatedAt: serverTimestamp(),
      });
      setRiderAvailability('busy');
      await loadAvailableOrders();
      await loadMyOrders();
      alert('Order accepted!');
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Failed to accept order');
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      if (status === 'delivering') {
        // Generate OTP when starting delivery
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        await updateOrderStatusByRider(orderId, status, otp);
        alert(`Order status updated. Delivery OTP: ${otp}`);
      } else if (status === 'delivered') {
        await updateOrderStatusByRider(orderId, status);
        await updateDoc(doc(db, 'riders', currentUser.uid), {
          availability: 'available',
          currentOrderId: null,
          totalDeliveries: (await getDoc(doc(db, 'riders', currentUser.uid))).data()?.totalDeliveries + 1 || 1,
          updatedAt: serverTimestamp(),
        });
        setRiderAvailability('available');
        alert('Order delivered successfully!');
      } else {
        await updateOrderStatusByRider(orderId, status);
      }
      await loadMyOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const handleUploadProfileImage = async () => {
    if (!profileImageFile) {
      alert('Please select an image');
      return;
    }

    try {
      const imageUrl = await uploadRiderProfileImage(profileImageFile, currentUser.uid);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        riderProfileImage: imageUrl,
        updatedAt: serverTimestamp(),
      });
      alert('Profile image uploaded successfully!');
      setProfileImageFile(null);
    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert('Failed to upload profile image');
    }
  };

  if (!userData?.riderApproved) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Pending Approval</h2>
            <p>Your rider account is pending admin approval.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Rider Dashboard</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleStatus}
              className={`px-4 py-2 rounded ${
                riderStatus === 'online'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-700'
              }`}
            >
              {riderStatus === 'online' ? 'Online' : 'Offline'}
            </button>
            <button
              onClick={handleToggleAvailability}
              className={`px-4 py-2 rounded ${
                riderAvailability === 'available'
                  ? 'bg-blue-600 text-white'
                  : 'bg-yellow-600 text-white'
              }`}
            >
              {riderAvailability === 'available' ? 'Available' : 'Busy'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('available')}
            className={`pb-2 px-4 ${
              activeTab === 'available'
                ? 'border-b-2 border-orange-600 text-orange-600'
                : 'text-gray-600'
            }`}
          >
            Available Orders
          </button>
          <button
            onClick={() => setActiveTab('my-orders')}
            className={`pb-2 px-4 ${
              activeTab === 'my-orders'
                ? 'border-b-2 border-orange-600 text-orange-600'
                : 'text-gray-600'
            }`}
          >
            My Orders
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2 px-4 ${
              activeTab === 'profile'
                ? 'border-b-2 border-orange-600 text-orange-600'
                : 'text-gray-600'
            }`}
          >
            Profile
          </button>
        </div>

        {/* Available Orders Tab */}
        {activeTab === 'available' && (
          <div>
            {availableOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                No available orders
              </div>
            ) : (
              <div className="space-y-4">
                {availableOrders.map((order) => (
                  <div key={order.orderId} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Order #{order.orderId.slice(0, 8)}</h3>
                        <p className="text-sm text-gray-500">
                          {order.createdAt?.toDate?.()?.toLocaleString() || 'Date not available'}
                        </p>
                      </div>
                      <span className="text-lg font-bold">{formatPrice(order.total)}</span>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Items:</h4>
                      <ul className="space-y-1">
                        {order.items?.map((item, idx) => (
                          <li key={idx} className="text-sm">
                            {item.foodName} x {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm">
                        <span className="font-semibold">Delivery Address:</span> {order.deliveryAddress}
                      </p>
                    </div>

                    <button
                      onClick={() => handleAcceptOrder(order.orderId)}
                      disabled={riderStatus !== 'online' || riderAvailability !== 'available'}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Accept Order
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Orders Tab */}
        {activeTab === 'my-orders' && (
          <div>
            {myOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                No orders assigned
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map((order) => (
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
                            {item.foodName} x {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm">
                        <span className="font-semibold">Delivery Address:</span> {order.deliveryAddress}
                      </p>
                      {order.deliveryOTP && (
                        <p className="text-sm mt-2">
                          <span className="font-semibold">Delivery OTP:</span>{' '}
                          <span className="font-mono font-bold">{order.deliveryOTP}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {order.orderStatus === 'picked_up' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.orderId, 'delivering')}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                          Start Delivering
                        </button>
                      )}
                      {order.orderStatus === 'delivering' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.orderId, 'delivered')}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                          Mark as Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Rider Profile</h3>
            {userData?.riderProfileImage && (
              <img
                src={userData.riderProfileImage}
                alt="Profile"
                className="w-32 h-32 object-cover rounded mb-4"
              />
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfileImageFile(e.target.files[0])}
                  className="w-full px-4 py-2 border border-gray-300 rounded mb-2"
                />
                <button
                  onClick={handleUploadProfileImage}
                  className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                >
                  Upload Image
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

