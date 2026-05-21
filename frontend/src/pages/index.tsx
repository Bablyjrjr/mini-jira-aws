import Head from 'next/head';
import { useCallback, useEffect, useRef, useState } from 'react';
import KanbanBoard from '../components/KanbanBoard';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, token, login, isReady } = useAuth();
  const [toast, setToast] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = useCallback((message: string) => {
    setToast(message);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Head>
        <title>Mini Jira</title>
      </Head>

      {toast && (
        <div className="fixed left-1/2 top-4 z-[60] w-[90%] max-w-lg -translate-x-1/2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}

      {!isReady && (
        <main className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
        </main>
      )}

      {isReady && !token && (
        <main className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
            <h1 className="text-3xl font-bold text-slate-900">Mini Jira</h1>
            <p className="mt-3 text-slate-600">Sign in with Cognito to access your team's board.</p>
            <button
              type="button"
              onClick={login}
              className="mt-6 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Sign in
            </button>
          </div>
        </main>
      )}

      {isReady && token && user && (
        <>
          <Header />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
            <KanbanBoard onError={showError} />
          </main>
        </>
      )}

      {isReady && token && !user && (
        <main className="flex min-h-screen items-center justify-center px-4">
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-slate-700">Session data is incomplete.</p>
            <button
              type="button"
              onClick={login}
              className="mt-4 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Sign in again
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
