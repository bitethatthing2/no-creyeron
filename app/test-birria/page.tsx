'use client';

import { useState } from 'react';
import MenuItemCard from '@/components/menu/MenuItemCard';
import type { MenuItemWithModifiers } from '@/types/features/menu';

/**
 * Development test page for birria soup watch-it-made functionality
 */
export default function TestBirriaPage() {
  // Mock birria soup menu items for testing
  const testItems: MenuItemWithModifiers[] = [
    {
      id: 'test-birria-soup',
      name: 'Birria Soup',
      description: 'Rich and flavorful birria soup with tender meat and aromatic spices',
      price: 12.99,
      is_available: true,
      display_order: 1,
      category_id: 'birria-category',
      category: {
        id: 'birria-category',
        name: 'Birria Specialties',
        type: 'food'
      }
    },
    {
      id: 'test-birria-ramen',
      name: 'Birria Ramen',
      description: 'Fusion birria ramen with noodles in rich birria broth',
      price: 14.99,
      is_available: true,
      display_order: 2,
      category_id: 'birria-category',
      category: {
        id: 'birria-category',
        name: 'Birria Specialties',
        type: 'food'
      }
    },
    {
      id: 'test-birria-ramen-bowl',
      name: 'Birria Ramen Bowl',
      description: 'Complete birria ramen bowl with all the fixings',
      price: 16.99,
      is_available: true,
      display_order: 3,
      category_id: 'birria-category',
      category: {
        id: 'birria-category',
        name: 'Birria Specialties',
        type: 'food'
      }
    },
    {
      id: 'test-birria-bowl',
      name: 'Birria Bowl',
      description: 'Hearty birria served in a bowl with fresh toppings',
      price: 13.99,
      is_available: true,
      display_order: 4,
      category_id: 'birria-category',
      category: {
        id: 'birria-category',
        name: 'Birria Specialties',
        type: 'food'
      }
    },
    {
      id: 'test-ramen-bowl',
      name: 'Ramen Bowl',
      description: 'Classic ramen bowl with birria twist',
      price: 11.99,
      is_available: true,
      display_order: 5,
      category_id: 'birria-category',
      category: {
        id: 'birria-category',
        name: 'Birria Specialties',
        type: 'food'
      }
    }
  ];

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>This page is only available in development mode.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-yellow-400">
          🍜 Birria Soup Watch-It-Made Test
        </h1>
        
        <div className="mb-6 p-4 bg-gray-900 border border-yellow-500 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-yellow-400">Instructions:</h2>
          <ul className="space-y-1 text-gray-300">
            <li>• Each item below should show a "Watch It Made" button</li>
            <li>• Clicking the button should play: <code>/food-menu-images/birria-soup-watch-it-made.mp4</code></li>
            <li>• Items should display the birria soup image from <code>birria-soup.png</code></li>
            <li>• If no button appears, the video mapping isn't working</li>
          </ul>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testItems.map((item) => (
            <div key={item.id} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm font-mono text-gray-400 mb-2">Testing: "{item.name}"</h3>
              <MenuItemCard
                item={item}
                onAddToCart={() => {}}
              />
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-900 border border-blue-500 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-blue-400">Expected Behavior:</h2>
          <div className="space-y-2 text-gray-300">
            <p><strong>✅ Video File:</strong> <code>/food-menu-images/birria-soup-watch-it-made.mp4</code></p>
            <p><strong>✅ Image File:</strong> <code>/food-menu-images/birria-soup.png</code></p>
            <p><strong>✅ Trigger Words:</strong> "birria soup", "birria ramen", "birria bowl", "ramen bowl", "soup", "ramen"</p>
            <p><strong>✅ Button:</strong> Orange "Watch It Made" button should appear on all cards above</p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <a 
            href="/menu" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Menu
          </a>
        </div>
      </div>
    </div>
  );
}