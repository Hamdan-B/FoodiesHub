import { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import {
  getAllUsers,
  getAllStores,
  getAllOrders,
  approveSeller,
  rejectSeller,
  approveRider,
  rejectRider,
} from '../../services/adminService';
import { getCityDisplayName } from '../../constants/pakistanCities';
import { formatPrice } from '../../utils/formatPrice';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'users', 'stores', 'orders'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, storesData, ordersData] = await Promise.all([
        getAllUsers(),
        getAllStores(),
        getAllOrders(),
      ]);
      setUsers(usersData);
      setStores(storesData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSeller = async (uid) => {
    try {
      await approveSeller(uid);
      await loadData();
      alert('Seller approved successfully!');
    } catch (error) {
      console.error('Error approving seller:', error);
      alert('Failed to approve seller');
    }
  };

  const handleRejectSeller = async (uid) => {
    try {
      await rejectSeller(uid);
      await loadData();
      alert('Seller rejected');
    } catch (error) {
      console.error('Error rejecting seller:', error);
      alert('Failed to reject seller');
    }
  };

  const handleApproveRider = async (uid) => {
    try {
      await approveRider(uid);
      await loadData();
      alert('Rider approved successfully!');
    } catch (error) {
      console.error('Error approving rider:', error);
      alert('Failed to approve rider');
    }
  };

  const handleRejectRider = async (uid) => {
    try {
      await rejectRider(uid);
      await loadData();
      alert('Rider rejected');
    } catch (error) {
      console.error('Error rejecting rider:', error);
      alert('Failed to reject rider');
    }
  };

  const pendingSellers = users.filter(
    (user) => user.roles?.includes('seller') && user.sellerApproved === false
  );
  const pendingRiders = users.filter(
    (user) => user.roles?.includes('rider') && user.riderApproved === false
  );

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
        <h2 className="text-2xl font-bold mb-6 text-red-600">Admin Panel</h2>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-2 px-4 ${
              activeTab === 'dashboard'
                ? 'border-b-2 border-red-600 text-red-600'
                : 'text-gray-600'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2 px-4 ${
              activeTab === 'users' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`pb-2 px-4 ${
              activeTab === 'stores' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600'
            }`}
          >
            Stores
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-2 px-4 ${
              activeTab === 'orders' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600'
            }`}
          >
            Orders
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-blue-600">{users.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Total Stores</h3>
              <p className="text-3xl font-bold text-green-600">{stores.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Total Orders</h3>
              <p className="text-3xl font-bold text-orange-600">{orders.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Pending Approvals</h3>
              <p className="text-3xl font-bold text-red-600">
                {pendingSellers.length + pendingRiders.length}
              </p>
            </div>

            {/* Pending Approvals */}
            <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Pending Seller Approvals</h3>
              {pendingSellers.length === 0 ? (
                <p className="text-gray-500">No pending seller approvals</p>
              ) : (
                <div className="space-y-2">
                  {pendingSellers.map((user) => (
                    <div key={user.uid} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{user.email}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveSeller(user.uid)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectSeller(user.uid)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Pending Rider Approvals</h3>
              {pendingRiders.length === 0 ? (
                <p className="text-gray-500">No pending rider approvals</p>
              ) : (
                <div className="space-y-2">
                  {pendingRiders.map((user) => (
                    <div key={user.uid} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{user.email}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveRider(user.uid)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRider(user.uid)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">All Users</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Seller Approved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Rider Approved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.uid}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.roles?.join(', ') || 'None'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.roles?.includes('seller') ? (
                          user.sellerApproved ? (
                            <span className="text-green-600">Approved</span>
                          ) : (
                            <span className="text-yellow-600">Pending</span>
                          )
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.roles?.includes('rider') ? (
                          user.riderApproved ? (
                            <span className="text-green-600">Approved</span>
                          ) : (
                            <span className="text-yellow-600">Pending</span>
                          )
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {user.roles?.includes('seller') && !user.sellerApproved && (
                            <>
                              <button
                                onClick={() => handleApproveSeller(user.uid)}
                                className="text-green-600 hover:text-green-700"
                              >
                                Approve Seller
                              </button>
                              <button
                                onClick={() => handleRejectSeller(user.uid)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {user.roles?.includes('rider') && !user.riderApproved && (
                            <>
                              <button
                                onClick={() => handleApproveRider(user.uid)}
                                className="text-green-600 hover:text-green-700"
                              >
                                Approve Rider
                              </button>
                              <button
                                onClick={() => handleRejectRider(user.uid)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stores Tab */}
        {activeTab === 'stores' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">All Stores</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <div key={store.storeId} className="border rounded-lg p-4">
                  {store.logoUrl && (
                    <img
                      src={store.logoUrl}
                      alt={store.name}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  )}
                  <h4 className="font-semibold">{store.name}</h4>
                  <p className="text-sm text-gray-600">{store.description}</p>
                  <p className="text-sm text-gray-500 mt-2">{getCityDisplayName(store.city)}</p>
                  <p className="text-sm mt-2">
                    Status: {store.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">All Orders</h3>
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.orderId} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">Order #{order.orderId.slice(0, 8)}</h4>
                      <p className="text-sm text-gray-500">
                        {order.createdAt?.toDate?.()?.toLocaleString() || 'Date not available'}
                      </p>
                    </div>
                    <span className="text-lg font-bold">{formatPrice(order.total)}</span>
                  </div>
                  <p className="text-sm">
                    <span className="font-semibold">Status:</span> {order.orderStatus}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Payment:</span> {order.paymentMethod}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

