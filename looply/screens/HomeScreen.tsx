import React from "react";
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.username}>Jesugbenga</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <Text style={styles.searchText}>Where would you like to go?</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#EBF8FF' }]}>
              <Ionicons name="car-outline" size={24} color="#2563EB" />
            </View>
            <Text style={styles.quickActionText}>Ride</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="bicycle-outline" size={24} color="#16A34A" />
            </View>
            <Text style={styles.quickActionText}>Bike</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="fast-food-outline" size={24} color="#D97706" />
            </View>
            <Text style={styles.quickActionText}>Food</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="gift-outline" size={24} color="#DB2777" />
            </View>
            <Text style={styles.quickActionText}>Package</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Trips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent trips</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <TouchableOpacity style={styles.tripItem}>
              <View style={styles.locationIcon}>
                <Ionicons name="location-outline" size={20} color="#6B7280" />
              </View>
              <View style={styles.tripDetails}>
                <Text style={styles.tripDestination}>West Edmonton Mall</Text>
                <Text style={styles.tripAddress}>8882 170 St NW, Edmonton, AB</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tripItem}>
              <View style={styles.locationIcon}>
                <Ionicons name="location-outline" size={20} color="#6B7280" />
              </View>
              <View style={styles.tripDetails}>
                <Text style={styles.tripDestination}>University of Alberta</Text>
                <Text style={styles.tripAddress}>116 St & 85 Ave, Edmonton, AB</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tripItem}>
              <View style={styles.locationIcon}>
                <Ionicons name="location-outline" size={20} color="#6B7280" />
              </View>
              <View style={styles.tripDetails}>
                <Text style={styles.tripDestination}>Downtown Core</Text>
                <Text style={styles.tripAddress}>Jasper Ave, Edmonton, AB</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Saved Places */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved places</Text>
          </View>
            
          <View style={styles.card}>
            <TouchableOpacity style={styles.savedPlace}>
              <View style={[styles.savedPlaceIcon, { backgroundColor: '#EBF8FF' }]}>
                <Ionicons name="home-outline" size={20} color="#2563EB" />
              </View>
              <View style={styles.savedPlaceDetails}>
                <Text style={styles.savedPlaceTitle}>Home</Text>
                <Text style={styles.savedPlaceAddress}>Add your home address</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.savedPlace}>
              <View style={[styles.savedPlaceIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="business-outline" size={20} color="#16A34A" />
              </View>
              <View style={styles.savedPlaceDetails}>
                <Text style={styles.savedPlaceTitle}>Work</Text>
                <Text style={styles.savedPlaceAddress}>Add your work address</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 4,
  },
  username: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  notificationButton: {
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  searchText: {
    fontSize: 16,
    color: "#9CA3AF",
    marginLeft: 12,
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  quickAction: {
    alignItems: "center",
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  seeAllText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  tripItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tripDetails: {
    flex: 1,
  },
  tripDestination: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 2,
  },
  tripAddress: {
    fontSize: 14,
    color: "#6B7280",
  },
  savedPlace: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  savedPlaceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  savedPlaceDetails: {
    flex: 1,
  },
  savedPlaceTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 2,
  },
  savedPlaceAddress: {
    fontSize: 14,
    color: "#6B7280",
  },
  bottomSpacer: {
    height: 100,
  },
});

export default HomeScreen;