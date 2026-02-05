import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
  listServices,
  createVendor,
  uploadVendorImage,
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

const defaultOpeningHours: Record<string, { open: string; close: string } | null> = {
  monday: { open: '09:00', close: '17:00' },
  tuesday: { open: '09:00', close: '17:00' },
  wednesday: { open: '09:00', close: '17:00' },
  thursday: { open: '09:00', close: '17:00' },
  friday: { open: '09:00', close: '15:00' },
  saturday: null,
  sunday: null,
};

function formatDay(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function VendorFormPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [businessLicense, setBusinessLicense] = useState('');
  const [description, setDescription] = useState('');
  const [openingHours, setOpeningHours] = useState<Record<string, { open: string; close: string } | null>>(
    () => ({ ...defaultOpeningHours })
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [services, setServices] = useState<VendorServiceLinkDto[]>([]);

  useEffect(() => {
    listServices()
      .then(setCategories)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load categories'))
      .finally(() => setLoading(false));
  }, []);

  function setDayHours(
    day: string,
    value: { open: string; close: string } | null
  ) {
    setOpeningHours((prev) => ({ ...prev, [day]: value }));
  }

  function addService() {
    if (categories.length === 0) return;
    setServices((prev) => [
      ...prev,
      {
        serviceId: categories[0].id,
        unitPrice: 0,
        serviceFee: 0,
      },
    ]);
  }

  function updateServiceAt(
    index: number,
    field: 'serviceId' | 'unitPrice' | 'serviceFee',
    value: string | number
  ) {
    setServices((prev) => {
      const next = [...prev];
      if (field === 'unitPrice' || field === 'serviceFee') {
        next[index] = { ...next[index], [field]: Number(value) };
      } else {
        next[index] = { ...next[index], [field]: value as string };
      }
      return next;
    });
  }

  function removeServiceAt(index: number) {
    setServices((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        throw new Error('Latitude and longitude must be numbers');
      }
      const vendor = await createVendor({
        name,
        phone,
        address,
        latitude: lat,
        longitude: lng,
        businessLicense: businessLicense || undefined,
        description,
        imageUrl: 'vendors/placeholder.png',
        openingHours,
        isActive: true,
        services: services.length ? services : undefined,
      });
      if (imageFile) {
        await uploadVendorImage(vendor.id, imageFile);
      }
      navigate(`/vendors/${vendor.id}`);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create vendor');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-primaryText">Loading...</p>;
  if (error) return <p className="text-destructive">{error}</p>;

  const inputClass =
    'w-full border border-highlight rounded px-3 py-2 bg-white text-primaryText focus:ring-2 focus:ring-brand';
  const labelClass = 'block text-sm text-primaryText mb-1';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-heading">New vendor</h1>
        <Link
          to="/vendors"
          className="text-brand hover:underline text-sm"
        >
          Back to vendors
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="bg-card rounded-lg shadow border border-highlight p-6 space-y-4">
          <h2 className="font-medium text-heading">Basic info</h2>
          <div>
            <label className={labelClass}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Latitude</label>
              <input
                type="text"
                inputMode="decimal"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Longitude</label>
              <input
                type="text"
                inputMode="decimal"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Business license (optional)</label>
            <input
              type="text"
              value={businessLicense}
              onChange={(e) => setBusinessLicense(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              rows={3}
              required
            />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow border border-highlight p-6 space-y-4">
          <h2 className="font-medium text-heading">Opening hours</h2>
          <p className="text-sm text-primaryText">
            Set open/close times per day (HH:MM). Leave closed for closed days.
          </p>
          <div className="space-y-2">
            {WEEKDAYS.map((day) => (
              <div key={day} className="flex items-center gap-4 flex-wrap">
                <span className="w-24 text-sm text-heading">{formatDay(day)}</span>
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={openingHours[day] != null}
                    onChange={(e) =>
                      setDayHours(day, e.target.checked ? { open: '09:00', close: '17:00' } : null)
                    }
                  />
                  Open
                </label>
                {openingHours[day] != null && (
                  <>
                    <input
                      type="time"
                      value={openingHours[day]!.open}
                      onChange={(e) =>
                        setDayHours(day, { ...openingHours[day]!, open: e.target.value })
                      }
                      className={inputClass}
                      style={{ width: '120px' }}
                    />
                    <span className="text-primaryText">to</span>
                    <input
                      type="time"
                      value={openingHours[day]!.close}
                      onChange={(e) =>
                        setDayHours(day, { ...openingHours[day]!, close: e.target.value })
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

        <div className="bg-card rounded-lg shadow border border-highlight p-6 space-y-4">
          <h2 className="font-medium text-heading">Image</h2>
          <p className="text-sm text-primaryText">
            Upload an image now or after creating the vendor.
          </p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="text-sm text-primaryText"
          />
        </div>

        <div className="bg-card rounded-lg shadow border border-highlight p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-heading">Offered services (optional)</h2>
            <button
              type="button"
              onClick={addService}
              className="text-sm text-brand hover:underline"
            >
              Add service
            </button>
          </div>
          <p className="text-sm text-primaryText">
            Add services this vendor offers and set price per service.
          </p>
          {services.length > 0 && (
            <div className="space-y-3">
              {services.map((svc, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 p-3 bg-background rounded">
                  <select
                    value={svc.serviceId}
                    onChange={(e) => updateServiceAt(i, 'serviceId', e.target.value)}
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
                    placeholder="Unit price"
                    value={svc.unitPrice || ''}
                    onChange={(e) => updateServiceAt(i, 'unitPrice', e.target.value)}
                    className={inputClass}
                    style={{ width: '100px' }}
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="Service fee"
                    value={svc.serviceFee || ''}
                    onChange={(e) => updateServiceAt(i, 'serviceFee', e.target.value)}
                    className={inputClass}
                    style={{ width: '100px' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeServiceAt(i)}
                    className="text-destructive text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {formError && <p className="text-destructive">{formError}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create vendor'}
          </button>
          <Link
            to="/vendors"
            className="bg-highlight text-heading px-4 py-2 rounded text-sm font-medium hover:bg-highlight/80 inline-block"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
