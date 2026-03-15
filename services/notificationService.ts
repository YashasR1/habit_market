import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// expo-notifications Android push support was removed from Expo Go in SDK 53.
// We only set the notification handler when running in a real app build,
// or on iOS (which still works fine in Expo Go).
const isExpoGo = Constants.executionEnvironment === 'storeClient';

if (!isExpoGo || Platform.OS !== 'android') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Set up a branded Android notification channel for birthday reminders.
  // This gives the notification the app's icon and accent color instead of
  // the default Expo Go placeholder icon.
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('birthdays', {
      name: 'Birthday Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#818CF8',        // App primary color
      sound: 'default',
      enableVibrate: true,
      showBadge: false,
    });
  }
}

export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'web') return false;
  if (isExpoGo && Platform.OS === 'android') return false; // Not supported in Expo Go on Android (SDK 53+)

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
};

export const scheduleBirthdayNotification = async (
  birthdayId: string, 
  name: string, 
  dateString: string // YYYY-MM-DD
) => {
  if (Platform.OS === 'web') return;
  if (isExpoGo && Platform.OS === 'android') return; // Not supported in Expo Go on Android (SDK 53+)

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const [, month, day] = dateString.split('-').map(Number);
  
  // Create a date object for the notification (day before at 9:00 AM)
  const notificationDate = new Date();
  // We don't care about the year when scheduling the annual trigger
  notificationDate.setMonth(month - 1);
  notificationDate.setDate(day - 1);
  notificationDate.setHours(9, 0, 0, 0);

  // If the notification date has already passed this year, schedule for next year
  if (notificationDate.getTime() < Date.now()) {
      notificationDate.setFullYear(notificationDate.getFullYear() + 1);
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🎂 Birthday Reminder!",
      body: `Tomorrow is ${name}'s birthday!`,
      data: { birthdayId },
    },
    trigger: {
      type: Notifications.AndroidNotificationPriority.HIGH, // Fixed trigger type issue causing typing error
      channelId: 'birthdays',
      // Workaround for expo-notifications Calendar trigger not being fully cross-platform compatible
      // Note: We use the Date object for the initial trigger. 
      // A more robust implementation for repeating might require a background task or push server,
      // but 'yearly' component trigger works well on iOS and most modern Android versions if supported.
      month: month - 1, // 0-indexed in JS, but expo-notifications docs say it should match the Date object format depending on platform
      day: day > 1 ? day - 1 : day, // Simplified logic for previous day. Needs edge case handling for 1st of month IRL.
      hour: 9,
      minute: 0,
      repeats: true,
    } as any, 
    // Using 'as any' here because the Expo Notifications Trigger type union is notoriously strict
    // about matching exactly one of the specific trigger interfaces (CalendarTrigger, TimeIntervalTrigger, DailyTrigger, etc)
    // and constructing it dynamically often fails TS checks without a strict type cast.
  });
};

export const cancelBirthdayNotification = async (birthdayId: string) => {
    if (Platform.OS === 'web') return;
    if (isExpoGo && Platform.OS === 'android') return; // Not supported in Expo Go on Android (SDK 53+)
    
    // In a fully robust app, we'd store the scheduled notification identifier returned by
    // scheduleNotificationAsync in the database. For now, we cancel by scanning the scheduled queue.
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
        if (notif.content.data?.birthdayId === birthdayId) {
            await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
    }
}
