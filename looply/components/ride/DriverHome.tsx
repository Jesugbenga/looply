import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from '@/contexts/AuthContext';
import { rideUtils, Ride, driverUtils, DriverProfile } from '@/lib/firebaseUtils';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { Theme } from '@/constants/Theme';

export default function DriverHome() {
  const { user, userProfile } = useAuth();
  const { isOnline } = useConnectionStatus();
  const [pendingRides, setPendingRides] = useState<Ride[]>([]);
  const [activeRides, setActiveRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);

  useEffect(() => {
    if (user) {
      loadPendingRides();
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

  const loadPendingRides = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const rides = await rideUtils.getPendingRides();
      // Do not show your own ride requests if you are also a rider
      const filtered = rides.filter(r => r.riderId !== user.uid);
      setPendingRides(filtered);
      // Also fetch current driver's active rides (matched/in-progress)
      const myRides = await rideUtils.getUserRides(user.uid, 'driver');
      setActiveRides(myRides.filter(r => r.status === 'matched' || r.status === 'in-progress'));
    } catch (error) {
      console.error('Error loading pending rides:', error);
      Alert.alert('Error', 'Failed to load ride requests');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingRides();
    setRefreshing(false);
  };

  const handleAcceptRide = async (ride: Ride) => {
    if (!user || !userProfile) return;

    Alert.alert(
      'Accept Ride Request',
      `Accept ride request from ${ride.riderName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await rideUtils.acceptRide(
                ride.id,
                user.uid,
                `${userProfile.firstName} ${userProfile.lastName}`,
                userProfile.phone || undefined,
                driverProfile ? `${driverProfile.vehicleYear} ${driverProfile.vehicleMake} ${driverProfile.vehicleModel}` : undefined,
                driverProfile?.licensePlate || undefined
              );
              Alert.alert('Success', 'Ride request accepted!');
              await loadPendingRides(); // Refresh the list
            } catch (error) {
              console.error('Error accepting ride:', error);
              Alert.alert('Error', 'Failed to accept ride request');
            }
          },
        },
      ]
    );
  };

  const handleDeclineRide = async (ride: Ride) => {
    Alert.alert(
      'Decline Ride Request',
      `Decline ride request from ${ride.riderName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await rideUtils.cancelRide(ride.id);
              Alert.alert('Success', 'Ride request declined');
              await loadPendingRides(); // Refresh the list
            } catch (error) {
              console.error('Error declining ride:', error);
              Alert.alert('Error', 'Failed to decline ride request');
            }
          },
        },
      ]
    );
  };

  const handleStartRide = async (ride: Ride) => {
    Alert.alert(
      'Start Ride',
      'Start this ride now?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            try {
              await rideUtils.startRide(ride.id);
              await loadPendingRides();
            } catch (error) {
              console.error('Error starting ride:', error);
              Alert.alert('Error', 'Failed to start ride');
            }
          },
        },
      ]
    );
  };

  const handleCompleteRide = async (ride: Ride) => {
    Alert.alert(
      'Complete Ride',
      'Mark this ride as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await rideUtils.completeRide(ride.id);
              await loadPendingRides();
            } catch (error) {
              console.error('Error completing ride:', error);
              Alert.alert('Error', 'Failed to complete ride');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSpacing} />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.username}>
              {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Driver'}
            </Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={Theme.colors.text.tertiary} />
          </TouchableOpacity>
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
            <TouchableOpacity onPress={loadPendingRides} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color={Theme.colors.primary[500]} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading ride requests...</Text>
            </View>
          ) : pendingRides.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color={Theme.colors.text.tertiary} />
              <Text style={styles.emptyStateTitle}>No ride requests</Text>
              <Text style={styles.emptyStateText}>
                Riders will appear here when they request rides.
              </Text>
            </View>
          ) : (
            pendingRides.map((ride) => (
              <View key={ride.id} style={styles.rideCard}>
                <View style={styles.rideHeader}>
                  <View style={styles.riderInfo}>
                    <Ionicons name="person-circle" size={40} color={Theme.colors.primary[500]} />
                    <View style={styles.riderDetails}>
                      <Text style={styles.riderName}>{ride.riderName}</Text>
                      <Text style={styles.eventName}>{ride.event}</Text>
                    </View>
                  </View>
                  <View style={styles.rideTime}>
                    <Text style={styles.timeText}>
                      {new Date(ride.requestedAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.rideDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="people-outline" size={16} color={Theme.colors.text.secondary} />
                    <Text style={styles.detailText}>{ride.passengers} passenger{ride.passengers !== 1 ? 's' : ''}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color={Theme.colors.text.secondary} />
                    <Text style={styles.detailText}>{ride.address}</Text>
                  </View>
                  {ride.additionalDetails && (
                    <View style={styles.detailRow}>
                      <Ionicons name="chatbubble-outline" size={16} color={Theme.colors.text.secondary} />
                      <Text style={styles.detailText}>{ride.additionalDetails}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.rideActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.declineButton]}
                    onPress={() => handleDeclineRide(ride)}
                  >
                    <Ionicons name="close" size={20} color={Theme.colors.status.error} />
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleAcceptRide(ride)}
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
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleCompleteRide(ride)}
                    >
                      <Ionicons name="checkmark-done" size={20} color={Theme.colors.text.primary} />
                      <Text style={styles.acceptButtonText}>Complete Ride</Text>
                    </TouchableOpacity>
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
  },
  username: {
    fontSize: Theme.typography.fontSize['2xl'],
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
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
