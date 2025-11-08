import axios from 'axios';
import type {
  User,
  Trip,
  PlanWithDetails,
  LoginRequest,
  RegisterRequest,
  CreatePlanRequest,
  AddFriendRequest,
  ApiResponse,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth APIs
export const authApi = {
  login: async (data: LoginRequest): Promise<User> => {
    const response = await api.post('/users/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post('/users/register', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/users/');
    return response.data;
  },

  logout: async (): Promise<void> => {
    // Clear cookie on client side
    document.cookie = 'cookies=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  },
};

// Plan/Trip APIs
export const planApi = {
  getAllPlans: async (): Promise<ApiResponse<{ trips: Trip[] }>> => {
    const response = await api.get('/userTrip/trips');
    return response.data;
  },

  getPlanById: async (tripId: string): Promise<ApiResponse<PlanWithDetails>> => {
    const response = await api.get(`/plan/trip?id=${tripId}`);
    return response.data;
  },

  createPlan: async (data: CreatePlanRequest): Promise<ApiResponse<Trip>> => {
    const response = await api.post('/plan/trip', data);
    return response.data;
  },

  addFriendsToPlan: async (data: AddFriendRequest): Promise<ApiResponse> => {
    const response = await api.post('/userTrip/', data);
    return response.data;
  },
};

export default api;