"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LocationSwitcher } from '@/components/shared/LocationSwitcher';
import { usePathname } from 'next/navigation';
import { getSmartCacheBustedUrl } from '@/lib/utils/image-cache';

export function TopNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { href: '/', label: 'Home' },
    { href: '/wolfpack/feed', label: 'Wolf Pack' },
    { href: '/blog', label: 'Blog' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/20 backdrop-blur-lg border-b border-white/30" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={getSmartCacheBustedUrl('/icons/wolf-icon.png')}
              alt="Side Hustle"
              width={56}
              height={56}
              className="w-14 h-14"
            />
            <Image
              src={getSmartCacheBustedUrl('/icons/sidehustle.png')}
              alt="Side Hustle"
              width={100}
              height={32}
              className="hidden sm:block h-8"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm text-white hover:text-red-500 transition-colors ${
                  isActive(item.href) ? 'text-red-500' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            {/* More Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-sm text-white hover:text-red-500 gap-1 px-3 py-1.5 h-auto">
                  More <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white/20 backdrop-blur-lg border-white/30 shadow-2xl">
                <DropdownMenuItem asChild>
                  <Link href="/about" className="text-white hover:text-red-500">
                    About Us
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/contact" className="text-white hover:text-red-500">
                    Contact
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/careers" className="text-white hover:text-red-500">
                    Careers
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <LocationSwitcher />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/30 bg-white/20 backdrop-blur-lg rounded-b-lg shadow-xl">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block py-2 text-white hover:text-red-500 transition-colors ${
                  isActive(item.href) ? 'text-red-500' : ''
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/about"
              className="block py-2 text-white hover:text-red-500"
              onClick={() => setIsOpen(false)}
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="block py-2 text-white hover:text-red-500"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="/careers"
              className="block py-2 text-white hover:text-red-500"
              onClick={() => setIsOpen(false)}
            >
              Careers
            </Link>
            <div className="pt-4">
              <LocationSwitcher />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}