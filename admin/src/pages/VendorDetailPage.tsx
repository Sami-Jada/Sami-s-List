import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getVendor,
  updateVendor,
  uploadVendorImage,
  getVendorServices,
  setVendorServices,
  listServices,
  listServiceProviders,
  createServiceProvider,
  toggleVendorActive,
  getApiBase,
  VendorDetail,
  ServiceCategory,
  VendorServiceLinkDto,
} from '../api';

const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

function formatDay(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatHours(oh: Record<string, { open: string; close: string } | null> | null) {
  if (!oh) return '—';
  return WEEKDAYS.map((day) => {
    const v = oh[day];
    if (!v) return `${formatDay(day)}: Closed`;
    return `${formatDay(day)}: ${v.open}–${v.close}`;
  }).join('; ');
}

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    latitude: '',
    longitude: '',
    businessLicense: '',
    description: '',
    openingHours: {} as Record<string, { open: string; close: string } | null>,
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [servicesEditing, setServicesEditing] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [servicesList, setServicesList] = useState<VendorServiceLinkDto[]>([]);
  const [servicesSaving, setServicesSaving] = useState(false);
  const [servicesError, setServicesError] = useState('');

  const [serviceProviders, setServiceProviders] = useState<Array<{ id: string; name: string; phone: string; isAvailable: boolean }>>([]);
  const [spName, setSpName] = useState('');
  const [spPhone, setSpPhone] = useState('');
  const [spPassword, setSpPassword] = useState('');
  const [spSubmitting, setSpSubmitting] = useState(false);
  const [spError, setSpError] = useState('');
  const [spFormOpen, setSpFormOpen] = useState(false);

  function loadVendor() {
    if (!id) return;
    setLoading(true);
    getVendor(id)
      .then((v) => {
        setVendor(v);
        setEditForm({
          name: v.name,
          phone: v.phone,
          address: v.address,
          latitude: String(v.latitude),
          longitude: String(v.longitude),
          businessLicense: v.businessLicense ?? '',
          description: v.description ?? '',
          openingHours: v.openingHours ?? {},
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadVendor();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    listServiceProviders(id).then(setServiceProviders).catch(() => setServiceProviders([]));
  }, [id, vendor]);

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setEditError('');
    setEditSaving(true);
    try {
      const lat = parseFloat(editForm.latitude);
      const lng = parseFloat(editForm.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) throw new Error('Latitude and longitude must be numbers');
      await updateVendor(id, {
        name: editForm.name,
        phone: editForm.phone,
        address: editForm.address,
        latitude: lat,
        longitude: lng,
        businessLicense: editForm.businessLicense || undefined,
        description: editForm.description,
        openingHours: editForm.openingHours,
      });
      setEditing(false);
      loadVendor();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setEditSaving(false);
    }
  }

  async function handleUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploadError('');
    setUploading(true);
    try {
      const updated = await uploadVendorImage(id, file);
      setVendor(updated);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  }

  async function loadServicesForEdit() {
    if (!id) return;
    setServicesEditing(true);
    setServicesError('');
    try {
      const [cats, links] = await Promise.all([listServices(), getVendorServices(id)]);
      setCategories(cats);
      setServicesList(
        links.map((l) => ({
          serviceId: l.service?.id ?? l.serviceId,
          unitPrice: Number(l.unitPrice) || 0,
          serviceFee: Number(l.serviceFee) || 0,
        }))
      );
    } catch (err: unknown) {
      setServicesError(err instanceof Error ? err.message : 'Failed to load');
    }
  }

  function addServiceRow() {
    if (categories.length) {
      setServicesList((prev) => [
        ...prev,
        { serviceId: categories[0].id, unitPrice: 0, serviceFee: 0 },
      ]);
    }
  }

  function updateServiceRow(i: number, field: keyof VendorServiceLinkDto, value: string | number) {
    setServicesList((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value as never };
      return next;
    });
  }

  function removeServiceRow(i: number) {
    setServicesList((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSaveServices(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setServicesError('');
    setServicesSaving(true);
    try {
      await setVendorServices(id, { services: servicesList });
      setServicesEditing(false);
      loadVendor();
    } catch (err: unknown) {
      setServicesError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setServicesSaving(false);
    }
  }

  async function handleAddServiceProvider(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSpError('');
    setSpSubmitting(true);
    try {
      const newSp = await createServiceProvider(id, {
        name: spName,
        phone: spPhone,
        password: spPassword || undefined,
      });
      setServiceProviders((prev) => [...prev, newSp]);
      setSpName('');
      setSpPhone('');
      setSpPassword('');
      setSpFormOpen(false);
    } catch (err: unknown) {
      setSpError(err instanceof Error ? err.message : 'Failed to add');
    } finally {
      setSpSubmitting(false);
    }
  }

  async function handleToggleActive() {
    if (!id || !vendor) return;
    try {
      const updated = await toggleVendorActive(id);
      setVendor(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to toggle');
    }
  }

  if (!id) return <p className="text-destructive">Missing vendor ID</p>;
  if (loading) return <p className="text-primaryText">Loading vendor...</p>;
  if (error) return <p className="text-destructive">{error}</p>;
  if (!vendor) return <p className="text-destructive">Vendor not found</p>;

  const inputClass =
    'w-full border border-highlight rounded px-3 py-2 bg-white text-primaryText focus:ring-2 focus:ring-brand';
  const labelClass = 'block text-sm text-primaryText mb-1';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-heading">{vendor.name}</h1>
        <div className="flex items-center gap-2">
          <Link to="/vendors" className="text-brand hover:underline text-sm">
            Back to vendors
          </Link>
          <button
            type="button"
            onClick={handleToggleActive}
            className={`px-3 py-1 rounded text-sm ${
              vendor.isActive ? 'bg-brand/30 text-heading' : 'bg-highlight/30 text-primaryText'
            }`}
          >
            {vendor.isActive ? 'Active' : 'Inactive'}
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="bg-card rounded-lg shadow border border-highlight p-6 mb-6">
        <h2 className="font-medium text-heading mb-2">Image</h2>
        {vendor.imageUrl ? (
          <img
            src={`${getApiBase()}/api/uploads/${vendor.imageUrl}`}
            alt={vendor.name}
            className="max-h-40 object-contain border border-highlight rounded"
          />
        ) : (
          <p className="text-sm text-primaryText">No image</p>
        )}
        <div className="mt-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUploadImage}
            disabled={uploading}
            className="text-sm text-primaryText"
          />
          {uploading && <span className="ml-2 text-sm text-primaryText">Uploading...</span>}
          {uploadError && <p className="text-sm text-destructive mt-1">{uploadError}</p>}
        </div>
      </div>

      {/* Edit / View */}
      <div className="bg-card rounded-lg shadow border border-highlight p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-heading">Details</h2>
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="text-brand hover:underline text-sm"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
        {editing ? (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className={labelClass}>Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Latitude</label>
                <input
                  type="text"
                  value={editForm.latitude}
                  onChange={(e) => setEditForm((p) => ({ ...p, latitude: e.target.value }))}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Longitude</label>
                <input
                  type="text"
                  value={editForm.longitude}
                  onChange={(e) => setEditForm((p) => ({ ...p, longitude: e.target.value }))}
                  className={inputClass}
                  required
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Business license (optional)</label>
              <input
                type="text"
                value={editForm.businessLicense}
                onChange={(e) => setEditForm((p) => ({ ...p, businessLicense: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                className={inputClass}
                rows={3}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Opening hours</label>
              <div className="space-y-2">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="flex items-center gap-4 flex-wrap">
                    <span className="w-24 text-sm text-heading">{formatDay(day)}</span>
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={editForm.openingHours[day] != null}
                        onChange={(e) =>
                          setEditForm((p) => ({
                            ...p,
                            openingHours: {
                              ...p.openingHours,
                              [day]: e.target.checked ? { open: '09:00', close: '17:00' } : null,
                            },
                          }))
                        }
                      />
                      Open
                    </label>
                    {editForm.openingHours[day] != null && (
                      <>
                        <input
                          type="time"
                          value={editForm.openingHours[day]!.open}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              openingHours: {
                                ...p.openingHours,
                                [day]: { ...p.openingHours[day]!, open: e.target.value },
                              },
                            }))
                          }
                          className={inputClass}
                          style={{ width: '120px' }}
                        />
                        <input
                          type="time"
                          value={editForm.openingHours[day]!.close}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              openingHours: {
                                ...p.openingHours,
                                [day]: { ...p.openingHours[day]!, close: e.target.value },
                              },
                            }))
                          }
                          className={inputClass}
                          style={{ width: '120px' }}
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
            <button
              type="submit"
              disabled={editSaving}
              className="bg-brand text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
            >
              {editSaving ? 'Saving...' : 'Save'}
            </button>
          </form>
        ) : (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-primaryText">Phone</dt>
              <dd className="text-heading">{vendor.phone}</dd>
            </div>
            <div>
              <dt className="text-primaryText">Address</dt>
              <dd className="text-heading">{vendor.address}</dd>
            </div>
            <div>
              <dt className="text-primaryText">Coordinates</dt>
              <dd className="text-heading">
                {vendor.latitude}, {vendor.longitude}
              </dd>
            </div>
            {vendor.businessLicense && (
              <div>
                <dt className="text-primaryText">Business license</dt>
                <dd className="text-heading">{vendor.businessLicense}</dd>
              </div>
            )}
            <div>
              <dt className="text-primaryText">Description</dt>
              <dd className="text-heading">{vendor.description ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-primaryText">Opening hours</dt>
              <dd className="text-heading whitespace-pre-wrap">{formatHours(vendor.openingHours)}</dd>
            </div>
          </dl>
        )}
      </div>

      {/* Offered services */}
      <div className="bg-card rounded-lg shadow border border-highlight p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-heading">Offered services</h2>
          {!servicesEditing ? (
            <button
              type="button"
              onClick={loadServicesForEdit}
              className="text-brand hover:underline text-sm"
            >
              Set services
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setServicesEditing(false)}
              className="text-primaryText hover:underline text-sm"
            >
              Cancel
            </button>
          )}
        </div>
        {servicesEditing ? (
          <form onSubmit={handleSaveServices} className="space-y-3">
            <div className="flex justify-end">
              <button type="button" onClick={addServiceRow} className="text-sm text-brand hover:underline">
                Add row
              </button>
            </div>
            {servicesList.map((row, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 p-2 bg-background rounded">
                <select
                  value={row.serviceId}
                  onChange={(e) => updateServiceRow(i, 'serviceId', e.target.value)}
                  className={inputClass}
                  style={{ minWidth: '160px' }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={row.unitPrice || ''}
                  onChange={(e) => updateServiceRow(i, 'unitPrice', e.target.value)}
                  className={inputClass}
                  style={{ width: '100px' }}
                  placeholder="Price"
                />
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={row.serviceFee || ''}
                  onChange={(e) => updateServiceRow(i, 'serviceFee', e.target.value)}
                  className={inputClass}
                  style={{ width: '100px' }}
                  placeholder="Fee"
                />
                <button type="button" onClick={() => removeServiceRow(i)} className="text-destructive text-sm hover:underline">
                  Remove
                </button>
              </div>
            ))}
            {servicesError && <p className="text-sm text-destructive">{servicesError}</p>}
            <button
              type="submit"
              disabled={servicesSaving}
              className="bg-brand text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
            >
              {servicesSaving ? 'Saving...' : 'Save services'}
            </button>
          </form>
        ) : (
          <div>
            {vendor.serviceLinks && vendor.serviceLinks.length > 0 ? (
              <table className="min-w-full divide-y divide-highlight">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-left text-xs text-heading">Service</th>
                    <th className="px-2 py-1 text-left text-xs text-heading">Unit price</th>
                    <th className="px-2 py-1 text-left text-xs text-heading">Service fee</th>
                  </tr>
                </thead>
                <tbody>
                  {vendor.serviceLinks.map((link) => (
                    <tr key={link.id}>
                      <td className="px-2 py-1 text-sm text-primaryText">{link.service?.name ?? '—'}</td>
                      <td className="px-2 py-1 text-sm text-primaryText">{link.unitPrice ?? '—'}</td>
                      <td className="px-2 py-1 text-sm text-primaryText">{link.serviceFee ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-primaryText">No services added yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Service providers */}
      <div className="bg-card rounded-lg shadow border border-highlight p-6">
        <h2 className="font-medium text-heading mb-4">Service providers</h2>
        {serviceProviders.length > 0 && (
          <table className="min-w-full divide-y divide-highlight mb-4">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left text-xs text-heading">Name</th>
                <th className="px-2 py-1 text-left text-xs text-heading">Phone</th>
                <th className="px-2 py-1 text-left text-xs text-heading">Status</th>
              </tr>
            </thead>
            <tbody>
              {serviceProviders.map((sp) => (
                <tr key={sp.id}>
                  <td className="px-2 py-1 text-sm text-primaryText">{sp.name}</td>
                  <td className="px-2 py-1 text-sm text-primaryText">{sp.phone}</td>
                  <td className="px-2 py-1 text-sm text-primaryText">
                    {sp.isAvailable ? 'Available' : 'Unavailable'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!spFormOpen ? (
          <button
            type="button"
            onClick={() => setSpFormOpen(true)}
            className="text-brand hover:underline text-sm"
          >
            Add service provider
          </button>
        ) : (
          <form onSubmit={handleAddServiceProvider} className="space-y-3 max-w-md">
            <div>
              <label className={labelClass}>Name</label>
              <input
                type="text"
                value={spName}
                onChange={(e) => setSpName(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="text"
                value={spPhone}
                onChange={(e) => setSpPhone(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Password (optional, for login)</label>
              <input
                type="password"
                value={spPassword}
                onChange={(e) => setSpPassword(e.target.value)}
                className={inputClass}
                minLength={8}
              />
            </div>
            {spError && <p className="text-sm text-destructive">{spError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={spSubmitting}
                className="bg-brand text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
              >
                {spSubmitting ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => setSpFormOpen(false)}
                className="bg-highlight text-heading px-4 py-2 rounded text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
