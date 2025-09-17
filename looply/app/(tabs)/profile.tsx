import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert, Modal } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from '@/contexts/AuthContext';
import { useRefresh } from '@/contexts/RefreshContext';
import { useRouter } from 'expo-router';
import { userUtils, SavedAddress, driverUtils } from '@/lib/firebaseUtils';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import DriverRegistrationModal from '@/components/DriverRegistrationModal';

// SavedAddress interface is now imported from firebaseUtils

export default function RiderProfileScreen() {
  const { user, userProfile, logout, switchUserRole, updateUserProfile } = useAuth();
  const { triggerRefresh } = useRefresh();
  const router = useRouter();
  const { isOnline, isConnecting, retryConnection } = useConnectionStatus();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', address: '' });
  const [isDriverAvailable, setIsDriverAvailable] = useState(false);
  const [showDriverRegistration, setShowDriverRegistration] = useState(false);
  const [hasDriverProfile, setHasDriverProfile] = useState(false);

  useEffect(() => {
    if (user) {
      loadSavedAddresses();
      loadDriverAvailability();
      checkDriverProfile();
    }
  }, [user]);

  const checkDriverProfile = async () => {
    if (!user) return;
    
    try {
      const driverProfile = await driverUtils.getDriverProfile(user.uid);
      setHasDriverProfile(!!driverProfile);
    } catch (error) {
      console.error('Error checking driver profile:', error);
    }
  };

  const loadSavedAddresses = async () => {
    if (!user) return;
    
    try {
      const userProfile = await userUtils.getUserProfile(user.uid);
      if (userProfile) {
        setSavedAddresses(userProfile.savedAddresses || []);
        setIsDriverAvailable(userProfile.isDriverAvailable || false);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadDriverAvailability = async () => {
    if (!user) return;
    
    try {
      const userProfile = await userUtils.getUserProfile(user.uid);
      if (userProfile) {
        setIsDriverAvailable(userProfile.isDriverAvailable || false);
      }
    } catch (error) {
      console.error('Error loading driver availability:', error);
    }
  };

  const saveAddress = async () => {
    if (!user || !newAddress.label.trim() || !newAddress.address.trim()) {
      Alert.alert('Error', 'Please fill in both label and address');
      return;
    }

    if (!isOnline) {
      Alert.alert(
        'Offline Mode',
        'You are currently offline. Please check your internet connection and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: retryConnection }
        ]
      );
      return;
    }

    try {
      const newAddressData = {
        label: newAddress.label.trim(),
        address: newAddress.address.trim(),
        isDefault: savedAddresses.length === 0, // First address is default
      };

      await userUtils.saveAddress(user.uid, newAddressData);
      
      // Update local state immediately for better UX
      const newAddressWithId = {
        ...newAddressData,
        id: Date.now().toString(), // Generate a temporary ID
      };
      setSavedAddresses(prev => [...prev, newAddressWithId]);
      
      // Clear form and close modal
      setNewAddress({ label: '', address: '' });
      setShowAddressModal(false);
      
      // Show success message
      Alert.alert('Success', 'Address saved successfully');
      
      // Trigger refresh of other components
      triggerRefresh();
      
      // Reload addresses in the background to ensure data consistency
      setTimeout(async () => {
        try {
          await loadSavedAddresses();
        } catch (error) {
          console.error('Error reloading addresses:', error);
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('Error saving address:', error);
      Alert.alert('Error', error.message || 'Failed to save address');
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    if (!user) return;

    try {
      // Update local state immediately for better UX
      const updatedAddresses = savedAddresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId,
      }));

      setSavedAddresses(updatedAddresses);
      
      // Update in Firestore
      await userUtils.updateSavedAddresses(user.uid, updatedAddresses);
      
      Alert.alert('Success', 'Default address updated');
      
      // Trigger refresh of other components
      triggerRefresh();
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert('Error', 'Failed to update default address');
      // Reload addresses to restore correct state
      await loadSavedAddresses();
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!user) return;

    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Update local state immediately for better UX
              const updatedAddresses = savedAddresses.filter(addr => addr.id !== addressId);
              
              // If we deleted the default address, make the first remaining one default
              if (updatedAddresses.length > 0 && !updatedAddresses.some(addr => addr.isDefault)) {
                updatedAddresses[0].isDefault = true;
              }

              // Update UI immediately
              setSavedAddresses(updatedAddresses);
              
              // Update in Firestore
              await userUtils.updateSavedAddresses(user.uid, updatedAddresses);
              
              Alert.alert('Success', 'Address deleted successfully');
              
              // Trigger refresh of other components
              triggerRefresh();
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Failed to delete address');
              // Reload addresses to restore correct state
              await loadSavedAddresses();
            }
          },
        },
      ]
    );
  };

  const toggleDriverAvailability = async () => {
    if (!user) return;

    try {
      const newAvailability = !isDriverAvailable;
      // Update both Firestore and AuthContext state
      await updateUserProfile({ isDriverAvailable: newAvailability });
      setIsDriverAvailable(newAvailability);
    } catch (error) {
      console.error('Error updating driver availability:', error);
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSwitchToDriver = async () => {
    if (!user || !userProfile) return;
    
    try {
      // Check if user has driver profile
      if (!hasDriverProfile) {
        Alert.alert(
          'Driver Registration Required',
          'You need to complete your driver registration first. This includes providing your license information and vehicle details.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Register', onPress: () => setShowDriverRegistration(true) }
          ]
        );
        return;
      }
      
      await switchUserRole('driver');
      Alert.alert('Success', 'Switched to driver mode');
      triggerRefresh(); // Refresh the UI
      // Navigate to Home so DriverHome is visible immediately
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Switch to driver error:', error);
      Alert.alert('Error', error.message || 'Failed to switch to driver mode');
    }
  };

  const handleSwitchToRider = async () => {
    if (!user || !userProfile) return;
    
    try {
      await switchUserRole('rider');
      Alert.alert('Success', 'Switched to rider mode');
      triggerRefresh(); // Refresh the UI
      // Navigate to Home so RiderHome is visible immediately
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Switch to rider error:', error);
      Alert.alert('Error', error.message || 'Failed to switch to rider mode');
    }
  };

  const handleDriverRegistrationSuccess = async () => {
    await checkDriverProfile();
    triggerRefresh();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: "https://i.pravatar.cc/150?img=1" }}
            style={styles.profileImage}
          />
          <Text style={styles.name}>
            {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : user?.displayName || 'User'}
          </Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.statusText}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>4.8</Text>
            <Text style={styles.ratingCount}>(24 rides)</Text>
          </View>
        </View>

        {/* Offline Warning */}
        {!isOnline && (
          <View style={styles.offlineWarning}>
            <Ionicons name="wifi-outline" size={20} color="#EF4444" />
            <Text style={styles.offlineText}>You're offline. Some features may not work.</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={retryConnection}
              disabled={isConnecting}
            >
              <Text style={styles.retryButtonText}>
                {isConnecting ? 'Retrying...' : 'Retry'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>15</Text>
            <Text style={styles.statLabel}>Total Rides</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>$247</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        </View>

        {/* Saved Addresses */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={22} color="#4B5563" />
            <Text style={styles.rowText}>Saved Addresses</Text>
          </View>
          
          {savedAddresses.length === 0 ? (
            <View style={styles.emptyAddresses}>
              <Text style={styles.emptyAddressText}>No saved addresses</Text>
              <Text style={styles.emptyAddressSubtext}>Add an address to make booking easier</Text>
            </View>
          ) : (
            savedAddresses.map((address) => (
              <View key={address.id} style={styles.addressItem}>
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>
                    {address.label}
                    {address.isDefault && (
                      <Text style={styles.defaultBadge}> (Default)</Text>
                    )}
                  </Text>
                  <Text style={styles.addressText}>{address.address}</Text>
                </View>
                <View style={styles.addressActions}>
                  {!address.isDefault && (
                    <TouchableOpacity
                      onPress={() => setDefaultAddress(address.id)}
                      style={styles.addressActionButton}
                    >
                      <Ionicons name="star-outline" size={16} color="#F59E0B" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => deleteAddress(address.id)}
                    style={styles.addressActionButton}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          
          <TouchableOpacity
            style={styles.addAddressButton}
            onPress={() => setShowAddressModal(true)}
          >
            <Ionicons name="add-outline" size={20} color="#3B82F6" />
            <Text style={styles.addAddressText}>Add Address</Text>
          </TouchableOpacity>
        </View>

        {/* Driver Availability Toggle (only when in driver mode) */}
        {(userProfile?.lastActiveAs === 'driver') && (
          <View style={styles.card}>
            <View style={styles.availabilityRow}>
              <View style={styles.availabilityInfo}>
                <Ionicons name="car-outline" size={22} color="#4B5563" />
                <View style={styles.availabilityTextContainer}>
                  <Text style={styles.rowText}>Driver Availability</Text>
                  <Text style={styles.availabilitySubtext}>
                    {isDriverAvailable ? 'Available to take rides' : 'Not available'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.toggle, isDriverAvailable && styles.toggleActive]}
                onPress={toggleDriverAvailability}
              >
                <View style={[styles.toggleThumb, isDriverAvailable && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
          </View>
        )}

         {/* Quick Actions */}
         <View style={styles.card}>
          {userProfile?.lastActiveAs === 'rider' ? (
            <TouchableOpacity style={styles.row} onPress={handleSwitchToDriver}>
              <Ionicons name="car-outline" size={22} color="#4B5563" />
              <Text style={styles.rowText}>Switch to Driver</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.row} onPress={handleSwitchToRider}>
              <Ionicons name="person-outline" size={22} color="#4B5563" />
              <Text style={styles.rowText}>Switch to Rider</Text>
            </TouchableOpacity>
          )}
          {/* <TouchableOpacity style={styles.row}>
            <Ionicons name="time-outline" size={22} color="#4B5563" />
            <Text style={styles.rowText}>Your Activity</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row}>
            <Ionicons name="heart-outline" size={22} color="#4B5563" />
            <Text style={styles.rowText}>Favorite Places</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row}>
            <Ionicons name="card-outline" size={22} color="#4B5563" />
            <Text style={styles.rowText}>Payment Methods</Text>
          </TouchableOpacity> */}
        {/* </View>

        {/* Account Settings */}
   
          <TouchableOpacity style={styles.row}>
            <Ionicons name="person-outline" size={22} color="#4B5563" />
            <Text style={styles.rowText}>Personal Information</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity style={styles.row}>
            <Ionicons name="notifications-outline" size={22} color="#4B5563" />
            <Text style={styles.rowText}>Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row}>
            <Ionicons name="shield-outline" size={22} color="#4B5563" />
            <Text style={styles.rowText}>Privacy & Security</Text>
          </TouchableOpacity> */}
        

        {/* Help & Support */}
          {/* <TouchableOpacity style={styles.row}>
            <Ionicons name="help-circle-outline" size={22} color="#4B5563" />
            <Text style={styles.rowText}>Help Center</Text>
          </TouchableOpacity> */}
          <TouchableOpacity style={styles.row}>
            <Ionicons name="mail-outline" size={22} color="#4B5563" />
            <Text style={styles.rowText}>Contact Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row}>
            <Ionicons name="star-outline" size={22} color="#4B5563" />
            <Text style={styles.rowText}>Rate the App</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutCard} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          {/* <Text style={styles.footerText}>App version 1.0.0</Text> */}
        </View>
      </ScrollView>

      {/* Add Address Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowAddressModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Address</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Label (e.g., Home, Work)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter a label for this address"
                value={newAddress.label}
                onChangeText={(text) => setNewAddress(prev => ({ ...prev, label: text }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Enter the full address"
                value={newAddress.address}
                onChangeText={(text) => setNewAddress(prev => ({ ...prev, address: text }))}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddressModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveAddress}
            >
              <Text style={styles.saveButtonText}>Save Address</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Driver Registration Modal */}
      <DriverRegistrationModal
        visible={showDriverRegistration}
        onClose={() => setShowDriverRegistration(false)}
        onSuccess={handleDriverRegistrationSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    alignItems: "center",
    marginTop: 80,
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "500",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 4,
    marginRight: 6,
  },
  ratingCount: {
    fontSize: 14,
    color: "#6B7280",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  rowText: {
    fontSize: 16,
    color: "#374151",
    marginLeft: 12,
    fontWeight: "500",
  },
  signOutCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  signOutText: {
    fontSize: 16,
    color: "#EF4444",
    marginLeft: 12,
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  footerText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  // Driver availability styles
  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  availabilityInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  availabilityTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  availabilitySubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: "#10B981",
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  // Address management styles
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  emptyAddresses: {
    padding: 20,
    alignItems: "center",
  },
  emptyAddressText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 4,
  },
  emptyAddressSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 2,
  },
  defaultBadge: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },
  addressText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  addressActions: {
    flexDirection: "row",
    gap: 8,
  },
  addressActionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  addAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: "#EBF8FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3B82F6",
    borderStyle: "dashed",
  },
  addAddressText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#3B82F6",
    marginLeft: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  modalPlaceholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#3B82F6",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  // Offline warning styles
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  offlineText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 8,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});