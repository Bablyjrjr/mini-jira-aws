const lanes = [
  { id: 'todo', title: 'To Do' },
  { id: 'inprogress', title: 'In Progress' },
  { id: 'inreview', title: 'In Review' },
  { id: 'done', title: 'Done' },
];

const sampleTasks = [
  { id: 'task-1', title: 'Design onboarding flow', status: 'todo', assignee: 'Sara' },
  { id: 'task-2', title: 'Implement API auth', status: 'inprogress', assignee: 'Omar' },
  { id: 'task-3', title: 'Review deployment plan', status: 'inreview', assignee: 'Ali' },
  { id: 'task-4', title: 'Close defects', status: 'done', assignee: 'Donia' },
];

export default function KanbanBoard() {
  return (
    <section className="grid gap-6 lg:grid-cols-4">
      {lanes.map((lane) => (
        <div key={lane.id} className="rounded-3xl bg-slate-900/5 p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">{lane.title}</h3>
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700">
              {sampleTasks.filter((task) => task.status === lane.id).length}
            </span>
          </div>
          <div className="space-y-4">
            {sampleTasks
              .filter((task) => task.status === lane.id)
              .map((task) => (
                <article key={task.id} className="rounded-3xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{task.title}</h4>
                      <p className="mt-2 text-sm text-slate-600">Assigned to {task.assignee}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{task.id}</span>
                  </div>
                </article>
              ))}
            {sampleTasks.filter((task) => task.status === lane.id).length === 0 && (
              <p className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-4 text-sm text-slate-500">
                No tasks in this lane.
              </p>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
