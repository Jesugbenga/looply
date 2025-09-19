import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from './firebase';
import { DriverProfile } from './types';

export const matchingUtils = {
  // Calculate Haversine distance between two coordinates (in kilometers)
  calculateHaversineDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLng = this.degreesToRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  // Convert degrees to radians
  degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  },

  // Normalize a value to 0-1 range
  normalize(value: number, min: number, max: number): number {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  },

  // Calculate driver score for matching
  calculateDriverScore(
    driver: DriverProfile,
    riderCoords: { lat: number; lng: number },
    ridersCount: number,
    weights: {
      distance: number;
      seats: number;
      rating: number;
      loadBalance: number;
    } = { distance: 0.4, seats: 0.3, rating: 0.2, loadBalance: 0.1 }
  ): number {
    if (!driver.currentLocation) return 0;

    // Calculate normalized distance score (closer is better)
    const distance = this.calculateHaversineDistance(
      riderCoords.lat,
      riderCoords.lng,
      driver.currentLocation.lat,
      driver.currentLocation.lng
    );
    const normalizedDistance = 1 - this.normalize(distance, 0, 5); // 5km max for normalization

    // Calculate seats fit score
    const seatsFit = driver.availableSeats >= ridersCount ? 1 : 0;

    // Calculate rating score (normalize 1-5 to 0-1)
    const ratingScore = this.normalize(driver.rating || 5, 1, 5);

    // Calculate load balance penalty (fewer recent rides is better)
    const recentLoad = driver.recentLoadCount || 0;
    const loadBalanceScore = 1 - this.normalize(recentLoad, 0, 10); // Max 10 recent rides

    // Calculate weighted score
    const score = 
      weights.distance * normalizedDistance +
      weights.seats * seatsFit +
      weights.rating * ratingScore +
      weights.loadBalance * loadBalanceScore;

    return score;
  },

  // Find nearby available drivers
  async findNearbyDrivers(
    riderCoords: { lat: number; lng: number },
    ridersCount: number,
    riderId: string,
    maxDistanceKm: number = 200
  ): Promise<DriverProfile[]> {
    try {
      console.log(`\n🔍 ===== FINDING NEARBY DRIVERS =====`);
      console.log(`📍 Rider coordinates: ${riderCoords.lat}, ${riderCoords.lng}`);
      console.log(`👥 Riders count: ${ridersCount}`);
      console.log(`📏 Max distance: ${maxDistanceKm}km`);

      const driversCollection = collection(db, 'driverProfiles');
      const q = query(
        driversCollection,
        // where('isAvailable', '==', true),
        // where('isVerified', '==', true)
      );
      
      console.log(`\n📡 Querying database for available drivers...`);
      const querySnapshot = await getDocs(q);
      const allDrivers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as DriverProfile[];

      console.log(`\n📊 ===== DATABASE RESULTS =====`);
      console.log(`Found ${allDrivers.length} available drivers in database`);

      // Log each driver's basic info
      allDrivers.forEach((driver, index) => {
        console.log(`\n🚗 Driver ${index + 1}/${allDrivers.length} (ID: ${driver.id}):`);
        console.log(`   📧 User ID: ${driver.userId}`);
        console.log(`   🚙 Vehicle: ${driver.vehicleMake} ${driver.vehicleModel} (${driver.vehicleYear})`);
        console.log(`   🪑 Total seats: ${driver.seats}`);
        console.log(`   🪑 Available seats: ${driver.availableSeats || 'NOT SET'}`);
        console.log(`   ⭐ Rating: ${driver.rating || 'N/A'}`);
        console.log(`   📍 Current location: ${driver.currentLocation ? `${driver.currentLocation.lat}, ${driver.currentLocation.lng}` : 'NOT SET'}`);
        console.log(`   🔄 Recent load count: ${driver.recentLoadCount || 0}`);
        console.log(`   📅 Last load reset: ${driver.lastLoadReset || 'N/A'}`);
        console.log(`   ✅ Is available: ${driver.isAvailable || true}`);
        console.log(`   ✅ Is verified: ${driver.isVerified || true}`);
      });

      console.log(`\n🔍 ===== FILTERING BY DISTANCE AND SEATS =====`);

      // Filter by distance and seat availability
      const nearbyDrivers = allDrivers.filter((driver, index) => {
        console.log(`\n🚗 Checking Driver ${index + 1}/${allDrivers.length} (ID: ${driver.id}):`);
        
        // Skip if this driver is the same person as the rider
        if (driver.userId === riderId) {
          console.log(`   ❌ SAME PERSON AS RIDER - SKIPPING`);
          console.log(`   👤 Driver User ID: ${driver.userId}, Rider ID: ${riderId}`);
          return false;
        }
        
        // Skip drivers without location
        if (!driver.currentLocation) {
          console.log(`   ❌ NO CURRENT LOCATION - SKIPPING`);
          console.log(`   💡 This driver needs to set their current location (use their default address)`);
          return false;
        }

        // Use total seats if availableSeats is not set (for backward compatibility)
        const availableSeats = driver.availableSeats !== undefined ? driver.availableSeats : driver.seats;
        
        // Skip drivers without enough seats
        if (availableSeats < ridersCount) {
          console.log(`   ❌ NOT ENOUGH SEATS - SKIPPING`);
          console.log(`   🪑 Available: ${availableSeats}, Required: ${ridersCount}`);
          return false;
        }

        // Calculate distance
        const distance = this.calculateHaversineDistance(
          riderCoords.lat,
          riderCoords.lng,
          driver.currentLocation.lat,
          driver.currentLocation.lng
        );

        const isWithinRange = distance <= maxDistanceKm;
        console.log(`   📍 Location: ${driver.currentLocation.lat}, ${driver.currentLocation.lng}`);
        console.log(`   📏 Distance: ${distance.toFixed(2)}km`);
        console.log(`   📏 Max allowed: ${maxDistanceKm}km`);
        console.log(`   ✅ Within range: ${isWithinRange}`);
        console.log(`   🎯 MEETS CRITERIA: ${isWithinRange ? 'YES' : 'NO'}`);
        
        return isWithinRange;
      });

      console.log(`\n🎯 ===== FINAL RESULTS =====`);
      console.log(`✅ ${nearbyDrivers.length} drivers meet all criteria`);
      
      if (nearbyDrivers.length > 0) {
        console.log(`\n📋 Selected drivers:`);
        nearbyDrivers.forEach((driver, index) => {
          const distance = this.calculateHaversineDistance(
            riderCoords.lat,
            riderCoords.lng,
            driver.currentLocation!.lat,
            driver.currentLocation!.lng
          );
          const availableSeats = driver.availableSeats !== undefined ? driver.availableSeats : driver.seats;
          console.log(`   ${index + 1}. ${driver.id} - ${distance.toFixed(2)}km - ${availableSeats} seats`);
        });
      } else {
        console.log(`\n❌ No drivers found that meet the criteria`);
        console.log(`   - Check if drivers have current locations set`);
        console.log(`   - Check if drivers have enough available seats`);
        console.log(`   - Check if drivers are within the distance limit`);
        console.log(`   - Check if drivers are available and verified`);
      }

      return nearbyDrivers;
    } catch (error) {
      console.error('Error finding nearby drivers:', error);
      throw error;
    }
  },

  // Find best drivers for a ride request
  async findBestDrivers(
    riderCoords: { lat: number; lng: number },
    ridersCount: number,
    riderId: string,
    topN: number = 5
  ): Promise<Array<{ driver: DriverProfile; score: number }>> {
    try {
      console.log('\n🔍 ===== DRIVER MATCHING PROCESS STARTED =====');
      console.log(`📍 Rider location: ${riderCoords.lat}, ${riderCoords.lng}`);
      console.log(`👥 Passengers needed: ${ridersCount}`);
      console.log(`🎯 Looking for top ${topN} drivers\n`);
      
      const nearbyDrivers = await this.findNearbyDrivers(riderCoords, ridersCount, riderId);
      
      if (nearbyDrivers.length === 0) {
        console.log('❌ No nearby drivers found');
        return [];
      }
      
      console.log(`\n📊 ===== CALCULATING DRIVER SCORES =====`);
      console.log(`Found ${nearbyDrivers.length} eligible drivers, calculating scores...\n`);
      
      // Calculate scores for all drivers
      const scoredDrivers = nearbyDrivers.map((driver, index) => {
        console.log(`\n--- Driver ${index + 1}/${nearbyDrivers.length} ---`);
        console.log(`🚗 ${driver.vehicleMake} ${driver.vehicleModel} (${driver.id})`);
        console.log(`📍 Location: ${driver.currentLocation?.lat}, ${driver.currentLocation?.lng}`);
        console.log(`🪑 Available seats: ${driver.availableSeats}/${driver.seats}`);
        console.log(`⭐ Rating: ${driver.rating || 'N/A'}`);
        console.log(`📈 Recent load: ${driver.recentLoadCount || 0}`);
        
        const score = this.calculateDriverScore(driver, riderCoords, ridersCount);
        console.log(`🎯 FINAL SCORE: ${score.toFixed(3)}`);
        
        return { driver, score };
      });

      console.log(`\n🏆 ===== RANKING DRIVERS =====`);
      
      // Sort by score (descending) and return top N
      const topDrivers = scoredDrivers
        .sort((a, b) => b.score - a.score)
        .slice(0, topN);

      console.log(`\n📋 TOP ${topDrivers.length} DRIVERS SELECTED:`);
      topDrivers.forEach(({ driver, score }, index) => {
        console.log(`${index + 1}. ${driver.vehicleMake} ${driver.vehicleModel} - Score: ${score.toFixed(3)}`);
      });
      
      console.log('\n✅ ===== DRIVER MATCHING PROCESS COMPLETE =====\n');
      return topDrivers;
    } catch (error) {
      console.error('❌ Error finding best drivers:', error);
      throw error;
    }
  },

  // Update driver load count for fairness
  async updateDriverLoadCount(driverId: string): Promise<void> {
    try {
      const driverRef = doc(db, 'driverProfiles', driverId);
      const driverDoc = await getDoc(driverRef);
      
      if (driverDoc.exists()) {
        const driverData = driverDoc.data() as DriverProfile;
        const now = new Date();
        const lastReset = driverData.lastLoadReset ? new Date(driverData.lastLoadReset) : now;
        
        // Reset count if it's been more than 1 hour
        const shouldReset = now.getTime() - lastReset.getTime() > 60 * 60 * 1000;
        const newCount = shouldReset ? 1 : (driverData.recentLoadCount || 0) + 1;
        
        await updateDoc(driverRef, {
          recentLoadCount: newCount,
          lastLoadReset: shouldReset ? now.toISOString() : driverData.lastLoadReset,
          updatedAt: now.toISOString(),
        });
      }
    } catch (error) {
      console.error('Error updating driver load count:', error);
      throw error;
    }
  },
};
