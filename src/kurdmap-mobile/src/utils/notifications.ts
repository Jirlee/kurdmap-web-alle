import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and return the Expo push token.
 * Returns null if permission is denied or device is a simulator.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Promise.all([
      Notifications.setNotificationChannelAsync('default', {
        name: 'KurdMap',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
      }),
      Notifications.setNotificationChannelAsync('reviews', {
        name: 'Reviews',
        description: 'New reviews on your business',
        importance: Notifications.AndroidImportance.DEFAULT,
      }),
      Notifications.setNotificationChannelAsync('favorites', {
        name: 'Favorites',
        description: 'Updates to your favorite businesses',
        importance: Notifications.AndroidImportance.DEFAULT,
      }),
      Notifications.setNotificationChannelAsync('general', {
        name: 'Announcements',
        description: 'Platform announcements',
        importance: Notifications.AndroidImportance.LOW,
      }),
    ]);
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}

/**
 * Schedule a local notification.
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  seconds = 1,
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: { seconds, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
  });
}
