'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BarChart3, 
  Settings, 
  Shield,
  Bell,
  MessageSquare,
  ChevronDown,
  LogOut,
  UserCheck,
  Home,
  Video,
  ShoppingBag,
  Database
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Dashboard {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
  description: string;
  requiredRole?: 'admin' | 'user';
  enabled: boolean;
}

interface SuperAdminDashboardSwitcherProps {
  className?: string;
}

const SuperAdminDashboardSwitcher: React.FC<SuperAdminDashboardSwitcherProps> = ({ 
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, loading: authLoading } = useAuth();

  // Determine current dashboard based on pathname
  const getCurrentDashboard = () => {
    if (pathname.startsWith('/admin')) return 'admin';
    if (pathname.startsWith('/dj')) return 'dj';
    if (pathname.startsWith('/analytics')) return 'analytics';
    if (pathname.startsWith('/events')) return 'events';
    if (pathname.startsWith('/social')) return 'social';
    if (pathname.startsWith('/menu')) return 'menu';
    return 'home';
  };

  const currentDashboard = getCurrentDashboard();

  // Define available dashboards based on your project structure
  const dashboards: Dashboard[] = [
    {
      id: 'home',
      name: 'Home',
      icon: Home,
      path: '/',
      color: 'slate',
      description: 'Main application',
      enabled: true
    },
    {
      id: 'admin',
      name: 'Admin Dashboard',
      icon: Shield,
      path: '/admin',
      color: 'purple',
      description: 'System administration',
      requiredRole: 'admin',
      enabled: true
    },
    {
      id: 'social',
      name: 'Social Feed',
      icon: Video,
      path: '/social',
      color: 'pink',
      description: 'Social content & videos',
      enabled: true
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
      color: 'blue',
      description: 'Business intelligence',
      requiredRole: 'admin',
      enabled: true
    },
    {
      id: 'users',
      name: 'User Management',
      icon: Users,
      path: '/admin/users',
      color: 'green',
      description: 'Member management',
      requiredRole: 'admin',
      enabled: true
    },
    {
      id: 'menu',
      name: 'Menu Management',
      icon: ShoppingBag,
      path: '/admin/menu',
      color: 'orange',
      description: 'Menu items & categories',
      requiredRole: 'admin',
      enabled: true
    },
    {
      id: 'content',
      name: 'Content Management',
      icon: Database,
      path: '/admin/content',
      color: 'indigo',
      description: 'Posts & media',
      requiredRole: 'admin',
      enabled: true
    },
    {
      id: 'chat',
      name: 'Chat System',
      icon: MessageSquare,
      path: '/admin/chat',
      color: 'teal',
      description: 'Chat management',
      requiredRole: 'admin',
      enabled: true
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell,
      path: '/admin/notifications',
      color: 'red',
      description: 'Push notifications',
      requiredRole: 'admin',
      enabled: true
    },
    {
      id: 'settings',
      name: 'System Settings',
      icon: Settings,
      path: '/admin/settings',
      color: 'gray',
      description: 'Configuration',
      requiredRole: 'admin',
      enabled: true
    }
  ];

  // Load user role from database
  useEffect(() => {
    const loadUserRole = async () => {
      if (!currentUser?.id) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentUser.id)
          .single();

        if (!error && data) {
          setUserRole(data.role);
        }
      } catch (error) {
        console.error('Error loading user role:', error);
      }
    };

    if (!authLoading && currentUser) {
      loadUserRole();
    }
  }, [currentUser, authLoading]);

  // Filter dashboards based on user role
  const availableDashboards = dashboards.filter(dashboard => {
    if (!dashboard.enabled) return false;
    if (!dashboard.requiredRole) return true;
    return userRole === dashboard.requiredRole;
  });

  const currentDash = availableDashboards.find(d => d.id === currentDashboard) || availableDashboards[0];

  const getColorClasses = (color: string, isBackground = true) => {
    const colors: Record<string, { bg: string; text: string; hover: string }> = {
      purple: {
        bg: 'bg-purple-500',
        hover: 'hover:bg-purple-600',
        text: 'text-purple-600'
      },
      pink: {
        bg: 'bg-pink-500',
        hover: 'hover:bg-pink-600',
        text: 'text-pink-600'
      },
      blue: {
        bg: 'bg-blue-500',
        hover: 'hover:bg-blue-600',
        text: 'text-blue-600'
      },
      green: {
        bg: 'bg-green-500',
        hover: 'hover:bg-green-600',
        text: 'text-green-600'
      },
      yellow: {
        bg: 'bg-yellow-500',
        hover: 'hover:bg-yellow-600',
        text: 'text-yellow-600'
      },
      orange: {
        bg: 'bg-orange-500',
        hover: 'hover:bg-orange-600',
        text: 'text-orange-600'
      },
      indigo: {
        bg: 'bg-indigo-500',
        hover: 'hover:bg-indigo-600',
        text: 'text-indigo-600'
      },
      teal: {
        bg: 'bg-teal-500',
        hover: 'hover:bg-teal-600',
        text: 'text-teal-600'
      },
      red: {
        bg: 'bg-red-500',
        hover: 'hover:bg-red-600',
        text: 'text-red-600'
      },
      gray: {
        bg: 'bg-gray-500',
        hover: 'hover:bg-gray-600',
        text: 'text-gray-600'
      },
      slate: {
        bg: 'bg-slate-500',
        hover: 'hover:bg-slate-600',
        text: 'text-slate-600'
      }
    };
    
    const colorSet = colors[color] || colors.gray;
    return isBackground ? `${colorSet.bg} ${colorSet.hover}` : colorSet.text;
  };

  const handleDashboardSwitch = (dashboard: Dashboard) => {
    router.push(dashboard.path);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Signed out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  // Don't render if not authenticated or still loading
  if (authLoading || !currentUser) {
    return null;
  }

  // Only show for admin users or on non-admin pages
  const showSwitcher = userRole === 'admin' || !pathname.startsWith('/admin');
  
  if (!showSwitcher) {
    return null;
  }

  return (
    <>
      {/* Floating Dashboard Switcher */}
      <div className={`fixed top-4 right-4 z-50 ${className}`}>
        <div className="relative">
          {/* Current Dashboard Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`${getColorClasses(currentDash.color)} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200 transform hover:scale-105`}
            aria-label="Dashboard switcher"
          >
            <currentDash.icon className="h-5 w-5" />
            <span className="font-medium hidden sm:inline">{currentDash.name}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
              />
              
              {/* Menu */}
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2">
                {/* User Info Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-full p-2">
                      <UserCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-bold">
                        {userRole === 'admin' ? 'Administrator' : 'User'}
                      </div>
                      <div className="text-sm opacity-90">
                        {currentUser.email || currentUser.username || 'User'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Grid */}
                <div className="p-2 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {availableDashboards.map((dashboard) => {
                      const Icon = dashboard.icon;
                      const isActive = dashboard.id === currentDashboard;
                      
                      return (
                        <button
                          key={dashboard.id}
                          onClick={() => handleDashboardSwitch(dashboard)}
                          className={`
                            group relative p-4 rounded-lg transition-all duration-200
                            ${isActive 
                              ? `${getColorClasses(dashboard.color)} text-white shadow-lg scale-105` 
                              : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }
                          `}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Icon className={`h-8 w-8 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                            <span className="text-xs font-medium text-center">{dashboard.name}</span>
                          </div>
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {dashboard.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Actions Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => router.push('/profile')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm"
                    >
                      <UserCheck className="h-4 w-4" />
                      Profile
                    </button>
                    <button 
                      onClick={handleSignOut}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Access Bar (Mobile Friendly) */}
      {userRole === 'admin' && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 sm:hidden">
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-2xl">
            <div className="flex items-center gap-1">
              {availableDashboards.slice(0, 4).map((dashboard) => {
                const Icon = dashboard.icon;
                const isActive = dashboard.id === currentDashboard;
                
                return (
                  <button
                    key={dashboard.id}
                    onClick={() => handleDashboardSwitch(dashboard)}
                    className={`
                      p-2 rounded-full transition-all duration-200
                      ${isActive 
                        ? 'bg-white text-gray-900 shadow-lg scale-110' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }
                    `}
                    aria-label={dashboard.name}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SuperAdminDashboardSwitcher;