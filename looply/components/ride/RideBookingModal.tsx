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
import { userUtils, rideUtils, SavedAddress } from '@/lib/firebaseUtils';
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
    if (!rideRequest.address.trim()) {
      Alert.alert('Error', 'Please enter your address');
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
      const rideData = {
        riderId: user.uid,
        riderName: `${userProfile.firstName} ${userProfile.lastName}`,
        event: rideRequest.event,
        passengers: rideRequest.passengers,
        address: rideRequest.address.trim(),
        pickupRequired: rideRequest.pickupRequired,
        dropoffRequired: rideRequest.dropoffRequired,
        additionalDetails: rideRequest.additionalDetails.trim(),
        status: 'pending' as const,
      };

      await rideUtils.createRideRequest(rideData);
      
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
      
      // Show success message
      Alert.alert(
        'Ride Requested!',
        'We\'ll notify you when we find a driver for this event.',
        [{ text: 'OK' }]
      );

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
            {savedAddresses.length > 0 && (
              <View style={styles.savedAddressesContainer}>
                <Text style={styles.savedAddressesTitle}>Saved Addresses</Text>
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
                      <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            <TextInput
              style={styles.textInput}
              placeholder="Enter your address"
              value={rideRequest.address}
              onChangeText={(text) => setRideRequest(prev => ({ ...prev, address: text }))}
              multiline
              numberOfLines={2}
            />
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
            style={[styles.requestButton, loading && styles.requestButtonDisabled]}
            onPress={handleRequestRide}
            disabled={loading}
          >
            <Text style={styles.requestButtonText}>
              {loading ? 'Requesting...' : 'Request Ride'}
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
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
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
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  eventOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  eventOptionSelected: {
    backgroundColor: '#EBF8FF',
    borderColor: '#3B82F6',
  },
  eventOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventOptionText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  eventOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  savedAddressesContainer: {
    marginBottom: 12,
  },
  savedAddressesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  savedAddressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  savedAddressOptionSelected: {
    backgroundColor: '#EBF8FF',
    borderColor: '#3B82F6',
  },
  savedAddressContent: {
    flex: 1,
  },
  savedAddressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  savedAddressText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  passengerCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceOptionSelected: {
    backgroundColor: '#EBF8FF',
    borderColor: '#3B82F6',
  },
  serviceOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceOptionText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  serviceOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  requestButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  requestButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  requestButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
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
    marginBottom: 16,
  },
  offlineText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 8,
  },
});
