export interface User {
    user_id: string;
    name?: string;
    email?: string;
    profile?: string;
    created_at?: string;
    updated_at?: string;
  }
  
  export interface Trip {
    trip_id: string;
    name: string;
    description?: string;
    image?: string;
    whiteboards: string[];
    dateRange?: string; // Date range like "Day 1 - Day 5" or "Day 1"
    created_at?: string; // Or use created_at if available
  }
  
  export interface Whiteboard {
    whiteboard_id: string;
    day: number;
    pins: string[];
  }
  
  export interface Pin {
    pin_id: string;
    name?: string;
    description?: string;
    image?: string;
    location?: number;
    expenses?: Expense[];
    participants?: string[];
    parents?: string[];
  }
  
  export interface Expense {
    user_id?: string;
    name?: string;
    expense?: number;
  }
  
  export interface PlanWithDetails extends Omit<Trip, 'whiteboards'> {
    whiteboards: WhiteboardWithPins[];
  }
  
  export interface WhiteboardWithPins {
    day: number;
    pins: Pin[];
    whiteboard_id?: string; // Add whiteboard_id
  }
  
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface RegisterRequest {
    name?: string;
    email: string;
    password: string;
  }
  
  export interface CreatePlanRequest {
    name: string;
    description?: string;
    startDate?: string; // ISO date string
    endDate?: string; // ISO date string
  }
  
  export interface AddFriendRequest {
    user_ids: string[];
    trip_id: string;
  }
  
  export interface ApiResponse<T = any> {
    message?: string;
    data?: T;
    status?: number;
  }

  export interface Participant {
    user_id: string;
    display_name?: string;
    profile?: string;
  }