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
import { userUtils, geocodingService } from '@/lib/firebaseUtils';
import { useAuth } from '@/contexts/AuthContext';
import { Theme } from '@/constants/Theme';

interface AddAddressModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isForDriver?: boolean;
}

export default function AddAddressModal({ visible, onClose, onSuccess, isForDriver = false }: AddAddressModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    apartment: '',
    street: '',
    city: '',
    province: '',
    postalCode: '',
    isDefault: false,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const requiredFields = ['label', 'street', 'city', 'province'];
    
    for (const field of requiredFields) {
      const value = formData[field as keyof typeof formData];
      if (typeof value === 'string' && !value.trim()) {
        Alert.alert('Validation Error', `Please fill in ${field}`);
        return false;
      }
    }

    return true;
  };

  const buildAddressString = () => {
    const parts = [];
    
    if (formData.apartment.trim()) {
      parts.push(`Apt ${formData.apartment.trim()}`);
    }
    
    parts.push(formData.street.trim());
    parts.push(formData.city.trim());
    parts.push(formData.province.trim());
    
    if (formData.postalCode.trim()) {
      parts.push(formData.postalCode.trim());
    }
    
    return parts.join(', ');
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!validateForm()) return;

    try {
      setLoading(true);

      const addressString = buildAddressString();
      console.log('📍 Built address string:', addressString);

      // Geocode the address
      const coordinates = await geocodingService.geocodeAddress(addressString);
      
      if (!coordinates) {
        Alert.alert('Error', 'Could not find coordinates for this address. Please check the address and try again.');
        return;
      }

      // Save the address
      await userUtils.saveAddress(user.uid, {
        label: formData.label.trim(),
        address: addressString,
        coordinates,
        isDefault: formData.isDefault,
      });

      Alert.alert(
        'Address Saved! 🎉',
        'Your address has been saved and geocoded successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess();
              onClose();
              // Reset form
              setFormData({
                label: '',
                apartment: '',
                street: '',
                city: '',
                province: '',
                postalCode: '',
                isDefault: false,
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Address save error:', error);
      Alert.alert('Error', 'Failed to save address. Please try again.');
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
            <Ionicons name="close" size={24} color={Theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {isForDriver ? 'Add Driver Location' : 'Add Address'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>
            {isForDriver 
              ? 'Set your current location for ride matching'
              : 'Add a new address for ride requests'
            }
          </Text>

          {/* Address Label */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address Label *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Home, Work, Current Location"
              value={formData.label}
              onChangeText={(text) => handleInputChange('label', text)}
            />
          </View>

          {/* Apartment Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Apartment/Unit Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 101, Unit 2A"
              value={formData.apartment}
              onChangeText={(text) => handleInputChange('apartment', text)}
            />
          </View>

          {/* Street Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 123 Main Street"
              value={formData.street}
              onChangeText={(text) => handleInputChange('street', text)}
            />
          </View>

          {/* City and Province Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Toronto"
                value={formData.city}
                onChangeText={(text) => handleInputChange('city', text)}
              />
            </View>
            
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Province/State *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., ON"
                value={formData.province}
                onChangeText={(text) => handleInputChange('province', text)}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Postal Code */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Postal Code</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., M5V 3A8"
              value={formData.postalCode}
              onChangeText={(text) => handleInputChange('postalCode', text)}
              autoCapitalize="characters"
            />
          </View>

          {/* Default Address Toggle */}
          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => handleInputChange('isDefault', !formData.isDefault)}
            >
              <View style={[styles.checkbox, formData.isDefault && styles.checkboxChecked]}>
                {formData.isDefault && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>Set as default address</Text>
            </TouchableOpacity>
          </View>

          {/* Address Preview */}
          {formData.street && formData.city && formData.province && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Address Preview:</Text>
              <Text style={styles.previewText}>{buildAddressString()}</Text>
            </View>
          )}
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
              {loading ? 'Saving...' : 'Save Address'}
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
    fontWeight: Theme.typography.fontWeight.semiBold,
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
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    marginVertical: Theme.spacing.xl,
    lineHeight: Theme.typography.lineHeight.relaxed * Theme.typography.fontSize.base,
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
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.dark.border,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.primary,
    backgroundColor: Theme.colors.dark.surfaceVariant,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Theme.colors.dark.border,
    borderRadius: Theme.borderRadius.sm,
    marginRight: Theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Theme.colors.primary[500],
    borderColor: Theme.colors.primary[500],
  },
  checkboxLabel: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.primary,
  },
  previewContainer: {
    backgroundColor: Theme.colors.dark.surfaceVariant,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    marginTop: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.dark.border,
  },
  previewLabel: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  previewText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    lineHeight: Theme.typography.lineHeight.normal * Theme.typography.fontSize.sm,
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
  submitButton: {
    flex: 2,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.primary[500],
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Theme.colors.text.disabled,
  },
  submitButtonText: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
  },
});
