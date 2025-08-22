// Supabase Storage URLs for Menu Videos
// All videos are stored in the 'menu-videos' bucket in Supabase Storage
// Format: https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/[filename]

const SUPABASE_URL = 'https://tvnpgbjypnezoasbhbwx.supabase.co';
const BUCKET = 'menu-videos';

// Helper function to construct Supabase storage URL  
const getSupabaseVideoUrl = (filename: string) => {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
};

// Video URL mapping for all menu items - using exact user file names from Supabase
export const VIDEO_URLS = {
  // Food videos (stored in Supabase menu-videos bucket)
  'birria-soup-watch-it-made': getSupabaseVideoUrl('birria-soup-watch-it-made.mp4'),
  'fish-tacos-watch-it-made': getSupabaseVideoUrl('fish-tacos-watch-it-made.mp4'),
  'watch-it-being-made-queso-tacos': getSupabaseVideoUrl('watch-it-being-made-queso-tacos.mp4.mp4'),
  'watch-it-being-made-taco-salad': getSupabaseVideoUrl('watch-it-being-made-taco-salad.mp4'),
  'watch-it-be-made-burrito': getSupabaseVideoUrl('watch-it-be-made-burrito.mp4'),
  'watch-it-be-made-general': getSupabaseVideoUrl('watch-it-be-made.mp4'),
  'watch-it-made-breakfast-burrito': getSupabaseVideoUrl('watch-it-made-breakfast-burrito.mp4'),
  'watch-it-made-pizza': getSupabaseVideoUrl('watch-it-made-pizza.mp4'),
  'watch-it-being-made-torta': getSupabaseVideoUrl('watch-it-being-made-torta.mp4'),
  'watch-it-being-made-nachos': getSupabaseVideoUrl('watch-it-being-made-nachos.mp4'),
  'watch-it-be-made-hotwings': getSupabaseVideoUrl('watch-it-be-made-hotwings.mp4'),
  
  // Drink videos (stored in Supabase menu-videos bucket)
  'MARGARITA-BOARDS': getSupabaseVideoUrl('MARGARITA-BOARDS.mp4'),
  'margarita-tower': getSupabaseVideoUrl('margarita-tower.mp4.mp4'),
  'watch-it-made-vampiros': getSupabaseVideoUrl('watch-it-made-vampiros.mp4'),
  'patron-flight': getSupabaseVideoUrl('patron-flight.mp4'),
  
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
  'loaded nachos': VIDEO_URLS['watch-it-being-made-nachos'],
  'loaded nachos (cheese only)': VIDEO_URLS['watch-it-being-made-nachos'],
  'loaded nacho': VIDEO_URLS['watch-it-being-made-nachos'],
  
  // Wings
  '4 wings': VIDEO_URLS['watch-it-be-made-hotwings'],
  '8 wings': VIDEO_URLS['watch-it-be-made-hotwings'],
  'family wing pack (20 wings)': VIDEO_URLS['watch-it-be-made-hotwings'],
  'wings': VIDEO_URLS['watch-it-be-made-hotwings'],
  
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
  
  // Torta
  'torta': VIDEO_URLS['watch-it-being-made-torta'],
  'TORTA': VIDEO_URLS['watch-it-being-made-torta'],
  
  // Drinks
  'margarita board': VIDEO_URLS['MARGARITA-BOARDS'],
  'MARGARITA BOARD': VIDEO_URLS['MARGARITA-BOARDS'],
  'vampiros': VIDEO_URLS['watch-it-made-vampiros'],
  'margarita tower': VIDEO_URLS['margarita-tower'],
  'MARGARITA TOWER': VIDEO_URLS['margarita-tower'],
  'patron flight': VIDEO_URLS['patron-flight'],
  'PATRON FLIGHT': VIDEO_URLS['patron-flight'],
};

// Helper function to get video URL for a menu item
export function getMenuItemVideoUrl(itemName: string): string | null {
  const normalizedName = itemName.toLowerCase().trim();
  return MENU_VIDEO_MAPPING[normalizedName] || null;
}

// Export all URLs for reference (Supabase storage with exact file names)
export const ALL_VIDEO_FILES = [
  // Food videos (user's exact file names in Supabase menu-videos bucket)
  'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/birria-soup-watch-it-made.mp4',
  'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/fish-tacos-watch-it-made.mp4',
  'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/watch-it-being-made-queso-tacos.mp4.mp4',
  'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/watch-it-being-made-taco-salad.mp4',
  'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/watch-it-be-made-burrito.mp4',
  'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/watch-it-be-made.mp4',
  'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/watch-it-made-breakfast-burrito.mp4',
  'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/watch-it-made-pizza.mp4',
  'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/watch-it-being-made-torta.mp4',
  'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/watch-it-being-made-nachos.mp4',
  'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/watch-it-be-made-hotwings.mp4',
  // Drink videos (user's exact file names in Supabase menu-videos bucket)
  'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/MARGARITA-BOARDS.mp4',
  'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/margarita-tower.mp4.mp4',
  'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/watch-it-made-vampiros.mp4',
  'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/patron-flight.mp4',
  // Icon videos (local - if any)
  '/videos/first-box.mp4',
  '/videos/main-page-only.mp4',
  '/videos/priemer-destination.mp4',
  '/videos/video-food.mp4',
  '/videos/welcome-to-hustle.mp4'
];