import React from 'react';
import { Metadata } from 'next';
import { DJAuthGuard } from '@/components/dj/DJAuthGuard';
import { DJDashboard } from '@/components/dj/DJDashboard';

// =============================================================================
// METADATA CONFIGURATION
// =============================================================================

export const metadata: Metadata = {
  title: 'DJ Control Center - Side Hustle Wolf Pack',
  description: 'DJ interface for managing Wolf Pack events and communications',
  keywords: ['DJ', 'control center', 'events', 'wolf pack', 'music', 'nightlife'],
  robots: {
    index: false, // Don't index DJ interface pages
    follow: false
  },
  openGraph: {
    title: 'DJ Control Center',
    description: 'Professional DJ interface for event management',
    type: 'website',
    siteName: 'Side Hustle Wolf Pack'
  }
};

// =============================================================================
// PAGE COMPONENT
// =============================================================================

/**
 * DJ Control Center Page
 * 
 * This page provides the main interface for DJs to:
 * - Create and manage events (polls, contests, etc.)
 * - Send broadcasts to the wolfpack
 * - Monitor pack activity and engagement
 * - View real-time analytics
 * 
 * Features:
 * - Role-based authentication (DJ/Admin only)
 * - Real-time updates via Supabase
 * - Responsive design for various screen sizes
 * - Accessibility compliance
 */
export default function DJPage() {
  return (
    <DJAuthGuard>
      <div className="dj-page main-content">
        {/* Main Content - Full Screen DJ Dashboard */}
        <DJDashboard />
      </div>
    </DJAuthGuard>
  );
}