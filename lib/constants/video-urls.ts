// Get Supabase URL from environment or use your project URL

// Helper function to construct Supabase storage URL
// (Removed unused getSupabaseVideoUrl function)

// Separate Supabase videos from local videos for clarity
export const SUPABASE_MENU_VIDEOS = {
  // Food videos
  "birria-soup": "birria-soup-watch-it-made.mp4",
  "fish-tacos": "fish-tacos-watch-it-made.mp4",
  "queso-tacos": "watch-it-being-made-queso-tacos.mp4", // Fixed double .mp4
  "taco-salad": "watch-it-being-made-taco-salad.mp4",
  "burrito": "watch-it-be-made-burrito.mp4",
  "general": "watch-it-be-made.mp4",
  "breakfast-burrito": "watch-it-made-breakfast-burrito.mp4",
  "pizza": "watch-it-made-pizza.mp4",
  "torta": "watch-it-being-made-torta.mp4",
  "nachos": "watch-it-being-made-nachos.mp4",
  "hotwings": "watch-it-be-made-hotwings.mp4",

  // Drink videos
  "margarita-boards": "MARGARITA-BOARDS.mp4",
  "margarita-tower": "margarita-tower.mp4", // Fixed double .mp4
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
