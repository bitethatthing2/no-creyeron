'use client';

import * as React from 'react';
import { Menu, Search, X, Bell, Home, User, MessageSquare, ShoppingBag, Video, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetClose
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getUserDisplayName as getDisplayName, getUserAvatarUrl } from '@/types/chat';

// Types based on your actual database schema
interface UserProfile {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  profile_image_url: string | null;
  is_verified: boolean | null;
  is_private: boolean | null;
  role: 'admin' | 'user' | null;
}

interface NavItem {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  requiresAuth?: boolean;
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
  navItems?: NavItem[];
  logo?: string;
  logoAlt?: string;
  showNotifications?: boolean;
  showSearch?: boolean;
  showMessages?: boolean;
  onSearch?: (query: string) => void;
  variant?: 'default' | 'transparent' | 'minimal' | 'dark';
  className?: string;
}

/**
 * Production-ready Header component for NEW SIDEHUSTLE
 * Uses actual database fields and proper authentication
 */
export function Header({
  title = 'Side Hustle',
  subtitle,
  navItems,
  logo = '/icons/wolf-icon.png',
  logoAlt = 'Side Hustle',
  showNotifications = true,
  showSearch = true,
  showMessages = true,
  onSearch,
  variant = 'default',
  className
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser } = useAuth();
  
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [notificationCount, setNotificationCount] = React.useState(0);
  const [messageCount, setMessageCount] = React.useState(0);
  
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  
  // Default navigation items based on your actual routes
  const defaultNavItems: NavItem[] = React.useMemo(() => [
    { href: '/', label: 'Home', icon: Home },
    { href: '/menu', label: 'Menu', icon: ShoppingBag },
    { href: '/social', label: 'Social', icon: Video },
    { href: '/messages', label: 'Messages', icon: MessageSquare, requiresAuth: true },
  ], []);

  const navigationItems = navItems || defaultNavItems;
  
  // Fetch user profile when auth user changes
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser) {
        setUserProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (!error && data) {
        setUserProfile(data);
      }
    };

    fetchUserProfile();
  }, [authUser]);

  // Fetch notification count
  React.useEffect(() => {
    const fetchCounts = async () => {
      if (!userProfile) {
        setNotificationCount(0);
        setMessageCount(0);
        return;
      }

      // Get unread notifications
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userProfile.id)
        .eq('status', 'unread');

      setNotificationCount(notifCount || 0);

      // Get unread message count (conversations with unread messages)
      const { data: conversations } = await supabase
        .from('chat_participants')
        .select(`
          conversation_id,
          last_read_at,
          chat_conversations!inner(
            last_message_at
          )
        `)
        .eq('user_id', userProfile.id);

      const unreadConversations = conversations?.filter(conv => {
        const lastMessage = Array.isArray(conv.chat_conversations) && conv.chat_conversations.length > 0
          ? conv.chat_conversations[0].last_message_at
          : undefined;
        const lastRead = conv.last_read_at;
        return lastMessage && (!lastRead || new Date(lastMessage) > new Date(lastRead));
      });

      setMessageCount(unreadConversations?.length || 0);
    };

    if (userProfile) {
      fetchCounts();
      
      // Set up real-time subscriptions
      const notificationSubscription = supabase
        .channel('header-notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userProfile.id}`
        }, () => {
          setNotificationCount(prev => prev + 1);
        })
        .subscribe();

      return () => {
        notificationSubscription.unsubscribe();
      };
    }
  }, [userProfile]);
  
  // Get background style based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'transparent':
        return 'bg-transparent text-white';
      case 'minimal':
        return 'bg-background/70 backdrop-blur-sm border-b border-border/50';
      case 'dark':
        return 'bg-gray-900 text-white border-b border-gray-800';
      default:
        return 'bg-background border-b border-border';
    }
  };
  
  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim());
      } else {
        // Default search behavior - redirect to search page
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Check if nav item is active
  const isNavItemActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Get display name for user using centralized utility
  const displayName = getDisplayName(userProfile as any);

  // Get avatar URL using centralized utility
  const avatarUrl = getUserAvatarUrl(userProfile as any);
  
  return (
    <header 
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300',
        getVariantStyles(),
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle>
                    {logo ? (
                      <div className="relative h-8 w-32">
                        <Image
                          src={logo}
                          alt={logoAlt}
                          fill
                          className="object-contain object-left"
                          priority
                        />
                      </div>
                    ) : (
                      <span className="text-lg font-bold">{title}</span>
                    )}
                  </SheetTitle>
                </SheetHeader>
                
                <ScrollArea className="mt-6 h-[calc(100vh-120px)]">
                  <nav className="space-y-1">
                    {navigationItems
                      .filter(item => !item.requiresAuth || userProfile)
                      .map((item) => {
                        const Icon = item.icon || Home;
                        const isActive = isNavItemActive(item.href);
                        
                        return (
                          <SheetClose asChild key={item.href}>
                            <Link 
                              href={item.href}
                              className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                isActive 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'hover:bg-accent hover:text-accent-foreground'
                              )}
                            >
                              <Icon className="h-5 w-5" />
                              <span className="flex-1">{item.label}</span>
                              {typeof item.badge === 'number' && item.badge > 0 && (
                                <Badge variant={isActive ? 'secondary' : 'default'}>
                                  {item.badge}
                                </Badge>
                              )}
                            </Link>
                          </SheetClose>
                        );
                      })}
                  </nav>

                  {/* User Section in Mobile Menu */}
                  {userProfile ? (
                    <div className="mt-6 border-t pt-6 space-y-1">
                      <Link
                        href={`/profile/${userProfile.id}`}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent"
                      >
                        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-purple-400 to-pink-400">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt={displayName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-white absolute inset-0 m-auto" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{displayName}</p>
                          {userProfile.is_verified && (
                            <p className="text-xs text-primary">✓ Verified</p>
                          )}
                        </div>
                      </Link>
                      
                      
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent text-left"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <div className="mt-6 border-t pt-6 space-y-2">
                      <Link
                        href="/login"
                        className="flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-primary-foreground"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/signup"
                        className="flex items-center justify-center rounded-lg border px-3 py-2"
                      >
                        Sign Up
                      </Link>
                    </div>
                  )}
                </ScrollArea>
              </SheetContent>
            </Sheet>
            
            {/* Logo/Title */}
            <Link 
              href="/" 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {logo ? (
                <div className="relative h-8 w-32">
                  <Image
                    src={logo}
                    alt={logoAlt}
                    fill
                    className="object-contain object-left"
                    priority
                  />
                </div>
              ) : (
                <h1 className="text-lg font-bold md:text-xl">
                  {title}
                </h1>
              )}
            </Link>
            
            {/* Subtitle */}
            {subtitle && (
              <span className="hidden text-sm text-muted-foreground md:inline-block">
                {subtitle}
              </span>
            )}
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:flex-1 md:justify-center md:gap-1">
            {navigationItems
              .filter(item => !item.requiresAuth || userProfile)
              .map((item) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(item.href);
                const badge = item.href === '/messages' ? messageCount : item.badge;
                
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                      isActive 
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{item.label}</span>
                    {typeof badge === 'number' && badge > 0 && (
                      <Badge 
                        variant={isActive ? 'secondary' : 'outline'} 
                        className="ml-1.5 h-5 px-1.5 text-xs"
                      >
                        {badge > 99 ? '99+' : badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
          </nav>
          
          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Search */}
            {showSearch && (
              <div className="relative">
                {isSearchOpen ? (
                  <form 
                    onSubmit={handleSearchSubmit}
                    className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center"
                  >
                    <div className="relative">
                      <Input
                        ref={searchInputRef}
                        type="search"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-[200px] pr-10 md:w-[300px]"
                        aria-label="Search"
                        autoFocus
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        className="absolute right-0 top-0 h-full hover:bg-transparent"
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        aria-label="Close search"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSearchOpen(true)}
                    aria-label="Open search"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                )}
              </div>
            )}
            
            {/* Messages (Mobile) */}
            {showMessages && userProfile && (
              <Link href="/messages" className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  aria-label={`Messages${messageCount > 0 ? ` (${messageCount} unread)` : ''}`}
                >
                  <MessageSquare className="h-5 w-5" />
                  {messageCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {messageCount > 99 ? '99+' : messageCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}
            
            {/* Notifications */}
            {showNotifications && userProfile && (
              <Link href="/notifications">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {/* User Avatar (Desktop) */}
            {userProfile ? (
              <Link
                href={`/profile/${userProfile.id}`}
                className="hidden md:flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity"
              >
                <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-purple-400 to-pink-400">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-white absolute inset-0 m-auto" />
                  )}
                  {userProfile.is_verified && (
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                  )}
                </div>
              </Link>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;