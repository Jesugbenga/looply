import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'rider' | 'driver';
  savedAddresses?: SavedAddress[];
  isDriverAvailable?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
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
}

// User Operations
export const userUtils = {
  // Get user profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      
      // Handle offline errors gracefully
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        console.warn('Firebase is offline, returning cached data if available');
        return null; // Return null for offline mode
      }
      
      throw new Error(`Failed to get user profile: ${error.message || 'Unknown error'}`);
    }
  },

  // Update user profile
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        throw new Error('Unable to update profile while offline. Changes will be saved when connection is restored.');
      }
      
      throw new Error(`Failed to update user profile: ${error.message || 'Unknown error'}`);
    }
  },

  // Save address
  async saveAddress(uid: string, address: Omit<SavedAddress, 'id'>): Promise<void> {
    try {
      console.log('💾 Saving address for user:', uid);
      console.log('Address data:', address);
      
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found. Please sign out and sign in again.');
      }
      
      const userData = userDoc.data();
      const savedAddresses = userData.savedAddresses || [];
      
      const newAddress: SavedAddress = {
        ...address,
        id: Date.now().toString(),
      };
      
      const updatedAddresses = [...savedAddresses, newAddress];
      
      console.log('📝 Updating user document with addresses:', updatedAddresses);
      
      await updateDoc(userRef, {
        savedAddresses: updatedAddresses,
        updatedAt: new Date().toISOString(),
      });
      
      console.log('✅ Address saved successfully to Firestore');
    } catch (error: any) {
      console.error('❌ Error saving address:', error);
      
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        throw new Error('Unable to save address while offline. Please try again when connection is restored.');
      }
      
      throw new Error(`Failed to save address: ${error.message || 'Unknown error'}`);
    }
  },

  // Update saved addresses
  async updateSavedAddresses(uid: string, addresses: SavedAddress[]): Promise<void> {
    try {
      console.log('🔄 Updating saved addresses for user:', uid);
      console.log('Addresses:', addresses);
      
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found. Please sign out and sign in again.');
      }
      
      await updateDoc(userRef, {
        savedAddresses: addresses,
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ Addresses updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating saved addresses:', error);
      
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        throw new Error('Unable to update addresses while offline. Please try again when connection is restored.');
      }
      
      throw new Error(`Failed to update addresses: ${error.message || 'Unknown error'}`);
    }
  },

  // Set driver availability
  async setDriverAvailability(uid: string, isAvailable: boolean): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        isDriverAvailable: isAvailable,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error setting driver availability:', error);
      throw error;
    }
  },
};

// Ride Operations
export const rideUtils = {
  // Create a new ride request
  async createRideRequest(rideData: Omit<Ride, 'id' | 'requestedAt' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const ridesCollection = collection(db, 'rides');
      const docRef = await addDoc(ridesCollection, {
        ...rideData,
        requestedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating ride request:', error);
      throw error;
    }
  },

  // Get rides for a user (rider or driver)
  async getUserRides(uid: string, userType: 'rider' | 'driver'): Promise<Ride[]> {
    try {
      const ridesCollection = collection(db, 'rides');
      const field = userType === 'rider' ? 'riderId' : 'driverId';
      const q = query(
        ridesCollection,
        where(field, '==', uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Ride[];
    } catch (error) {
      console.error('Error getting user rides:', error);
      throw error;
    }
  },

  // Get pending rides for drivers
  async getPendingRides(): Promise<Ride[]> {
    try {
      const ridesCollection = collection(db, 'rides');
      const q = query(
        ridesCollection,
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Ride[];
    } catch (error) {
      console.error('Error getting pending rides:', error);
      throw error;
    }
  },

  // Update ride status
  async updateRideStatus(rideId: string, status: Ride['status'], additionalData?: Partial<Ride>): Promise<void> {
    try {
      const rideRef = doc(db, 'rides', rideId);
      const updateData: any = {
        status,
        updatedAt: new Date().toISOString(),
      };

      if (status === 'matched') {
        updateData.matchedAt = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completedAt = new Date().toISOString();
      }

      if (additionalData) {
        Object.assign(updateData, additionalData);
      }

      await updateDoc(rideRef, updateData);
    } catch (error) {
      console.error('Error updating ride status:', error);
      throw error;
    }
  },

  // Accept a ride (driver)
  async acceptRide(rideId: string, driverId: string, driverName: string, driverPhone?: string, carDescription?: string, licensePlate?: string): Promise<void> {
    try {
      await this.updateRideStatus(rideId, 'matched', {
        driverId,
        driverName,
        driverPhone,
        carDescription,
        licensePlate,
      });
    } catch (error) {
      console.error('Error accepting ride:', error);
      throw error;
    }
  },

  // Start a ride
  async startRide(rideId: string): Promise<void> {
    try {
      await this.updateRideStatus(rideId, 'in-progress');
    } catch (error) {
      console.error('Error starting ride:', error);
      throw error;
    }
  },

  // Complete a ride
  async completeRide(rideId: string): Promise<void> {
    try {
      await this.updateRideStatus(rideId, 'completed');
    } catch (error) {
      console.error('Error completing ride:', error);
      throw error;
    }
  },

  // Cancel a ride
  async cancelRide(rideId: string): Promise<void> {
    try {
      await this.updateRideStatus(rideId, 'cancelled');
    } catch (error) {
      console.error('Error cancelling ride:', error);
      throw error;
    }
  },

  // Subscribe to real-time ride updates
  subscribeToUserRides(
    uid: string, 
    userType: 'rider' | 'driver', 
    callback: (rides: Ride[]) => void
  ): () => void {
    const ridesCollection = collection(db, 'rides');
    const field = userType === 'rider' ? 'riderId' : 'driverId';
    const q = query(
      ridesCollection,
      where(field, '==', uid),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const rides = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Ride[];
      callback(rides);
    });
  },

  // Subscribe to pending rides for drivers
  subscribeToPendingRides(callback: (rides: Ride[]) => void): () => void {
    const ridesCollection = collection(db, 'rides');
    const q = query(
      ridesCollection,
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const rides = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Ride[];
      callback(rides);
    });
  },
};

// Event Operations
export const eventUtils = {
  // Get available events
  getAvailableEvents(): string[] {
    return [
      'Rhema Chapel Sunday Service at 9 am',
      'Rhema Glow Sunday Service at 12 pm',
      'Midweek Service',
    ];
  },

  // Get event details (for future expansion)
  getEventDetails(eventName: string): { name: string; time: string; location: string } | null {
    const events: Record<string, { name: string; time: string; location: string }> = {
      'Rhema Chapel Sunday Service at 9 am': {
        name: 'Rhema Chapel Sunday Service',
        time: '9:00 AM',
        location: 'Rhema Chapel',
      },
      'Rhema Glow Sunday Service at 12 pm': {
        name: 'Rhema Glow Sunday Service',
        time: '12:00 PM',
        location: 'Rhema Chapel',
      },
      'Midweek Service': {
        name: 'Midweek Service',
        time: '7:00 PM',
        location: 'Rhema Chapel',
      },
    };

    return events[eventName] || null;
  },
};

// Utility functions
export const utils = {
  // Generate unique ID
  generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  },

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Calculate distance between two addresses (placeholder)
  calculateDistance(address1: string, address2: string): number {
    // This would integrate with a mapping service like Google Maps
    // For now, return a random distance
    return Math.floor(Math.random() * 20) + 1;
  },
};
