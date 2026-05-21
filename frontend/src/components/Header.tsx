import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <h1 className="text-xl font-bold text-slate-900">Mini Jira</h1>
        <div className="flex items-center gap-3">
          {user?.role === 'Manager' && (
            <button
              type="button"
              onClick={() => window.alert('Use the API to create projects')}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              New Project
            </button>
          )}
          <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
            {user?.name || user?.email} ({user?.role})
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
