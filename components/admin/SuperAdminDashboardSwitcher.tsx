'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Mic2, 
  Users, 
  BarChart3, 
  Settings, 
  Shield,
  Package,
  DollarSign,
  Bell,
  Calendar,
  MessageSquare,
  ChevronDown,
  LogOut,
  UserCheck,
  Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Dashboard {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  path: string;
  color: string;
  description: string;
}

interface SuperAdminDashboardSwitcherProps {
  currentDashboard?: string;
  userEmail?: string;
}

const SuperAdminDashboardSwitcher: React.FC<SuperAdminDashboardSwitcherProps> = ({ 
  currentDashboard = 'admin', 
  userEmail = 'mkahler599@gmail.com' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const dashboards: Dashboard[] = [
    {
      id: 'admin',
      name: 'Admin Dashboard',
      icon: Shield,
      path: '/admin',
      color: 'purple',
      description: 'System administration'
    },
    {
      id: 'dj',
      name: 'DJ Dashboard',
      icon: Mic2,
      path: '/dj',
      color: 'pink',
      description: 'Broadcasts & events'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
      color: 'blue',
      description: 'Business intelligence'
    },
    {
      id: 'users',
      name: 'User Management',
      icon: Users,
      path: '/admin/users',
      color: 'green',
      description: 'Member management'
    },
    {
      id: 'financial',
      name: 'Financial',
      icon: DollarSign,
      path: '/admin/financial',
      color: 'yellow',
      description: 'Revenue & orders'
    },
    {
      id: 'inventory',
      name: 'Inventory',
      icon: Package,
      path: '/admin/inventory',
      color: 'orange',
      description: 'Stock management'
    },
    {
      id: 'events',
      name: 'Events',
      icon: Calendar,
      path: '/events',
      color: 'indigo',
      description: 'Event planning'
    },
    {
      id: 'chat',
      name: 'Chat Moderation',
      icon: MessageSquare,
      path: '/admin/chat-mod',
      color: 'teal',
      description: 'Wolfpack chat'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell,
      path: '/admin/notifications',
      color: 'red',
      description: 'Push notifications'
    },
    {
      id: 'settings',
      name: 'System Settings',
      icon: Settings,
      path: '/admin/settings',
      color: 'gray',
      description: 'Configuration'
    }
  ];

  const currentDash = dashboards.find(d => d.id === currentDashboard) || dashboards[0];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'bg-purple-500 hover:bg-purple-600',
      pink: 'bg-pink-500 hover:bg-pink-600',
      blue: 'bg-blue-500 hover:bg-blue-600',
      green: 'bg-green-500 hover:bg-green-600',
      yellow: 'bg-yellow-500 hover:bg-yellow-600',
      orange: 'bg-orange-500 hover:bg-orange-600',
      indigo: 'bg-indigo-500 hover:bg-indigo-600',
      teal: 'bg-teal-500 hover:bg-teal-600',
      red: 'bg-red-500 hover:bg-red-600',
      gray: 'bg-gray-500 hover:bg-gray-600'
    };
    return colors[color] || colors.gray;
  };

  const handleDashboardSwitch = (dashboard: Dashboard) => {
    router.push(dashboard.path);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    // Add your sign out logic here
    router.push('/login');
  };

  return (
    <>
      {/* Floating Dashboard Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <div className="relative">
          {/* Current Dashboard Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`${getColorClasses(currentDash.color)} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200 transform hover:scale-105`}
          >
            <currentDash.icon className="h-5 w-5" />
            <span className="font-medium">{currentDash.name}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsOpen(false)}
              />
              
              {/* Menu */}
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
                {/* User Info Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-full p-2">
                      <UserCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-bold">Supreme Admin</div>
                      <div className="text-sm opacity-90">{userEmail}</div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Grid */}
                <div className="p-2 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {dashboards.map((dashboard) => {
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
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                            }
                          `}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Icon className={`h-8 w-8 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                            <span className="text-xs font-medium">{dashboard.name}</span>
                          </div>
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            {dashboard.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Actions Footer */}
                <div className="border-t border-gray-200 p-3 bg-gray-50">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => router.push('/admin/status')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    >
                      <Activity className="h-4 w-4" />
                      System Status
                    </button>
                    <button 
                      onClick={handleSignOut}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
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

      {/* Quick Switch Bar (Alternative) */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-2xl">
          <div className="flex items-center gap-1">
            {dashboards.slice(0, 5).map((dashboard) => {
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
                  title={dashboard.name}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
            
            <div className="w-px h-6 bg-gray-700 mx-1" />
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200"
              title="All Dashboards"
            >
              <LayoutDashboard className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default SuperAdminDashboardSwitcher;