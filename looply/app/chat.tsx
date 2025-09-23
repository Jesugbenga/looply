import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { messagingService } from '@/lib/messagingService';
import { Message, Ride } from '@/lib/types';
import { Theme } from '@/constants/Theme';
import { rideUtils } from '@/lib/rideUtils';

export default function ChatScreen() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { chatRoomId, rideId, otherUserName, otherUserId } = params;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ride, setRide] = useState<Ride | null>(null);
  const [isRideCompleted, setIsRideCompleted] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (chatRoomId && user && userProfile) {
      loadMessages();
      markMessagesAsRead();
      loadRideDetails();
      
      // Set up real-time message subscription
      const unsubscribe = messagingService.subscribeToMessages(
        chatRoomId as string,
        (newMessages) => {
          setMessages(newMessages);
          // Auto-scroll to bottom when new messages arrive
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      );

      return () => {
        unsubscribe();
      };
    }
  }, [chatRoomId, user, userProfile]);

  const loadRideDetails = async () => {
    if (!rideId) return;
    
    try {
      const rideData = await rideUtils.getRideById(rideId as string);
      if (rideData) {
        setRide(rideData);
        setIsRideCompleted(rideData.status === 'completed');
      }
    } catch (error) {
      console.error('Error loading ride details:', error);
    }
  };

  const loadMessages = async () => {
    if (!chatRoomId) return;

    try {
      setLoading(true);
      const messageList = await messagingService.getMessages(chatRoomId as string);
      setMessages(messageList);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!chatRoomId || !user) return;

    try {
      await messagingService.markMessagesAsRead(chatRoomId as string, user.uid);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatRoomId || !user || !userProfile || sending || isRideCompleted) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const userType = userProfile.lastActiveAs || 'rider';
      await messagingService.sendMessage(
        chatRoomId as string,
        user.uid,
        messageContent,
        userType as 'rider' | 'driver'
      );
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (message: Message) => {
    return message.senderId === user?.uid;
  };

  const renderMessage = ({ item: message }: { item: Message }) => {
    const isMine = isMyMessage(message);
    const isSystem = message.messageType === 'system';

    if (isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{message.content}</Text>
          <Text style={styles.systemMessageTime}>{formatTime(message.timestamp)}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, isMine && styles.myMessageContainer]}>
        <View style={[styles.messageBubble, isMine && styles.myMessageBubble]}>
          <Text style={[styles.messageText, isMine && styles.myMessageText]}>
            {message.content}
          </Text>
          <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name="chatbubble-outline" 
        size={60} 
        color={Theme.colors.text.tertiary} 
      />
      <Text style={styles.emptyStateText}>
        {isRideCompleted ? 'Ride Completed' : 'Start a conversation'}
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {isRideCompleted 
          ? 'This ride has been completed. Chat is no longer available.' 
          : 'Send a message to coordinate your ride'
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/messages')}>
            <Ionicons name="arrow-back" size={24} color={Theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{otherUserName}</Text>
          <View style={styles.headerSpacer} />
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
        <TouchableOpacity onPress={() => router.push('/(tabs)/messages')}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{otherUserName}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={messages.length === 0 ? styles.emptyContainer : styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {!isRideCompleted && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor={Theme.colors.text.tertiary}
              multiline
              maxLength={500}
              editable={!sending}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              <Ionicons 
                name={sending ? "hourglass-outline" : "send"} 
                size={20} 
                color={(!newMessage.trim() || sending) ? Theme.colors.text.tertiary : '#FFFFFF'} 
              />
            </TouchableOpacity>
          </View>
        )}
        
        {isRideCompleted && (
          <View style={styles.completedContainer}>
            <Ionicons 
              name="checkmark-circle" 
              size={24} 
              color={Theme.colors.primary[500]} 
            />
            <Text style={styles.completedText}>
              This ride has been completed. Chat is no longer available.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.dark.background,
    paddingTop: Theme.spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.dark.border,
  },
  headerTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Theme.spacing.md,
  },
  headerSpacer: {
    width: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.secondary,
  },
  chatContainer: {
    flex: 1,
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
  emptyStateText: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
  },
  messagesList: {
    padding: Theme.spacing.md,
  },
  messageContainer: {
    marginVertical: Theme.spacing.xs,
    alignItems: 'flex-start',
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.dark.surfaceVariant,
  },
  myMessageBubble: {
    backgroundColor: Theme.colors.primary[500],
  },
  messageText: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.primary,
    lineHeight: Theme.typography.lineHeight.normal * Theme.typography.fontSize.base,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.text.tertiary,
    marginTop: Theme.spacing.xs,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: Theme.spacing.sm,
  },
  systemMessageText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  systemMessageTime: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.text.tertiary,
    marginTop: Theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.dark.border,
    backgroundColor: Theme.colors.dark.surfaceVariant,
  },
  textInput: {
    flex: 1,
    backgroundColor: Theme.colors.dark.background,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.primary,
    maxHeight: 100,
    marginRight: Theme.spacing.sm,
  },
  sendButton: {
    backgroundColor: Theme.colors.primary[500],
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  sendButtonDisabled: {
    backgroundColor: Theme.colors.dark.border,
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.dark.surfaceVariant,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.dark.border,
  },
  completedText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    marginLeft: Theme.spacing.sm,
    textAlign: 'center',
    flex: 1,
  },
});
