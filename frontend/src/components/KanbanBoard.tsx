import { DragDropContext, Draggable, DropResult, Droppable } from '@hello-pangea/dnd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTasks, updateTask } from '../lib/api';
import { Task } from '../types';
import CreateTaskModal from './CreateTaskModal';
import TaskModal from './TaskModal';

type KanbanBoardProps = {
  onError: (message: string) => void;
};

const columns: Task['status'][] = ['To Do', 'In Progress', 'In Review', 'Done'];

function getPriorityClass(priority: Task['priority']) {
  if (priority === 'High') {
    return 'bg-red-100 text-red-700';
  }
  if (priority === 'Medium') {
    return 'bg-yellow-100 text-yellow-700';
  }
  return 'bg-green-100 text-green-700';
}

function formatDeadline(deadline?: string) {
  if (!deadline) {
    return '-';
  }
  return new Date(deadline).toLocaleDateString();
}

export default function KanbanBoard({ onError }: KanbanBoardProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const isManager = user?.role === 'Manager';

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedTasks = await getTasks();
      setTasks(fetchedTasks);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch tasks';
      onError(message);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const taskMap = useMemo(() => {
    const map: Record<Task['status'], Task[]> = {
      'To Do': [],
      'In Progress': [],
      'In Review': [],
      'Done': [],
    };

    for (const task of tasks) {
      map[task.status].push(task);
    }

    for (const status of columns) {
      map[status].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return map;
  }, [tasks]);

  const activeTask = useMemo(() => tasks.find((task) => task.taskId === activeTaskId) || null, [activeTaskId, tasks]);

  const onDragEnd = async (result: DropResult) => {
    const destination = result.destination;
    if (!destination) {
      return;
    }

    const sourceStatus = result.source.droppableId as Task['status'];
    const destinationStatus = destination.droppableId as Task['status'];
    if (sourceStatus === destinationStatus) {
      return;
    }

    const sourceTasks = taskMap[sourceStatus];
    const movedTask = sourceTasks[result.source.index];
    if (!movedTask) {
      return;
    }

    setTasks((current) => current.map((task) => (task.taskId === movedTask.taskId ? { ...task, status: destinationStatus } : task)));
    try {
      const updated = await updateTask(movedTask.taskId, { status: destinationStatus });
      setTasks((current) => current.map((task) => (task.taskId === movedTask.taskId ? updated : task)));
    } catch (error) {
      setTasks((current) => current.map((task) => (task.taskId === movedTask.taskId ? { ...task, status: sourceStatus } : task)));
      const message = error instanceof Error ? error.message : 'Failed to move task';
      onError(message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
      </div>
    );
  }

  return (
    <>
      <section>
        {isManager && (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              New Task
            </button>
          </div>
        )}

        <DragDropContext onDragEnd={(result) => void onDragEnd(result)}>
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max gap-4">
              {columns.map((status) => (
                <div key={status} className="h-[70vh] w-72 flex-shrink-0 rounded-2xl bg-slate-100 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">{status}</h3>
                    <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-700">{taskMap[status].length}</span>
                  </div>

                  <Droppable droppableId={status}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="h-[62vh] space-y-3 overflow-y-auto pr-1">
                        {taskMap[status].map((task, index) => (
                          <Draggable key={task.taskId} draggableId={task.taskId} index={index}>
                            {(dragProvided) => (
                              <article
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                onClick={() => setActiveTaskId(task.taskId)}
                                className="cursor-pointer rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-sm font-semibold text-slate-900">{task.title}</h4>
                                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${getPriorityClass(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                </div>
                                <p className="mt-2 text-xs text-slate-600">Deadline: {formatDeadline(task.deadline)}</p>
                                <p className="mt-1 text-xs text-slate-600">Assignee: {task.assigneeId || '-'}</p>
                              </article>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {taskMap[status].length === 0 && (
                          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
                            No tasks
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </div>
        </DragDropContext>
      </section>

      <TaskModal
        open={!!activeTask}
        task={activeTask}
        onClose={() => setActiveTaskId(null)}
        onTaskUpdated={(updated) => setTasks((current) => current.map((task) => (task.taskId === updated.taskId ? updated : task)))}
        onTaskDeleted={(taskId) => {
          setTasks((current) => current.filter((task) => task.taskId !== taskId));
          setActiveTaskId(null);
        }}
        onError={onError}
      />

      {isManager && (
        <CreateTaskModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            void loadTasks();
          }}
          onError={onError}
        />
      )}
    </>
  );
}
