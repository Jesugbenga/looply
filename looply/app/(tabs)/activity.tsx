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
import { Theme } from '@/constants/Theme';

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
  const [activeTab, setActiveTab] = useState<'past' | 'upcoming'>('past');

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
      case 'upcoming':
        return ride.status === 'pending' || ride.status === 'matched';
      case 'past':
        return ride.status === 'completed' || ride.status === 'cancelled';
      default:
        return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return Theme.colors.status.warning;
      case 'matched':
        return Theme.colors.accent.blue;
      case 'in-progress':
        return Theme.colors.status.success;
      case 'completed':
        return Theme.colors.text.tertiary;
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
      {/* Modern Card Header with Gradient Background */}
      <View style={styles.rideCardHeader}>
        <View style={styles.rideHeaderLeft}>
          <View style={styles.carIconContainer}>
            <Ionicons name="car-sport" size={24} color={Theme.colors.primary[500]} />
          </View>
          <View style={styles.rideHeaderInfo}>
            <Text style={styles.rideDate}>
              {new Date(ride.requestedAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </Text>
            <Text style={styles.rideTime}>
              {new Date(ride.requestedAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>
        <View style={[styles.rideStatusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
          <Text style={styles.rideStatusText}>{getStatusText(ride.status)}</Text>
        </View>
      </View>
      
      {/* Modern Route Visualization */}
      <View style={styles.rideCardContent}>
        <View style={styles.routeContainer}>
          <View style={styles.routeLine} />
          <View style={styles.locationContainer}>
            <View style={styles.locationIconContainer}>
              <Ionicons name="location" size={16} color={Theme.colors.primary[500]} />
            </View>
            <Text style={styles.rideLocation}>{ride.address}</Text>
          </View>
          
          <View style={styles.locationContainer}>
            <View style={[styles.locationIconContainer, styles.destinationIconContainer]}>
              <Ionicons name="flag" size={16} color={Theme.colors.status.success} />
            </View>
            <Text style={styles.rideLocation}>{ride.event}</Text>
          </View>
        </View>
      </View>
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
      <View style={styles.topSpacing} />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="time-outline" size={24} color={Theme.colors.text.primary} />
            <Text style={styles.title}>Activity</Text>
          </View>
          <Text style={styles.subtitle}>
            {userProfile?.userType === 'driver' ? 'Rides you\'ve provided' : 'Your ride history'}
          </Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabContainer}>
          {['past', 'upcoming'].map((tab) => (
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
            <Ionicons name="time-outline" size={64} color={Theme.colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No rides found</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'past' 
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
    backgroundColor: Theme.colors.dark.background,
  },
  topSpacing: {
    height: Theme.spacing['4xl'],
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
    padding: Theme.spacing.xl,
    paddingBottom: Theme.spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  title: {
    fontSize: Theme.typography.fontSize['3xl'],
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.sm,
  },
  subtitle: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.secondary,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.xl,
    marginBottom: Theme.spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.lg,
    marginRight: Theme.spacing.sm,
    borderRadius: Theme.borderRadius['2xl'],
    backgroundColor: Theme.colors.dark.surfaceVariant,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Theme.colors.primary[500],
  },
  tabText: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.secondary,
  },
  activeTabText: {
    color: Theme.colors.text.primary,
  },
  ridesList: {
    paddingHorizontal: Theme.spacing.xl,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
    marginBottom: 2,
  },
  eventTime: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.lg,
  },
  statusText: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
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
  actionButtons: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    backgroundColor: Theme.colors.dark.surface,
    borderRadius: Theme.borderRadius.sm,
  },
  actionButtonText: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.accent.blue,
    marginLeft: Theme.spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Theme.spacing['6xl'],
    paddingHorizontal: Theme.spacing['4xl'],
  },
  emptyTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: Theme.typography.lineHeight.relaxed * Theme.typography.fontSize.sm,
  },
  rideCard: {
    ...Theme.frostedGlassCard,
    marginHorizontal: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
    padding: Theme.spacing.md,
  },
  rideCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.dark.border,
  },
  rideHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  carIconContainer: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.primary[500] + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.sm,
  },
  rideHeaderInfo: {
    flex: 1,
  },
  rideDate: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  rideTime: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    fontFamily: Theme.typography.fontFamily.regular,
    marginTop: Theme.spacing.xs,
  },
  rideStatusBadge: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius['2xl'],
  },
  rideStatusText: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  rideCardContent: {
    marginBottom: Theme.spacing.sm,
  },
  routeContainer: {
    position: 'relative',
  },
  routeLine: {
    position: 'absolute',
    left: 20,
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: Theme.colors.primary[500] + '40',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    paddingLeft: Theme.spacing['3xl'],
  },
  locationIconContainer: {
    width: 28,
    height: 28,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.sm,
    borderWidth: 2,
    borderColor: Theme.colors.primary[500],
  },
  destinationIconContainer: {
    borderColor: Theme.colors.status.success,
  },
  rideLocation: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.primary,
    flex: 1,
    fontFamily: Theme.typography.fontFamily.medium,
  },
});
