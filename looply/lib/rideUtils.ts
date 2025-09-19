import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';
import { Ride } from './types';

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
      const q = query(ridesCollection, where(field, '==', uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || '')) as Ride[];
    } catch (error) {
      console.error('Error getting user rides:', error);
      throw error;
    }
  },

  // Get pending rides for drivers
  async getPendingRides(): Promise<Ride[]> {
    try {
      const ridesCollection = collection(db, 'rides');
      // Avoid composite index by fetching pending and sorting client-side
      const q = query(ridesCollection, where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || '')) as Ride[];
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
      // Generate a 4-digit verification PIN for the rider
      const verificationPin = Math.floor(1000 + Math.random() * 9000).toString();

      // Filter out undefined values to avoid Firestore errors
      const additionalData: any = {
        driverId,
        driverName,
        verificationPin,
      };

      if (driverPhone) additionalData.driverPhone = driverPhone;
      if (carDescription) additionalData.carDescription = carDescription;
      if (licensePlate) additionalData.licensePlate = licensePlate;

      await this.updateRideStatus(rideId, 'matched', additionalData);
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
    const q = query(ridesCollection, where(field, '==', uid));

    return onSnapshot(q, (querySnapshot) => {
      const rides = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || '')) as Ride[];
      callback(rides as Ride[]);
    });
  },

  // Subscribe to pending rides for drivers
  subscribeToPendingRides(callback: (rides: Ride[]) => void): () => void {
    const ridesCollection = collection(db, 'rides');
    const q = query(ridesCollection, where('status', '==', 'pending'));

    return onSnapshot(q, (querySnapshot) => {
      const rides = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || '')) as Ride[];
      callback(rides);
    });
  },
};
