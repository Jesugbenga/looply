import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from './firebase';
import { Ride, DriverProfile, DriverRideRequest, RideFallbackDrivers } from './types';
import { rideUtils } from './rideUtils';
import { driverUtils } from './driverUtils';
import { matchingUtils } from './matchingUtils';

export const rideMatchingService = {
  // Create ride request with sequential driver matching
  async createRideRequestWithMatching(
    rideData: Omit<Ride, 'id' | 'requestedAt' | 'createdAt' | 'updatedAt'>,
    riderCoords: { lat: number; lng: number },
    ridersCount: number
  ): Promise<{ rideId: string; status: 'pending' | 'matched' | 'no_match' }> {
    try {
      // Create the ride request
      const rideId = await rideUtils.createRideRequest(rideData);
      
      // Find top 5 drivers
      const topDrivers = await matchingUtils.findBestDrivers(
        riderCoords,
        ridersCount,
        rideData.riderId,
        5
      );

      if (topDrivers.length === 0) {
        console.log('❌ No drivers available for this ride request');
        await rideUtils.updateRideStatus(rideId, 'cancelled', {
          additionalDetails: 'No drivers available in the area'
        });
        return { rideId, status: 'no_match' };
      }

      // Update load counts for all top drivers
      for (const { driver } of topDrivers) {
        await matchingUtils.updateDriverLoadCount(driver.id);
      }

      // Start sequential notification process
      const result = await this.notifyDriversSequentially(rideId, topDrivers, rideData.riderName);
      
      return { rideId, status: result };
    } catch (error) {
      console.error('Error creating ride request with matching:', error);
      throw error;
    }
  },

  // Create ride requests for drivers sequentially (highest score first)
  async notifyDriversSequentially(
    rideId: string,
    drivers: Array<{ driver: DriverProfile; score: number }>,
    riderName: string
  ): Promise<'matched' | 'no_match'> {
    try {
      console.log(`🔄 Starting sequential ride request creation for ${drivers.length} drivers`);
      
      // Only create ride request for the top driver initially
      if (drivers.length > 0) {
        const { driver, score } = drivers[0];
        console.log(`\n📋 Creating ride request for top driver (${driver.id}) with score ${score.toFixed(3)}`);
        
        // Create ride request in driver's interface
        await this.createDriverRideRequest(driver.id, rideId, riderName);
        
        // Store fallback drivers for potential use
        await this.storeFallbackDrivers(rideId, drivers.slice(1));
        
        console.log(`✅ Ride request created for driver ${driver.id}`);
        console.log(`📝 ${drivers.length - 1} fallback drivers stored for potential use`);
        console.log(`💡 Driver can now see the request in their ride requests section`);
        
        return 'matched'; // Return matched since we're creating the request for the driver
      }
      
      // No drivers available
      console.log('❌ No drivers available');
      await rideUtils.updateRideStatus(rideId, 'cancelled', {
        additionalDetails: 'No drivers were available to accept this ride'
      });
      return 'no_match';
    } catch (error) {
      console.error('Error in sequential ride request creation:', error);
      throw error;
    }
  },

  // Create ride request in driver's interface
  async createDriverRideRequest(driverId: string, rideId: string, riderName: string): Promise<void> {
    try {
      console.log(`📋 Creating ride request specifically for driver ${driverId}`);
      
      // Get the ride details
      const rideDoc = await getDoc(doc(db, 'rides', rideId));
      if (!rideDoc.exists()) {
        throw new Error('Ride not found');
      }
      
      const rideData = rideDoc.data() as Ride;
      
      // Create driver ride request document
      const driverRideRequest = {
        rideId,
        driverId, // This ensures only this specific driver can see it
        riderName,
        riderId: rideData.riderId,
        event: rideData.event,
        passengers: rideData.passengers,
        address: rideData.address,
        pickupRequired: rideData.pickupRequired,
        dropoffRequired: rideData.dropoffRequired,
        additionalDetails: rideData.additionalDetails,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Store in driver's ride requests collection
      const driverRideRequestsCollection = collection(db, 'driverRideRequests');
      await addDoc(driverRideRequestsCollection, driverRideRequest);
      
      console.log(`✅ Ride request created specifically for driver ${driverId}`);
      console.log(`🔒 This request is only visible to driver ${driverId}, not other drivers`);
    } catch (error) {
      console.error('Error creating driver ride request:', error);
      throw error;
    }
  },

  // Store fallback drivers for potential use
  async storeFallbackDrivers(rideId: string, fallbackDrivers: Array<{ driver: DriverProfile; score: number }>): Promise<void> {
    try {
      if (fallbackDrivers.length === 0) return;
      
      console.log(`📝 Storing ${fallbackDrivers.length} fallback drivers for ride ${rideId}`);
      
      // Store fallback drivers in a collection for this ride
      const fallbackCollection = collection(db, 'rideFallbackDrivers');
      const fallbackData = {
        rideId,
        drivers: fallbackDrivers.map(({ driver, score }) => ({
          driverId: driver.id,
          score,
          driverName: `${driver.vehicleMake} ${driver.vehicleModel}`,
        })),
        createdAt: new Date().toISOString(),
      };
      
      await addDoc(fallbackCollection, fallbackData);
      console.log(`✅ Fallback drivers stored for ride ${rideId}`);
    } catch (error) {
      console.error('Error storing fallback drivers:', error);
      throw error;
    }
  },

  // Remove ride request from driver's interface
  async removeDriverRideRequest(driverId: string, rideId: string): Promise<void> {
    try {
      console.log(`🗑️ Removing ride request ${rideId} from driver ${driverId}`);
      
      // Find and delete the driver ride request
      const driverRideRequestsCollection = collection(db, 'driverRideRequests');
      const q = query(
        driverRideRequestsCollection,
        where('driverId', '==', driverId),
        where('rideId', '==', rideId)
      );
      
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log(`✅ Ride request removed from driver ${driverId}`);
    } catch (error) {
      console.error('Error removing driver ride request:', error);
      throw error;
    }
  },

  // Move to next driver when current driver declines
  async moveToNextDriver(rideId: string): Promise<'matched' | 'no_match'> {
    try {
      console.log(`🔄 Moving to next driver for ride ${rideId}`);
      
      // Get fallback drivers for this ride
      const fallbackCollection = collection(db, 'rideFallbackDrivers');
      const q = query(fallbackCollection, where('rideId', '==', rideId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log(`❌ No fallback drivers found for ride ${rideId}`);
        await rideUtils.updateRideStatus(rideId, 'cancelled', {
          additionalDetails: 'All drivers declined the ride'
        });
        return 'no_match';
      }
      
      const fallbackData = querySnapshot.docs[0].data();
      const fallbackDrivers = fallbackData.drivers;
      
      if (fallbackDrivers.length === 0) {
        console.log(`❌ No more fallback drivers for ride ${rideId}`);
        await rideUtils.updateRideStatus(rideId, 'cancelled', {
          additionalDetails: 'All drivers declined the ride'
        });
        return 'no_match';
      }
      
      // Get the next driver (highest score remaining)
      const nextDriver = fallbackDrivers[0];
      console.log(`📋 Moving to next driver: ${nextDriver.driverId} (score: ${nextDriver.score})`);
      
      // Create ride request for next driver
      await this.createDriverRideRequest(nextDriver.driverId, rideId, 'Rider');
      
      // Remove this driver from fallback list
      const remainingDrivers = fallbackDrivers.slice(1);
      if (remainingDrivers.length > 0) {
        await updateDoc(querySnapshot.docs[0].ref, {
          drivers: remainingDrivers
        });
      } else {
        // No more fallback drivers, delete the document
        await deleteDoc(querySnapshot.docs[0].ref);
      }
      
      console.log(`✅ Next driver notified, ${remainingDrivers.length} drivers remaining`);
      return 'matched';
    } catch (error) {
      console.error('Error moving to next driver:', error);
      throw error;
    }
  },

  // Driver accepts a ride request
  async driverAcceptRide(driverId: string, rideId: string): Promise<void> {
    try {
      console.log(`✅ Driver ${driverId} accepting ride ${rideId}`);
      
      // Get ride details
      const rideDoc = await getDoc(doc(db, 'rides', rideId));
      if (!rideDoc.exists()) {
        throw new Error('Ride not found');
      }
      
      const rideData = rideDoc.data() as Ride;
      
      // Update ride status to matched
      await rideUtils.updateRideStatus(rideId, 'matched', {
        driverId,
        matchedAt: new Date().toISOString(),
      });
      
      // Update driver availability and seats
      await driverUtils.updateDriverSeats(driverId, rideData.passengers);
      await driverUtils.updateDriverAvailability(driverId, false);
      
      // Remove the ride request from driver's interface
      await this.removeDriverRideRequest(driverId, rideId);
      
      // Update driver load count for fairness
      await matchingUtils.updateDriverLoadCount(driverId);
      
      console.log(`🎉 Driver ${driverId} successfully accepted ride ${rideId}`);
    } catch (error) {
      console.error('Error accepting ride:', error);
      throw error;
    }
  },

  // Driver declines a ride request
  async driverDeclineRide(driverId: string, rideId: string): Promise<void> {
    try {
      console.log(`❌ Driver ${driverId} declining ride ${rideId}`);
      
      // Remove the ride request from driver's interface
      await this.removeDriverRideRequest(driverId, rideId);
      
      // Update driver load count for fairness
      await matchingUtils.updateDriverLoadCount(driverId);
      
      // Move to next driver
      const result = await this.moveToNextDriver(rideId);
      
      if (result === 'no_match') {
        console.log(`❌ No more drivers available for ride ${rideId}`);
      } else {
        console.log(`📋 Moved to next driver for ride ${rideId}`);
      }
      
    } catch (error) {
      console.error('Error declining ride:', error);
      throw error;
    }
  },

  // Get driver's ride requests (only requests specifically sent to this driver)
  async getDriverRideRequests(driverId: string): Promise<any[]> {
    try {
      console.log(`🔍 Getting ride requests specifically for driver ${driverId}`);
      
      const driverRideRequestsCollection = collection(db, 'driverRideRequests');
      const q = query(
        driverRideRequestsCollection,
        where('driverId', '==', driverId),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`📋 Found ${requests.length} ride requests specifically for driver ${driverId}`);
      console.log(`🔒 These requests are ONLY visible to driver ${driverId}`);
      
      // Log each request for debugging
      requests.forEach((request: any, index) => {
        console.log(`   ${index + 1}. Ride ${request.rideId} from ${request.riderName} - ${request.event}`);
      });
      
      return requests;
    } catch (error) {
      console.error('Error getting driver ride requests:', error);
      throw error;
    }
  },

  // Get all ride requests (for debugging purposes)
  async getAllRideRequests(): Promise<any[]> {
    try {
      console.log(`🔍 Getting ALL ride requests (for debugging)`);
      
      const driverRideRequestsCollection = collection(db, 'driverRideRequests');
      const q = query(driverRideRequestsCollection, where('status', '==', 'pending'));
      
      const querySnapshot = await getDocs(q);
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`📋 Found ${requests.length} total ride requests in system`);
      
      // Group by driver for debugging
      const requestsByDriver = requests.reduce((acc, request: any) => {
        if (!acc[request.driverId]) {
          acc[request.driverId] = [];
        }
        acc[request.driverId].push(request);
        return acc;
      }, {} as Record<string, any[]>);
      
      Object.entries(requestsByDriver).forEach(([driverId, driverRequests]) => {
        console.log(`   Driver ${driverId}: ${driverRequests.length} requests`);
      });
      
      return requests;
    } catch (error) {
      console.error('Error getting all ride requests:', error);
      throw error;
    }
  },

  // Verify that driver filtering is working correctly
  async verifyDriverFiltering(testDriverId: string): Promise<void> {
    try {
      console.log(`🔍 Verifying driver filtering for driver ${testDriverId}`);
      
      // Get requests specifically for this driver
      const driverRequests = await this.getDriverRideRequests(testDriverId);
      
      // Get all requests in the system
      const allRequests = await this.getAllRideRequests();
      
      // Check if any requests are visible to this driver that shouldn't be
      const requestsForThisDriver = allRequests.filter((req: any) => req.driverId === testDriverId);
      
      console.log(`✅ Verification complete:`);
      console.log(`   - Driver ${testDriverId} sees ${driverRequests.length} requests`);
      console.log(`   - Total requests in system: ${allRequests.length}`);
      console.log(`   - Requests specifically for this driver: ${requestsForThisDriver.length}`);
      
      if (driverRequests.length === requestsForThisDriver.length) {
        console.log(`✅ Driver filtering is working correctly!`);
      } else {
        console.log(`❌ Driver filtering issue detected!`);
      }
    } catch (error) {
      console.error('Error verifying driver filtering:', error);
      throw error;
    }
  },

  // Book a ride with full matching flow
  async bookRide(
    riderId: string,
    riderName: string,
    event: string,
    passengers: number,
    address: string,
    pickupRequired: boolean,
    dropoffRequired: boolean,
    additionalDetails?: string
  ): Promise<{ rideId: string; status: 'pending' | 'matched' | 'no_match' }> {
    try {
      // Import userUtils here to avoid circular dependency
      const { userUtils } = await import('./userUtils');
      
      // Get rider's saved address coordinates
      const userProfile = await userUtils.getUserProfile(riderId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Find the address in saved addresses
      const savedAddress = userProfile.savedAddresses?.find(addr => addr.address === address);
      if (!savedAddress?.coordinates) {
        throw new Error('Address coordinates not found. Please save the address first.');
      }

      // Create ride data
      const rideData: Omit<Ride, 'id' | 'requestedAt' | 'createdAt' | 'updatedAt'> = {
        riderId,
        riderName,
        event,
        passengers,
        address,
        pickupRequired,
        dropoffRequired,
        additionalDetails,
        status: 'pending',
      };

      // Create ride request with sequential matching
      const result = await this.createRideRequestWithMatching(
        rideData,
        savedAddress.coordinates,
        passengers
      );

      return result;
    } catch (error) {
      console.error('Error booking ride:', error);
      throw error;
    }
  },
};
