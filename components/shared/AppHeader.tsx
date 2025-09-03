'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DynamicLogo } from './DynamicLogo';
import { BackButton } from './BackButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Menu, 
  X, 
  Bell, 
  MessageSquare, 
  User,
  Home,
  Utensils,
  Video,
  Users,
  Settings,
  LogOut,
  ShoppingBag,
  Search
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/lib/contexts/unified-notification-context';

interface AppHeaderProps {
  showBackButton?: boolean;
  showNavigation?: boolean;
  showUserMenu?: boolean;
  showSearch?: boolean;
  className?: string;
}

export function AppHeader({ 
  showBackButton = false,
  showNavigation = true,
  showUserMenu = true,
  showSearch = false,
  className = ''
}: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, currentUser, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  // Navigation items based on actual features in your database
  const navigationItems = [
    { 
      href: '/', 
      label: 'Home', 
      icon: Home,
      exact: true 
    },
    { 
      href: '/menu', 
      label: 'Menu', 
      icon: Utensils,
      description: 'Food & Drinks'
    },
    { 
      href: '/social', 
      label: 'Social Feed', 
      icon: Video,
      description: 'Videos & Posts'
    },
    { 
      href: '/community', 
      label: 'Community', 
      icon: Users,
      description: 'Connect with others'
    }
  ];

  // User menu items
  const userMenuItems = [
    {
      label: 'Profile',
      href: `/profile/${user?.id}`,
      icon: User
    },
    {
      label: 'Messages',
      href: '/messages',
      icon: MessageSquare
    },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: Bell,
      badge: unreadCount || 0
    },
    {
      label: 'Orders',
      href: '/orders',
      icon: ShoppingBag
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings
    }
  ];

  const isActiveRoute = (href: string, exact: boolean = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href) && href !== '/';
  };

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (currentUser?.displayName) {
      return currentUser.displayName.slice(0, 2).toUpperCase();
    }
    if (currentUser?.firstName && currentUser?.lastName) {
      return `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase();
    }
    if (currentUser?.username) {
      return currentUser.username.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - Logo and Back Button */}
          <div className="flex items-center gap-4">
            {showBackButton && <BackButton />}
            
            <Link href="/" className="flex items-center">
              <DynamicLogo 
                type="brand" 
                width={150} 
                height={40} 
                className="hover:opacity-80 transition-opacity"
              />
            </Link>
          </div>

          {/* Center - Navigation (Desktop) */}
          {showNavigation && (
            <nav className="hidden md:flex items-center space-x-1 flex-1 justify-center max-w-2xl">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActiveRoute(item.href, item.exact)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right side - Search, Notifications, User Menu */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            {showSearch && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="hidden sm:flex"
              >
                <Search size={20} />
              </Button>
            )}

            {/* Notifications */}
            {user && (
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}

            {/* Messages */}
            {user && (
              <Link href="/messages">
                <Button variant="ghost" size="icon" className="relative hidden sm:flex">
                  <MessageSquare size={20} />
                  {/* Message count would come from messaging context */}
                </Button>
              </Link>
            )}

            {/* User Menu */}
            {showUserMenu && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage 
                        src={currentUser?.avatarUrl || undefined} 
                        alt={currentUser?.displayName || 'User'} 
                      />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {currentUser?.displayName || currentUser?.username}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {currentUser?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon size={16} />
                            <span>{item.label}</span>
                          </div>
                          {(item.badge ?? 0) > 0 && (
                            <Badge variant="default" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut size={16} className="mr-2" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : showUserMenu ? (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    Sign up
                  </Button>
                </Link>
              </div>
            ) : null}

            {/* Mobile Menu Button */}
            {showNavigation && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar (when open) */}
        {showSearch && isSearchOpen && (
          <div className="border-t px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Search posts, users, menu items..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {showNavigation && isMobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="px-2 py-3 space-y-1">
              {/* Mobile Navigation */}
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                      isActiveRoute(item.href, item.exact)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon size={20} />
                    <div className="flex-1">
                      <div>{item.label}</div>
                      {item.description && (
                        <div className="text-xs opacity-80">{item.description}</div>
                      )}
                    </div>
                  </Link>
                );
              })}

              {/* Mobile User Menu Items (if logged in) */}
              {user && (
                <>
                  <div className="border-t my-2" />
                  {userMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center justify-between px-3 py-3 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={20} />
                          <span>{item.label}</span>
                        </div>
                        {(item.badge ?? 0) > 0 && (
                          <Badge variant="default">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                  <div className="border-t my-2" />
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <LogOut size={20} />
                    <span>Sign out</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// Specialized header variants for common use cases
export function MainHeader() {
  return (
    <AppHeader 
      showBackButton={false}
      showNavigation={true}
      showUserMenu={true}
      showSearch={true}
    />
  );
}

export function SimpleHeader() {
  return (
    <AppHeader 
      showBackButton={true}
      showNavigation={false}
      showUserMenu={true}
      showSearch={false}
    />
  );
}

export function MinimalHeader() {
  return (
    <AppHeader 
      showBackButton={true}
      showNavigation={false}
      showUserMenu={false}
      showSearch={false}
    />
  );
}