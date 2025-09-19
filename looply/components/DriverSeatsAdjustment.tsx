import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { driverUtils, DriverProfile } from '@/lib/firebaseUtils';
import { useAuth } from '@/contexts/AuthContext';
import { Theme } from '@/constants/Theme';

interface DriverSeatsAdjustmentProps {
  driverProfile: DriverProfile | null;
  onSeatsUpdated: () => void;
}

export default function DriverSeatsAdjustment({ driverProfile, onSeatsUpdated }: DriverSeatsAdjustmentProps) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [availableSeats, setAvailableSeats] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (driverProfile) {
      setAvailableSeats(driverProfile.availableSeats?.toString() || '0');
    }
  }, [driverProfile]);

  const handleSave = async () => {
    if (!user || !driverProfile) return;

    const newSeats = parseInt(availableSeats);
    
    if (isNaN(newSeats) || newSeats < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of seats');
      return;
    }

    if (newSeats > driverProfile.seats) {
      Alert.alert('Invalid Input', `Available seats cannot exceed total seats (${driverProfile.seats})`);
      return;
    }

    try {
      setLoading(true);
      
      // Update available seats in the backend
      await driverUtils.updateDriverSeats(driverProfile.id, driverProfile.availableSeats - newSeats);
      
      // Update isAvailable based on seats
      const isStillAvailable = newSeats > 0;
      await driverUtils.updateDriverAvailability(driverProfile.id, isStillAvailable);
      
      Alert.alert('Success', 'Available seats updated successfully!');
      setEditing(false);
      onSeatsUpdated();
    } catch (error) {
      console.error('Error updating seats:', error);
      Alert.alert('Error', 'Failed to update available seats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setAvailableSeats(driverProfile?.availableSeats?.toString() || '0');
    setEditing(false);
  };

  if (!driverProfile) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="people-outline" size={22} color={Theme.colors.text.primary} />
          <Text style={styles.title}>Available Seats</Text>
        </View>
        
        {!editing ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditing(true)}
          >
            <Ionicons name="pencil" size={16} color={Theme.colors.primary[500]} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.seatsInfo}>
          <Text style={styles.label}>Total Seats</Text>
          <Text style={styles.value}>{driverProfile.seats}</Text>
        </View>
        
        <View style={styles.seatsInfo}>
          <Text style={styles.label}>Available Seats</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={availableSeats}
              onChangeText={setAvailableSeats}
              keyboardType="numeric"
              maxLength={2}
              autoFocus
              placeholderTextColor={Theme.colors.text.tertiary}
            />
          ) : (
            <Text style={styles.value}>{driverProfile.availableSeats || 0}</Text>
          )}
        </View>

        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <Ionicons 
              name={driverProfile.isAvailable ? "checkmark-circle" : "checkmark-circle"} 
              size={16} 
              color={driverProfile.isAvailable ? Theme.colors.status.success : Theme.colors.status.success} 
            />
            <Text style={[
              styles.statusText,
              { color: driverProfile.isAvailable ? Theme.colors.status.success : Theme.colors.status.success }
            ]}>
              {driverProfile.isAvailable ? 'Available for rides' : 'Available for rides '}
            </Text>
          </View>
          
          {/* {!driverProfile.isAvailable && (
            <Text style={styles.statusSubtext}>
              You'll be available again when you have seats
            </Text>
          )} */}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...Theme.frostedGlassCard,
    marginHorizontal: Theme.spacing.xl,
    marginVertical: Theme.spacing.sm,
    paddingVertical: Theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.dark.border,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.dark.surfaceVariant,
  },
  editButtonText: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.primary[500],
    marginLeft: Theme.spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  cancelButton: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.dark.border,
  },
  cancelButtonText: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.secondary,
  },
  saveButton: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.primary[500],
  },
  saveButtonDisabled: {
    backgroundColor: Theme.colors.text.disabled,
  },
  saveButtonText: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
  },
  content: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
  },
  seatsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.dark.borderLight,
  },
  label: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  value: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.dark.border,
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
    textAlign: 'center',
    minWidth: 50,
    backgroundColor: Theme.colors.dark.surfaceVariant,
  },
  statusContainer: {
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.medium,
    marginLeft: Theme.spacing.sm,
  },
  statusSubtext: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.text.tertiary,
    marginTop: Theme.spacing.xs,
    marginLeft: 22,
  },
});
