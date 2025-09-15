import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  userType: 'rider' | 'driver' | 'both';
  isActive: boolean;
  rating: number;
  totalRides: number;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    signInSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
    },
    signUpSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
    },
    signOutSuccess: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const {
  setLoading,
  setError,
  signInSuccess,
  signUpSuccess,
  signOutSuccess,
  updateUser,
} = authSlice.actions;

// Thunks for async actions
export const signIn = (email: string, password: string) => async (dispatch: any) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  
  try {
    // Simulate API call - replace with real API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user data - replace with real API response
    const mockUser: User = {
      id: '1',
      email: email,
      firstName: 'John',
      lastName: 'Doe',
      userType: 'rider',
      isActive: true,
      rating: 4.8,
      totalRides: 15,
    };
    
    const mockToken = 'mock-jwt-token';
    
    // Store token in AsyncStorage
    await AsyncStorage.setItem('authToken', mockToken);
    await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    
    dispatch(signInSuccess({ user: mockUser, token: mockToken }));
    
  } catch (error) {
    dispatch(setError('Failed to sign in. Please try again.'));
  }
};

export const signUp = (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) => async (dispatch: any) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  
  try {
    // Simulate API call - replace with real API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user data - replace with real API response
    const mockUser: User = {
      id: '2',
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      userType: 'rider',
      isActive: true,
      rating: 5.0,
      totalRides: 0,
    };
    
    const mockToken = 'mock-jwt-token';
    
    // Store token in AsyncStorage
    await AsyncStorage.setItem('authToken', mockToken);
    await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    
    dispatch(signUpSuccess({ user: mockUser, token: mockToken }));
    
  } catch (error) {
    dispatch(setError('Failed to create account. Please try again.'));
  }
};

export const signOut = () => async (dispatch: any) => {
  try {
    // Remove token from AsyncStorage
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
    
    dispatch(signOutSuccess());
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

export const loadStoredAuth = () => async (dispatch: any) => {
  dispatch(setLoading(true));
  
  try {
    const token = await AsyncStorage.getItem('authToken');
    const userStr = await AsyncStorage.getItem('user');
    
    if (token && userStr) {
      const user = JSON.parse(userStr);
      dispatch(signInSuccess({ user, token }));
    }
  } catch (error) {
    console.error('Error loading stored auth:', error);
  } finally {
    dispatch(setLoading(false));
  }
};

export default authSlice.reducer;