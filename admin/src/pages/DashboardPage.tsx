import { useEffect, useState } from 'react';
import { listVendors } from '../api';
import { listOrders } from '../api';

export default function DashboardPage() {
  const [vendorsCount, setVendorsCount] = useState<number | null>(null);
  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listVendors(), listOrders()])
      .then(([vendors, orders]) => {
        setVendorsCount(Array.isArray(vendors) ? vendors.length : 0);
        setOrdersCount(Array.isArray(orders) ? orders.length : 0);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, []);

  if (error) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-800 mb-4">Dashboard</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-800 mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500">Vendors</h2>
          <p className="text-2xl font-semibold text-gray-800 mt-1">
            {vendorsCount ?? '—'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500">Orders</h2>
          <p className="text-2xl font-semibold text-gray-800 mt-1">
            {ordersCount ?? '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
