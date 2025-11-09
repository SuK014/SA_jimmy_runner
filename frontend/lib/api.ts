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
  Pin,
  Expense,
  Participant,
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

  getUserByEmail: async (email: string): Promise<User> => {
    const response = await api.get(`/users/email?email=${encodeURIComponent(email)}`);
    return response.data;
  },
};

// Plan/Trip APIs
export const planApi = {
  getAllPlans: async (): Promise<Trip[]> => {
    try {
      // Get trips - the endpoint already returns full trip data
      const tripsResponse = await api.get('/userTrip/trips');
      console.log('Trips response:', tripsResponse.data); // Debug log
      
      // The response structure is { trips: [...] }
      // Each trip has: tripId, name, description, image, whiteboards
      const tripsData = tripsResponse.data?.trips || [];
      
      if (!Array.isArray(tripsData) || tripsData.length === 0) {
        return [];
      }

      // Map the response to Trip format and fetch whiteboard details for date range
      const trips: Trip[] = await Promise.all(
        tripsData.map(async (tripData: any) => {
          // Handle image - convert bytes to base64 if needed
          let imageUrl: string | undefined;
          if (tripData.image) {
            if (typeof tripData.image === 'string') {
              imageUrl = tripData.image;
            } else if (Array.isArray(tripData.image)) {
              // Convert byte array to base64
              const base64 = btoa(String.fromCharCode(...tripData.image));
              imageUrl = `data:image/jpeg;base64,${base64}`;
            }
          }

          // Fetch whiteboard details to get day numbers for date range
          let dateRange: string | undefined;
          if (tripData.whiteboards && tripData.whiteboards.length > 0) {
            try {
              const tripDetailResponse = await api.get(`/plan/trip?id=${tripData.tripId || tripData.trip_id}`);
              const whiteboards = tripDetailResponse.data?.data?.whiteboards?.whiteboards || 
                                 tripDetailResponse.data?.whiteboards?.whiteboards || [];
              
              if (whiteboards.length > 0) {
                const days = whiteboards.map((wb: any) => wb.day || 0).filter((d: number) => d > 0);
                if (days.length > 0) {
                  const minDay = Math.min(...days);
                  const maxDay = Math.max(...days);
                  
                  if (minDay === maxDay) {
                    dateRange = `Day ${minDay}`;
                  } else {
                    dateRange = `Day ${minDay} - Day ${maxDay}`;
                  }
                }
              }
            } catch (error) {
              console.error(`Failed to fetch whiteboard details for trip ${tripData.tripId}:`, error);
            }
          }

          return {
            trip_id: tripData.tripId || tripData.trip_id,
            name: tripData.name || '',
            description: tripData.description,
            image: imageUrl,
            whiteboards: tripData.whiteboards || [],
            dateRange: dateRange, // Add date range
          };
        })
      );
      
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
    const response = await api.post('/plan/trip', {
      name: data.name,
      description: data.description,
    });
    return response.data;
  },

  uploadTripImage: async (tripId: string, imageFile: File): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await api.put(`/plan/trip/image?id=${tripId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  createWhiteboard: async (tripId: string, day: number, pinId?: string): Promise<ApiResponse> => {
    // The backend endpoint expects trip_id and day as query parameters
    // It also creates a default pin automatically, so we don't need to create one
    const response = await api.post(`/plan/whiteboard?trip_id=${tripId}&day=${day}`);
    return response.data;
  },

  deleteWhiteboard: async (whiteboardId: string, tripId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/plan/whiteboard?id=${whiteboardId}&trip_id=${tripId}`);
    return response.data;
  },

  addFriendsToPlan: async (data: AddFriendRequest): Promise<ApiResponse> => {
    const response = await api.post('/userTrip/', data);
    return response.data;
  },

  deletePlan: async (tripId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/plan/trip?id=${tripId}`);
    return response.data;
  },

  getTripParticipants: async (tripId: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/userTrip/avatars?trip_id=${tripId}`);
    return response.data;
  },

  getPinById: async (pinId: string): Promise<ApiResponse<Pin>> => {
    const response = await api.get(`/plan/pin?id=${pinId}`);
    return response.data;
  },

  createPin: async (whiteboardId: string, pinData?: { 
    name?: string; 
    description?: string;
    location?: number;
    expenses?: Expense[];
    participants?: string[];
    parents?: string[];
  }): Promise<ApiResponse> => {
    const response = await api.post(`/plan/pin?whiteboard_id=${whiteboardId}`, pinData || {});
    return response.data;
  },

  updatePin: async (pinId: string, pinData: {
    name?: string;
    description?: string;
    location?: number;
    expenses?: Expense[];
    participants?: string[];
    parents?: string[];
  }): Promise<ApiResponse> => {
    const response = await api.put(`/plan/pin?id=${pinId}`, pinData);
    return response.data;
  },

  uploadPinImage: async (pinId: string, imageFile: File): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    // Don't manually set Content-Type - let axios set it with the correct boundary
    const response = await api.put(`/plan/pin/image?id=${pinId}`, formData);
    return response.data;
  },

  deletePin: async (pinId: string, whiteboardId: string): Promise<ApiResponse> => {
    const response = await api.delete(
      `/plan/pin?id=${pinId}&whiteboard_id=${whiteboardId}`
    );
    return response.data;
  },
};

export default api;