import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
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
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { notificationsService } from '@/api/services/notificationsService';
import { subscribePush, unsubscribePush } from '@/lib/push';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_SETTINGS = {
  emailEnabled: true,
  pushEnabled: false,
  lowStock: true,
  order: true,
  payment: true,
};

const PAGE_SIZE = 20;

const normalizeSettings = (payload = {}) => ({
  emailEnabled: Boolean(
    payload.emailEnabled ?? DEFAULT_SETTINGS.emailEnabled
  ),
  pushEnabled: Boolean(
    payload.pushEnabled ?? DEFAULT_SETTINGS.pushEnabled
  ),
  lowStock: Boolean(payload.lowStock ?? DEFAULT_SETTINGS.lowStock),
  order: Boolean(payload.order ?? DEFAULT_SETTINGS.order),
  payment: Boolean(payload.payment ?? DEFAULT_SETTINGS.payment),
});

const typeIcon = {
  warning: (className) => <Bell className={className} />,
  info: (className) => <Bell className={className} />,
  success: (className) => <CheckCircle className={className} />,
  error: (className) => <XCircle className={className} />,
};

const typeStyles = {
  warning: 'text-yellow-600',
  info: 'text-blue-600',
  success: 'text-green-600',
  error: 'text-red-600',
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: PAGE_SIZE,
  });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const mountedRef = useRef(true);
  const { toast } = useToast();

  const fmtRelative = useCallback((iso) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = Math.max(0, (now - d) / 1000);
      if (diff < 60) return `${Math.floor(diff)}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return d.toLocaleString();
    } catch {
      return iso || '';
    }
  }, []);

  const transformNotification = useCallback(
    (n) => {
      const topic = (n.topic || n?.meta?.topic || '').toLowerCase();
      const baseType = (n.type || '').toLowerCase();
      const derivedType =
        topic === 'low_stock'
          ? 'warning'
          : topic === 'order'
          ? 'info'
          : topic === 'payment'
          ? 'success'
          : baseType || 'info';
      return {
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        time: fmtRelative(n.createdAt),
        read: Boolean(n.read || n.isRead),
        topic,
        meta: n.meta || {},
        payload: n.payload || n?.meta?.payload || {},
        type: derivedType,
      };
    },
    [fmtRelative]
  );

  const syncSettings = useCallback((payload) => {
    setSettings(normalizeSettings(payload));
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const data = await notificationsService.getSettings();
      if (!mountedRef.current) return;
      syncSettings(data);
    } catch (error) {
      if (!mountedRef.current) return;
      toast({
        title: 'Notifications',
        description: 'Unable to load notification settings.',
        variant: 'destructive',
      });
    }
  }, [syncSettings, toast]);

  const loadPage = useCallback(
    async (page = 1, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const res = await notificationsService.list(PAGE_SIZE, page);
        const items = (res?.data || []).map(transformNotification);
        if (!mountedRef.current) return;
        setNotifications((prev) => {
          const next = append ? [...prev, ...items] : items;
          const pag = res?.pagination || {};
          setPagination({
            page,
            totalPages: pag.totalPages ?? Math.max(page, 1),
            total: pag.total ?? next.length,
            limit: pag.limit ?? PAGE_SIZE,
          });
          return next;
        });
      } catch (error) {
        if (!mountedRef.current) return;
        if (!append) {
          setNotifications([]);
          setPagination({
            page: 1,
            totalPages: 1,
            total: 0,
            limit: PAGE_SIZE,
          });
        }
        toast({
          title: 'Notifications',
          description: 'Failed to load notifications.',
          variant: 'destructive',
        });
      } finally {
        if (!mountedRef.current) return;
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [transformNotification, toast]
  );

  const refreshList = useCallback(() => {
    loadPage(1, false);
  }, [loadPage]);

  useEffect(() => {
    mountedRef.current = true;
    refreshList();
    loadSettings();
    return () => {
      mountedRef.current = false;
    };
  }, [refreshList, loadSettings]);

  const handleSettingChange = useCallback(
    async (key) => {
      const prevState = settings;
      const desired = !prevState[key];
      let nextState = { ...prevState, [key]: desired };
      setSettings(nextState);
      try {
        if (key === 'pushEnabled') {
          if (desired) {
            const result = await subscribePush();
            if (!result?.success) {
              throw new Error(
                result?.error || 'Unable to enable push notifications.'
              );
            }
            if (typeof result.pushEnabled === 'boolean') {
              nextState = { ...nextState, pushEnabled: result.pushEnabled };
            }
          } else {
            const result = await unsubscribePush();
            if (!result?.success) {
              throw new Error(
                result?.error || 'Unable to disable push notifications.'
              );
            }
            if (typeof result.pushEnabled === 'boolean') {
              nextState = { ...nextState, pushEnabled: result.pushEnabled };
            }
          }
        }

        const saved = await notificationsService.updateSettings(nextState);
        if (!mountedRef.current) return;
        syncSettings(saved ?? nextState);
      } catch (error) {
        if (!mountedRef.current) return;
        setSettings(prevState);
        toast({
          title: 'Notification settings',
          description:
            error?.message ||
            'Unable to update notification settings. Please try again.',
          variant: 'destructive',
        });
      }
    },
    [settings, syncSettings, toast]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsService.markAllRead?.();
    } catch (error) {
      toast({
        title: 'Notifications',
        description: 'Unable to mark notifications as read.',
        variant: 'destructive',
      });
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [toast]);

  const markAsRead = useCallback(
    async (id) => {
      try {
        await notificationsService.markRead?.(id);
      } catch (error) {
        toast({
          title: 'Notifications',
          description: 'Unable to mark notification as read.',
          variant: 'destructive',
        });
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
    [toast]
  );

  const deleteNotification = useCallback(
    async (id) => {
      try {
        await notificationsService.delete?.(id);
      } catch (error) {
        toast({
          title: 'Notifications',
          description: 'Unable to delete notification.',
          variant: 'destructive',
        });
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setPagination((pag) => ({
        ...pag,
        total: Math.max(0, (pag.total || 1) - 1),
      }));
    },
    [toast]
  );

  const loadMore = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      loadPage(pagination.page + 1, true);
    }
  }, [pagination, loadPage]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
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
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((n) => {
                    const IconRenderer =
                      typeIcon[n.type] || typeIcon.info;
                    const iconColor =
                      typeStyles[n.type] || typeStyles.info;
                    return (
                      <div
                        key={n.id}
                        className={`p-3 rounded-lg flex items-start justify-between transition-all ${
                          n.read ? 'bg-white' : 'bg-yellow-100'
                        } hover:bg-yellow-200`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="mt-1">
                            {IconRenderer(`h-5 w-5 ${iconColor}`)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4
                                className={`font-medium ${
                                  !n.read ? 'font-semibold' : ''
                                }`}
                              >
                                {n.title}
                              </h4>
                              {n.topic ? (
                                <Badge variant="outline" className="uppercase">
                                  {n.topic}
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {n.message}
                            </p>
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
                    );
                  })
                ) : (
                  <div className="text-center py-6">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">
                      No notifications to display
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="flex flex-wrap gap-2 justify-between border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </Button>
            <div className="flex gap-2">
              {pagination.page < pagination.totalPages && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-1"
                >
                  {loadingMore && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {loadingMore ? 'Loading…' : 'Load more'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={refreshList}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <div>
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Configure alert preferences</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {[
              {
                key: 'emailEnabled',
                label: 'Email Notifications',
                desc: 'Receive alerts via email',
              },
              {
                key: 'pushEnabled',
                label: 'Push Notifications',
                desc: 'Browser notifications',
              },
              {
                key: 'lowStock',
                label: 'Low Stock Alerts',
                desc: 'When inventory is low',
              },
              {
                key: 'order',
                label: 'Order Alerts',
                desc: 'New and updated orders',
              },
              {
                key: 'payment',
                label: 'Payment Alerts',
                desc: 'Payment confirmations',
              },
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
