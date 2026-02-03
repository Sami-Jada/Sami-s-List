import { useEffect, useState } from 'react';
import { listVendors } from '../api';

interface Vendor {
  id: string;
  name: string;
  isActive: boolean;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listVendors()
      .then((data) => setVendors(Array.isArray(data) ? data : []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-primaryText">Loading vendors...</p>;
  if (error) return <p className="text-destructive">{error}</p>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-heading mb-4">Vendors</h1>
      <div className="bg-card rounded-lg shadow border border-highlight overflow-hidden">
        <table className="min-w-full divide-y divide-highlight">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-heading uppercase">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-heading uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-highlight">
            {vendors.map((v) => (
              <tr key={v.id}>
                <td className="px-4 py-2 text-sm text-primaryText">{v.name}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs rounded ${
                      v.isActive ? 'bg-brand/30 text-heading' : 'bg-highlight/30 text-primaryText'
                    }`}
                  >
                    {v.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
