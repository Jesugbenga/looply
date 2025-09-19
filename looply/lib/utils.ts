import { matchingUtils } from './matchingUtils';

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

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    return matchingUtils.calculateHaversineDistance(lat1, lng1, lat2, lng2);
  },
};
