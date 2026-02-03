import React, { useEffect, useState } from 'react';
import { listOrders } from '../api';

interface Order {
  id: string;
  orderNumber?: string;
  status: string;
  quantity?: number;
  totalPrice?: string | number;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-600">Loading orders...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-800 mb-4">Orders</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-2 text-sm text-gray-800">{o.orderNumber ?? o.id.slice(0, 8)}</td>
                <td className="px-4 py-2">
                  <span className="inline-flex px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-800">{o.quantity ?? '—'}</td>
                <td className="px-4 py-2 text-sm text-gray-800">{o.totalPrice ?? '—'}</td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {new Date(o.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
