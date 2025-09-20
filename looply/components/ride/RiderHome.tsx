import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { rideUtils, Ride } from '@/lib/firebaseUtils';
import { notificationService } from '@/lib/notificationService';
import RideBookingModal from './RideBookingModal';
import NotificationButton from '../NotificationButton';
import { Theme } from '@/constants/Theme';

interface RiderHomeProps {}

export default function RiderHome({}: RiderHomeProps) {
  const { user, userProfile } = useAuth();
  const { showError, showSuccess, showInfo } = useAlert();
  const { isOnline } = useConnectionStatus();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [previousRides, setPreviousRides] = useState<Ride[]>([]);

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
          
           // Get previous completed rides
           const completed = rides.filter(ride => 
             ride.status === 'completed' || ride.status === 'cancelled'
           ).slice(0, 2); // Show last 2 rides
           setPreviousRides(completed);
          
          // Send notifications for status changes
          if (active && user) {
            if (active.status === 'cancelled') {
              notificationService.sendNotificationToUser(
                user.uid,
                'Ride Declined',
                'Unfortunately, your ride request was declined. Please try again.',
                {
                  type: 'ride_declined',
                  rideId: active.id,
                  action: 'book_again'
                }
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
      showError(
        'Cannot Cancel Ride',
        'This ride cannot be cancelled as it is already in progress or completed.'
      );
      return;
    }

    showError(
      'Cancel Ride',
      'Are you sure you want to cancel this ride request?',
      {
        actionText: 'Yes, Cancel',
        onAction: async () => {
          try {
            await rideUtils.cancelRide(ride.id);
            if (user) {
              await notificationService.sendNotificationToUser(
                user.uid,
                'Ride Cancelled',
                'Your ride request has been cancelled',
                {
                  type: 'system_alert',
                  rideId: ride.id,
                  action: 'book_again'
                }
              );
            }
          } catch (error) {
            console.error('Error cancelling ride:', error);
            if (user) {
              await notificationService.sendNotificationToUser(
                user.uid,
                'Cancel Failed',
                'Failed to cancel ride request',
                {
                  type: 'system_alert',
                  action: 'try_again'
                }
              );
            }
          }
        },
        autoHide: false,
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return Theme.colors.status.warning;
      case 'matched':
        return Theme.colors.accent.blue;
      case 'in-progress':
        return Theme.colors.status.success;
      case 'completed':
        return Theme.colors.status.success;
      case 'cancelled':
        return Theme.colors.status.error;
      default:
        return Theme.colors.text.tertiary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Match';
      case 'matched':
        return 'Matched';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning 👋';
    } else if (hour < 17) {
      return 'Good afternoon 👋';
    } else {
      return 'Good evening 👋';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSpacing} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.username}>
              {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : user?.email}
            </Text>
          </View>
          <NotificationButton />
        </View>

        {/* Active Ride Status */}
        {activeRide && (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons 
                name={activeRide.status === 'matched' ? 'checkmark-circle' : 'time-outline'} 
                size={24} 
                color={activeRide.status === 'matched' ? Theme.colors.status.success : Theme.colors.status.warning} 
              />
              <Text style={styles.statusTitle}>
                {activeRide.status === 'pending' && 'Waiting for Driver'}
                {activeRide.status === 'matched' && 'Ride Accepted!'}
                {activeRide.status === 'in-progress' && 'Ride in Progress'}
              </Text>
            </View>
            <Text style={styles.statusText}>
              {activeRide.status === 'pending' && 'Your ride request is being reviewed by drivers.'}
              {activeRide.status === 'matched' && `Driver: ${activeRide.driverName || 'A driver'} will contact you soon.`}
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
                <Ionicons name="close-circle-outline" size={20} color={Theme.colors.status.error} />
                <Text style={styles.cancelButtonText}>Cancel Ride</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Previous Rides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Previous Rides</Text>
          {previousRides.length > 0 ? (
            previousRides.map((ride, index) => (
              <View key={ride.id} style={styles.previousRideCard}>
                {/* Modern Card Header */}
                <View style={styles.previousRideCardHeader}>
                  <View style={styles.previousRideHeaderLeft}>
                    <View style={styles.previousRideCarIconContainer}>
                      <Ionicons name="car-sport" size={20} color={Theme.colors.primary[500]} />
                    </View>
                    <View style={styles.previousRideHeaderInfo}>
                      <Text style={styles.previousRideDate}>
                        {new Date(ride.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </Text>
                      <Text style={styles.previousRideTime}>
                        {new Date(ride.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.previousRideStatusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
                    <Text style={styles.previousRideStatusText}>{getStatusText(ride.status)}</Text>
                  </View>
                </View>
                
                {/* Clean Location Display */}
                <View style={styles.previousRideCardContent}>
                  <View style={styles.previousRideLocationContainer}>
                    <View style={styles.previousRideLocationIconContainer}>
                      <Ionicons name="location" size={14} color={Theme.colors.primary[500]} />
                    </View>
                    <Text style={styles.previousRideLocation}>{ride.event}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <TouchableOpacity style={styles.newUserTile}>
              <View style={styles.newUserTileContent}>
                <Ionicons name="car-outline" size={48} color={Theme.colors.primary[500]} />
                <Text style={styles.newUserTileTitle}>Welcome to Muuv!</Text>
                <Text style={styles.newUserTileSubtitle}>
                  Book your first ride and start exploring the city!
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Book Ride Button - moved to bottom */}
        <TouchableOpacity
          style={[
            styles.bookRideButton,
            (activeRide || userProfile?.lastActiveAs === 'driver' && userProfile?.isDriverAvailable) && styles.bookRideButtonDisabled
          ]}
          onPress={() => !activeRide && !(userProfile?.lastActiveAs === 'driver' && userProfile?.isDriverAvailable) && setShowBookingModal(true)}
          disabled={!!activeRide || (userProfile?.lastActiveAs === 'driver' && userProfile?.isDriverAvailable)}
        >
          <View style={styles.bookRideContent}>
            <Ionicons name="car-outline" size={24} color={Theme.colors.text.primary} />
            <Text style={styles.bookRideText}>
              {activeRide ? 'Ride in Progress' : 'Book a Ride'}
            </Text>
          </View>
        </TouchableOpacity>
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
    backgroundColor: Theme.colors.dark.background,
  },
  topSpacing: {
    height: Theme.spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.xl,
  },
  greeting: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  username: {
    fontSize: Theme.typography.fontSize['2xl'],
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  notificationButton: {
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius['2xl'],
    backgroundColor: Theme.colors.dark.surfaceVariant,
    ...Theme.shadows.sm,
  },
  bookRideButton: {
    backgroundColor: Theme.colors.primary[500],
    marginHorizontal: Theme.spacing.xl,
    marginBottom: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.lg,
    paddingVertical: Theme.spacing.lg,
    ...Theme.shadows.md,
  },
  bookRideContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookRideText: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.sm,
  },
  section: {
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
    marginHorizontal: Theme.spacing.xl,
    marginBottom: Theme.spacing.md,
  },
  rideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.dark.borderLight,
  },
  rideIconContainer: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.dark.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  rideDetails: {
    flex: 1,
  },
  rideDestination: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  rideDateTime: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
  },
  statusCard: {
    backgroundColor: Theme.colors.dark.surfaceVariant,
    marginHorizontal: Theme.spacing.xl,
    marginBottom: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    ...Theme.shadows.sm,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  statusTitle: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.sm,
  },
  statusText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    lineHeight: Theme.typography.lineHeight.normal * Theme.typography.fontSize.sm,
    marginBottom: Theme.spacing.sm,
  },
  driverPhone: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.secondary,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.sm,
    backgroundColor: Theme.colors.status.error + '20',
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.status.error + '40',
  },
  cancelButtonText: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.status.error,
    marginLeft: Theme.spacing.xs,
  },
  bookRideButtonDisabled: {
    backgroundColor: Theme.colors.text.tertiary,
  },
  previousRideCard: {
    ...Theme.frostedGlassCard,
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    padding: Theme.spacing.md,
  },
  previousRideCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.dark.border,
  },
  previousRideHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  previousRideCarIconContainer: {
    width: 48,
    height: 48,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.primary[500] + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  previousRideHeaderInfo: {
    flex: 1,
  },
  previousRideDate: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  previousRideTime: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.xs,
  },
  previousRideStatusBadge: {
    backgroundColor: Theme.colors.status.success,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius['2xl'],
  },
  previousRideStatusText: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
  },
  previousRideCardContent: {
    marginBottom: 1,
  },
  previousRideLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previousRideLocationIconContainer: {
    width: 20,
    height: 20,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.sm,
    borderWidth: 2,
    borderColor: Theme.colors.primary[500],
  },
  previousRideLocation: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.primary,
    flex: 1,
  },
  newUserTile: {
    ...Theme.frostedGlassCard,
    marginHorizontal: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
    padding: Theme.spacing['2xl'],
  },
  newUserTileContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  newUserTileTitle: {
    fontSize: Theme.typography.fontSize.xl,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  newUserTileSubtitle: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: Theme.typography.lineHeight.relaxed * Theme.typography.fontSize.base,
  },
});
