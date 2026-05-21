export interface Task {
  taskId: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'In Review' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  deadline?: string;
  assigneeId?: string;
  teamId: string;
  projectId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  audit: { from: string; to: string; by: string; at: string }[];
}

export interface Project {
  projectId: string;
  name: string;
  description?: string;
  teamId: string;
}

export interface Comment {
  commentId: string;
  taskId: string;
  authorId: string;
  authorName?: string;
  message: string;
  createdAt: string;
}

export interface User {
  sub: string;
  email: string;
  name?: string;
  role: 'Manager' | 'Employee' | 'Admin';
  teamId?: string;
}
