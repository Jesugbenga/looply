declare module 'firebase/auth/react-native' {
  import { Persistence } from 'firebase/auth';
  import AsyncStorageType from '@react-native-async-storage/async-storage';

  export function getReactNativePersistence(storage: typeof AsyncStorageType | any): Persistence;
}
