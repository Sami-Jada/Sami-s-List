import { useEffect, useState } from 'react';
import { listAdmins, createAdmin, AdminUser } from '../api';

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    listAdmins()
      .then(setAdmins)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const newAdmin = await createAdmin({ username, password, name: name || undefined });
      setAdmins((prev) => [...prev, newAdmin]);
      setShowForm(false);
      setUsername('');
      setPassword('');
      setName('');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-primaryText">Loading admins...</p>;
  if (error) return <p className="text-destructive">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-heading">Admins</h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="bg-brand text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand/90"
        >
          {showForm ? 'Cancel' : 'Add admin'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-card rounded-lg shadow border border-highlight p-6 mb-6 max-w-md space-y-4">
          <h2 className="font-medium text-heading">New admin</h2>
          <div>
            <label className="block text-sm text-primaryText mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-highlight rounded px-3 py-2 bg-white text-primaryText focus:ring-2 focus:ring-brand"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-primaryText mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-highlight rounded px-3 py-2 bg-white text-primaryText focus:ring-2 focus:ring-brand"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-sm text-primaryText mb-1">Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-highlight rounded px-3 py-2 bg-white text-primaryText focus:ring-2 focus:ring-brand"
            />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create admin'}
          </button>
        </form>
      )}

      <div className="bg-card rounded-lg shadow border border-highlight overflow-hidden">
        <table className="min-w-full divide-y divide-highlight">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-heading uppercase">Username</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-heading uppercase">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-heading uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-highlight">
            {admins.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-2 text-sm text-primaryText">{a.username}</td>
                <td className="px-4 py-2 text-sm text-primaryText">{a.name ?? '—'}</td>
                <td className="px-4 py-2 text-sm text-heading">
                  {new Date(a.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
