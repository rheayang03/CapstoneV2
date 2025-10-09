// Helpers to register a service worker and subscribe to Web Push
import { notificationsService } from '@/api/services/notificationsService';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function ensureServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

export async function subscribePush() {
  try {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return { success: false, error: 'Push notifications are not supported.' };
    }
    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        return {
          success: false,
          error: 'Notification permission denied.',
        };
      }
    }
    if (Notification.permission === 'denied') {
      return {
        success: false,
        error: 'Notification permission denied.',
      };
    }
    const reg = await ensureServiceWorker();
    if (!reg || !reg.pushManager) {
      return {
        success: false,
        error: 'Service worker unavailable.',
      };
    }

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const keyRes = await notificationsService.getVapidPublicKey();
      const pub =
        keyRes?.publicKey ||
        keyRes?.data?.publicKey ||
        import.meta?.env?.VITE_VAPID_PUBLIC_KEY ||
        '';
      const appServerKey = pub ? urlBase64ToUint8Array(pub) : undefined;
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      });
    }
    const payload = sub.toJSON();
    const apiRes = await notificationsService.subscribePush(payload);
    return {
      success: true,
      pushEnabled:
        typeof apiRes?.pushEnabled === 'boolean'
          ? apiRes.pushEnabled
          : true,
      subscription: sub,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error?.message ||
        'Failed to subscribe to push notifications.',
    };
  }
}

export async function unsubscribePush() {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg || !reg.pushManager) {
      return { success: true, pushEnabled: false };
    }
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const payload = sub.toJSON();
      await notificationsService.unsubscribePush(payload);
      await sub.unsubscribe();
    }
    return { success: true, pushEnabled: false };
  } catch (error) {
    return {
      success: false,
      error:
        error?.message ||
        'Failed to unsubscribe from push notifications.',
    };
  }
}
