import { FormEvent, useMemo, useState } from 'react';
import { createTask, uploadImage } from '../lib/api';

type CreateTaskModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  onError: (message: string) => void;
};

const defaultForm = {
  title: '',
  description: '',
  priority: 'Medium' as 'Low' | 'Medium' | 'High',
  deadline: '',
  assigneeId: '',
  teamId: '',
  projectId: '',
};

export default function CreateTaskModal({ open, onClose, onCreated, onError }: CreateTaskModalProps) {
  const [form, setForm] = useState(defaultForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => form.title.trim().length > 0, [form.title]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setValidationError('Title is required');
      return;
    }

    setValidationError(null);
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      await createTask({
        title: form.title.trim(),
        description: form.description || undefined,
        priority: form.priority,
        deadline: form.deadline || undefined,
        assigneeId: form.assigneeId || undefined,
        teamId: form.teamId,
        projectId: form.projectId || undefined,
        imageUrl,
      });

      setForm(defaultForm);
      setImageFile(null);
      onCreated();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create task';
      onError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Create Task</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800">
            X
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {validationError && <div className="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700">{validationError}</div>}

          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              id="title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-slate-200 focus:ring"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="h-24 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-slate-200 focus:ring"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="priority" className="mb-1 block text-sm font-medium text-slate-700">
                Priority
              </label>
              <select
                id="priority"
                value={form.priority}
                onChange={(event) =>
                  setForm((current) => ({ ...current, priority: event.target.value as 'Low' | 'Medium' | 'High' }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-slate-200 focus:ring"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label htmlFor="deadline" className="mb-1 block text-sm font-medium text-slate-700">
                Deadline
              </label>
              <input
                id="deadline"
                type="date"
                value={form.deadline}
                onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-slate-200 focus:ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="assigneeId" className="mb-1 block text-sm font-medium text-slate-700">
                Assignee ID
              </label>
              <input
                id="assigneeId"
                value={form.assigneeId}
                onChange={(event) => setForm((current) => ({ ...current, assigneeId: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-slate-200 focus:ring"
              />
            </div>
            <div>
              <label htmlFor="teamId" className="mb-1 block text-sm font-medium text-slate-700">
                Team ID
              </label>
              <input
                id="teamId"
                value={form.teamId}
                onChange={(event) => setForm((current) => ({ ...current, teamId: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-slate-200 focus:ring"
              />
            </div>
          </div>

          <div>
            <label htmlFor="projectId" className="mb-1 block text-sm font-medium text-slate-700">
              Project ID
            </label>
            <input
              id="projectId"
              value={form.projectId}
              onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-slate-200 focus:ring"
            />
          </div>

          <div>
            <label htmlFor="image" className="mb-1 block text-sm font-medium text-slate-700">
              Image Upload
            </label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
