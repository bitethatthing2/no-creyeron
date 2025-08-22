"use client";

import { Suspense } from 'react';
import { ShoppingBag } from 'lucide-react';

export default function MerchPage() {
  return (
    <div className="main-content">
      <div className="container py-8">
      <div className="flex items-center mb-8">
        <ShoppingBag className="h-6 w-6 mr-2 text-primary" />
        <h1 className="text-3xl font-bold">Merchandise</h1>
      </div>
      
      <Suspense fallback={<MerchPageSkeleton />}>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Merch Store Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            We&apos;re currently setting up our merchandise store. Check back soon to 
            purchase Side Hustle branded apparel and accessories!
          </p>
        </div>
      </Suspense>
      </div>
    </div>
  );
}

function MerchPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 h-48 animate-pulse">
              <div className="h-24 rounded-md bg-muted mb-4" />
              <div className="h-4 w-3/4 bg-muted rounded mb-2" />
              <div className="h-4 w-1/2 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
