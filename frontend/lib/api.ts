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

  getCurrentUser: async (): Promise<User> => {
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
  getAllPlans: async (): Promise<Trip[]> => {
    try {
      // Get trip IDs
      const tripsResponse = await api.get('/userTrip/trips');
      console.log('Trips response:', tripsResponse.data); // Debug log
      
      // Handle different possible response structures
      const tripIds = tripsResponse.data?.tripId || 
                     tripsResponse.data?.trip_ids || 
                     tripsResponse.data?.data?.tripId ||
                     [];
      
      if (!Array.isArray(tripIds) || tripIds.length === 0) {
        return [];
      }

      // Fetch trip details for each ID
      const trips: Trip[] = [];
      for (const tripId of tripIds) {
        try {
          const tripResponse = await api.get(`/plan/trip?id=${tripId}`);
          const tripData = tripResponse.data?.data?.trip || tripResponse.data?.trip;
          
          if (tripData) {
            trips.push({
              trip_id: tripData.trip_id || tripId,
              name: tripData.name || '',
              description: tripData.description,
              image: tripData.image,
              whiteboards: tripData.whiteboards || [],
            });
          }
        } catch (error) {
          console.error(`Failed to fetch trip ${tripId}:`, error);
        }
      }
      
      return trips;
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      throw error;
    }
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