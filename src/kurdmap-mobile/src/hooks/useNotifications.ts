import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { registerForPushNotifications } from '../utils/notifications';

/**
 * Hook that registers for push notifications on mount,
 * handles foreground notification display, and navigates
 * on notification tap (deep linking).
 */
export function useNotifications() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Register for push token
    registerForPushNotifications().catch(() => {
      // Silently ignore — user may deny permissions
    });

    // Listen for foreground notifications (display handled by setNotificationHandler in utils)
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Notification received while app is in foreground — no-op since handler shows it
    });

    // Listen for notification taps → deep link
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.screen) {
        router.push(data.screen as any);
      } else if (data?.businessSlug) {
        router.push(`/business/${data.businessSlug}` as any);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router]);
}
