'use client';

import { useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationPopover } from '../../notifications/NotificationPopover';
import Link from 'next/link';

interface NavItem {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  navItems?: NavItem[];
  logo?: string;
  showNotifications?: boolean;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  variant?: 'default' | 'transparent' | 'minimal';
}

/**
 * Unified Header component
 * Can be used in both admin and customer-facing pages
 */
export function Header({
  title,
  subtitle,
  navItems = [],
  logo,
  showNotifications = true,
  showSearch = false,
  onSearch,
  variant = 'default'
}: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get background style based on variant
  const getBgStyle = () => {
    switch (variant) {
      case 'transparent':
        return 'bg-transparent';
      case 'minimal':
        return 'bg-background/70 backdrop-blur-sm border-b border-border/50';
      default:
        return 'bg-background border-b border-border';
    }
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };
  
  return (
    <header className={`sticky top-0 z-40 w-full ${getBgStyle()}`}>
      <div className="container flex h-16 items-center px-4">
        <div className="flex items-center gap-2 md:gap-4">
          {navItems.length > 0 && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="pr-0">
                <div className="py-4 pr-6">
                  <div className="mb-4">
                    {logo ? (
                      <img src={logo} alt={title} className="h-8" />
                    ) : (
                      <h2 className="text-lg font-semibold">{title}</h2>
                    )}
                    {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                  </div>
                  <ScrollArea className="h-[calc(100vh-120px)]">
                    <nav className="space-y-2">
                      {navItems.map((item) => (
                        <Link 
                          key={item.href} 
                          href={item.href}
                          className="flex items-center gap-2 py-2 text-base font-medium"
                        >
                          {item.icon && <item.icon className="h-5 w-5" />}
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </nav>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
          )}
          
          {logo ? (
            <Link href="/">
              <img src={logo} alt={title} className="h-8" />
            </Link>
          ) : (
            <Link href="/" className="flex items-center">
              <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
            </Link>
          )}
          
          {subtitle && (
            <span className="hidden text-sm text-muted-foreground md:inline-block">
              {subtitle}
            </span>
          )}
        </div>
        
        {/* Desktop nav items */}
        {navItems.length > 0 && (
          <nav className="hidden md:flex md:flex-1 md:justify-center md:gap-6">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        )}
        
        {/* Right-side items */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          {showSearch && (
            <div className="relative">
              {isSearchOpen ? (
                <form 
                  onSubmit={handleSearchSubmit}
                  className="absolute right-0 top-0 flex w-60 md:w-80"
                >
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                    autoFocus
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setIsSearchOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <Search className="h-5 w-5" />
                  <span className="sr-only">Search</span>
                </Button>
              )}
            </div>
          )}
          
          {/* Notifications */}
          {showNotifications && (
            <div className="relative">
              <NotificationPopover />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
