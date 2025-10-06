// Default role permissions map mirrored from backend (views_common.DEFAULT_ROLE_PERMISSIONS)
// Keep minimal and focused to gate UI controls only.

export const DEFAULT_ROLE_PERMISSIONS = {
  admin: ['all'],
  manager: [
    'account.login',
    'account.logout',
    'account.password.edit',
    'account.info.edit',
    'account.biometric',
    'inventory.view',
    'inventory.update',
    'inventory.expiry.track',
    'inventory.menu.manage',
    'inventory.lowstock.alerts',
    'inventory.restock.manage',
    'order.queue.handle',
    'order.status.update',
    'order.bulk.track',
    'payment.process',
    'payment.records.view',
    'order.history.view',
    'payment.refund',
    'profile.view_roles',
    'schedule.view_edit',
    'schedule.manage',
    'attendance.manage',
    'leave.manage',
    'reports.sales.view',
    'reports.inventory.view',
    'reports.orders.view',
    'reports.staff.view',
    'reports.customer.view',
    'notification.send',
    'notification.receive',
    'notification.view',
    'menu.manage',
    'employees.manage',
    'verify.review',
  ],
  staff: [
    'account.login',
    'account.logout',
    'account.password.edit',
    'account.info.edit',
    'account.biometric',
    'inventory.view',
    'inventory.update',
    'inventory.expiry.track',
    'order.place',
    'order.status.view',
    'order.queue.handle',
    'order.status.update',
    'order.bulk.track',
    'payment.process',
    'payment.records.view',
    'order.history.view',
    'profile.view_roles',
    'schedule.view_edit',
    'notification.send',
    'notification.receive',
    'notification.view',
  ],
};

export function effectivePermissions(user) {
  const role = (user?.role || 'staff').toLowerCase();
  const base = DEFAULT_ROLE_PERMISSIONS[role] || [];
  const explicit = Array.isArray(user?.permissions) ? user.permissions : [];
  if (role === 'admin' || explicit.includes('all')) return ['all'];
  // union
  const set = new Set([...base, ...explicit]);
  return Array.from(set);
}
