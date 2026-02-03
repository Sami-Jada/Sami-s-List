import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-card p-8 rounded-lg shadow-lg border border-highlight w-full max-w-sm">
        <div className="flex justify-center mb-6">
          {!logoError ? (
            <img
              src="/logo.svg"
              alt="Sami's List"
              className="h-14 w-auto object-contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <h1 className="text-2xl font-semibold text-heading">Sami's List</h1>
          )}
        </div>
        <h2 className="text-lg font-medium text-heading text-center mb-6">Admin</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primaryText mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-highlight rounded px-3 py-2 bg-white text-primaryText focus:ring-2 focus:ring-brand focus:border-brand"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primaryText mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-highlight rounded px-3 py-2 bg-white text-primaryText focus:ring-2 focus:ring-brand focus:border-brand"
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white py-2 rounded font-medium hover:bg-brand/90 disabled:opacity-50 focus:ring-2 focus:ring-offset-2 focus:ring-brand"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
