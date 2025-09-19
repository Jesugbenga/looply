import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRefresh } from '@/contexts/RefreshContext';
import { userUtils, rideUtils, rideMatchingService, SavedAddress } from '@/lib/firebaseUtils';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { Theme } from '@/constants/Theme';

// SavedAddress interface is now imported from firebaseUtils

interface RideRequest {
  event: string;
  passengers: number;
  address: string;
  pickupRequired: boolean;
  dropoffRequired: boolean;
  additionalDetails: string;
}

interface RideBookingModalProps {
  visible: boolean;
  onClose: () => void;
}

const EVENTS = [
  'Rhema Chapel Sunday Service at 9 am',
  'Rhema Glow Sunday Service at 12 pm',
  'Midweek Service',
];

export default function RideBookingModal({ visible, onClose }: RideBookingModalProps) {
  const { user, userProfile } = useAuth();
  const { triggerRefresh } = useRefresh();
  const { isOnline, retryConnection } = useConnectionStatus();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [rideRequest, setRideRequest] = useState<RideRequest>({
    event: '',
    passengers: 1,
    address: '',
    pickupRequired: true,
    dropoffRequired: true,
    additionalDetails: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && visible) {
      loadSavedAddresses();
    }
  }, [user, visible]);

  const loadSavedAddresses = async () => {
    if (!user) return;
    
    try {
      const userProfile = await userUtils.getUserProfile(user.uid);
      if (userProfile) {
        const addresses = userProfile.savedAddresses || [];
        setSavedAddresses(addresses);
        
        // Set default address if available
        const defaultAddress = addresses.find((addr: SavedAddress) => addr.isDefault);
        if (defaultAddress) {
          setRideRequest(prev => ({ ...prev, address: defaultAddress.address }));
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const handleEventSelect = (event: string) => {
    setRideRequest(prev => ({ ...prev, event }));
  };

  const handleAddressSelect = (address: string) => {
    setRideRequest(prev => ({ ...prev, address }));
  };

  const handlePassengerChange = (change: number) => {
    const newCount = Math.max(1, Math.min(8, rideRequest.passengers + change));
    setRideRequest(prev => ({ ...prev, passengers: newCount }));
  };

  const handleRequestRide = async () => {
    if (!user || !userProfile) return;

    // Validation
    if (!rideRequest.event) {
      Alert.alert('Error', 'Please select an event');
      return;
    }
    if (savedAddresses.length === 0) {
      Alert.alert(
        'No Saved Addresses',
        'You need to save an address in your profile before booking a ride. Please go to your Profile tab and add a saved address.',
        [
          { text: 'OK' },
          { text: 'Go to Profile', onPress: () => onClose() }
        ]
      );
      return;
    }
    if (!rideRequest.address.trim()) {
      Alert.alert('Error', 'Please select an address from your saved addresses');
      return;
    }
    if (!rideRequest.pickupRequired && !rideRequest.dropoffRequired) {
      Alert.alert('Error', 'Please select at least one service (pickup or dropoff)');
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

    setLoading(true);
    try {
      // Use the new matching service instead of just creating a ride
      const result = await rideMatchingService.bookRide(
        user.uid,
        `${userProfile.firstName} ${userProfile.lastName}`,
        rideRequest.event,
        rideRequest.passengers,
        rideRequest.address.trim(),
        rideRequest.pickupRequired,
        rideRequest.dropoffRequired,
        rideRequest.additionalDetails.trim()
      );
      
      // Reset form first
      setRideRequest({
        event: '',
        passengers: 1,
        address: savedAddresses.find(addr => addr.isDefault)?.address || '',
        pickupRequired: true,
        dropoffRequired: true,
        additionalDetails: '',
      });
      
      // Close modal
      onClose();
      
      // Show success message based on matching result
      if (result.status === 'matched') {
        Alert.alert(
          'Ride Matched!',
          'Great! We found a driver for your ride. Check your activity for details.',
          [{ text: 'OK' }]
        );
      } else if (result.status === 'no_match') {
        Alert.alert(
          'No Drivers Available',
          'Sorry, we couldn\'t find any available drivers in your area right now. Please try again later.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Ride Requested!',
          'We\'re looking for a driver for your ride. You\'ll be notified when we find one.',
          [{ text: 'OK' }]
        );
      }

      // Trigger refresh of activity screen
      triggerRefresh();
    } catch (error: any) {
      console.error('Error requesting ride:', error);
      Alert.alert('Error', error.message || 'Failed to request ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.modalCloseButton}
          >
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Book a Ride</Text>
          <View style={styles.modalPlaceholder} />
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Offline Warning */}
          {!isOnline && (
            <View style={styles.offlineWarning}>
              <Ionicons name="wifi-outline" size={20} color="#EF4444" />
              <Text style={styles.offlineText}>You're offline. Please check your connection.</Text>
            </View>
          )}

          {/* Event Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Select Event *</Text>
            {EVENTS.map((event) => (
              <TouchableOpacity
                key={event}
                style={[
                  styles.eventOption,
                  rideRequest.event === event && styles.eventOptionSelected,
                ]}
                onPress={() => handleEventSelect(event)}
              >
                <View style={styles.eventOptionContent}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={rideRequest.event === event ? '#3B82F6' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.eventOptionText,
                      rideRequest.event === event && styles.eventOptionTextSelected,
                    ]}
                  >
                    {event}
                  </Text>
                </View>
                {rideRequest.event === event && (
                  <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Address Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address *</Text>
            {savedAddresses.length > 0 ? (
              <View style={styles.savedAddressesContainer}>
                <Text style={styles.savedAddressesTitle}>Select from Saved Addresses</Text>
                {savedAddresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    style={[
                      styles.savedAddressOption,
                      rideRequest.address === address.address && styles.savedAddressOptionSelected,
                    ]}
                    onPress={() => handleAddressSelect(address.address)}
                  >
                    <View style={styles.savedAddressContent}>
                      <Text style={styles.savedAddressLabel}>{address.label}</Text>
                      <Text style={styles.savedAddressText}>{address.address}</Text>
                    </View>
                    {rideRequest.address === address.address && (
                      <Ionicons name="checkmark-circle" size={20} color={Theme.colors.primary[500]} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noAddressesContainer}>
                <Ionicons name="location-outline" size={48} color={Theme.colors.text.tertiary} />
                <Text style={styles.noAddressesTitle}>No Saved Addresses</Text>
                <Text style={styles.noAddressesText}>
                  You need to save an address in your profile before booking a ride.
                </Text>
                <Text style={styles.noAddressesSubtext}>
                  Go to your Profile tab and add a saved address to continue.
                </Text>
              </View>
            )}
          </View>

          {/* Passenger Count */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Number of Passengers</Text>
            <View style={styles.passengerCounter}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => handlePassengerChange(-1)}
              >
                <Ionicons name="remove" size={20} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.counterText}>{rideRequest.passengers}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => handlePassengerChange(1)}
              >
                <Ionicons name="add" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Service Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Services Needed *</Text>
            <TouchableOpacity
              style={[
                styles.serviceOption,
                rideRequest.pickupRequired && styles.serviceOptionSelected,
              ]}
              onPress={() => setRideRequest(prev => ({ ...prev, pickupRequired: !prev.pickupRequired }))}
            >
              <View style={styles.serviceOptionContent}>
                <Ionicons
                  name="arrow-up-circle-outline"
                  size={20}
                  color={rideRequest.pickupRequired ? '#10B981' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.serviceOptionText,
                    rideRequest.pickupRequired && styles.serviceOptionTextSelected,
                  ]}
                >
                  Pickup Required
                </Text>
              </View>
              <View style={[
                styles.checkbox,
                rideRequest.pickupRequired && styles.checkboxSelected,
              ]}>
                {rideRequest.pickupRequired && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.serviceOption,
                rideRequest.dropoffRequired && styles.serviceOptionSelected,
              ]}
              onPress={() => setRideRequest(prev => ({ ...prev, dropoffRequired: !prev.dropoffRequired }))}
            >
              <View style={styles.serviceOptionContent}>
                <Ionicons
                  name="arrow-down-circle-outline"
                  size={20}
                  color={rideRequest.dropoffRequired ? '#3B82F6' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.serviceOptionText,
                    rideRequest.dropoffRequired && styles.serviceOptionTextSelected,
                  ]}
                >
                  Dropoff Required
                </Text>
              </View>
              <View style={[
                styles.checkbox,
                rideRequest.dropoffRequired && styles.checkboxSelected,
              ]}>
                {rideRequest.dropoffRequired && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Additional Details */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Additional Details (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Any special instructions or details..."
              value={rideRequest.additionalDetails}
              onChangeText={(text) => setRideRequest(prev => ({ ...prev, additionalDetails: text }))}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.requestButton, 
              (loading || savedAddresses.length === 0) && styles.requestButtonDisabled
            ]}
            onPress={handleRequestRide}
            disabled={loading || savedAddresses.length === 0}
          >
            <Text style={styles.requestButtonText}>
              {loading ? 'Requesting...' : savedAddresses.length === 0 ? 'Add Address First' : 'Request Ride'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Theme.colors.dark.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.dark.border,
  },
  modalCloseButton: {
    padding: Theme.spacing.xs,
  },
  modalTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
  },
  modalPlaceholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Theme.spacing.xl,
  },
  inputGroup: {
    marginTop: Theme.spacing.xl,
  },
  inputLabel: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  eventOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
    backgroundColor: Theme.colors.dark.surfaceVariant,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.dark.border,
  },
  eventOptionSelected: {
    backgroundColor: Theme.colors.dark.surfaceElevated,
    borderColor: Theme.colors.primary[500],
  },
  eventOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventOptionText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.sm,
  },
  eventOptionTextSelected: {
    color: Theme.colors.primary[500],
    fontWeight: Theme.typography.fontWeight.medium,
  },
  savedAddressesContainer: {
    marginBottom: Theme.spacing.md,
  },
  savedAddressesTitle: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.sm,
  },
  savedAddressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
    backgroundColor: Theme.colors.dark.surfaceVariant,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.dark.border,
  },
  savedAddressOptionSelected: {
    backgroundColor: Theme.colors.dark.surfaceElevated,
    borderColor: Theme.colors.primary[500],
  },
  savedAddressContent: {
    flex: 1,
  },
  savedAddressLabel: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
  },
  savedAddressText: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Theme.colors.dark.border,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.primary,
    backgroundColor: Theme.colors.dark.surfaceVariant,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  passengerCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.dark.surfaceVariant,
    borderRadius: Theme.borderRadius.lg,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.lg,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Theme.colors.dark.border,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
    marginHorizontal: Theme.spacing.lg,
    minWidth: 24,
    textAlign: 'center',
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
    backgroundColor: Theme.colors.dark.surfaceVariant,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.dark.border,
  },
  serviceOptionSelected: {
    backgroundColor: Theme.colors.dark.surfaceElevated,
    borderColor: Theme.colors.primary[500],
  },
  serviceOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceOptionText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.sm,
  },
  serviceOptionTextSelected: {
    color: Theme.colors.primary[500],
    fontWeight: Theme.typography.fontWeight.medium,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: Theme.colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Theme.colors.primary[500],
    borderColor: Theme.colors.primary[500],
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.dark.border,
    gap: Theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.dark.border,
    alignItems: 'center',
    backgroundColor: Theme.colors.dark.surfaceVariant,
  },
  cancelButtonText: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.secondary,
  },
  requestButton: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.primary[500],
    alignItems: 'center',
  },
  requestButtonDisabled: {
    backgroundColor: Theme.colors.text.disabled,
  },
  requestButtonText: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
  },
  // Offline warning styles
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.dark.surfaceVariant,
    borderColor: Theme.colors.status.error,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  offlineText: {
    flex: 1,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.status.error,
    marginLeft: Theme.spacing.sm,
  },
  // No addresses styles
  noAddressesContainer: {
    alignItems: 'center',
    paddingVertical: Theme.spacing['2xl'],
    paddingHorizontal: Theme.spacing.lg,
    backgroundColor: Theme.colors.dark.surfaceVariant,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.dark.border,
  },
  noAddressesTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  noAddressesText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: Theme.typography.lineHeight.relaxed * Theme.typography.fontSize.base,
    marginBottom: Theme.spacing.sm,
  },
  noAddressesSubtext: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: Theme.typography.lineHeight.normal * Theme.typography.fontSize.sm,
  },
});
