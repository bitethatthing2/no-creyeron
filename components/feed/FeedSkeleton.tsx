/**
 * Feed Skeleton Component
 * Loading placeholder for the wolf pack feed
 */

'use client';

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-gray-900 rounded-lg overflow-hidden animate-pulse">
          {/* Video/Thumbnail Skeleton */}
          <div className="aspect-[9/16] bg-gray-800 relative">
            {/* Play button skeleton */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-gray-700 rounded-full p-4">
                <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
              </div>
            </div>
            
            {/* User info overlay skeleton */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-600 rounded w-16"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          </div>

          {/* Action buttons skeleton */}
          <div className="flex items-center justify-between p-4 bg-black/90">
            <div className="flex items-center space-x-6">
              {/* Like button skeleton */}
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded w-8"></div>
              </div>
              
              {/* Comment button skeleton */}
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded w-8"></div>
              </div>
              
              {/* Share button skeleton */}
              <div className="w-6 h-6 bg-gray-700 rounded"></div>
            </div>
            
            {/* View count skeleton */}
            <div className="h-4 bg-gray-700 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}