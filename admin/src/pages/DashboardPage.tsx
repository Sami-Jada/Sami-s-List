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
        <h1 className="text-xl font-semibold text-heading mb-4">Dashboard</h1>
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-heading mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg shadow border border-highlight p-6">
          <h2 className="text-sm font-medium text-heading">Vendors</h2>
          <p className="text-2xl font-semibold text-primaryText mt-1">
            {vendorsCount ?? '—'}
          </p>
        </div>
        <div className="bg-card rounded-lg shadow border border-highlight p-6">
          <h2 className="text-sm font-medium text-heading">Orders</h2>
          <p className="text-2xl font-semibold text-primaryText mt-1">
            {ordersCount ?? '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
