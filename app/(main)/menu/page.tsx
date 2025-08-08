// app/(main)/menu/page.tsx
import { Suspense } from 'react';
import MenuServer from './MenuServer';
import { Skeleton } from "@/components/ui/skeleton";

// Force dynamic rendering to prevent static generation errors
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Simple loading component using your existing Skeleton
function MenuLoading() {
  return (
    <div className="content-container">
      <div className="container mx-auto px-4 py-4 space-y-6">
        {/* Category Tabs Skeleton */}
        <div className="flex gap-2 pb-2 border-b">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
        
        {/* Menu Items Skeleton */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <main className="main-content">
      <Suspense fallback={<MenuLoading />}>
        <MenuServer />
      </Suspense>
    </main>
  );
}