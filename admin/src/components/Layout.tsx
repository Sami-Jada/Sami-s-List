import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/admins', label: 'Admins' },
  { to: '/vendors', label: 'Vendors' },
  { to: '/orders', label: 'Orders' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <span className="font-semibold">Sami's List</span>
          <span className="block text-xs text-gray-400">Admin</span>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`block px-3 py-2 rounded ${location.pathname === to ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <p className="text-sm text-gray-400 truncate">{user?.name || user?.id}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 text-sm text-red-400 hover:text-red-300"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
