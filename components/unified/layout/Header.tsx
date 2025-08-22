'use client';

import * as React from 'react';
import { Menu, Search, X, Bell, Home, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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

// Types
interface NavItem {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  isActive?: boolean;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  navItems?: NavItem[];
  logo?: string;
  logoAlt?: string;
  showNotifications?: boolean;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  variant?: 'default' | 'transparent' | 'minimal' | 'wolfpack';
  currentPath?: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
    wolfpack_status?: string;
  };
  notificationCount?: number;
  onNotificationClick?: () => void;
  className?: string;
}

/**
 * Production-ready Header component
 * Fully typed, accessible, and optimized for TikTok-style app
 */
export function Header({
  title,
  subtitle,
  navItems = [],
  logo,
  logoAlt,
  showNotifications = true,
  showSearch = false,
  onSearch,
  variant = 'default',
  currentPath = '/',
  user,
  notificationCount = 0,
  onNotificationClick,
  className
}: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  
  // Get background style based on variant
  const getVariantStyles = React.useCallback(() => {
    switch (variant) {
      case 'transparent':
        return 'bg-transparent text-white';
      case 'minimal':
        return 'bg-background/70 backdrop-blur-sm border-b border-border/50';
      case 'wolfpack':
        return 'bg-gradient-to-r from-purple-900/90 to-pink-900/90 backdrop-blur-md text-white border-b border-purple-500/20';
      default:
        return 'bg-background border-b border-border';
    }
  }, [variant]);
  
  // Handle search submit
  const handleSearchSubmit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  }, [searchQuery, onSearch]);

  // Handle search open
  const handleSearchOpen = React.useCallback(() => {
    setIsSearchOpen(true);
    // Focus input after state update
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  // Handle search close
  const handleSearchClose = React.useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, []);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        handleSearchClose();
      }
    };
    
    if (isSearchOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isSearchOpen, handleSearchClose]);

  // Check if nav item is active
  const isNavItemActive = React.useCallback((href: string) => {
    if (href === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(href);
  }, [currentPath]);
  
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
            {navItems.length > 0 && (
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant={variant === 'wolfpack' ? 'ghost' : 'ghost'} 
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
                            alt={logoAlt || title}
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
                      {navItems.map((item) => {
                        const Icon = item.icon || Home;
                        const isActive = item.isActive ?? isNavItemActive(item.href);
                        
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
                              {item.badge !== undefined && (
                                <Badge variant={isActive ? 'secondary' : 'default'}>
                                  {item.badge}
                                </Badge>
                              )}
                            </Link>
                          </SheetClose>
                        );
                      })}
                    </nav>
                  </ScrollArea>

                  {/* User Profile in Mobile Menu */}
                  {user && (
                    <div className="absolute bottom-4 left-4 right-4 border-t pt-4">
                      <Link
                        href={`/profile/${user.username}`}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent"
                      >
                        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-purple-400 to-pink-400">
                          {user.avatar_url ? (
                            <Image
                              src={user.avatar_url}
                              alt={user.username}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-white absolute inset-0 m-auto" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{user.username}</p>
                          {user.wolfpack_status === 'active' && (
                            <p className="text-xs text-purple-500">🐺 Wolfpack</p>
                          )}
                        </div>
                      </Link>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            )}
            
            {/* Logo/Title */}
            <Link 
              href="/" 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {logo ? (
                <div className="relative h-8 w-32">
                  <Image
                    src={logo}
                    alt={logoAlt || title}
                    fill
                    className="object-contain object-left"
                    priority
                  />
                </div>
              ) : (
                <h1 className={cn(
                  'text-lg font-bold md:text-xl',
                  variant === 'wolfpack' && 'bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent'
                )}>
                  {title}
                </h1>
              )}
            </Link>
            
            {/* Subtitle */}
            {subtitle && (
              <span className={cn(
                'hidden text-sm md:inline-block',
                variant === 'wolfpack' ? 'text-white/70' : 'text-muted-foreground'
              )}>
                {subtitle}
              </span>
            )}
          </div>
          
          {/* Desktop Navigation */}
          {navItems.length > 0 && (
            <nav className="hidden md:flex md:flex-1 md:justify-center md:gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.isActive ?? isNavItemActive(item.href);
                
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                      isActive 
                        ? variant === 'wolfpack'
                          ? 'bg-white/20 text-white'
                          : 'bg-accent text-accent-foreground'
                        : variant === 'wolfpack'
                          ? 'text-white/80 hover:bg-white/10 hover:text-white'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <Badge 
                        variant={isActive ? 'secondary' : 'outline'} 
                        className="ml-1.5 h-5 px-1.5 text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
          
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
                        className={cn(
                          'w-[200px] pr-10 md:w-[300px]',
                          variant === 'wolfpack' && 'bg-white/10 border-white/20 text-white placeholder:text-white/50'
                        )}
                        aria-label="Search"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        className="absolute right-0 top-0 h-full hover:bg-transparent"
                        onClick={handleSearchClose}
                        aria-label="Close search"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button
                    variant={variant === 'wolfpack' ? 'ghost' : 'ghost'}
                    size="icon"
                    onClick={handleSearchOpen}
                    aria-label="Open search"
                    className={variant === 'wolfpack' ? 'text-white hover:bg-white/10' : ''}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                )}
              </div>
            )}
            
            {/* Notifications */}
            {showNotifications && (
              <Button
                variant={variant === 'wolfpack' ? 'ghost' : 'ghost'}
                size="icon"
                onClick={onNotificationClick}
                className={cn(
                  'relative',
                  variant === 'wolfpack' && 'text-white hover:bg-white/10'
                )}
                aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </Button>
            )}

            {/* User Avatar (Desktop) */}
            {user && (
              <Link
                href={`/profile/${user.username}`}
                className="hidden md:flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity"
              >
                <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-purple-400 to-pink-400">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.username}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-white absolute inset-0 m-auto" />
                  )}
                  {user.wolfpack_status === 'active' && (
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-purple-500 border-2 border-white" />
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;