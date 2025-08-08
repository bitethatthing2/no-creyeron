import React from 'react';
import Link from 'next/link';
import { NotificationProvider } from '@/components/unified';
import { Home, ShoppingBag, Users, BarChart3, BookOpen, Table2 } from 'lucide-react';

/**
 * Main admin layout
 * Provides navigation and notification context for all admin pages
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Auth will be handled client-side to avoid build errors
  return (
    <NotificationProvider>
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="mr-4 flex">
              <Link href="/admin/dashboard" className="mr-6 flex items-center space-x-2">
                <span className="font-bold">Admin Panel</span>
              </Link>
              <nav className="flex items-center space-x-6 text-sm font-medium">
                <Link
                  href="/admin/dashboard"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  <Home className="h-4 w-4 inline mr-1" />
                  Dashboard
                </Link>
                <Link
                  href="/admin/orders"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  <ShoppingBag className="h-4 w-4 inline mr-1" />
                  Orders
                </Link>
                <Link
                  href="/admin/tables"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  <Table2 className="h-4 w-4 inline mr-1" />
                  Tables
                </Link>
                <Link
                  href="/admin/menu"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  <BookOpen className="h-4 w-4 inline mr-1" />
                  Menu
                </Link>
                <Link
                  href="/admin/users"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  <Users className="h-4 w-4 inline mr-1" />
                  Users
                </Link>
                <Link
                  href="/admin/analytics"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  <BarChart3 className="h-4 w-4 inline mr-1" />
                  Analytics
                </Link>
              </nav>
            </div>
            <div className="ml-auto flex items-center space-x-4">
              <Link
                href="/"
                className="text-sm transition-colors hover:text-foreground/80 text-foreground/60"
              >
                ← Back to Site
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <div className="container py-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t">
          <div className="container flex h-14 items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Kitchen Display System
            </p>
            <p className="text-sm text-muted-foreground">
              Staff Access
            </p>
          </div>
        </footer>
      </div>
    </NotificationProvider>
  );
}