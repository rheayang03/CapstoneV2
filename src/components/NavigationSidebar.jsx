// NavigationSidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Menu,
  TrendingUp,
  Users,
  CalendarClock,
  MessageSquare,
  ShoppingCart,
  Utensils,
  Bell,
  Package,
  CreditCard,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/components/AuthContext';

export const NavigationSidebar = ({ isCollapsed }) => {
  const location = useLocation();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  const navigationCategories = [
    {
      label: 'Main',
      items: [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Analytics', href: '/analytics', icon: TrendingUp },
      ],
    },
    {
      label: 'Sales & Menu',
      items: [
        { name: 'Menu Management', href: '/menu', icon: Menu },
        { name: 'Point of Sale', href: '/pos', icon: ShoppingCart },
        { name: 'Catering', href: '/catering', icon: Utensils },
        { name: 'Payments', href: '/payments', icon: CreditCard },
      ],
    },
    {
      label: 'Operations',
      items: [
        { name: 'Inventory', href: '/inventory', icon: Package },
        {
          name: 'Employee Management',
          href: '/employees',
          icon: CalendarClock,
        },
      ],
    },
    {
      label: 'User Management',
      items: [
        { name: 'Users', href: '/users', icon: Users, adminOnly: true },
        { name: 'Activity Logs', href: '/logs', icon: FileText },
      ],
    },
    {
      label: 'Communication',
      items: [
        { name: 'Notifications', href: '/notifications', icon: Bell },
        { name: 'Customer Feedback', href: '/feedback', icon: MessageSquare },
      ],
    },
  ];

  return (
    <div className="px-1 py-2">
      <SidebarMenu>
        {navigationCategories.map((category) => {
          const visibleItems = category.items.filter(
            (item) => !item.adminOnly || isAdmin
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={category.label} className="mb-3">
              {/* Show category label only if not collapsed */}
              {!isCollapsed && (
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">
                  {category.label}
                </p>
              )}

              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.href}
                    tooltip={item.name}
                  >
                    <Link
                      to={item.href}
                      className={`group flex items-center ${
                        isCollapsed ? 'justify-center' : 'space-x-3'
                      } px-2 py-2 rounded-md transition-colors duration-200 hover:bg-gray-500 hover:text-black`}
                    >
                      <item.icon className="h-5 w-5 transition-colors duration-200 text-current" />
                      {!isCollapsed && (
                        <span className="transition-colors duration-200">
                          {item.name}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </div>
          );
        })}
      </SidebarMenu>
    </div>
  );
};
