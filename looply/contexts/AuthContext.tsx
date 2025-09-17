import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'rider' | 'driver' | 'both';
  savedAddresses: any[];
  isDriverAvailable: boolean;
  lastActiveAs: 'rider' | 'driver'; // Track last active role (not 'both')
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string, userType: 'rider' | 'driver' | 'both') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  switchUserRole: (role: 'rider' | 'driver') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Create user profile in Firestore
  const createUserProfile = async (user: User, firstName: string, lastName: string, userType: 'rider' | 'driver' | 'both') => {
    try {
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        firstName,
        lastName,
        userType,
        savedAddresses: [],
        isDriverAvailable: false,
        lastActiveAs: userType === 'both' ? 'rider' : userType, // Set initial active role
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('📝 Creating user profile:', userProfile);
      await setDoc(doc(db, 'users', user.uid), userProfile);
      console.log('✅ User profile created successfully in Firestore');
      
      return userProfile;
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      throw new Error(`Failed to create user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid: string) => {
    try {
      console.log('🔍 Fetching user profile for UID:', uid);
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        const userProfile = userDoc.data() as UserProfile;
        console.log('✅ User profile found:', userProfile);
        return userProfile;
      } else {
        console.log('❌ User profile not found in Firestore');
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      throw new Error(`Failed to fetch user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, firstName: string, lastName: string, userType: 'rider' | 'driver' | 'both') => {
    try {
      console.log('🚀 Starting user sign-up process...');
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('✅ User created in Firebase Auth:', user.uid);

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });
      console.log('✅ User profile updated in Firebase Auth');

      // Create user profile in Firestore
      console.log('📝 Creating user profile in Firestore...');
      const userProfile = await createUserProfile(user, firstName, lastName, userType);
      console.log('✅ User profile created in Firestore:', userProfile);
      
      setUserProfile(userProfile);
      console.log('🎉 Sign-up completed successfully!');
    } catch (error) {
      console.error('❌ Sign up error:', error);
      throw error;
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting user sign-in process...');
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('✅ User signed in to Firebase Auth:', user.uid);

      // Verify user profile exists in Firestore
      console.log('🔍 Checking user profile in Firestore...');
      let userProfile = await fetchUserProfile(user.uid);
      
      if (!userProfile) {
        console.log('⚠️ User profile not found in Firestore, creating one...');
        // Create a basic profile if it doesn't exist (for existing users)
        userProfile = await createUserProfile(user, 'User', 'Name', 'rider');
        console.log('✅ User profile created in Firestore:', userProfile);
      } else {
        console.log('✅ User profile found in Firestore:', userProfile);
        // Ensure lastActiveAs is set for existing users
        if (!userProfile.lastActiveAs) {
          userProfile.lastActiveAs = userProfile.userType === 'both' ? 'rider' : userProfile.userType;
          await updateUserProfile({ lastActiveAs: userProfile.lastActiveAs });
        }
      }
      
      setUserProfile(userProfile);
      console.log('🎉 Sign-in completed successfully!');
    } catch (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const updatedProfile = {
        ...userProfile,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
      setUserProfile(updatedProfile as UserProfile);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  // Switch user role (rider/driver)
  const switchUserRole = async (role: 'rider' | 'driver') => {
    if (!user || !userProfile) throw new Error('No user logged in');
    
    try {
      // Only allow switching if user has 'both' userType or is switching to their registered type
      if (userProfile.userType !== 'both' && userProfile.userType !== role) {
        throw new Error(`You are registered as a ${userProfile.userType}. Cannot switch to ${role}.`);
      }
      
      await updateUserProfile({ lastActiveAs: role });
      console.log(`✅ Switched to ${role} mode`);
    } catch (error) {
      console.error('Switch role error:', error);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Fetch user profile when user signs in
        const profile = await fetchUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    logout,
    updateUserProfile,
    switchUserRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
