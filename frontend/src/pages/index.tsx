import Head from 'next/head';
import KanbanBoard from '../components/KanbanBoard';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Head>
        <title>Mini Jira AWS</title>
      </Head>

      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Mini Jira AWS</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900">Team Task Management</h1>
          </div>
          <button className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700">Sign in</button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-8 rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
              <p className="mt-2 text-slate-600">View team tasks, manage projects, and stay on top of deadlines.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                Create task
              </button>
              <button className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">
                New project
              </button>
            </div>
          </div>
        </section>

        <KanbanBoard />
      </main>
    </div>
  );
}
