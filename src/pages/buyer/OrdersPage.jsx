import { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { getBuyerOrders, subscribeToOrder } from '../../services/orderService';
import { formatPrice } from '../../utils/formatPrice';

const ORDER_STATUSES = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-800' },
  preparing: { label: 'Preparing', color: 'bg-purple-100 text-purple-800' },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-800' },
  picked_up: { label: 'Picked Up', color: 'bg-indigo-100 text-indigo-800' },
  delivering: { label: 'Delivering', color: 'bg-pink-100 text-pink-800' },
  delivered: { label: 'Delivered', color: 'bg-green-200 text-green-900' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
};

export default function OrdersPage() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadOrders();
    }
  }, [currentUser]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersList = await getBuyerOrders(currentUser.uid);
      // Sort by most recent first
      ordersList.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
      setOrders(ordersList);

      // Subscribe to real-time updates for each order
      ordersList.forEach((order) => {
        subscribeToOrder(order.orderId, (updatedOrder) => {
          if (updatedOrder) {
            setOrders((prev) =>
              prev.map((o) => (o.orderId === updatedOrder.orderId ? updatedOrder : o))
            );
          }
        });
      });
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    return ORDER_STATUSES[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6">My Orders</h2>

        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.orderStatus);
              return (
                <div key={order.orderId} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Order #{order.orderId.slice(0, 8)}</h3>
                      <p className="text-sm text-gray-500">
                        {order.createdAt?.toDate?.()?.toLocaleString() || 'Date not available'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
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
                    <p className="text-sm">
                      <span className="font-semibold">Payment:</span> {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online (Demo)'}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="text-lg font-bold">Total: {formatPrice(order.total)}</span>
                    {order.deliveryOTP && (
                      <span className="text-sm text-gray-600">
                        Delivery OTP: <span className="font-mono font-bold">{order.deliveryOTP}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

