import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { messagingService } from '@/lib/messagingService';
import { ChatRoom } from '@/lib/types';
import { Theme } from '@/constants/Theme';

export default function MessagesScreen() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && userProfile) {
      loadChatRooms();
    }
  }, [user, userProfile]);

  const loadChatRooms = async () => {
    if (!user || !userProfile) return;

    try {
      setLoading(true);
      const userType = userProfile.lastActiveAs || 'rider';
      const rooms = await messagingService.getChatRooms(user.uid, userType);
      setChatRooms(rooms);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChatRooms();
    setRefreshing(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getUnreadCount = (room: ChatRoom) => {
    if (!userProfile) return 0;
    const userType = userProfile.lastActiveAs || 'rider';
    return userType === 'rider' ? room.unreadCount.rider : room.unreadCount.driver;
  };

  const openChat = (room: ChatRoom) => {
    router.push({
      pathname: '/chat',
      params: {
        chatRoomId: room.id,
        rideId: room.rideId,
        otherUserName: userProfile?.lastActiveAs === 'rider' ? room.driverName : room.riderName,
        otherUserId: userProfile?.lastActiveAs === 'rider' ? room.driverId : room.riderId
      }
    });
  };

  const renderChatRoom = ({ item: room }: { item: ChatRoom }) => {
    const unreadCount = getUnreadCount(room);
    const otherUserName = userProfile?.lastActiveAs === 'rider' ? room.driverName : room.riderName;

    return (
      <TouchableOpacity 
        style={styles.chatRoomItem} 
        onPress={() => openChat(room)}
        activeOpacity={0.7}
      >
        <View style={styles.chatRoomContent}>
          <View style={styles.avatarContainer}>
            <Ionicons 
              name="person-circle-outline" 
              size={40} 
              color={Theme.colors.primary[500]} 
            />
          </View>
          
          <View style={styles.chatRoomInfo}>
            <View style={styles.chatRoomHeader}>
              <Text style={styles.otherUserName}>{otherUserName}</Text>
              {room.lastMessage && (
                <Text style={styles.messageTime}>
                  {formatTime(room.lastMessage.timestamp)}
                </Text>
              )}
            </View>
            
            <View style={styles.messagePreview}>
              <Text 
                style={[
                  styles.lastMessageText,
                  unreadCount > 0 && styles.unreadMessageText
                ]}
                numberOfLines={1}
              >
                {room.lastMessage?.content || 'No messages yet'}
              </Text>
              
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name="chatbubbles-outline" 
        size={80} 
        color={Theme.colors.text.tertiary} 
      />
      <Text style={styles.emptyStateTitle}>No Messages Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        When you book a ride, you'll be able to chat with your driver here.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={loadChatRooms}>
          <Ionicons name="refresh-outline" size={24} color={Theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.id}
        renderItem={renderChatRoom}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Theme.colors.primary[500]}
          />
        }
        contentContainerStyle={chatRooms.length === 0 ? styles.emptyContainer : undefined}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.dark.background,
    paddingTop: Theme.spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.dark.border,
  },
  headerTitle: {
    fontSize: Theme.typography.fontSize['2xl'],
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing['2xl'],
  },
  emptyStateTitle: {
    fontSize: Theme.typography.fontSize.xl,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
  },
  emptyStateSubtitle: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: Theme.typography.lineHeight.normal * Theme.typography.fontSize.base,
  },
  chatRoomItem: {
    backgroundColor: Theme.colors.dark.surfaceVariant,
    marginHorizontal: Theme.spacing.xl,
    marginVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
  },
  chatRoomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  avatarContainer: {
    marginRight: Theme.spacing.md,
  },
  chatRoomInfo: {
    flex: 1,
  },
  chatRoomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  otherUserName: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
    flex: 1,
  },
  messageTime: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.tertiary,
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  unreadMessageText: {
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  unreadBadge: {
    backgroundColor: Theme.colors.primary[500],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
});
