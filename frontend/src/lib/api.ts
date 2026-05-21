import { TOKEN_STORAGE_KEY } from '../context/AuthContext';
import { Comment, Project, Task } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

type CreateTaskInput = {
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  deadline?: string;
  assigneeId?: string;
  teamId: string;
  projectId?: string;
  imageUrl?: string;
};

type UpdateTaskInput = Partial<{
  title: string;
  description: string;
  status: Task['status'];
  priority: Task['priority'];
  deadline: string;
  assigneeId: string;
  teamId: string;
  projectId: string;
  imageUrl: string;
}>;

type CreateProjectInput = {
  name: string;
  description?: string;
  teamId: string;
};

type CreateCommentInput = {
  taskId: string;
  message: string;
};

function getToken() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

async function request<T>(path: string, init: RequestInit = {}) {
  const token = getToken();
  if (!token) {
    throw new Error('You are not signed in');
  }

  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const errorBody = (await response.json()) as { message?: string };
      if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      // Ignore JSON parse errors on non-JSON error responses.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getTasks() {
  const result = await request<{ items: Task[] }>('/api/tasks', { method: 'GET' });
  return result.items || [];
}

export async function createTask(data: CreateTaskInput) {
  return request<Task>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTask(taskId: string, data: UpdateTaskInput) {
  return request<Task>(`/api/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTask(taskId: string) {
  return request<void>(`/api/tasks/${taskId}`, { method: 'DELETE' });
}

export async function getProjects() {
  const result = await request<{ items: Project[] }>('/api/projects', { method: 'GET' });
  return result.items || [];
}

export async function createProject(data: CreateProjectInput) {
  return request<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getComments(taskId: string) {
  const result = await request<{ items: Comment[] }>(`/api/comments/${taskId}`, { method: 'GET' });
  return result.items || [];
}

export async function createComment(data: CreateCommentInput) {
  return request<Comment>('/api/comments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append('image', file);

  const result = await request<{ url: string }>('/api/uploads/image', {
    method: 'POST',
    body: formData,
  });
  return result.url;
}
