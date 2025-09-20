// Shared types and interfaces for the Looply app

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'rider' | 'driver' | 'both';
  savedAddresses?: SavedAddress[];
  isDriverAvailable?: boolean;
  phone?: string;
  lastActiveAs?: 'rider' | 'driver';
  rating?: number;
  totalRides?: number;
  recentLoadCount?: number; // For load balancing
  lastLoadReset?: string; // Timestamp for load count reset
  oneSignalUserId?: string; // For push notifications
  createdAt: string;
  updatedAt: string;
}

export interface DriverProfile {
  id: string;
  userId: string;
  licenseNumber: string;
  licenseExpiry: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleColor: string;
  licensePlate: string;
  vehicleType: 'sedan' | 'suv' | 'hatchback' | 'luxury';
  seats: number;
  availableSeats: number; // Current available seats
  isVerified: boolean;
  isAvailable: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  totalEarnings: number;
  rating?: number; // Driver rating (1-5)
  recentLoadCount?: number; // For load balancing
  lastLoadReset?: string; // Timestamp for load count reset
  oneSignalUserId?: string; // For push notifications
  createdAt: string;
  updatedAt: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isDefault: boolean;
}

export interface Ride {
  id: string;
  riderId: string;
  driverId?: string;
  riderName: string;
  driverName?: string;
  event: string;
  passengers: number;
  address: string;
  pickupRequired: boolean;
  dropoffRequired: boolean;
  additionalDetails?: string;
  status: 'pending' | 'matched' | 'in-progress' | 'completed' | 'cancelled';
  requestedAt: string;
  createdAt: string;
  updatedAt: string;
  matchedAt?: string;
  completedAt?: string;
  driverPhone?: string;
  carDescription?: string;
  licensePlate?: string;
  verificationPin?: string;
}

export interface DriverRideRequest {
  id: string;
  rideId: string;
  driverId: string;
  riderName: string;
  riderId: string;
  event: string;
  passengers: number;
  address: string;
  pickupRequired: boolean;
  dropoffRequired: boolean;
  additionalDetails?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

export interface RideFallbackDrivers {
  id: string;
  rideId: string;
  drivers: Array<{
    driverId: string;
    score: number;
    driverName: string;
  }>;
  createdAt: string;
}

// Messaging System Types
export interface Message {
  id: string;
  rideId: string;
  senderId: string;
  senderName: string;
  senderType: 'rider' | 'driver';
  content: string;
  timestamp: string;
  isRead: boolean;
  messageType: 'text' | 'system' | 'location' | 'status_update';
  metadata?: {
    location?: {
      lat: number;
      lng: number;
      address?: string;
    };
    status?: string;
    [key: string]: any;
  };
}

export interface ChatRoom {
  id: string;
  rideId: string;
  riderId: string;
  driverId: string;
  riderName: string;
  driverName: string;
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: {
    rider: number;
    driver: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageNotification {
  id: string;
  rideId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}