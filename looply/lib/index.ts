// Main export file for all Firebase utilities
// This provides a clean interface for importing utilities

// Export all types
export * from './types';

// Export all utilities
export { userUtils } from './userUtils';
export { driverUtils } from './driverUtils';
export { rideUtils } from './rideUtils';
export { matchingUtils } from './matchingUtils';
export { rideMatchingService } from './rideMatchingService';
export { geocodingService } from './geocodingService';
export { eventUtils } from './eventUtils';
export { utils } from './utils';

// Re-export Firebase instance for direct access if needed
export { db } from './firebase';
