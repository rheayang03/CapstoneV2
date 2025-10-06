import React, { useEffect, useRef, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label'; 
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { notificationsService } from '@/api/services/notificationsService';
import { subscribePush, unsubscribePush } from '@/lib/push';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({
    emailEnabled: true,
    pushEnabled: false,
    lowStock: true,
    order: true,
    payment: true,
  });

  const fmtRelative = (iso) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = Math.max(0, (now - d) / 1000);
      if (diff < 60) return `${Math.floor(diff)}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return d.toLocaleDateString();
    } catch {
      return iso || '';
    }
  };

  const refreshList = async () => {
    try {
      const res = await notificationsService.getRecent(100);
      const list = (res?.data || []).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        time: fmtRelative(n.createdAt),
        read: Boolean(n.read || n.isRead),
        type:
          n.type === 'low_stock'
            ? 'warning'
            : n.type === 'new_order'
            ? 'info'
            : n.type === 'payment'
            ? 'success'
            : n.type || 'info',
      }));
      setNotifications(list);
    } catch {}
  };

  const loadSettings = async () => {
    try {
      const data = await notificationsService.getSettings();
      setSettings({
        emailEnabled: Boolean(data.emailEnabled),
        pushEnabled: Boolean(data.pushEnabled),
        lowStock: Boolean(data.lowStock),
        order: Boolean(data.order),
        payment: Boolean(data.payment),
      });
    } catch {}
  };

  useEffect(() => {
    refreshList();
    loadSettings();
  }, []);

  const handleSettingChange = async (key) => {
    const nextState = { ...settings, [key]: !settings[key] };
    setSettings(nextState);
    try {
      if (key === 'pushEnabled') {
        if (nextState.pushEnabled) {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') return;
          await subscribePush();
        } else {
          await unsubscribePush();
        }
      }
      await notificationsService.updateSettings(nextState);
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllRead?.();
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = async (id) => {
    try {
      await notificationsService.markRead?.(id);
    } catch {}
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = async (id) => {
    try {
      await notificationsService.delete?.(id);
    } catch {}
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const notificationColors = {
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Notifications List */}
      <div className="md:col-span-2">
        <Card className="bg-yellow-50 shadow-lg">
          <CardHeader className="flex justify-between pb-2">
            <div>
              <CardTitle className="text-3xl">Notification Center</CardTitle>
              <CardDescription>System alerts and messages</CardDescription>
            </div>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} unread</Badge>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="max-h-[700px]">
              <div className="space-y-2 p-2">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-lg flex items-start justify-between transition-all ${
                        n.read ? 'bg-white' : 'bg-yellow-100'
                      } hover:bg-yellow-200 cursor-pointer`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="mt-1">
                          {n.type === 'warning' && (
                            <Bell className="h-5 w-5 text-yellow-600" />
                          )}
                          {n.type === 'info' && (
                            <Bell className="h-5 w-5 text-blue-600" />
                          )}
                          {n.type === 'success' && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                          {n.type === 'error' && (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h4 className={`font-medium ${!n.read ? 'font-semibold' : ''}`}>
                            {n.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">{n.message}</p>
                          <span className="text-xs text-muted-foreground mt-1 block">
                            {n.time}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        {!n.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(n.id)}
                          >
                            Mark as read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(n.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No notifications to display</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={refreshList}
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Notification Settings */}
      <div>
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Configure alert preferences</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {[
              { key: 'emailEnabled', label: 'Email Notifications', desc: 'Receive alerts via email' },
              { key: 'pushEnabled', label: 'Push Notifications', desc: 'Browser notifications' },
              { key: 'lowStock', label: 'Low Stock Alerts', desc: 'When inventory is low' },
              { key: 'order', label: 'Order Alerts', desc: 'New and updated orders' },
              { key: 'payment', label: 'Payment Alerts', desc: 'Payment confirmations' },
            ].map((s) => (
              <div
                key={s.key}
                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  settings[s.key] ? 'bg-primary/10' : 'bg-background'
                }`}
              >
                <div className="space-y-0.5">
                  <Label>{s.label}</Label>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
                <Switch
                  checked={settings[s.key]}
                  onCheckedChange={() => handleSettingChange(s.key)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Notifications;
