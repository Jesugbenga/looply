import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from './firebase';
import { DriverProfile } from './types';
import { userUtils } from './userUtils';

export const driverUtils = {
  // Migrate existing driver profiles to include new fields
  async migrateDriverProfiles(): Promise<void> {
    try {
      console.log('🔄 Starting driver profile migration...');
      
      const driverProfilesCollection = collection(db, 'driverProfiles');
      const querySnapshot = await getDocs(driverProfilesCollection);
      const migrationPromises: Promise<void>[] = [];
      
      for (const doc of querySnapshot.docs) {
        const driverData = doc.data() as DriverProfile;
        const updates: Partial<DriverProfile> = {};
        let needsUpdate = false;

        // Add currentLocation if missing - use user's default address
        if (!driverData.currentLocation) {
          try {
            const defaultAddress = await userUtils.getDefaultAddress(driverData.userId);
            if (defaultAddress?.coordinates) {
              updates.currentLocation = defaultAddress.coordinates;
              console.log(`📍 Driver ${doc.id} setting currentLocation from default address: ${defaultAddress.address}`);
              needsUpdate = true;
            } else {
              console.log(`⚠️ Driver ${doc.id} has no default address, currentLocation will remain null`);
            }
          } catch (error) {
            console.error(`Error getting default address for driver ${doc.id}:`, error);
          }
        }

        // Add availableSeats if missing
        if (driverData.availableSeats === undefined) {
          updates.availableSeats = driverData.seats;
          console.log(`🪑 Driver ${doc.id} missing availableSeats, setting to ${driverData.seats}`);
          needsUpdate = true;
        }

        // Add rating if missing
        if (driverData.rating === undefined) {
          updates.rating = 5.0;
          console.log(`⭐ Driver ${doc.id} missing rating, setting to 5.0`);
          needsUpdate = true;
        }

        // Add load balancing fields if missing
        if (driverData.recentLoadCount === undefined) {
          updates.recentLoadCount = 0;
          needsUpdate = true;
        }

        if (driverData.lastLoadReset === undefined) {
          updates.lastLoadReset = new Date().toISOString();
          needsUpdate = true;
        }

        // Add updatedAt if missing
        if (!driverData.updatedAt) {
          updates.updatedAt = new Date().toISOString();
          needsUpdate = true;
        }

        if (needsUpdate) {
          const updatePromise = updateDoc(doc.ref, updates).then(() => {
            console.log(`✅ Migrated driver ${doc.id}`);
          });
          migrationPromises.push(updatePromise);
        }
      }

      await Promise.all(migrationPromises);
      console.log(`🎉 Migration complete! Updated ${migrationPromises.length} drivers`);
    } catch (error) {
      console.error('Error migrating driver profiles:', error);
      throw error;
    }
  },

  // Create driver profile
  async createDriverProfile(userId: string, driverData: Omit<DriverProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Get user's default address to use as driver's current location
      const defaultAddress = await userUtils.getDefaultAddress(userId);
      let currentLocation = driverData.currentLocation;
      
      if (!currentLocation && defaultAddress?.coordinates) {
        console.log('📍 Using user default address as driver location:', defaultAddress.address);
        currentLocation = defaultAddress.coordinates;
      } else if (!currentLocation) {
        console.warn('⚠️ No default address found for driver, location will need to be set manually');
      }

      const driverProfilesCollection = collection(db, 'driverProfiles');
      const docRef = await addDoc(driverProfilesCollection, {
        ...driverData,
        currentLocation, // Use default address coordinates or provided location
        availableSeats: driverData.seats, // Initialize available seats to total seats
        isAvailable: true, // All drivers are available by default
        isVerified: true, // All drivers are verified by default
        rating: driverData.rating || 5.0, // Default rating
        recentLoadCount: 0,
        lastLoadReset: new Date().toISOString(),
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating driver profile:', error);
      throw error;
    }
  },

  // Get driver profile by user ID
  async getDriverProfile(userId: string): Promise<DriverProfile | null> {
    try {
      const driverProfilesCollection = collection(db, 'driverProfiles');
      const q = query(driverProfilesCollection, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as DriverProfile;
    } catch (error) {
      console.error('Error getting driver profile:', error);
      throw error;
    }
  },

  // Update driver profile
  async updateDriverProfile(profileId: string, updates: Partial<DriverProfile>): Promise<void> {
    try {
      const profileRef = doc(db, 'driverProfiles', profileId);
      await updateDoc(profileRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating driver profile:', error);
      throw error;
    }
  },

  // Update driver availability
  async updateDriverAvailability(userId: string, isAvailable: boolean): Promise<void> {
    try {
      const profile = await this.getDriverProfile(userId);
      if (profile) {
        await this.updateDriverProfile(profile.id, { isAvailable });
      }
    } catch (error) {
      console.error('Error updating driver availability:', error);
      throw error;
    }
  },

  // Update driver location
  async updateDriverLocation(userId: string, location: { lat: number; lng: number }): Promise<void> {
    try {
      const profile = await this.getDriverProfile(userId);
      if (profile) {
        await this.updateDriverProfile(profile.id, { 
          currentLocation: location,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error updating driver location:', error);
      throw error;
    }
  },

  // Update driver seats when accepting a ride
  async updateDriverSeats(driverId: string, passengers: number): Promise<void> {
    try {
      const driverRef = doc(db, 'driverProfiles', driverId);
      const driverDoc = await getDoc(driverRef);
      
      if (driverDoc.exists()) {
        const driverData = driverDoc.data() as DriverProfile;
        const newAvailableSeats = (driverData.availableSeats || driverData.seats) - passengers;
        const isStillAvailable = newAvailableSeats > 0;
        
        await updateDoc(driverRef, {
          availableSeats: newAvailableSeats,
          isAvailable: isStillAvailable,
          updatedAt: new Date().toISOString(),
        });
        
        console.log(`✅ Driver ${driverId} seats updated: ${newAvailableSeats} available, isAvailable: ${isStillAvailable}`);
      }
    } catch (error) {
      console.error('Error updating driver seats:', error);
      throw error;
    }
  },

  // Reset driver seats (when ride completes)
  async resetDriverSeats(userId: string): Promise<void> {
    try {
      const profile = await this.getDriverProfile(userId);
      if (profile) {
        await this.updateDriverProfile(profile.id, { 
          availableSeats: profile.seats,
          isAvailable: true,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error resetting driver seats:', error);
      throw error;
    }
  },
};
