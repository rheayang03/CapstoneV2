import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const SecurityAlertsCard = ({ securityAlerts, onBlockIP, onDismiss }) => {
  const [showEarlier, setShowEarlier] = useState(false);

  const groupedAlerts = useMemo(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString(); // 1 day ago

    const groups = {
      today: [],
      yesterday: [],
      earlier: [],
    };

    securityAlerts.forEach(alert => {
      const alertDate = new Date(alert.timestamp).toDateString();
      if (alertDate === today) groups.today.push(alert);
      else if (alertDate === yesterday) groups.yesterday.push(alert);
      else groups.earlier.push(alert);
    });

    return groups;
  }, [securityAlerts]);

  const renderAlertItem = (alert) => (
    <div
      key={alert.id}
      className={`rounded-lg border p-3 flex gap-3 ${
        alert.type === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
      }`}
    >
      <AlertTriangle
        className={`h-5 w-5 shrink-0 mt-0.5 ${
          alert.type === 'critical' ? 'text-red-600' : 'text-amber-600'
        }`}
      />
      <div className="flex-1">
        <h4
          className={`font-medium ${
            alert.type === 'critical' ? 'text-red-900' : 'text-amber-900'
          }`}
        >
          {alert.title}
        </h4>
        <p
          className={`text-sm ${
            alert.type === 'critical' ? 'text-red-700' : 'text-amber-700'
          }`}
        >
          {alert.description}
        </p>
        <div className="mt-2 flex gap-2">
          {alert.type === 'critical' && (
            <Button size="sm" variant="destructive" onClick={() => onBlockIP(alert.id)}>
              Block IP
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onDismiss(alert.id)}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Alerts</CardTitle>
        <CardDescription>Important security notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[360px] overflow-auto">
        {groupedAlerts.today.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Today</h4>
            <div className="space-y-2">{groupedAlerts.today.map(renderAlertItem)}</div>
          </div>
        )}
        {groupedAlerts.yesterday.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Yesterday</h4>
            <div className="space-y-2">{groupedAlerts.yesterday.map(renderAlertItem)}</div>
          </div>
        )}
        {groupedAlerts.earlier.length > 0 && (
          <div>
            <button
              className="flex items-center gap-1 mb-2 text-sm font-semibold text-muted-foreground"
              onClick={() => setShowEarlier(!showEarlier)}
            >
              {showEarlier ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Earlier
            </button>
            {showEarlier && <div className="space-y-2">{groupedAlerts.earlier.map(renderAlertItem)}</div>}
          </div>
        )}
        {securityAlerts.length === 0 && (
          <p className="text-center text-muted-foreground">No security alerts</p>
        )}
      </CardContent>
    </Card>
  );
};

export default SecurityAlertsCard;
