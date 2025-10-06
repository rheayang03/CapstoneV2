// MainLayout.jsx
import React, { useState } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { NavigationSidebar } from '@/components/NavigationSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Bell, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import PageTransition from '@/components/PageTransition';
import logo from '@/assets/technomart-logo.png';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import Notifications from '@/components/Notifications';

const MainLayout = ({ children }) => {
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const displayName = user?.name || 'Admin';
  const displayRole = user?.role || 'admin';
  const avatarInitial = (displayName?.[0] || 'A').toUpperCase();

  const unreadNotifications = 3; // Example count

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex h-screen w-full bg-white">
        {/* Sidebar */}
        <Sidebar
          variant="sidebar"
          collapsible="icon"
          className={`border-r border-sidebar-border transition-all duration-300 ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <SidebarHeader className="shadow-sm">
            <div className="flex items-center justify-center p-4">
              <div
                className={`flex items-center space-x-2 transition-all duration-300 ${
                  isCollapsed ? 'justify-center w-full' : ''
                }`}
              >
                <img
                  src={logo}
                  alt="TechnoMart Logo"
                  className={`h-8 w-8 object-contain transition-all duration-300 ${
                    isCollapsed ? 'hidden' : ''
                  }`}
                />
                <span
                  className={`text-xl font-bold transition-opacity duration-300 ${
                    isCollapsed ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  TechnoMart
                </span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <NavigationSidebar isCollapsed={isCollapsed} />
          </SidebarContent>

          <SidebarFooter>
            <div
              className={`p-4 border-t border-sidebar-border flex items-center transition-all duration-300 ${
                isCollapsed ? 'justify-center' : 'justify-start space-x-3'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
                <span className="font-semibold text-sidebar-accent-foreground text-lg transition-all duration-300">
                  {avatarInitial}
                </span>
              </div>
              {!isCollapsed && (
                <div className="flex flex-col truncate transition-all duration-300">
                  <p className="font-semibold text-sidebar-foreground truncate">
                    {displayName}
                  </p>
                  <p className="text-sm text-sidebar-foreground/70 capitalize truncate">
                    {displayRole}
                  </p>
                </div>
              )}
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main content */}
        <SidebarInset className="flex flex-col transition-all duration-300">
          {/* Header */}
          <header className="flex justify-between items-center bg-white border-b px-4 py-2 h-16 shadow-sm">
            <div className="flex items-center">
              {/* Sidebar Trigger */}
              <SidebarTrigger
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="mr-2 p-2 z-10"
              >
                <Button variant="outline" size="sm">
                  {isCollapsed ? '>' : '<'}
                </Button>
              </SidebarTrigger>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full shadow-md bg-gray-200 hover:bg-white"
                title="Notifications"
                onClick={() => navigate('/notifications')} 
              >
                <Bell className="h-6 w-6 text-gray-700" strokeWidth={2.5} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs text-white bg-red-500 rounded-full">
                    {unreadNotifications}
                  </span>
                )}
              </Button>

              {/* Help */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full shadow-md bg-gray-200 hover:bg-white"
                title="Help"
                onClick={() => navigate('/help')}
              >
                <span className="h-6 w-6 flex items-center justify-center font-bold text-gray-800">
                  ?
                </span>
              </Button>

              {/* Settings */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full shadow-md bg-gray-200 hover:bg-white"
                title="Settings"
                onClick={() => navigate('/settings')}
              >
                <Settings className="h-6 w-6 text-gray-800" strokeWidth={2.5} />
              </Button>

              {/* Logout */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" title="Logout" className="ml-2">
                    <LogOut className="mr-1" /> Logout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to logout?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      You’ll be signed out of your account and may need to log
                      in again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={logout}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Logout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">
            <PageTransition>{children}</PageTransition>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
