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
import { driverUtils, DriverProfile, userUtils } from '@/lib/firebaseUtils';
import { useAuth } from '@/contexts/AuthContext';
import AddAddressModal from './AddAddressModal';
import { Theme } from '@/constants/Theme';

interface DriverRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DriverRegistrationModal({ visible, onClose, onSuccess }: DriverRegistrationModalProps) {
  const { user, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [hasAddress, setHasAddress] = useState(false);
  const [formData, setFormData] = useState({
    licenseNumber: '',
    licenseExpiry: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    licensePlate: '',
    vehicleType: 'sedan' as 'sedan' | 'suv' | 'hatchback' | 'luxury',
    seats: '4',
    phone: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Check if user has saved addresses when modal opens
  useEffect(() => {
    if (visible && user) {
      checkUserAddresses();
    }
  }, [visible, user]);

  const checkUserAddresses = async () => {
    if (!user) return;
    
    try {
      const userProfile = await userUtils.getUserProfile(user.uid);
      const hasSavedAddresses = userProfile?.savedAddresses && userProfile.savedAddresses.length > 0;
      setHasAddress(!!hasSavedAddresses);
    } catch (error) {
      console.error('Error checking user addresses:', error);
      setHasAddress(false);
    }
  };

  const validateForm = () => {
    const requiredFields = [
      'licenseNumber', 'licenseExpiry', 'vehicleMake', 'vehicleModel',
      'vehicleYear', 'vehicleColor', 'licensePlate', 'phone'
    ];
    
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData].trim()) {
        Alert.alert('Validation Error', `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    // Validate license expiry date
    const expiryDate = new Date(formData.licenseExpiry);
    if (expiryDate <= new Date()) {
      Alert.alert('Validation Error', 'License expiry date must be in the future');
      return false;
    }

    // Validate vehicle year
    const currentYear = new Date().getFullYear();
    const vehicleYear = parseInt(formData.vehicleYear);
    if (vehicleYear < 1990 || vehicleYear > currentYear + 1) {
      Alert.alert('Validation Error', 'Please enter a valid vehicle year');
      return false;
    }

    // Validate seats
    const seats = parseInt(formData.seats);
    if (seats < 2 || seats > 8) {
      Alert.alert('Validation Error', 'Vehicle must have between 2-8 seats');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!validateForm()) return;

    try {
      setLoading(true);

      // Create driver profile
      const driverData = {
        licenseNumber: formData.licenseNumber.trim(),
        licenseExpiry: formData.licenseExpiry,
        vehicleMake: formData.vehicleMake.trim(),
        vehicleModel: formData.vehicleModel.trim(),
        vehicleYear: parseInt(formData.vehicleYear),
        vehicleColor: formData.vehicleColor.trim(),
        licensePlate: formData.licensePlate.trim().toUpperCase(),
        vehicleType: formData.vehicleType,
        seats: parseInt(formData.seats),
        availableSeats: parseInt(formData.seats), // Initialize with total seats
        isVerified: false, // Will be verified later by admin
        isAvailable: false,
        totalEarnings: 0,
      };

      await driverUtils.createDriverProfile(user.uid, driverData);

      // Update user profile to include driver type and phone
      await updateUserProfile({
        userType: 'both',
        phone: formData.phone.trim(),
        lastActiveAs: 'driver',
      });

      Alert.alert(
        'Registration Successful! 🎉',
        'Your driver profile has been created. You can now switch to driver mode and start accepting rides.',
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess();
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Driver registration error:', error);
      Alert.alert('Error', 'Failed to create driver profile. Please try again.');
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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Theme.colors.text.secondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Become a Driver</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>
            Complete your driver profile to start accepting ride requests
          </Text>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor={Theme.colors.text.tertiary}
                value={formData.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Driver Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Driver Location</Text>
            <Text style={styles.sectionDescription}>
              Set your current location for ride matching. This will be used to find nearby riders.
            </Text>
            
            {hasAddress ? (
              <View style={styles.addressStatus}>
                <Ionicons name="checkmark-circle" size={20} color={Theme.colors.status.success} />
                <Text style={styles.addressStatusText}>
                  You have saved addresses. Your default address will be used as your driver location.
                </Text>
              </View>
            ) : (
              <View style={styles.addressPrompt}>
                <Ionicons name="location-outline" size={20} color={Theme.colors.text.tertiary} />
                <Text style={styles.addressPromptText}>
                  You need to add an address to set your driver location.
                </Text>
                <TouchableOpacity
                  style={styles.addAddressButton}
                  onPress={() => setShowAddressModal(true)}
                >
                  <Text style={styles.addAddressButtonText}>Add Address</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* License Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>License Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>License Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your license number"
                placeholderTextColor={Theme.colors.text.tertiary}
                value={formData.licenseNumber}
                onChangeText={(text) => handleInputChange('licenseNumber', text)}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>License Expiry Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Theme.colors.text.tertiary}
                value={formData.licenseExpiry}
                onChangeText={(text) => handleInputChange('licenseExpiry', text)}
              />
            </View>
          </View>

          {/* Vehicle Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Make *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Toyota"
                  placeholderTextColor={Theme.colors.text.tertiary}
                  value={formData.vehicleMake}
                  onChangeText={(text) => handleInputChange('vehicleMake', text)}
                />
              </View>
              
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Model *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Camry"
                  placeholderTextColor={Theme.colors.text.tertiary}
                  value={formData.vehicleModel}
                  onChangeText={(text) => handleInputChange('vehicleModel', text)}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Year *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 2020"
                  placeholderTextColor={Theme.colors.text.tertiary}
                  value={formData.vehicleYear}
                  onChangeText={(text) => handleInputChange('vehicleYear', text)}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Color *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., White"
                  placeholderTextColor={Theme.colors.text.tertiary}
                  value={formData.vehicleColor}
                  onChangeText={(text) => handleInputChange('vehicleColor', text)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>License Plate *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., ABC123"
                placeholderTextColor={Theme.colors.text.tertiary}
                value={formData.licensePlate}
                onChangeText={(text) => handleInputChange('licensePlate', text)}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle Type *</Text>
              <View style={styles.vehicleTypeContainer}>
                {(['sedan', 'suv', 'hatchback', 'luxury'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.vehicleTypeButton,
                      formData.vehicleType === type && styles.vehicleTypeButtonActive,
                    ]}
                    onPress={() => handleInputChange('vehicleType', type)}
                  >
                    <Text
                      style={[
                        styles.vehicleTypeText,
                        formData.vehicleType === type && styles.vehicleTypeTextActive,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Number of Seats *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 4"
                value={formData.seats}
                onChangeText={(text) => handleInputChange('seats', text)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Creating Profile...' : 'Complete Registration'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add Address Modal */}
        <AddAddressModal
          visible={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          onSuccess={() => {
            setShowAddressModal(false);
            checkUserAddresses();
          }}
          isForDriver={true}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.dark.border,
  },
  closeButton: {
    padding: Theme.spacing.xs,
  },
  title: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.semiBold,
    color: Theme.colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: Theme.spacing.xl,
  },
  subtitle: {
    fontSize: Theme.typography.fontSize.base,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    marginVertical: Theme.spacing.xl,
    lineHeight: Theme.typography.lineHeight.relaxed * Theme.typography.fontSize.base,
  },
  section: {
    marginBottom: Theme.spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontFamily: Theme.typography.fontFamily.semiBold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.lg,
  },
  sectionDescription: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.lg,
    lineHeight: Theme.typography.lineHeight.normal * Theme.typography.fontSize.sm,
  },
  addressStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.status.success + '20',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.status.success + '40',
  },
  addressStatusText: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.status.success,
    marginLeft: Theme.spacing.sm,
    flex: 1,
  },
  addressPrompt: {
    backgroundColor: Theme.colors.dark.surfaceVariant,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.dark.border,
    alignItems: 'center',
  },
  addressPromptText: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    marginVertical: Theme.spacing.sm,
  },
  addAddressButton: {
    backgroundColor: Theme.colors.primary[500],
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
    marginTop: Theme.spacing.sm,
  },
  addAddressButtonText: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.text.inverse,
  },
  inputGroup: {
    marginBottom: Theme.spacing.lg,
  },
  halfWidth: {
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  label: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.dark.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    fontSize: Theme.typography.fontSize.base,
    fontFamily: Theme.typography.fontFamily.regular,
    color: Theme.colors.text.primary,
    backgroundColor: Theme.colors.dark.surface,
  },
  vehicleTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  vehicleTypeButton: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius['2xl'],
    borderWidth: 1,
    borderColor: Theme.colors.dark.border,
    backgroundColor: Theme.colors.dark.surface,
  },
  vehicleTypeButtonActive: {
    backgroundColor: Theme.colors.primary[500],
    borderColor: Theme.colors.primary[500],
  },
  vehicleTypeText: {
    fontSize: Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.text.primary,
  },
  vehicleTypeTextActive: {
    color: Theme.colors.text.inverse,
  },
  footer: {
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
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.dark.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: Theme.typography.fontSize.base,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.text.primary,
  },
  submitButton: {
    flex: 2,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.primary[500],
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Theme.colors.text.disabled,
  },
  submitButtonText: {
    fontSize: Theme.typography.fontSize.base,
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.text.inverse,
  },
});
