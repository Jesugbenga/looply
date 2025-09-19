import { SavedAddress } from './types';

// Expo Constants: runtime config for environment variables in Expo apps
let ExpoConstants: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ExpoConstants = require('expo-constants');
} catch (e) {
  ExpoConstants = null;
}

// Geoapify API configuration
const GEOAPIFY_BASE_URL = 'https://api.geoapify.com/v1/geocode/search';

// Read API key from multiple possible locations
function readGeoapifyKey(): string | undefined {
  const fromProcess = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;
  if (fromProcess) return fromProcess;

  if (ExpoConstants) {
    // runtime config (recommended)
    const extras = ExpoConstants.expoConfig?.extra ?? ExpoConstants.manifest?.extra ?? ExpoConstants.default?.extra ?? ExpoConstants.expo?.extra;
    if (extras && extras.EXPO_PUBLIC_GEOAPIFY_API_KEY) {
      return extras.EXPO_PUBLIC_GEOAPIFY_API_KEY;
    }
    // some setups put values directly on Constants.expoConfig or Constants.manifest
    if (ExpoConstants.expoConfig?.EXPO_PUBLIC_GEOAPIFY_API_KEY) return ExpoConstants.expoConfig.EXPO_PUBLIC_GEOAPIFY_API_KEY;
    if (ExpoConstants.manifest?.EXPO_PUBLIC_GEOAPIFY_API_KEY) return ExpoConstants.manifest.EXPO_PUBLIC_GEOAPIFY_API_KEY;
  }

  return undefined;
}

const GEOAPIFY_API_KEY = readGeoapifyKey();
if (!GEOAPIFY_API_KEY) {
  console.error('🚨 EXPO_PUBLIC_GEOAPIFY_API_KEY not found.');
  console.error('Make sure you:');
  console.error('  • have a `.env` with EXPO_PUBLIC_GEOAPIFY_API_KEY when running Expo CLI (dev builds)');
  console.error('  • or configure `extra` in `app.json`/`app.config.js` and run `expo prebuild`/use runtime config');
  console.error('  • or set the env at build time so `process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY` is available');
}

export const geocodingService = {
  // Geocode an address using Geoapify API
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      if (!GEOAPIFY_API_KEY) {
        throw new Error('Geoapify API key not configured. Please add EXPO_PUBLIC_GEOAPIFY_API_KEY to your .env file');
      }

      console.log('🌍 Geocoding address:', address);
      
      const response = await fetch(
        `${GEOAPIFY_BASE_URL}?text=${encodeURIComponent(address)}&apiKey=${GEOAPIFY_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].geometry.coordinates;
        console.log('📍 Geocoded coordinates:', { lat, lng });
        return { lat, lng };
      }
      
      console.warn('No coordinates found for address:', address);
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error; // Re-throw to let calling code handle the error
    }
  },

  // Geocode and save address for user
  async geocodeAndSaveAddress(uid: string, address: Omit<SavedAddress, 'id' | 'coordinates'>): Promise<void> {
    try {
      console.log('🌍 Geocoding address:', address.address);
      const coordinates = await this.geocodeAddress(address.address);
      
      if (!coordinates) {
        throw new Error('Could not geocode address. Please check the address and try again.');
      }

      console.log('📍 Geocoded coordinates:', coordinates);
      
      const addressWithCoords: SavedAddress = {
        ...address,
        id: Date.now().toString(),
        coordinates,
      };

      // Import userUtils here to avoid circular dependency
      const { userUtils } = await import('./userUtils');
      await userUtils.saveAddress(uid, addressWithCoords);
    } catch (error) {
      console.error('Error geocoding and saving address:', error);
      throw error;
    }
  },
};
