// Based on Figure 2: Class Diagram and Data Requirements

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export enum PlaceCategory {
  Restaurant = 'Restaurant',
  Cafe = 'Cafe',
  Event = 'Event', // Added for Phase 1
  Museum = 'Museum',
  Park = 'Park',
  Historical = 'Historical',
  Shopping = 'Shopping',
  Service = 'Service',
  Other = 'Other'
}

export interface Place {
  id: string; // UUID
  name: string;
  category: PlaceCategory;
  location: GeoPoint;
  description?: string;
  image_url?: string;
  rating?: number;
  // Phase 1 UI additions
  subtitle?: string; // e.g., "$$ • Open now" or "Today 20:00"
  startTime?: string;
  endTime?: string;
}

export interface Event {
  id: string; // UUID
  title: string;
  category: string;
  start_time: string; // ISO DateTime
  end_time: string; // ISO DateTime
  location: GeoPoint;
  place_id?: string; // Foreign key to Place
  description?: string;
}

export interface UserPreferences {
  pref_id: string;
  preferred_categories: PlaceCategory[];
  language: string;
}

export interface User {
  user_id: string;
  username: string;
  email: string;
  preferences: UserPreferences;
  created_at: string; // ISO Date
  is_guest: boolean;
}

// UI Types
export type TabView = 'map' | 'nearby' | 'favorites' | 'profile';

// App Flow States
export type AppScreenState = 'SPLASH' | 'ONBOARDING' | 'AUTH' | 'APP';

// Auth Internal States
export type AuthView = 'SIGN_IN' | 'SIGN_UP' | 'FORGOT_PASSWORD';