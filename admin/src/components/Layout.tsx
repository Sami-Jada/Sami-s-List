import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/admins', label: 'Admins' },
  { to: '/vendors', label: 'Vendors' },
  { to: '/categories', label: 'Categories' },
  { to: '/orders', label: 'Orders' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-56 bg-heading text-white flex flex-col shadow-lg">
        <div className="p-4 border-b border-brand/40">
          {!logoError ? (
            <img
              src="/logo.svg"
              alt="Sami's List"
              className="h-10 w-auto object-contain object-left"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="font-semibold text-white">Sami's List</span>
          )}
          <span className="block text-xs text-card/90 mt-1">Admin</span>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`block px-3 py-2 rounded ${location.pathname === to ? 'bg-brand text-white' : 'hover:bg-brand/70 text-white'}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-brand/40">
          <p className="text-sm text-card/90 truncate">{user?.name || user?.id}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 text-sm text-destructive hover:bg-destructive/20 px-2 py-1 rounded"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-background p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
