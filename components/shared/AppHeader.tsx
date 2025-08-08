'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { DynamicLogo } from './DynamicLogo';
import { LocationSwitcher } from './LocationSwitcher';
import { BackButton } from './BackButton';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

interface AppHeaderProps {
  showLocationSwitcher?: boolean;
  showBackButton?: boolean;
  showNavigation?: boolean;
  className?: string;
}

export function AppHeader({ 
  showLocationSwitcher = true,
  showBackButton = false,
  showNavigation = true,
  className = ''
}: AppHeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Navigation items
  const navigationItems = [
    { href: '/', label: 'Home', exact: true },
    { href: '/menu', label: 'Menu' },
    { href: '/wolfpack', label: 'Wolf Pack' },
    { href: '/dj', label: 'DJ' },
    { href: '/about', label: 'About' }
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

  return (
    <header className={`sticky top-0 z-50 w-full max-w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-x-hidden ${className}`}>
      <div className="container mx-auto px-4 w-full max-w-full box-border">
        <div className="flex h-24 items-center justify-between min-w-0">
          {/* Left side - Logo and Back Button */}
          <div className="flex items-center gap-4 min-w-0 flex-shrink-0">
            {showBackButton && <BackButton />}
            
            <Link href="/" className="flex items-center">
              <DynamicLogo 
                type="brand" 
                width={200} 
                height={50} 
                className="hover:opacity-80 transition-opacity"
              />
            </Link>
          </div>

          {/* Center - Navigation (Desktop) */}
          {showNavigation && (
            <nav className="hidden md:flex items-center space-x-1 flex-1 justify-center min-w-0">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveRoute(item.href, item.exact)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right side - Location Switcher, Theme Control, Mobile Menu */}
          <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
            {showLocationSwitcher && (
              <div className="hidden sm:block">
                <LocationSwitcher />
              </div>
            )}

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

        {/* Mobile Menu */}
        {showNavigation && isMobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 py-3 space-y-1">
              {/* Mobile Location Switcher */}
              {showLocationSwitcher && (
                <div className="px-3 py-2 border-b border-border mb-2">
                  <LocationSwitcher className="w-full" />
                </div>
              )}

              {/* Mobile Navigation */}
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActiveRoute(item.href, item.exact)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// Specialized header variants for common use cases
export function WolfpackHeader() {
  return (
    <AppHeader 
      showLocationSwitcher={true}
      showBackButton={false}
      showNavigation={true}
    />
  );
}

export function MenuHeader() {
  return (
    <AppHeader 
      showLocationSwitcher={true}
      showBackButton={false}
      showNavigation={true}
    />
  );
}

export function SimpleHeader() {
  return (
    <AppHeader 
      showLocationSwitcher={false}
      showBackButton={true}
      showNavigation={false}
    />
  );
}