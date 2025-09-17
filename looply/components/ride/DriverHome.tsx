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
            <Ionicons name="notifications-outline" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* Driver Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="car-outline" size={24} color="#10B981" />
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
            <Ionicons name="wifi-outline" size={20} color="#EF4444" />
            <Text style={styles.offlineText}>You're offline. Some features may not work.</Text>
          </View>
        )}

        {/* Available Rides Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ride Requests</Text>
            <TouchableOpacity onPress={loadPendingRides} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading ride requests...</Text>
            </View>
          ) : pendingRides.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color="#D1D5DB" />
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
                    <Ionicons name="person-circle" size={40} color="#3B82F6" />
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
                    <Ionicons name="people-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{ride.passengers} passenger{ride.passengers !== 1 ? 's' : ''}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{ride.address}</Text>
                  </View>
                  {ride.additionalDetails && (
                    <View style={styles.detailRow}>
                      <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
                      <Text style={styles.detailText}>{ride.additionalDetails}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.rideActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.declineButton]}
                    onPress={() => handleDeclineRide(ride)}
                  >
                    <Ionicons name="close" size={20} color="#EF4444" />
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleAcceptRide(ride)}
                  >
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Active Rides Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Active Rides</Text>
          {activeRides.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="timer-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>No active rides</Text>
              <Text style={styles.emptyStateText}>Accepted or in-progress rides will appear here.</Text>
            </View>
          ) : (
            activeRides.map((ride) => (
              <View key={ride.id} style={styles.rideCard}>
                <View style={styles.rideHeader}>
                  <View style={styles.riderInfo}>
                    <Ionicons name="person-circle" size={40} color="#10B981" />
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
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{ride.address}</Text>
                  </View>
                </View>

                <View style={styles.rideActions}>
                  {ride.status === 'matched' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleStartRide(ride)}
                    >
                      <Ionicons name="play" size={20} color="#FFFFFF" />
                      <Text style={styles.acceptButtonText}>Start Ride</Text>
                    </TouchableOpacity>
                  )}
                  {ride.status === 'in-progress' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleCompleteRide(ride)}
                    >
                      <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
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
  emptyState: {
    backgroundColor: '#FFFFFF',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  // New styles for ride cards
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
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
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  rideCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  riderDetails: {
    marginLeft: 12,
    flex: 1,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  eventName: {
    fontSize: 14,
    color: '#6B7280',
  },
  rideTime: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  rideDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  rideActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  declineButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
    marginLeft: 6,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 6,
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
    marginHorizontal: 20,
    marginBottom: 16,
  },
  offlineText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 8,
  },
});
