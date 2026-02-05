import { useEffect, useState } from 'react';
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
      .then((data) => setOrders(Array.isArray(data) ? (data as Order[]) : []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-primaryText">Loading orders...</p>;
  if (error) return <p className="text-destructive">{error}</p>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-heading mb-4">Orders</h1>
      <div className="bg-card rounded-lg shadow border border-highlight overflow-hidden">
        <table className="min-w-full divide-y divide-highlight">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-heading uppercase">Order</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-heading uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-heading uppercase">Quantity</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-heading uppercase">Total</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-heading uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-highlight">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-2 text-sm text-primaryText">{o.orderNumber ?? o.id.slice(0, 8)}</td>
                <td className="px-4 py-2">
                  <span className="inline-flex px-2 py-1 text-xs rounded bg-highlight/30 text-primaryText">
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-primaryText">{o.quantity ?? '—'}</td>
                <td className="px-4 py-2 text-sm text-primaryText">{o.totalPrice ?? '—'}</td>
                <td className="px-4 py-2 text-sm text-heading">
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
