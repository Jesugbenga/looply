import React, { useState } from 'react';
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
import { driverUtils, DriverProfile } from '@/lib/firebaseUtils';
import { useAuth } from '@/contexts/AuthContext';

interface DriverRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DriverRegistrationModal({ visible, onClose, onSuccess }: DriverRegistrationModalProps) {
  const { user, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
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
            <Ionicons name="close" size={24} color="#374151" />
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
                value={formData.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* License Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>License Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>License Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your license number"
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
                  value={formData.vehicleMake}
                  onChangeText={(text) => handleInputChange('vehicleMake', text)}
                />
              </View>
              
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Model *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Camry"
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
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
    marginRight: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  vehicleTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  vehicleTypeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  vehicleTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  vehicleTypeTextActive: {
    color: '#FFFFFF',
  },
  footer: {
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
  submitButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
