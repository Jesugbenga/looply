import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from '@/contexts/AuthContext';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { rideUtils, Ride } from '@/lib/firebaseUtils';
import RideBookingModal from './RideBookingModal';

interface RiderHomeProps {}

export default function RiderHome({}: RiderHomeProps) {
  const { user, userProfile } = useAuth();
  const { isOnline } = useConnectionStatus();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);

  useEffect(() => {
    if (user) {
      // Subscribe to user's rides for real-time updates
      const unsubscribe = rideUtils.subscribeToUserRides(
        user.uid,
        'rider',
        (rides) => {
          // Find the most recent active ride
          const active = rides.find(ride => 
            ride.status === 'pending' || 
            ride.status === 'matched' || 
            ride.status === 'in-progress'
          );
          setActiveRide(active || null);
          
          // Show notifications for status changes
          if (active) {
            if (active.status === 'matched') {
              Alert.alert(
                'Ride Accepted! 🎉',
                `Your ride has been accepted by ${active.driverName}. They will contact you soon.`,
                [{ text: 'OK' }]
              );
            } else if (active.status === 'cancelled') {
              Alert.alert(
                'Ride Declined',
                'Unfortunately, your ride request was declined. Please try again.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      );

      return () => unsubscribe();
    }
  }, [user]);

  const handleCancelRide = async (ride: Ride) => {
    if (!user) return;

    // Check if ride can be cancelled
    if (ride.status === 'in-progress' || ride.status === 'completed') {
      Alert.alert(
        'Cannot Cancel Ride',
        'This ride cannot be cancelled as it is already in progress or completed.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await rideUtils.cancelRide(ride.id);
              Alert.alert('Success', 'Ride request cancelled');
            } catch (error) {
              console.error('Error cancelling ride:', error);
              Alert.alert('Error', 'Failed to cancel ride request');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.username}>
              {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : user?.email}
            </Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* Active Ride Status */}
        {activeRide && (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons 
                name={activeRide.status === 'matched' ? 'checkmark-circle' : 'time-outline'} 
                size={24} 
                color={activeRide.status === 'matched' ? '#10B981' : '#F59E0B'} 
              />
              <Text style={styles.statusTitle}>
                {activeRide.status === 'pending' && 'Waiting for Driver'}
                {activeRide.status === 'matched' && 'Ride Accepted!'}
                {activeRide.status === 'in-progress' && 'Ride in Progress'}
              </Text>
            </View>
            <Text style={styles.statusText}>
              {activeRide.status === 'pending' && 'Your ride request is being reviewed by drivers.'}
              {activeRide.status === 'matched' && `Driver: ${activeRide.driverName} will contact you soon.`}
              {activeRide.status === 'in-progress' && 'Your driver is on the way!'}
            </Text>
            {activeRide.verificationPin && (
              <Text style={styles.driverPhone}>Your verification PIN: {activeRide.verificationPin}</Text>
            )}
            {activeRide.driverPhone && (
              <Text style={styles.driverPhone}>Driver Phone: {activeRide.driverPhone}</Text>
            )}
            
            {/* Cancel Button - only show if ride can be cancelled */}
            {(activeRide.status === 'pending' || activeRide.status === 'matched') && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelRide(activeRide)}
              >
                <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                <Text style={styles.cancelButtonText}>Cancel Ride</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick Book Ride Button (disabled when driver available) */}
        <TouchableOpacity
          style={[
            styles.bookRideButton,
            (activeRide || userProfile?.lastActiveAs === 'driver' && userProfile?.isDriverAvailable) && styles.bookRideButtonDisabled
          ]}
          onPress={() => !activeRide && !(userProfile?.lastActiveAs === 'driver' && userProfile?.isDriverAvailable) && setShowBookingModal(true)}
          disabled={!!activeRide || (userProfile?.lastActiveAs === 'driver' && userProfile?.isDriverAvailable)}
        >
          <View style={styles.bookRideContent}>
            <Ionicons name="car-outline" size={24} color="#FFFFFF" />
            <Text style={styles.bookRideText}>
              {activeRide ? 'Ride in Progress' : 'Book a Ride'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#EBF8FF' }]}>
                <Ionicons name="time-outline" size={24} color="#2563EB" />
              </View>
              <Text style={styles.quickActionText}>My Rides</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="location-outline" size={24} color="#10B981" />
              </View>
              <Text style={styles.quickActionText}>Saved Places</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="calendar-outline" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.quickActionText}>Events</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Ride Booking Modal */}
        <RideBookingModal
          visible={showBookingModal}
          onClose={() => setShowBookingModal(false)}
        />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  notificationButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bookRideButton: {
    backgroundColor: '#3B82F6',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bookRideContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookRideText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  // Status card styles
  statusCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  driverPhone: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
    marginLeft: 6,
  },
  bookRideButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
});
