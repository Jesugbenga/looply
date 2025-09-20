import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Message, ChatRoom, MessageNotification } from './types';
import { sendMessageNotification } from './oneSignal';
import { userUtils } from './userUtils';
import { driverUtils } from './driverUtils';

export const messagingService = {
  // Create a chat room when a ride is accepted
  async createChatRoom(rideId: string, riderId: string, driverId: string): Promise<string> {
    try {
      console.log('Creating chat room for ride:', rideId, 'rider:', riderId, 'driver:', driverId);
      
      // Get user names
      const [riderProfile, driverProfile] = await Promise.all([
        userUtils.getUserProfile(riderId),
        driverUtils.getDriverProfile(driverId)
      ]);

      console.log('Rider profile:', riderProfile ? 'found' : 'not found');
      console.log('Driver profile:', driverProfile ? 'found' : 'not found');

      if (!riderProfile) {
        throw new Error(`Rider profile not found for user: ${riderId}`);
      }
      
      if (!driverProfile) {
        throw new Error(`Driver profile not found for driver: ${driverId}`);
      }

      // Get driver's user profile for name
      const driverUserProfile = await userUtils.getUserProfile(driverProfile.userId);
      if (!driverUserProfile) {
        throw new Error(`Driver user profile not found for user: ${driverProfile.userId}`);
      }

      const chatRoomData: Omit<ChatRoom, 'id'> = {
        rideId,
        riderId,
        driverId,
        riderName: `${riderProfile.firstName} ${riderProfile.lastName}`,
        driverName: `${driverUserProfile.firstName} ${driverUserProfile.lastName}`,
        unreadCount: {
          rider: 0,
          driver: 0
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const chatRoomsCollection = collection(db, 'chatRooms');
      const docRef = await addDoc(chatRoomsCollection, chatRoomData);
      
      // Send system message
      await this.sendSystemMessage(docRef.id, 'Chat room created. You can now communicate with your driver/rider.');
      
      console.log('✅ Chat room created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  },

  // Send a text message
  async sendMessage(
    chatRoomId: string,
    senderId: string,
    content: string,
    senderType: 'rider' | 'driver'
  ): Promise<string> {
    try {
      // Get chat room details
      const chatRoomDoc = await getDoc(doc(db, 'chatRooms', chatRoomId));
      if (!chatRoomDoc.exists()) {
        throw new Error('Chat room not found');
      }

      const chatRoom = chatRoomDoc.data() as ChatRoom;
      const senderName = senderType === 'rider' ? chatRoom.riderName : chatRoom.driverName;
      const recipientId = senderType === 'rider' ? chatRoom.driverId : chatRoom.riderId;

      // Create message
      const messageData: Omit<Message, 'id'> = {
        rideId: chatRoom.rideId,
        senderId,
        senderName,
        senderType,
        content: content.trim(),
        timestamp: new Date().toISOString(),
        isRead: false,
        messageType: 'text'
      };

      const messagesCollection = collection(db, 'messages');
      const messageRef = await addDoc(messagesCollection, messageData);

      // Update chat room with last message
      await updateDoc(doc(db, 'chatRooms', chatRoomId), {
        lastMessage: {
          content: content.trim(),
          timestamp: new Date().toISOString(),
          senderId
        },
        updatedAt: new Date().toISOString()
      });

      // Send push notification to recipient (optional)
      try {
        const recipientProfile = senderType === 'rider' 
          ? await driverUtils.getDriverProfile(recipientId)
          : await userUtils.getUserProfile(recipientId);
        
        if (recipientProfile?.oneSignalUserId) {
          await sendMessageNotification(
            recipientProfile.oneSignalUserId,
            senderName,
            content.trim(),
            chatRoom.rideId,
            senderId
          );
        } else {
          console.log('No OneSignal user ID found for recipient - skipping push notification');
        }
      } catch (notificationError) {
        console.warn('Failed to send push notification (this is normal if OneSignal is not configured):', notificationError);
        // Don't throw error for notification failures
      }

      console.log('✅ Message sent:', messageRef.id);
      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Send a system message
  async sendSystemMessage(chatRoomId: string, content: string): Promise<string> {
    try {
      const chatRoomDoc = await getDoc(doc(db, 'chatRooms', chatRoomId));
      if (!chatRoomDoc.exists()) {
        throw new Error('Chat room not found');
      }

      const chatRoom = chatRoomDoc.data() as ChatRoom;

      const messageData: Omit<Message, 'id'> = {
        rideId: chatRoom.rideId,
        senderId: 'system',
        senderName: 'System',
        senderType: 'rider', // System messages are treated as rider type for display
        content,
        timestamp: new Date().toISOString(),
        isRead: true, // System messages are considered read
        messageType: 'system'
      };

      const messagesCollection = collection(db, 'messages');
      const messageRef = await addDoc(messagesCollection, messageData);

      console.log('✅ System message sent:', messageRef.id);
      return messageRef.id;
    } catch (error) {
      console.error('Error sending system message:', error);
      throw error;
    }
  },

  // Get messages for a chat room
  async getMessages(chatRoomId: string, limitCount: number = 50): Promise<Message[]> {
    try {
      const messagesCollection = collection(db, 'messages');
      const q = query(
        messagesCollection,
        where('rideId', '==', chatRoomId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const messages: Message[] = [];

      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as Message);
      });

      // Return messages in chronological order (oldest first)
      return messages.reverse();
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  },

  // Listen to messages in real-time
  subscribeToMessages(
    chatRoomId: string,
    callback: (messages: Message[]) => void,
    limitCount: number = 50
  ): () => void {
    const messagesCollection = collection(db, 'messages');
    const q = query(
      messagesCollection,
      where('rideId', '==', chatRoomId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages: Message[] = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as Message);
      });
      
      // Return messages in chronological order (oldest first)
      callback(messages.reverse());
    }, (error) => {
      console.error('Error listening to messages:', error);
    });
  },

  // Get chat rooms for a user
  async getChatRooms(userId: string, userType: 'rider' | 'driver'): Promise<ChatRoom[]> {
    try {
      const chatRoomsCollection = collection(db, 'chatRooms');
      const field = userType === 'rider' ? 'riderId' : 'driverId';
      
      // First query: get all chat rooms for the user
      const q = query(
        chatRoomsCollection,
        where(field, '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const chatRooms: ChatRoom[] = [];

      querySnapshot.forEach((doc) => {
        const chatRoom = { id: doc.id, ...doc.data() } as ChatRoom;
        // Filter active chat rooms in memory to avoid index requirement
        if (chatRoom.isActive) {
          chatRooms.push(chatRoom);
        }
      });

      // Sort by updatedAt in memory
      chatRooms.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      return chatRooms;
    } catch (error) {
      console.error('Error getting chat rooms:', error);
      throw error;
    }
  },

  // Mark messages as read
  async markMessagesAsRead(chatRoomId: string, userId: string): Promise<void> {
    try {
      const messagesCollection = collection(db, 'messages');
      const q = query(
        messagesCollection,
        where('rideId', '==', chatRoomId),
        where('senderId', '!=', userId),
        where('isRead', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, { isRead: true })
      );

      await Promise.all(updatePromises);

      // Update unread count in chat room
      const chatRoomDoc = await getDoc(doc(db, 'chatRooms', chatRoomId));
      if (chatRoomDoc.exists()) {
        const chatRoom = chatRoomDoc.data() as ChatRoom;
        const field = chatRoom.riderId === userId ? 'rider' : 'driver';
        
        await updateDoc(doc(db, 'chatRooms', chatRoomId), {
          [`unreadCount.${field}`]: 0,
          updatedAt: new Date().toISOString()
        });
      }

      console.log('✅ Messages marked as read');
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  // Get or create chat room for a ride
  async getOrCreateChatRoom(rideId: string, riderId: string, driverId: string): Promise<string> {
    try {
      // Check if chat room already exists
      const chatRoomsCollection = collection(db, 'chatRooms');
      const q = query(
        chatRoomsCollection,
        where('rideId', '==', rideId),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const existingChatRoom = querySnapshot.docs[0];
        return existingChatRoom.id;
      }

      // Create new chat room
      return await this.createChatRoom(rideId, riderId, driverId);
    } catch (error) {
      console.error('Error getting or creating chat room:', error);
      throw error;
    }
  },

  // Close chat room
  async closeChatRoom(chatRoomId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'chatRooms', chatRoomId), {
        isActive: false,
        updatedAt: new Date().toISOString()
      });

      // Send system message
      await this.sendSystemMessage(chatRoomId, 'Chat room closed. Ride completed.');

      console.log('✅ Chat room closed');
    } catch (error) {
      console.error('Error closing chat room:', error);
      throw error;
    }
  }
};
