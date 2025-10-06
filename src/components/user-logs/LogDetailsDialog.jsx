import React from 'react';
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Clock, Copy, Check } from 'lucide-react';

const fmtLocal = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso;
  }
};

const KVP = ({ label, value, copyKey, onCopy, monospace, tiny, copied }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {!!value && onCopy && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onCopy(copyKey, value)}
            >
              {copied === copyKey ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>
      )}
    </div>
    <p
      className={`${monospace ? 'font-mono' : ''} ${tiny ? 'text-xs' : 'text-sm'} bg-muted px-2 py-1 rounded break-words`}
    >
      {value || '—'}
    </p>
  </div>
);

const LogDetailsDialog = ({
  open,
  onOpenChange,
  selectedLog,
  getActionIcon,
  getActionColor,
}) => {
  const [copied, setCopied] = useState('');
  const onCopy = (key, text) => {
    try {
      navigator.clipboard?.writeText(String(text));
      setCopied(key);
      setTimeout(() => setCopied(''), 1200);
    } catch {}
  };

  const actionOrType = selectedLog?.action || selectedLog?.type || '';

  const isoTs = useMemo(() => {
    if (!selectedLog?.timestamp) return '';
    try {
      const d = new Date(selectedLog.timestamp);
      if (Number.isNaN(d.getTime())) return String(selectedLog.timestamp);
      return d.toISOString();
    } catch {
      return String(selectedLog.timestamp);
    }
  }, [selectedLog]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Log Details</DialogTitle>
          <DialogDescription>
            Essential information about this log entry
          </DialogDescription>
        </DialogHeader>

        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KVP
                label="Log ID"
                value={selectedLog.id}
                copyKey="id"
                onCopy={onCopy}
                monospace
                copied={copied}
              />
              <KVP
                label="Action / Type"
                value={actionOrType}
                copyKey="actionType"
                onCopy={onCopy}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Timestamp
                </label>
                <div className="bg-muted rounded p-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{fmtLocal(selectedLog.timestamp)}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    ISO: {isoTs}
                  </div>
                </div>
              </div>
              <KVP
                label="User ID"
                value={selectedLog.userId || ''}
                copyKey="userId"
                onCopy={onCopy}
                monospace
                copied={copied}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LogDetailsDialog;
