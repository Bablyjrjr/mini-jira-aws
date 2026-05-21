import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createComment, deleteTask, getComments, updateTask } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Comment, Task } from '../types';

type TaskModalProps = {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
  onError: (message: string) => void;
};

const statusOptions: Task['status'][] = ['To Do', 'In Progress', 'In Review', 'Done'];

function formatDate(date?: string) {
  if (!date) {
    return '-';
  }
  return new Date(date).toLocaleString();
}

export default function TaskModal({ open, task, onClose, onTaskUpdated, onTaskDeleted, onError }: TaskModalProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isManager = user?.role === 'Manager';
  const hasGlobalAccess = user?.role === 'Manager' || user?.role === 'Admin';
  const canChangeStatus = useMemo(() => {
    if (!task || !user) {
      return false;
    }
    if (hasGlobalAccess) {
      return true;
    }
    return user.role === 'Employee' && !!user.teamId && user.teamId === task.teamId;
  }, [hasGlobalAccess, task, user]);

  useEffect(() => {
    if (!open || !task) {
      return;
    }

    const loadComments = async () => {
      setLoadingComments(true);
      try {
        const items = await getComments(task.taskId);
        setComments(items);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load comments';
        onError(message);
      } finally {
        setLoadingComments(false);
      }
    };

    void loadComments();
  }, [onError, open, task]);

  if (!open || !task) {
    return null;
  }

  const handleStatusChange = async (nextStatus: Task['status']) => {
    if (!canChangeStatus || nextStatus === task.status) {
      return;
    }

    setUpdatingStatus(true);
    try {
      const updated = await updateTask(task.taskId, { status: nextStatus });
      onTaskUpdated(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update status';
      onError(message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const messageText = commentText.trim();
    if (!messageText) {
      return;
    }

    setPostingComment(true);
    try {
      const created = await createComment({
        taskId: task.taskId,
        message: messageText,
      });
      setComments((current) => [...current, created]);
      setCommentText('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create comment';
      onError(message);
    } finally {
      setPostingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!isManager) {
      return;
    }

    setDeleting(true);
    try {
      await deleteTask(task.taskId);
      onTaskDeleted(task.taskId);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete task';
      onError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{task.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{task.taskId}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-900">
            X
          </button>
        </div>

        <div className="space-y-2 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Description:</span> {task.description || '-'}
          </p>
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Priority:</span> {task.priority}
          </p>
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Deadline:</span> {task.deadline || '-'}
          </p>
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Assignee:</span> {task.assigneeId || '-'}
          </p>
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Team:</span> {task.teamId}
          </p>
          <div className="text-sm text-slate-700">
            <label htmlFor="status" className="font-semibold text-slate-900">
              Status:
            </label>
            <select
              id="status"
              value={task.status}
              disabled={!canChangeStatus || updatingStatus}
              onChange={(event) => handleStatusChange(event.target.value as Task['status'])}
              className="ml-2 rounded-xl border border-slate-300 bg-white px-2 py-1 outline-none ring-slate-200 focus:ring disabled:opacity-60"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {task.imageUrl && (
          <div className="mt-4">
            <img src={task.imageUrl} alt={task.title} className="h-56 w-full rounded-2xl object-cover shadow-sm" />
          </div>
        )}

        <section className="mt-6">
          <h3 className="text-lg font-semibold text-slate-900">Comments</h3>
          <div className="mt-3 max-h-44 space-y-2 overflow-y-auto rounded-2xl bg-slate-50 p-3">
            {loadingComments && <p className="text-sm text-slate-500">Loading comments...</p>}
            {!loadingComments && comments.length === 0 && <p className="text-sm text-slate-500">No comments yet.</p>}
            {comments.map((comment) => (
              <article key={comment.commentId} className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-sm text-slate-800">{comment.message}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {comment.authorName || comment.authorId} - {formatDate(comment.createdAt)}
                </p>
              </article>
            ))}
          </div>
          <form onSubmit={handleCommentSubmit} className="mt-3 flex gap-2">
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Add a comment"
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-200 focus:ring"
            />
            <button
              type="submit"
              disabled={postingComment}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {postingComment ? 'Sending...' : 'Submit'}
            </button>
          </form>
        </section>

        <section className="mt-6">
          <h3 className="text-lg font-semibold text-slate-900">Audit Log</h3>
          <div className="mt-3 space-y-2 rounded-2xl bg-slate-50 p-3">
            {task.audit.length === 0 && <p className="text-sm text-slate-500">No status changes yet.</p>}
            {task.audit.map((entry, index) => (
              <p key={`${entry.at}-${index}`} className="text-sm text-slate-700">
                {entry.by} moved from {entry.from} to {entry.to} at {formatDate(entry.at)}
              </p>
            ))}
          </div>
        </section>

        {isManager && (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
