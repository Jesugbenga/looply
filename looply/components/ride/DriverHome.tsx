import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { rideUtils, Ride, driverUtils, DriverProfile, rideMatchingService } from '@/lib/firebaseUtils';
import { notificationService } from '@/lib/notificationService';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import NotificationButton from '../NotificationButton';
import { Theme } from '@/constants/Theme';

export default function DriverHome() {
  const { user, userProfile } = useAuth();
  const { showError, showSuccess, showInfo } = useAlert();
  const { isOnline } = useConnectionStatus();
  const [pendingRideRequests, setPendingRideRequests] = useState<any[]>([]);
  const [activeRides, setActiveRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);

  useEffect(() => {
    if (user) {
      loadDriverRideRequests();
      loadDriverProfile();
    }
  }, [user]);

  const loadDriverProfile = async () => {
    if (!user) return;
    
    try {
      const profile = await driverUtils.getDriverProfile(user.uid);
      setDriverProfile(profile);
    } catch (error) {
      console.error('Error loading driver profile:', error);
    }
  };

  const loadDriverRideRequests = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Get driver profile to get driver ID
      const profile = await driverUtils.getDriverProfile(user.uid);
      if (!profile) {
        console.log('No driver profile found');
        setPendingRideRequests([]);
        return;
      }
      
      // Get ride requests specifically sent to this driver
      const rideRequests = await rideMatchingService.getDriverRideRequests(profile.id);
      
      // No need to filter out own requests since matching prevents same person from being selected
      setPendingRideRequests(rideRequests);
      
      // Also fetch current driver's active rides (matched/in-progress)
      const myRides = await rideUtils.getUserRides(user.uid, 'driver');
      const activeRides = myRides.filter(r => r.status === 'matched' || r.status === 'in-progress');
      setActiveRides(activeRides);
    } catch (error) {
      console.error('Error loading driver ride requests:', error);
      showError('Error', 'Failed to load ride requests');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDriverRideRequests();
    setRefreshing(false);
  };

  const handleAcceptRide = async (rideRequest: any) => {
    if (!user || !userProfile || !driverProfile) return;

    showInfo(
      'Accept Ride Request',
      `Accept ride request from ${rideRequest.riderName}?`,
      {
        actionText: 'Accept',
        onAction: async () => {
          try {
            // Use the new ride matching service to accept the ride
            await rideMatchingService.driverAcceptRide(driverProfile.id, rideRequest.rideId);
            await loadDriverRideRequests(); // Refresh the list
          } catch (error) {
            console.error('Error accepting ride:', error);
            if (user) {
              await notificationService.sendNotificationToUser(
                user.uid,
                'Accept Failed',
                'Failed to accept ride request',
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

  const handleDeclineRide = async (rideRequest: any) => {
    if (!driverProfile) return;

    showError(
      'Decline Ride Request',
      `Decline ride request from ${rideRequest.riderName}?`,
      {
        actionText: 'Decline',
        onAction: async () => {
          try {
            // Use the new ride matching service to decline the ride
            await rideMatchingService.driverDeclineRide(driverProfile.id, rideRequest.rideId);
            if (user) {
              await notificationService.sendNotificationToUser(
                user.uid,
                'Ride Declined',
                'You have declined the ride request',
                {
                  type: 'system_alert',
                  rideId: rideRequest.rideId,
                  action: 'view_requests'
                }
              );
            }
            await loadDriverRideRequests(); // Refresh the list
          } catch (error) {
            console.error('Error declining ride:', error);
            if (user) {
              await notificationService.sendNotificationToUser(
                user.uid,
                'Decline Failed',
                'Failed to decline ride request',
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

  const handleStartRide = async (ride: Ride) => {
    showInfo(
      'Start Ride',
      'Start this ride now?',
      {
        actionText: 'Start',
        onAction: async () => {
          try {
            await rideUtils.startRide(ride.id);
            if (user) {
              await notificationService.sendNotificationToUser(
                user.uid,
                'Ride Started!',
                'The ride has been started successfully',
                {
                  type: 'ride_started',
                  rideId: ride.id,
                  action: 'view_ride'
                }
              );
            }
            await loadDriverRideRequests();
          } catch (error) {
            console.error('Error starting ride:', error);
            if (user) {
              await notificationService.sendNotificationToUser(
                user.uid,
                'Start Failed',
                'Failed to start ride',
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

  const handleCompleteRide = async (ride: Ride) => {
    showInfo(
      'Complete Ride',
      'Mark this ride as completed?',
      {
        actionText: 'Complete',
        onAction: async () => {
          try {
            await rideUtils.completeRide(ride.id);
            if (user) {
              await notificationService.sendNotificationToUser(
                user.uid,
                'Ride Completed!',
                'The ride has been completed successfully',
                {
                  type: 'ride_completed',
                  rideId: ride.id,
                  action: 'view_ride'
                }
              );
            }
            await loadDriverRideRequests();
          } catch (error) {
            console.error('Error completing ride:', error);
            if (user) {
              await notificationService.sendNotificationToUser(
                user.uid,
                'Complete Failed',
                'Failed to complete ride',
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

  const handleNotifyArrived = async (ride: Ride) => {
    showInfo(
      'Notify Arrival',
      'Notify the rider that you have arrived?',
      {
        actionText: 'Notify',
        onAction: async () => {
          try {
            await rideUtils.notifyDriverArrived(ride.id);
            if (user) {
              await notificationService.sendNotificationToUser(
                user.uid,
                'Rider Notified!',
                'The rider has been notified of your arrival',
                {
                  type: 'ride_arrived',
                  rideId: ride.id,
                  action: 'view_ride'
                }
              );
            }
          } catch (error) {
            console.error('Error notifying arrival:', error);
            if (user) {
              await notificationService.sendNotificationToUser(
                user.uid,
                'Notify Failed',
                'Failed to notify rider of arrival',
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
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.username}>
              {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Driver'}
            </Text>
          </View>
          <NotificationButton />
        </View>

        {/* Driver Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="car-outline" size={24} color={Theme.colors.status.success} />
            <Text style={styles.statusTitle}>Driver Mode</Text>
          </View>
          <Text style={styles.statusText}>
            {userProfile?.isDriverAvailable 
              ? 'You are available to take rides' 
              : 'You are not available. Check your profile to toggle availability.'
            }
          </Text>
        </View>

        {/* Offline Warning */}
        {!isOnline && (
          <View style={styles.offlineWarning}>
            <Ionicons name="wifi-outline" size={20} color={Theme.colors.status.error} />
            <Text style={styles.offlineText}>You're offline. Some features may not work.</Text>
          </View>
        )}

        {/* Available Rides Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ride Requests</Text>
            <TouchableOpacity onPress={loadDriverRideRequests} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color={Theme.colors.primary[500]} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading ride requests...</Text>
            </View>
          ) : pendingRideRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color={Theme.colors.text.tertiary} />
              <Text style={styles.emptyStateTitle}>No ride requests</Text>
              <Text style={styles.emptyStateText}>
                You'll receive ride requests here when riders book rides in your area.
              </Text>
            </View>
          ) : (
            pendingRideRequests.map((rideRequest) => (
              <View key={rideRequest.id} style={styles.rideCard}>
                <View style={styles.rideHeader}>
                  <View style={styles.riderInfo}>
                    <Ionicons name="person-circle" size={40} color={Theme.colors.primary[500]} />
                    <View style={styles.riderDetails}>
                      <Text style={styles.riderName}>{rideRequest.riderName}</Text>
                      <Text style={styles.eventName}>{rideRequest.event}</Text>
                    </View>
                  </View>
                  <View style={styles.rideTime}>
                    <Text style={styles.timeText}>
                      {new Date(rideRequest.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.rideDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="people-outline" size={16} color={Theme.colors.text.secondary} />
                    <Text style={styles.detailText}>{rideRequest.passengers} passenger{rideRequest.passengers !== 1 ? 's' : ''}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color={Theme.colors.text.secondary} />
                    <Text style={styles.detailText}>{rideRequest.address}</Text>
                  </View>
                  {rideRequest.additionalDetails && (
                    <View style={styles.detailRow}>
                      <Ionicons name="chatbubble-outline" size={16} color={Theme.colors.text.secondary} />
                      <Text style={styles.detailText}>{rideRequest.additionalDetails}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.rideActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.declineButton]}
                    onPress={() => handleDeclineRide(rideRequest)}
                  >
                    <Ionicons name="close" size={20} color={Theme.colors.status.error} />
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleAcceptRide(rideRequest)}
                  >
                    <Ionicons name="checkmark" size={20} color={Theme.colors.text.primary} />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Active Rides Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Active Rides</Text>
          </View>
          {activeRides.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="timer-outline" size={48} color={Theme.colors.text.tertiary} />
              <Text style={styles.emptyStateTitle}>No active rides</Text>
              <Text style={styles.emptyStateText}>Accepted or in-progress rides will appear here.</Text>
            </View>
          ) : (
            activeRides.map((ride) => (
              <View key={ride.id} style={styles.rideCard}>
                <View style={styles.rideHeader}>
                  <View style={styles.riderInfo}>
                    <Ionicons name="person-circle" size={40} color={Theme.colors.status.success} />
                    <View style={styles.riderDetails}>
                      <Text style={styles.riderName}>{ride.riderName}</Text>
                      <Text style={styles.eventName}>{ride.event}</Text>
                    </View>
                  </View>
                  <View style={styles.rideTime}>
                    <Text style={styles.timeText}>{ride.status === 'matched' ? 'Matched' : 'In Progress'}</Text>
                  </View>
                </View>

                <View style={styles.rideDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color={Theme.colors.text.secondary} />
                    <Text style={styles.detailText}>{ride.address}</Text>
                  </View>
                </View>

                <View style={styles.rideActions}>
                  {ride.status === 'matched' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleStartRide(ride)}
                    >
                      <Ionicons name="play" size={20} color={Theme.colors.text.primary} />
                      <Text style={styles.acceptButtonText}>Start Ride</Text>
                    </TouchableOpacity>
                  )}
                  {ride.status === 'in-progress' && (
                    <>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.notifyButton]}
                        onPress={() => handleNotifyArrived(ride)}
                      >
                        <Ionicons name="location" size={20} color={Theme.colors.text.primary} />
                        <Text style={styles.notifyButtonText}>I've Arrived</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => handleCompleteRide(ride)}
                      >
                        <Ionicons name="checkmark-done" size={20} color={Theme.colors.text.primary} />
                        <Text style={styles.acceptButtonText}>Complete Ride</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.dark.background,
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
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.sm,
  },
  statusText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    lineHeight: Theme.typography.lineHeight.normal * Theme.typography.fontSize.sm,
  },
  section: {
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
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
  emptyState: {
    backgroundColor: Theme.colors.dark.surfaceVariant,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emptyStateTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: Theme.typography.lineHeight.normal * Theme.typography.fontSize.sm,
  },
  // New styles for ride cards
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Theme.spacing.xl,
    marginBottom: Theme.spacing.md,
  },
  refreshButton: {
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius['2xl'],
    backgroundColor: Theme.colors.dark.surfaceVariant,
  },
  loadingContainer: {
    backgroundColor: Theme.colors.dark.surfaceVariant,
    marginHorizontal: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing['3xl'],
    alignItems: 'center',
    ...Theme.shadows.sm,
  },
  loadingText: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.md,
  },
  rideCard: {
    ...Theme.frostedGlassCard,
    marginHorizontal: Theme.spacing.xl,
    marginBottom: Theme.spacing.md,
    padding: Theme.spacing.lg,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  riderDetails: {
    marginLeft: Theme.spacing.md,
    flex: 1,
  },
  riderName: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  eventName: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
  },
  rideTime: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.primary[500],
  },
  rideDetails: {
    marginBottom: Theme.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  detailText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    marginLeft: Theme.spacing.sm,
    flex: 1,
  },
  rideActions: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
  },
  declineButton: {
    backgroundColor: Theme.colors.status.error + '20',
    borderWidth: 1,
    borderColor: Theme.colors.status.error,
  },
  declineButtonText: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.status.error,
    marginLeft: Theme.spacing.xs,
  },
  acceptButton: {
    backgroundColor: Theme.colors.primary[500],
  },
  acceptButtonText: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.xs,
  },
  notifyButton: {
    backgroundColor: Theme.colors.accent.blue,
  },
  notifyButtonText: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.xs,
  },
  // Offline warning styles
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.status.error + '20',
    borderColor: Theme.colors.status.error,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginHorizontal: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
  },
  offlineText: {
    flex: 1,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.status.error,
    marginLeft: Theme.spacing.sm,
  },
});
