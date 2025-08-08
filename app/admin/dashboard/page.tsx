'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LogOut, 
  ClipboardList,
  Users,
  Bell,
  ChefHat,
  DollarSign,
  BookOpen,
  Archive
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import BroadcastCleanupManager from '@/components/admin/BroadcastArchiveManager';

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);      await supabase.auth.signOut();
      router.push('/login');
    } catch {
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Simple Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manager Dashboard</h1>
        <Button 
          variant="outline" 
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Today's Summary - Simple Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today&#39;s Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today&#39;s Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,847</div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Staff Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Action Buttons - What they actually use */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Orders Section */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => router.push('/admin/orders')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              View Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              See all customer orders and their status
            </p>
            <div className="flex gap-4 text-sm">
              <span className="text-orange-600 font-medium">5 New</span>
              <span className="text-blue-600 font-medium">8 In Progress</span>
              <span className="text-green-600 font-medium">34 Completed</span>
            </div>
          </CardContent>
        </Card>

        {/* Kitchen Display */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => router.push('/admin/kitchen')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <ChefHat className="h-6 w-6 text-orange-600" />
              </div>
              Kitchen Display
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Live view for kitchen staff to see orders
            </p>
            <p className="text-sm font-medium text-orange-600">
              13 orders pending preparation
            </p>
          </CardContent>
        </Card>

        {/* Wolf Pack Management */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => router.push('/admin/wolfpack')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              Wolf Pack Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              View active Wolf Pack members
            </p>
            <p className="text-sm text-blue-600 font-medium">
              12 members currently active
            </p>
          </CardContent>
        </Card>

        {/* Send Notification */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => router.push('/admin/notifications')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Bell className="h-6 w-6 text-purple-600" />
              </div>
              Send Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Send updates to customers
            </p>
            <p className="text-sm text-purple-600 font-medium">
              Last sent: 2 hours ago
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push('/admin/staff')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Staff Management</p>
                <p className="text-sm text-muted-foreground">View who&#39;s working</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push('/admin/sales')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Daily Sales Report</p>
                <p className="text-sm text-muted-foreground">View today&#39;s totals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push('/admin/menu')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Update Menu</p>
                <p className="text-sm text-muted-foreground">Mark items as sold out</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Broadcast Cleanup Management Section */}
      <BroadcastCleanupManager />
    </div>
  );
}