import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useVerificationQueue } from '@/hooks/useVerificationQueue';
import verificationService from '@/api/services/verificationService';
import { Badge } from '@/components/ui/badge';
import TableSkeleton from '@/components/shared/TableSkeleton';
import ErrorState from '@/components/shared/ErrorState';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Check,
  X,
  Image as ImageIcon,
  RefreshCcw,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export const PendingVerifications = () => {
  const { requests, pagination, loading, error, refetch, approve, reject } =
    useVerificationQueue({
      status: 'pending',
      limit: 10,
    });
  const [previewId, setPreviewId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [approveId, setApproveId] = useState(null);
  const [role, setRole] = useState('staff');

  const total = pagination?.total ?? requests.length;
  const getInitials = (name = '') =>
    name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .join('')
      .toUpperCase();

  const openPreview = async (reqId) => {
    setPreviewId(reqId);
    try {
      const blob = await verificationService.fetchHeadshotBlob(reqId);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (e) {
      setPreviewUrl('');
    }
  };
  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setPreviewId(null);
  };

  const onApprove = async () => {
    if (!approveId) return;
    await approve.mutateAsync({ requestId: approveId, role });
    setApproveId(null);
  };
  const onRejectRow = async (id) => {
    await reject.mutateAsync({ requestId: id, note: '' });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            Pending Verifications
            <Badge variant="secondary" className="font-normal">
              {total} pending
            </Badge>
          </CardTitle>
          <CardDescription>
            Review new account requests and assign roles
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <TableSkeleton
            headers={['User', 'Contact', 'Submitted', 'Headshot', 'Actions']}
            rows={5}
          />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 border rounded-md">
            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <div className="text-sm text-muted-foreground">
              No pending requests
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => refetch()}
            >
              Refresh
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Headshot</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>
                            {getInitials(req.user?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium leading-none">
                            {req.user?.name || '—'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {req.user?.email || '—'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{req.user?.phone || '—'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(req.createdAt).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {req.hasHeadshot ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPreview(req.id)}
                          className="inline-flex items-center"
                        >
                          <ImageIcon className="h-4 w-4 mr-1" /> Preview
                        </Button>
                      ) : (
                        <Badge variant="secondary">No photo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              Assign Role
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuRadioGroup
                                value={role}
                                onValueChange={setRole}
                              >
                                <DropdownMenuRadioItem value="staff">
                                  Staff
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="manager">
                                  Manager
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="admin">
                                  Admin
                                </DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setApproveId(req.id)}
                          >
                            <Check className="h-4 w-4 mr-2" /> Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onRejectRow(req.id)}>
                            <X className="h-4 w-4 mr-2" /> Reject
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Approve confirmation dialog */}
        <Dialog
          open={Boolean(approveId)}
          onOpenChange={(v) => !v && setApproveId(null)}
        >
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Approve Account</DialogTitle>
              <DialogDescription>
                Are you sure you want to approve this account?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setApproveId(null)}>
                Cancel
              </Button>
              <Button onClick={onApprove} disabled={approve.isPending}>
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image preview dialog */}
        <Dialog
          open={Boolean(previewId)}
          onOpenChange={(v) => !v && closePreview()}
        >
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Headshot Preview</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Headshot"
                  className="max-h-[60vh] rounded-md border"
                />
              ) : (
                <div className="text-sm text-muted-foreground">No image</div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={closePreview}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PendingVerifications;
