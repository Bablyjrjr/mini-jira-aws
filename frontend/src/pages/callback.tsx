import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../context/AuthContext';
import { User } from '../types';

type TokenPayload = {
  sub: string;
  email: string;
  name?: string;
  'custom:role'?: User['role'];
  'custom:teamId'?: string;
};

export default function CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
    const params = new URLSearchParams(hash);
    const idToken = params.get('id_token');

    if (!idToken) {
      setError('Missing id_token in callback URL');
      return;
    }

    try {
      const decoded = jwtDecode<TokenPayload>(idToken);
      const user: User = {
        sub: decoded.sub,
        email: decoded.email,
        name: decoded.name || decoded.email,
        role: decoded['custom:role'] || 'Employee',
        teamId: decoded['custom:teamId'],
      };

      window.localStorage.setItem(TOKEN_STORAGE_KEY, idToken);
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      window.location.replace('/');
    } catch (decodeError) {
      setError(decodeError instanceof Error ? decodeError.message : 'Failed to decode id_token');
    }
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm">
        {!error && <p className="text-slate-700">Signing you in...</p>}
        {error && (
          <>
            <p className="text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void router.replace('/')}
              className="mt-4 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Back to home
            </button>
          </>
        )}
      </div>
    </main>
  );
}
