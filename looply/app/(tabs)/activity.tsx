import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRefresh } from '@/contexts/RefreshContext';
import { rideUtils, Ride } from '@/lib/firebaseUtils';

// Ride interface is now imported from firebaseUtils

interface ActivityScreenProps {
  refreshKey?: number;
}

export default function ActivityScreen() {
  const { user, userProfile } = useAuth();
  const { refreshKey } = useRefresh();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'completed'>('all');

  useEffect(() => {
    if (!user || !userProfile) return;

    const isDriver = userProfile.userType === 'driver';
    
    const unsubscribe = rideUtils.subscribeToUserRides(
      user.uid,
      isDriver ? 'driver' : 'rider',
      (ridesData) => {
        setRides(ridesData);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, userProfile]);

  // Handle refresh from parent component
  useEffect(() => {
    if (refreshKey && refreshKey > 0) {
      onRefresh();
    }
  }, [refreshKey]);

  const onRefresh = () => {
    setRefreshing(true);
    // Force a refresh by re-subscribing to the listener
    if (user && userProfile) {
      const isDriver = userProfile.userType === 'driver';
      rideUtils.subscribeToUserRides(
        user.uid,
        isDriver ? 'driver' : 'rider',
        (ridesData) => {
          setRides(ridesData);
          setRefreshing(false);
        }
      );
    } else {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  const filteredRides = rides.filter(ride => {
    switch (activeTab) {
      case 'pending':
        return ride.status === 'pending';
      case 'active':
        return ride.status === 'matched' || ride.status === 'in-progress';
      case 'completed':
        return ride.status === 'completed';
      default:
        return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'matched':
        return '#3B82F6';
      case 'in-progress':
        return '#10B981';
      case 'completed':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderRideCard = (ride: Ride) => (
    <View key={ride.id} style={styles.rideCard}>
      <View style={styles.rideHeader}>
        <View style={styles.eventInfo}>
          <Text style={styles.eventName}>{ride.event}</Text>
          <Text style={styles.eventTime}>{formatDate(ride.requestedAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
          <Text style={styles.statusText}>{getStatusText(ride.status)}</Text>
        </View>
      </View>

      <View style={styles.rideDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{ride.passengers} passenger{ride.passengers > 1 ? 's' : ''}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{ride.address}</Text>
        </View>

        {ride.pickupRequired && (
          <View style={styles.detailRow}>
            <Ionicons name="arrow-up-circle-outline" size={16} color="#10B981" />
            <Text style={styles.detailText}>Pickup required</Text>
          </View>
        )}

        {ride.dropoffRequired && (
          <View style={styles.detailRow}>
            <Ionicons name="arrow-down-circle-outline" size={16} color="#3B82F6" />
            <Text style={styles.detailText}>Dropoff required</Text>
          </View>
        )}

        {userProfile?.userType === 'driver' && ride.riderName && (
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>Rider: {ride.riderName}</Text>
          </View>
        )}

        {userProfile?.userType === 'rider' && ride.driverName && (
          <View style={styles.detailRow}>
            <Ionicons name="car-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>Driver: {ride.driverName}</Text>
          </View>
        )}

        {ride.additionalDetails && (
          <View style={styles.detailRow}>
            <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{ride.additionalDetails}</Text>
          </View>
        )}
      </View>

      {(ride.status === 'matched' || ride.status === 'in-progress') && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="call-outline" size={16} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={16} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Message</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading your rides...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Rides</Text>
          <Text style={styles.subtitle}>
            {userProfile?.userType === 'driver' ? 'Rides you\'ve provided' : 'Your ride history'}
          </Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabContainer}>
          {['all', 'pending', 'active', 'completed'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rides List */}
        {filteredRides.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No rides found</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'all' 
                ? 'You haven\'t taken any rides yet'
                : `No ${activeTab} rides found`
              }
            </Text>
          </View>
        ) : (
          <View style={styles.ridesList}>
            {filteredRides.map(renderRideCard)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  ridesList: {
    paddingHorizontal: 20,
  },
  rideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  rideDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
