// Supabase Storage URLs for Menu Videos
// All videos are stored in the 'menu-videos' bucket in Supabase Storage
// Format: https://[project-ref].supabase.co/storage/v1/object/public/menu-videos/[folder]/[filename]

const SUPABASE_URL = 'https://tvnpgbjypnezoasbhbwx.supabase.co';
const BUCKET = 'menu-videos';

// Helper function to construct Supabase storage URL
const getSupabaseVideoUrl = (folder: 'food' | 'drinks' | 'icons', filename: string) => {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${folder}/${filename}`;
};

// Video URL mapping for all menu items
export const VIDEO_URLS = {
  // Food videos
  'watch-it-made': getSupabaseVideoUrl('food', 'watch-it-made.mp4'),
  'watch-it-made-pizza': getSupabaseVideoUrl('food', 'watch-it-made-pizza.mp4'),
  'birria-soup-watch-it-made': getSupabaseVideoUrl('food', 'birria-soup-watch-it-made.mp4'),
  'fish-tacos-watch-it-made': getSupabaseVideoUrl('food', 'fish-tacos-watch-it-made.mp4'),
  'watch-it-being-made-taco-salad': getSupabaseVideoUrl('food', 'watch-it-being-made-taco-salad.mp4'),
  'watch-it-be-made-burrito': getSupabaseVideoUrl('food', 'watch-it-be-made-burrito.mp4'),
  'watch-it-made-breakfast-burrito': getSupabaseVideoUrl('food', 'watch-it-made-breakfast-burrito.mp4'),
  'watch-it-being-made-queso-tacos': getSupabaseVideoUrl('food', 'watch-it-being-made-queso-tacos.mp4'),
  
  // Drink videos
  'MARGARITA-BOARDS': getSupabaseVideoUrl('drinks', 'MARGARITA-BOARDS.mp4'),
  'margarita-tower': getSupabaseVideoUrl('drinks', 'margarita-tower.mp4'),
  'watch-it-made-vampiros': getSupabaseVideoUrl('drinks', 'watch-it-made-vampiros.mp4'),
  
  // Icon/promotional videos
  'first-box': getSupabaseVideoUrl('icons', 'first-box.mp4'),
  'main-page-only': getSupabaseVideoUrl('icons', 'main-page-only.mp4'),
  'priemer-destination': getSupabaseVideoUrl('icons', 'priemer-destination.mp4'),
  'video-food': getSupabaseVideoUrl('icons', 'video-food.mp4'),
  'welcome-to-hustle': getSupabaseVideoUrl('icons', 'welcome-to-hustle.mp4'),
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

// Export all URLs for reference
export const ALL_VIDEO_FILES = [
  // Food videos
  'birria-soup-watch-it-made.mp4',
  'fish-tacos-watch-it-made.mp4',
  'watch-it-be-made-burrito.mp4',
  'watch-it-being-made-queso-tacos.mp4',
  'watch-it-being-made-taco-salad.mp4',
  'watch-it-made-breakfast-burrito.mp4',
  'watch-it-made-pizza.mp4',
  'watch-it-made.mp4',
  // Drink videos
  'MARGARITA-BOARDS.mp4',
  'margarita-tower.mp4',
  'watch-it-made-vampiros.mp4',
  // Icon videos
  'first-box.mp4',
  'main-page-only.mp4',
  'priemer-destination.mp4',
  'video-food.mp4',
  'welcome-to-hustle.mp4'
];