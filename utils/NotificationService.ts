import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationService = {
  async registerForPushNotificationsAsync() {
    // Push notifications are not supported in Expo Go (SDK 53+)
    if (Constants.appOwnership === 'expo') {
      console.log('Push notifications are not supported in Expo Go. Use a development build.');
      return null;
    }

    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    // Get the token with the Project ID from Expo
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Expo Push Token:', token);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  },

  async sendLocalNotification(title: string, body: string, data: any = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // trigger immediately
    });
  },

  async sendPushNotificationToPeers(actor: string, action: string, label: string) {
    try {
      const tokensSnapshot = await getDocs(collection(db, "user_tokens"));
      const messages: any[] = [];

      tokensSnapshot.forEach((doc) => {
        const data = doc.data();
        // Skip the person who did the action
        if (doc.id === actor) return;
        
        // Grab the token from Firestore document
        const pushToken = data.token;
        if (!pushToken || typeof pushToken !== 'string') return;

        // Ensure it looks like a valid Expo Push token ExponentPushToken[xxxx]
        if (!pushToken.includes('ExponentPushToken') && !pushToken.includes('ExpoPushToken')) return;

        messages.push({
          to: pushToken,
          sound: 'default',
          title: "MARHABS: Collaborative Update",
          body: `${actor} ${action}: ${label}`,
          data: { actor, action, label },
        });
      });

      if (messages.length === 0) return;

      // Send the batch to Expo's Push API
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        console.error("Failed to send remote push notification", await response.text());
      }
    } catch (e) {
      console.error("Error sending push notifications to peers:", e);
    }
  }
};
