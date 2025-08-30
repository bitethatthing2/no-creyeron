// Get Supabase URL from environment or use your project URL

// Helper function to construct Supabase storage URL
// (Removed unused getSupabaseVideoUrl function)

// Separate Supabase videos from local videos for clarity
export const SUPABASE_MENU_VIDEOS = {
  // Food videos - Birria items
  "birria-soup": "birria-soup-watch-it-made.mp4",
  "birria-tacos": "birria-soup-watch-it-made.mp4",
  "birria-quesadilla": "birria-soup-watch-it-made.mp4",
  "birria-ramen": "birria-soup-watch-it-made.mp4",
  
  // Tacos
  "fish-tacos": "fish-tacos-watch-it-made.mp4",
  "queso-tacos": "watch-it-being-made-queso-tacos.mp4",
  "taco-salad": "watch-it-being-made-taco-salad.mp4",
  "street-tacos": "watch-it-being-made-queso-tacos.mp4",
  
  // Other food items
  "burrito": "watch-it-be-made-burrito.mp4",
  "general": "watch-it-be-made.mp4",
  "breakfast-burrito": "watch-it-made-breakfast-burrito.mp4",
  "pizza": "watch-it-made-pizza.mp4",
  "torta": "watch-it-being-made-torta.mp4",
  "nachos": "watch-it-being-made-nachos.mp4",
  "loaded-nachos": "watch-it-being-made-nachos.mp4",
  "hotwings": "watch-it-be-made-hotwings.mp4",
  "buffalo-wings": "watch-it-be-made-hotwings.mp4",

  // Drink videos
  "margarita-boards": "MARGARITA-BOARDS.mp4",
  "margarita-board": "MARGARITA-BOARDS.mp4",
  "margarita-tower": "margarita-tower.mp4",
  "margarita-flight": "MARGARITA-BOARDS.mp4",
  "vampiros": "watch-it-made-vampiros.mp4",
  "patron-flight": "patron-flight.mp4",
} as const;

export const LOCAL_VIDEOS = {
  "first-box": "/videos/first-box.mp4",
  "main-page-only": "/videos/main-page-only.mp4",
  "priemer-destination": "/videos/priemer-destination.mp4",
  "video-food": "/videos/video-food.mp4",
  "welcome-to-hustle": "/videos/welcome-to-hustle.mp4",
} as const;

/**
 * Get menu item video URL from Supabase storage
 */
export function getMenuItemVideoUrl(itemName: string): string | null {
  if (!itemName) return null;
  
  // Convert item name to slug format (lowercase, replace spaces with hyphens)
  const slug = itemName.toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
    .trim();
  
  // Check if we have a video for this item
  const videoFileName = SUPABASE_MENU_VIDEOS[slug as keyof typeof SUPABASE_MENU_VIDEOS];
  
  // Also try partial matches for items with similar names
  if (!videoFileName) {
    // Check if the item name contains any key words that match our videos
    const keys = Object.keys(SUPABASE_MENU_VIDEOS);
    for (const key of keys) {
      if (slug.includes(key) || key.includes(slug.split('-')[0])) {
        const matchedVideo = SUPABASE_MENU_VIDEOS[key as keyof typeof SUPABASE_MENU_VIDEOS];
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tvnpgbjypnezoasbhbwx.supabase.co';
        return `${baseUrl}/storage/v1/object/public/menu-videos/${matchedVideo}`;
      }
    }
  }
  
  if (videoFileName) {
    // Return Supabase storage URL for the video
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tvnpgbjypnezoasbhbwx.supabase.co';
    const url = `${baseUrl}/storage/v1/object/public/menu-videos/${videoFileName}`;
    return url;
  }
  
  return null;
}
