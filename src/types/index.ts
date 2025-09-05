export interface User {
  id: number;
  name: string;
  email: string;
  token?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Using string literals for TaskStage to be compatible with erasableSyntaxOnly
export type TaskStage = 'backlog' | 'in_progress' | 'review' | 'done';

// Constants for TaskStage values
export const TaskStages = {
  BACKLOG: 'backlog' as TaskStage,
  IN_PROGRESS: 'in_progress' as TaskStage,
  REVIEW: 'review' as TaskStage,
  DONE: 'done' as TaskStage,
};

export interface StageMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
export interface Task {
  id: number;
  title: string;
  description: string;
  stage: TaskStage;
  index?: number;
  user_id: number;
  user?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export const Stage = {
  meta: {} as StageMeta,
  tasks: [] as Task[],
};

export interface CreateTaskDto {
  title: string;
  description: string;
  stage: TaskStage;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  stage?: TaskStage;
  index?: number;
}

export interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface TaskGroup {
  name: string;
  tasks: Task[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface GroupedTasksResponse {
  success: boolean;
  message: string;
  data: {
    backlog: TaskGroup;
    in_progress: TaskGroup;
    review: TaskGroup;
    done: TaskGroup;
  };
}
