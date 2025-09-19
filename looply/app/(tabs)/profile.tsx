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
import DriverSeatsAdjustment from '@/components/DriverSeatsAdjustment';
import AddAddressModal from '@/components/AddAddressModal';
import { Theme } from '@/constants/Theme';
import { TurboModuleRegistry } from "react-native";

// SavedAddress interface is now imported from firebaseUtils

export default function RiderProfileScreen() {
  const { user, userProfile, logout, switchUserRole, updateUserProfile } = useAuth();
  const { triggerRefresh } = useRefresh();
  const router = useRouter();
  const { isOnline, isConnecting, retryConnection } = useConnectionStatus();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', address: '' });
  const [isDriverAvailable, setIsDriverAvailable] = useState(true);
  const [showDriverRegistration, setShowDriverRegistration] = useState(false);
  const [hasDriverProfile, setHasDriverProfile] = useState(false);
  const [driverProfile, setDriverProfile] = useState<any>(null);

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
      const profile = await driverUtils.getDriverProfile(user.uid);
      setHasDriverProfile(!!profile);
      setDriverProfile(profile);
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
        setIsDriverAvailable(userProfile.isDriverAvailable || true);
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
        setIsDriverAvailable(userProfile.isDriverAvailable || true);
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
      setIsDriverAvailable(true);
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
      <View style={styles.topSpacing} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.name}>
              {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : user?.displayName || 'User'}
            </Text>
            <Image
              source={{ uri: "https://i.pravatar.cc/150?img=1" }}
              style={styles.profileImage}
            />
          </View>
        </View>

        {/* Quick Access Buttons */}
        <View style={styles.quickAccessContainer}>
          <TouchableOpacity style={styles.quickAccessButton}>
            <Ionicons name="help-circle-outline" size={24} color={Theme.colors.text.primary} />
            <Text style={styles.quickAccessText}>Help</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAccessButton}>
            <Ionicons name="car-outline" size={24} color={Theme.colors.text.primary} />
            <Text style={styles.quickAccessText}>Trips</Text>
          </TouchableOpacity>
        </View>

        {/* Saved Addresses */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={22} color={Theme.colors.text.primary} />
            <Text style={styles.rowText}>Saved Addresses</Text>
          </View>
          
          {savedAddresses.length === 0 ? (
            <View style={styles.emptyAddresses}>
              <Text style={styles.emptyAddressText}>No saved addresses</Text>
              <Text style={styles.emptyAddressSubtext}>Add an address to make booking easier</Text>
            </View>
          ) : (
            savedAddresses.map((address, index) => (
              <View key={address.id} style={[
                styles.addressItem,
                index === savedAddresses.length - 1 && styles.lastAddressItem
              ]}>
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
                      <Ionicons name="star-outline" size={16} color={Theme.colors.status.warning} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => deleteAddress(address.id)}
                    style={styles.addressActionButton}
                  >
                    <Ionicons name="trash-outline" size={16} color={Theme.colors.status.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          
          <TouchableOpacity
            style={styles.addAddressButton}
            onPress={() => setShowAddressModal(true)}
          >
            <Ionicons name="add-outline" size={20} color={Theme.colors.primary[500]} />
            <Text style={styles.addAddressText}>Add Address</Text>
          </TouchableOpacity>
        </View>

        {/* Driver Seats Adjustment (only when user has driver profile and is in driver mode) */}
        {hasDriverProfile && driverProfile && userProfile?.lastActiveAs === 'driver' && (
          <DriverSeatsAdjustment
            driverProfile={driverProfile}
            onSeatsUpdated={() => {
              checkDriverProfile(); // Refresh driver profile data
              loadDriverAvailability(); // Refresh availability status
            }}
          />
        )}

        {/* Driver Availability Toggle (only when in driver mode) */}
        {/* {(userProfile?.lastActiveAs === 'driver') && (
          <View style={styles.card}>
            <View style={styles.availabilityRow}>
              <View style={styles.availabilityInfo}>
                <Ionicons name="car-outline" size={22} color={Theme.colors.text.primary} />
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
        )} */}

        {/* Switch Role Button */}
        <View style={styles.menuContainer}>
          {userProfile?.lastActiveAs === 'rider' ? (
            <TouchableOpacity style={styles.menuItem} onPress={handleSwitchToDriver}>
              <Ionicons name="car-outline" size={20} color={Theme.colors.text.primary} />
              <Text style={styles.menuText}>Switch to Driver</Text>
              <Ionicons name="chevron-forward-outline" size={16} color={Theme.colors.text.tertiary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.menuItem} onPress={handleSwitchToRider}>
              <Ionicons name="person-outline" size={20} color={Theme.colors.text.primary} />
              <Text style={styles.menuText}>Switch to Rider</Text>
              <Ionicons name="chevron-forward-outline" size={16} color={Theme.colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="mail-outline" size={20} color={Theme.colors.text.primary} />
            <Text style={styles.menuText}>Messages</Text>
            <Ionicons name="chevron-forward-outline" size={16} color={Theme.colors.text.tertiary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={20} color={Theme.colors.text.primary} />
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward-outline" size={16} color={Theme.colors.text.tertiary} />
          </TouchableOpacity>
          
          {/* Only show Legal for drivers */}
          {userProfile?.lastActiveAs === 'driver' && (
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="document-text-outline" size={20} color={Theme.colors.text.primary} />
              <Text style={styles.menuText}>Legal</Text>
              <Ionicons name="chevron-forward-outline" size={16} color={Theme.colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutCard} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          {/* <Text style={styles.versionText}>v2.128.10002</Text> */}
        </View>
      </ScrollView>

      {/* Add Address Modal */}
      <AddAddressModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSuccess={() => {
          setShowAddressModal(false);
          loadSavedAddresses();
        }}
        isForDriver={false}
      />

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
    backgroundColor: Theme.colors.dark.background,
  },
  topSpacing: {
    height: Theme.spacing['2xl'],
  },
  header: {
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing['4xl'],
    paddingBottom: Theme.spacing.xl,
  },
  greeting: {
    fontSize: Theme.typography.fontSize['lg'],
    color: Theme.colors.text.primary,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: Theme.typography.fontSize['2xl'],
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    flex: 1,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  profileImage: {
    width: 65,
    height: 65,
    borderRadius: 12,
  },
  quickAccessContainer: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.xl,
    marginBottom: Theme.spacing.xs,
    gap: Theme.spacing.md,
  },
  quickAccessButton: {
    flex: 1,
    backgroundColor: Theme.colors.dark.surfaceVariant,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  quickAccessText: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
    marginTop: Theme.spacing.xs,
  },
  menuContainer: {
    backgroundColor: Theme.colors.dark.surfaceVariant,
    marginHorizontal: Theme.spacing.xl,
    marginVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.dark.borderLight,
  },
  menuText: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.md,
    flex: 1,
  },
  card: {
    ...Theme.frostedGlassCard,
    marginHorizontal: Theme.spacing.xl,
    marginVertical: Theme.spacing.sm,
    paddingVertical: Theme.spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
  },
  rowText: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.md,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  signOutCard: {
    backgroundColor: Theme.colors.dark.surfaceVariant,
    marginHorizontal: Theme.spacing.xl,
    marginVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.xl,
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    ...Theme.shadows.md,
  },
  signOutText: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.status.error,
    marginLeft: Theme.spacing.md,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  footer: {
    alignItems: "center",
    paddingVertical: Theme.spacing['4xl'],
  },
  versionText: {
    color: Theme.colors.text.tertiary,
    fontSize: Theme.typography.fontSize.sm,
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
    borderBottomColor: Theme.colors.dark.border,
  },
  emptyAddresses: {
    padding: Theme.spacing['2xl'],
    alignItems: "center",
  },
  emptyAddressText: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  emptyAddressSubtext: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    textAlign: "center",
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.dark.border,
  },
  lastAddressItem: {
    borderBottomWidth: 0,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  defaultBadge: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.status.success,
    fontWeight: Theme.typography.fontWeight.semiBold,
  },
  addressText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    lineHeight: Theme.typography.lineHeight.normal * Theme.typography.fontSize.sm,
  },
  addressActions: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
  },
  addressActionButton: {
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.dark.surfaceVariant,
  },
  addAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    marginHorizontal: Theme.spacing.lg,
    marginVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.dark.surfaceVariant,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.primary[500],
  },
  addAddressText: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.primary[500],
    marginLeft: Theme.spacing.sm,
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