import axios from 'axios';
import type { 
  CreateTaskDto, 
  LoginCredentials, 
  RegisterCredentials, 
  UpdateTaskDto,
  GroupedTasksResponse,
  TaskStage
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth services
export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  register: async (credentials: RegisterCredentials) => {
    const response = await api.post('/auth/register', credentials);
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/user');
    return response.data;
  },
};

// Task services
export const taskService = {
  getAllTasks: async (page = 1, limit = 10) => {
    const response = await api.get(`/tasks?page=${page}&per_page=${limit}`);
    return response.data;
  },
  
  getTasksByStage: async (stage: TaskStage, page = 1, limit = 10) => {
    const response = await api.get(`/tasks?stage=${stage}&page=${page}&per_page=${limit}`);
    return response.data;
  },
  
  getAllTasksGrouped: async (perPage = 10, keyword?: string) => {
    const url = keyword 
      ? `/tasks?per_page=${perPage}&keyword=${keyword}`
      : `/tasks?per_page=${perPage}`;
    const response = await api.get<GroupedTasksResponse>(url);
    return response.data;
  },
  
  getTaskById: async (id: number) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },
  createTask: async (task: CreateTaskDto) => {
    const response = await api.post('/tasks', task);
    return response.data;
  },
  updateTask: async (id: number, task: UpdateTaskDto) => {
    const response = await api.put(`/tasks/${id}`, task);
    return response.data;
  },
  deleteTask: async (id: number) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },
  searchTasks: async (query: string) => {
    const response = await api.get(`/tasks?search=${query}`);
    return response.data;
  },
};

export default api;
