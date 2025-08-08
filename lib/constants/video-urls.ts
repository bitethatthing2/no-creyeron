// Local Video URLs for Menu Videos
// All videos are stored in the public/food-menu-images/ directory
// Format: /food-menu-images/[filename] or /drink-menu-images/[filename]

// Video URL mapping for all menu items - using exact user file names
export const VIDEO_URLS = {
  // Food videos (matching user's exact file names)
  'birria-soup-watch-it-made': '/food-menu-images/birria-soup-watch-it-made.mp4',
  'fish-tacos-watch-it-made': '/food-menu-images/fish-tacos-watch-it-made.mp4',
  'watch-it-being-made-queso-tacos': '/food-menu-images/watch-it-being-made-queso-tacos.mp4.mp4',
  'watch-it-being-made-taco-salad': '/food-menu-images/watch-it-being-made-taco-salad.mp4',
  'watch-it-be-made-burrito': '/food-menu-images/watch-it-be-made-burrito.mp4',
  'watch-it-be-made-general': '/food-menu-images/watch-it-be-made.mp4',
  'watch-it-made-breakfast-burrito': '/food-menu-images/watch-it-made-breakfast-burrito.mp4',
  'watch-it-made-pizza': '/food-menu-images/watch-it-made-pizza.mp4',
  
  // Drink videos (matching user's exact file names)
  'MARGARITA-BOARDS': '/drink-menu-images/MARGARITA-BOARDS.mp4',
  'margarita-tower': '/drink-menu-images/margarita-tower.mp4.mp4',
  'watch-it-made-vampiros': '/drink-menu-images/watch-it-made-vampiros.mp4',
  
  // Icon/promotional videos (local public folder)
  'first-box': '/videos/first-box.mp4',
  'main-page-only': '/videos/main-page-only.mp4',
  'priemer-destination': '/videos/priemer-destination.mp4',
  'video-food': '/videos/video-food.mp4',
  'welcome-to-hustle': '/videos/welcome-to-hustle.mp4',
} as const;

// Video mapping for menu items - maps item names to video keys
export const MENU_VIDEO_MAPPING: { [key: string]: string } = {
  // Nachos
  'loaded nachos': VIDEO_URLS['watch-it-made'],
  'loaded nacho': VIDEO_URLS['watch-it-made'],
  
  // Pizza
  'birria pizza': VIDEO_URLS['watch-it-made-pizza'],
  
  // Birria Ramen Bowl - multiple variations for matching
  'birria ramen bowl': VIDEO_URLS['birria-soup-watch-it-made'],
  'birria soup': VIDEO_URLS['birria-soup-watch-it-made'],
  'birria ramen': VIDEO_URLS['birria-soup-watch-it-made'],
  'BIRRIA RAMEN BOWL': VIDEO_URLS['birria-soup-watch-it-made'],
  'birria bowl': VIDEO_URLS['birria-soup-watch-it-made'],
  'ramen bowl': VIDEO_URLS['birria-soup-watch-it-made'],
  'ramen': VIDEO_URLS['birria-soup-watch-it-made'],
  'soup': VIDEO_URLS['birria-soup-watch-it-made'],
  
  // Fish Tacos
  'fried fish tacos (2)': VIDEO_URLS['fish-tacos-watch-it-made'],
  'fish tacos': VIDEO_URLS['fish-tacos-watch-it-made'],
  
  // Taco Salad
  'taco salad': VIDEO_URLS['watch-it-being-made-taco-salad'],
  
  // Burritos
  'burrito': VIDEO_URLS['watch-it-be-made-burrito'],
  'watch it be made': VIDEO_URLS['watch-it-be-made-general'],
  'ham & potato breakfast burrito': VIDEO_URLS['watch-it-made-breakfast-burrito'],
  'ham and potato breakfast burrito': VIDEO_URLS['watch-it-made-breakfast-burrito'],
  'chorizo & potato breakfast burrito': VIDEO_URLS['watch-it-made-breakfast-burrito'],
  'chorizo and potato breakfast burrito': VIDEO_URLS['watch-it-made-breakfast-burrito'],
  'asada & bacon': VIDEO_URLS['watch-it-made-breakfast-burrito'],
  'asada and bacon': VIDEO_URLS['watch-it-made-breakfast-burrito'],
  'breakfast burrito': VIDEO_URLS['watch-it-made-breakfast-burrito'],
  
  // Queso Tacos
  'birria queso tacos': VIDEO_URLS['watch-it-being-made-queso-tacos'],
  'queso birria tacos': VIDEO_URLS['watch-it-being-made-queso-tacos'],
  'single queso taco': VIDEO_URLS['watch-it-being-made-queso-tacos'],
  'queso tacos': VIDEO_URLS['watch-it-being-made-queso-tacos'],
  'queso taco': VIDEO_URLS['watch-it-being-made-queso-tacos'],
  
  // Drinks
  'margarita board': VIDEO_URLS['MARGARITA-BOARDS'],
  'MARGARITA BOARD': VIDEO_URLS['MARGARITA-BOARDS'],
  'vampiros': VIDEO_URLS['watch-it-made-vampiros'],
  'margarita tower': VIDEO_URLS['margarita-tower'],
  'MARGARITA TOWER': VIDEO_URLS['margarita-tower'],
};

// Helper function to get video URL for a menu item
export function getMenuItemVideoUrl(itemName: string): string | null {
  const normalizedName = itemName.toLowerCase().trim();
  return MENU_VIDEO_MAPPING[normalizedName] || null;
}

// Export all URLs for reference (matching user's exact file names)
export const ALL_VIDEO_FILES = [
  // Food videos (user's exact file names in public/food-menu-images/)
  '/food-menu-images/birria-soup-watch-it-made.mp4',
  '/food-menu-images/fish-tacos-watch-it-made.mp4',
  '/food-menu-images/watch-it-being-made-queso-tacos.mp4.mp4',
  '/food-menu-images/watch-it-being-made-taco-salad.mp4',
  '/food-menu-images/watch-it-be-made-burrito.mp4',
  '/food-menu-images/watch-it-be-made.mp4',
  '/food-menu-images/watch-it-made-breakfast-burrito.mp4',
  '/food-menu-images/watch-it-made-pizza.mp4',
  // Drink videos (user's exact file names in public/drink-menu-images/)
  '/drink-menu-images/MARGARITA-BOARDS.mp4',
  '/drink-menu-images/margarita-tower.mp4.mp4',
  '/drink-menu-images/watch-it-made-vampiros.mp4',
  // Icon videos (in public/videos/)
  '/videos/first-box.mp4',
  '/videos/main-page-only.mp4',
  '/videos/priemer-destination.mp4',
  '/videos/video-food.mp4',
  '/videos/welcome-to-hustle.mp4'
];