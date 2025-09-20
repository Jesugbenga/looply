import { 
  doc, 
  getDoc, 
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, SavedAddress } from './types';
import { geocodingService } from './geocodingService';

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

  // Save address (with optional geocoding)
  async saveAddress(uid: string, address: Omit<SavedAddress, 'id'>, geocode: boolean = true): Promise<void> {
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
      
      let newAddress: SavedAddress = {
        ...address,
        id: Date.now().toString(),
      };

      // Geocode the address if requested and coordinates not provided
      if (geocode && !address.coordinates) {
        console.log('🌍 Geocoding address...');
        const coordinates = await geocodingService.geocodeAddress(address.address);
        if (coordinates) {
          newAddress.coordinates = coordinates;
        }
      }
      
      // If this is the first address or it's marked as default, make it the default
      if (savedAddresses.length === 0 || address.isDefault) {
        // Remove default flag from all other addresses
        const updatedAddresses = savedAddresses.map((addr: SavedAddress) => ({ ...addr, isDefault: false }));
        updatedAddresses.push({ ...newAddress, isDefault: true });
        
        console.log('📝 Setting as default address');
        
        await updateDoc(userRef, {
          savedAddresses: updatedAddresses,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const updatedAddresses = [...savedAddresses, newAddress];
        
        await updateDoc(userRef, {
          savedAddresses: updatedAddresses,
          updatedAt: new Date().toISOString(),
        });
      }
      
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

  // Get default address for user
  async getDefaultAddress(uid: string): Promise<SavedAddress | null> {
    try {
      const userProfile = await this.getUserProfile(uid);
      if (!userProfile?.savedAddresses) {
        return null;
      }
      
      // Find the default address
      const defaultAddress = userProfile.savedAddresses.find(addr => addr.isDefault);
      return defaultAddress || null;
    } catch (error) {
      console.error('Error getting default address:', error);
      return null;
    }
  },

  // Update OneSignal user ID
  async updateOneSignalUserId(uid: string, oneSignalUserId: string): Promise<void> {
    try {
      await this.updateUserProfile(uid, { oneSignalUserId });
      console.log('✅ OneSignal user ID updated for user:', uid);
    } catch (error) {
      console.error('Error updating OneSignal user ID:', error);
      throw error;
    }
  },
};
