import { useEffect, useState } from 'react';
import {
  listServices,
  createService,
  updateService,
  deleteService,
  ServiceCategory,
} from '../api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [iconName, setIconName] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  function load() {
    setLoading(true);
    listServices()
      .then(setCategories)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setName('');
    setSlug('');
    setIconName('');
    setIsPopular(false);
    setSortOrder(0);
    setFormError('');
    setShowForm(false);
    setEditingId(null);
  }

  function fillEdit(c: ServiceCategory) {
    setName(c.name);
    setSlug(c.slug ?? '');
    setIconName(c.iconName);
    setIsPopular(c.isPopular);
    setSortOrder(c.sortOrder);
    setEditingId(c.id);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (editingId) {
        await updateService(editingId, {
          name,
          slug: slug || undefined,
          iconName,
          isPopular,
          sortOrder,
        });
        resetForm();
      } else {
        await createService({
          name,
          slug: slug || undefined,
          iconName,
          isPopular,
          sortOrder,
        });
        resetForm();
      }
      load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this category? Vendors linked to it will lose this service.')) return;
    setDeletingId(id);
    try {
      await deleteService(id);
      load();
      setDeletingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setDeletingId(null);
    }
  }

  if (loading) return <p className="text-primaryText">Loading categories...</p>;
  if (error) return <p className="text-destructive">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-heading">Categories</h1>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="bg-brand text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand/90"
        >
          {showForm ? 'Cancel' : 'Add category'}
        </button>
      </div>

      {(showForm || editingId) && (
        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-lg shadow border border-highlight p-6 mb-6 max-w-md space-y-4"
        >
          <h2 className="font-medium text-heading">
            {editingId ? 'Edit category' : 'New category'}
          </h2>
          <div>
            <label className="block text-sm text-primaryText mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-highlight rounded px-3 py-2 bg-white text-primaryText focus:ring-2 focus:ring-brand"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-primaryText mb-1">Slug (optional)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full border border-highlight rounded px-3 py-2 bg-white text-primaryText focus:ring-2 focus:ring-brand"
              placeholder="e.g. plumbers"
            />
          </div>
          <div>
            <label className="block text-sm text-primaryText mb-1">Icon name</label>
            <input
              type="text"
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
              className="w-full border border-highlight rounded px-3 py-2 bg-white text-primaryText focus:ring-2 focus:ring-brand"
              required
              placeholder="e.g. plumber"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPopular"
              checked={isPopular}
              onChange={(e) => setIsPopular(e.target.checked)}
              className="rounded border-highlight"
            />
            <label htmlFor="isPopular" className="text-sm text-primaryText">
              Popular
            </label>
          </div>
          <div>
            <label className="block text-sm text-primaryText mb-1">Sort order</label>
            <input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full border border-highlight rounded px-3 py-2 bg-white text-primaryText focus:ring-2 focus:ring-brand"
            />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-highlight text-heading px-4 py-2 rounded text-sm font-medium hover:bg-highlight/80"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="bg-card rounded-lg shadow border border-highlight overflow-hidden">
        <table className="min-w-full divide-y divide-highlight">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-heading uppercase">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-heading uppercase">Slug</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-heading uppercase">Icon</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-heading uppercase">Popular</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-heading uppercase">Order</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-heading uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-highlight">
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2 text-sm text-primaryText">{c.name}</td>
                <td className="px-4 py-2 text-sm text-primaryText">{c.slug ?? '—'}</td>
                <td className="px-4 py-2 text-sm text-primaryText">{c.iconName}</td>
                <td className="px-4 py-2 text-sm text-primaryText">{c.isPopular ? 'Yes' : 'No'}</td>
                <td className="px-4 py-2 text-sm text-primaryText">{c.sortOrder}</td>
                <td className="px-4 py-2 text-sm">
                  <button
                    type="button"
                    onClick={() => fillEdit(c)}
                    className="text-brand hover:underline mr-2"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    className="text-destructive hover:underline disabled:opacity-50"
                  >
                    {deletingId === c.id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
