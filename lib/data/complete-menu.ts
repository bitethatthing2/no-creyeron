// COMPLETE Menu data with ALL items from CSV export
import { MenuItem } from '@/types/functions/MENU_ITEMS';

export interface ExtendedMenuItem extends MenuItem {
  image_display_url?: string;
  category_display_name?: string;
}

export const COMPLETE_MENU_DATA: ExtendedMenuItem[] = [
  // ========== BIRRIA CATEGORY ==========
  {
    id: '0363f9db-7a2c-4419-af04-f67c9f6d2423',
    name: 'Birria Flautas',
    description: 'Corn tortilla filled with birria, served with consommé.',
    price: 12.00,
    category_id: 'BIRRIA',
    category_display_name: 'BIRRIA',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/birria-flautas.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 2, spice_level: 2, prep_time_minutes: 10, allergens: null
  },
  {
    id: '5dc4fbf5-fbfd-49d7-bd17-f0065cbf7005',
    name: 'Birria Queso Tacos',
    description: '3 queso birria tacos with queso oaxaca, onions, and cilantro. Served with consommé for dipping.',
    price: 16.75,
    category_id: 'BIRRIA',
    category_display_name: 'BIRRIA',
    is_featured: true,
    has_video: true,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/birria-tacos.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 2, spice_level: 2, prep_time_minutes: 15, allergens: null
  },
  {
    id: '3f3a1567-0b28-411f-b75e-fe040f765e7d',
    name: 'Birria Ramen Bowl',
    description: 'Birria tapatío noodles with cilantro and onions.',
    price: 14.75,
    category_id: 'BIRRIA',
    category_display_name: 'BIRRIA',
    is_featured: true,
    has_video: true,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/birria-ramen.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 2, spice_level: 2, prep_time_minutes: 12, allergens: null
  },
  {
    id: 'd223ac5e-d0e3-45b9-961a-7e55e9d4fcf5',
    name: 'Birria Pizza',
    description: 'Two flour tortillas with birria, cilantro, onions, and queso oaxaca.',
    price: 29.00,
    category_id: 'BIRRIA',
    category_display_name: 'BIRRIA',
    is_featured: true,
    has_video: true,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/pizza.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 2, spice_level: 2, prep_time_minutes: 18, allergens: null
  },

  // ========== MAIN DISHES ==========
  {
    id: '06ea8fa4-0bbd-414b-9763-adb8a4a51c79',
    name: 'Empanadas',
    description: 'Golden pastries filled with seasoned beef, chicken, or cheese. Served with salsa for dipping.',
    price: 7.00,
    category_id: 'Main',
    category_display_name: 'MAIN',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/empanadas.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 4, spice_level: null, prep_time_minutes: 8, allergens: null
  },
  {
    id: '1839095b-0bdc-40ca-ba3a-322ea46a6e28',
    name: 'Loaded Nachos',
    description: 'Fresh tortilla chips loaded with cheese, beans, jalapeños, sour cream, guacamole, and your choice of meat.',
    price: 18.00,
    category_id: 'Main',
    category_display_name: 'MAIN',
    is_featured: true,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/loaded-nachos.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 4, spice_level: 1, prep_time_minutes: 10, allergens: null
  },
  {
    id: '392ca3d5-54e2-4641-8280-d3c45b3f381c',
    name: 'Loaded Nachos (Cheese Only)',
    description: 'Fresh tortilla chips loaded with cheese, beans, jalapeños, sour cream, and guacamole.',
    price: 14.00,
    category_id: 'Main',
    category_display_name: 'MAIN',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/loaded-nachos.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 4, spice_level: 1, prep_time_minutes: 8, allergens: null
  },
  {
    id: '63d4f2b6-ef69-4df0-83be-009d51d374a3',
    name: 'Loaded Fries',
    description: 'Crispy fries topped with cheese, bacon, jalapeños, sour cream, and green onions.',
    price: 19.00,
    category_id: 'Main',
    category_display_name: 'MAIN',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/loaded-fries.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 4, spice_level: 1, prep_time_minutes: 12, allergens: null
  },
  {
    id: 'ec1aa207-8be3-410f-ba35-ac60da2675c7',
    name: 'Tacos',
    description: 'Authentic Mexican tacos with your choice of meat, served with onions and cilantro.',
    price: 3.75,
    category_id: 'Main',
    category_display_name: 'MAIN',
    is_featured: true,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/tacos.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 4, spice_level: 1, prep_time_minutes: 5, allergens: null
  },
  {
    id: 'c2b62718-ac4c-404c-9964-3e81e640930e',
    name: 'Burrito',
    description: 'Large flour tortilla filled with your choice of meat, rice, beans, cheese, lettuce, pico de gallo.',
    price: 14.00,
    category_id: 'Main',
    category_display_name: 'MAIN',
    is_featured: true,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/burrito.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 4, spice_level: 1, prep_time_minutes: 10, allergens: null
  },
  {
    id: 'c24eff25-c5c3-4459-beaf-87532263ae9e',
    name: 'Quesadilla',
    description: 'Large flour tortilla filled with melted cheese and your choice of meat, grilled to perfection.',
    price: 14.00,
    category_id: 'Main',
    category_display_name: 'MAIN',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/quesadilla.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 4, spice_level: null, prep_time_minutes: 8, allergens: null
  },
  {
    id: '7ced040a-3292-492b-801a-34f31156176b',
    name: 'Torta',
    description: 'Mexican sandwich on toasted bread with your choice of meat, beans, lettuce, tomato, avocado, and chili.',
    price: 12.00,
    category_id: 'Main',
    category_display_name: 'MAIN',
    is_featured: true,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/torta.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 4, spice_level: 1, prep_time_minutes: 10, allergens: null
  },
  {
    id: '910cc1fb-aea7-4895-af0d-606014b409e0',
    name: 'Mulita',
    description: 'Grilled tortilla sandwich filled with cheese and your choice of meat, served crispy and golden.',
    price: 7.75,
    category_id: 'Main',
    category_display_name: 'MAIN',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/mulita.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 4, spice_level: 1, prep_time_minutes: 8, allergens: null
  },
  {
    id: '9cbd180c-8e74-4052-b80f-6497b373291b',
    name: 'Single Queso Taco',
    description: 'Taco filled with melted cheese and your choice of meat, grilled until crispy and golden.',
    price: 6.90,
    category_id: 'Main',
    category_display_name: 'MAIN',
    is_featured: true,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/queso-taco.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 4, spice_level: 1, prep_time_minutes: 6, allergens: null
  },
  {
    id: 'ab45246d-ec2f-4894-8a5a-44c490393022',
    name: 'Hustle Bowl',
    description: 'Our signature bowl with rice, beans, your choice of protein, cheese, salsa, guacamole, and all the fixings.',
    price: 15.00,
    category_id: 'Main',
    category_display_name: 'MAIN',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/hustle-bowl.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 4, spice_level: 1, prep_time_minutes: 12, allergens: null
  },
  {
    id: 'afee86dc-1d39-41d5-b9c2-447d9051364b',
    name: 'Taco Salad',
    description: 'Fresh lettuce topped with your choice of meat, beans, cheese, tomatoes, and avocado in a crispy tortilla.',
    price: 14.00,
    category_id: 'Main',
    category_display_name: 'MAIN',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/taco-salad.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 4, spice_level: null, prep_time_minutes: 10, allergens: null
  },
  {
    id: '88c7bdfa-a06d-4598-be98-e1a8fd138bc8',
    name: 'Flautas (4)',
    description: 'Four crispy rolled tortillas filled with chicken or beef, served with guacamole, sour cream, and salsa.',
    price: 10.00,
    category_id: 'Main',
    category_display_name: 'MAIN',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/flautas.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 4, spice_level: 1, prep_time_minutes: 12, allergens: null
  },
  {
    id: 'f39d6a2d-f974-4978-a6c9-885b29988445',
    name: 'Vampiros',
    description: 'Crispy tortillas topped with beans, cheese, meat, lettuce, tomato, and crema.',
    price: 7.75,
    category_id: 'Main',
    category_display_name: 'MAIN',
    is_featured: true,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/vampiros.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 4, spice_level: 2, prep_time_minutes: 10, allergens: null
  },

  // ========== BREAKFAST ==========
  {
    id: '0dbfacbe-fa2e-4282-977e-eb0f9b11e8a9',
    name: 'Monchi Pancakes',
    description: 'Fluffy pancakes served with butter and maple syrup.',
    price: 15.00,
    category_id: 'BREAKFAST',
    category_display_name: 'BREAKFAST',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/pancakes.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 3, spice_level: null, prep_time_minutes: 12, allergens: null
  },
  {
    id: '16ecb230-1cd1-4048-a424-be4d88a73e1e',
    name: 'Ham & Potato Breakfast Burrito',
    description: 'Breakfast burrito with scrambled eggs, ham, seasoned potatoes, cheese, and salsa.',
    price: 15.00,
    category_id: 'BREAKFAST',
    category_display_name: 'BREAKFAST',
    is_featured: true,
    has_video: true,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/breakfast-burrito.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 3, spice_level: null, prep_time_minutes: 10, allergens: null
  },
  {
    id: '64dd661e-3ea5-4e9a-8cf0-6f9c931c99d1',
    name: 'Chorizo & Potato Breakfast Burrito',
    description: 'Breakfast burrito with scrambled eggs, chorizo, seasoned potatoes, cheese, and salsa.',
    price: 15.00,
    category_id: 'BREAKFAST',
    category_display_name: 'BREAKFAST',
    is_featured: true,
    has_video: true,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/breakfast-burrito.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 3, spice_level: 2, prep_time_minutes: 10, allergens: null
  },
  {
    id: '54c19f6e-fbc7-4313-a028-6bd00855301c',
    name: 'Asada & Bacon',
    description: 'Carne asada with crispy bacon, perfect breakfast combination.',
    price: 13.00,
    category_id: 'BREAKFAST',
    category_display_name: 'BREAKFAST',
    is_featured: true,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/asada-bacon.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 3, spice_level: 1, prep_time_minutes: 15, allergens: null
  },
  {
    id: '34e57a5e-89f4-40d1-bc4b-cb786ca64030',
    name: 'Chilaquiles Red',
    description: 'Traditional Mexican breakfast with crispy tortilla chips simmered in red salsa, topped with cheese.',
    price: 17.00,
    category_id: 'BREAKFAST',
    category_display_name: 'BREAKFAST',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/chilaquiles.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 3, spice_level: 2, prep_time_minutes: 15, allergens: null
  },
  {
    id: 'd829b7ec-52e5-43c1-8512-ebc934939b0e',
    name: 'Chilaquiles Green',
    description: 'Traditional Mexican breakfast with crispy tortilla chips simmered in green salsa, topped with cheese.',
    price: 17.00,
    category_id: 'BREAKFAST',
    category_display_name: 'BREAKFAST',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/chilaquiles.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 3, spice_level: 2, prep_time_minutes: 15, allergens: null
  },
  {
    id: '9be9ad00-420c-45c4-9f6e-d16a9ceffcef',
    name: 'Chicken & Waffles',
    description: 'Crispy fried chicken served on golden waffles with maple syrup and butter.',
    price: 19.00,
    category_id: 'BREAKFAST',
    category_display_name: 'BREAKFAST',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/chicken-waffles.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 3, spice_level: null, prep_time_minutes: 18, allergens: null
  },

  // ========== SEA FOOD ==========
  {
    id: '96139c4f-48ff-42f0-8867-f1c4509058fe',
    name: 'Fried Shrimp Tacos (2)',
    description: 'Two fried shrimp tacos with cabbage slaw.',
    price: 11.00,
    category_id: 'SEA FOOD',
    category_display_name: 'SEAFOOD',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/shrimp-tacos.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 5, spice_level: null, prep_time_minutes: 12, allergens: null
  },
  {
    id: 'e51bbe5b-4819-47db-8632-ad2a65dcc70c',
    name: 'Fried Fish Tacos (2)',
    description: 'Two fresh white fish tacos, beer-battered and fried, served in corn tortillas with cabbage slaw.',
    price: 11.00,
    category_id: 'SEA FOOD',
    category_display_name: 'SEAFOOD',
    is_featured: true,
    has_video: true,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/fish-tacos.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 5, spice_level: null, prep_time_minutes: 12, allergens: null
  },

  // ========== WINGS ==========
  {
    id: 'b3910293-50ac-4545-8130-5ea2a87f4b0c',
    name: '4 Wings',
    description: 'Four crispy chicken wings tossed in your choice of buffalo, BBQ, or mango habanero sauce.',
    price: 8.00,
    category_id: 'WINGS',
    category_display_name: 'WINGS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/hot-wings.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 6, spice_level: 2, prep_time_minutes: 15, allergens: null
  },
  {
    id: '6ac3592e-4906-41bb-ad54-269f78c1fce2',
    name: '8 Wings',
    description: 'Eight crispy chicken wings tossed in your choice of buffalo, BBQ, or mango habanero sauce.',
    price: 15.00,
    category_id: 'WINGS',
    category_display_name: 'WINGS',
    is_featured: true,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/hot-wings.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 6, spice_level: 2, prep_time_minutes: 20, allergens: null
  },
  {
    id: '237edd90-e7f5-4ba6-8091-f5b4c35e56f1',
    name: 'Family Wing Pack (20 Wings)',
    description: 'Twenty crispy chicken wings tossed in your choice of buffalo, BBQ, or mango habanero sauce.',
    price: 35.00,
    category_id: 'WINGS',
    category_display_name: 'WINGS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/hot-wings.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 6, spice_level: 2, prep_time_minutes: 30, allergens: null
  },

  // ========== KETO ==========
  {
    id: '8d5ba436-2379-4f10-9f6f-18e8eda7b1b5',
    name: 'Keto Taco',
    description: 'Low-carb taco served in a crispy cheese shell with your choice of protein and keto-friendly toppings.',
    price: 7.00,
    category_id: 'Keto',
    category_display_name: 'KETO',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/keto-taco.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 7, spice_level: null, prep_time_minutes: 8, allergens: null
  },

  // ========== SPECIALS ==========
  {
    id: '0ee91d36-37ea-4698-9e8d-2f3816ae39f1',
    name: 'Pork Chop Platter',
    description: 'Grilled pork chop served with rice, beans, and tortillas. A hearty traditional meal.',
    price: 18.00,
    category_id: 'Specials',
    category_display_name: 'SPECIALS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/pork-chop.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 8, spice_level: null, prep_time_minutes: 20, allergens: null
  },
  {
    id: '203c80c7-c084-40ea-854f-24e11c0818e5',
    name: 'Mango Ceviche',
    description: 'Fresh fish marinated in lime juice with mango, red onion, cilantro, and jalapeños. Served with tortilla chips.',
    price: 18.99,
    category_id: 'Specials',
    category_display_name: 'SPECIALS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/ceviche.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 8, spice_level: 1, prep_time_minutes: 15, allergens: null
  },
  {
    id: '6547df6a-f234-4723-81ae-e0ea1dfbaef8',
    name: '3 Tacos Beans and Rice',
    description: 'Three authentic tacos with your choice of meat, served with seasoned black beans and Mexican rice.',
    price: 15.00,
    category_id: 'Specials',
    category_display_name: 'SPECIALS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/tacos-combo.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 8, spice_level: 1, prep_time_minutes: 12, allergens: null
  },

  // ========== SMALL BITES ==========
  {
    id: '17826b2e-db05-4a30-986a-a7c8bcc71eed',
    name: 'Basket of Fries',
    description: 'Golden crispy french fries served hot with your choice of dipping sauce.',
    price: 7.00,
    category_id: 'Small Bites',
    category_display_name: 'SMALL BITES',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/fries.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 9, spice_level: null, prep_time_minutes: 6, allergens: null
  },
  {
    id: '465f8520-f7ad-43dc-b1d5-730090064412',
    name: 'Chips, Guac and Salsa',
    description: 'Fresh tortilla chips served with house-made guacamole and our signature salsa.',
    price: 12.00,
    category_id: 'Small Bites',
    category_display_name: 'SMALL BITES',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/chips-guac.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 9, spice_level: 1, prep_time_minutes: 5, allergens: null
  },
  {
    id: 'd7e15d51-2039-4ac9-8045-bfb6b7ed119a',
    name: 'Basket of Tots',
    description: 'Crispy tater tots served hot with ketchup or your favorite dipping sauce.',
    price: 7.00,
    category_id: 'Small Bites',
    category_display_name: 'SMALL BITES',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/tots.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 9, spice_level: null, prep_time_minutes: 6, allergens: null
  },

  // ========== SIDES ==========
  {
    id: '08d69271-2e01-4d08-a5e4-c0f3478f97c3',
    name: 'Beans and Rice',
    description: 'Seasoned black beans and Mexican rice - the perfect complement to any meal.',
    price: 7.20,
    category_id: 'Sides',
    category_display_name: 'SIDES',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/beans-rice.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 10, spice_level: null, prep_time_minutes: 3, allergens: null
  },
  {
    id: 'ce3e8b31-e1a0-47f9-a9a5-509376369193',
    name: 'Rice',
    description: 'Fluffy Mexican rice cooked with tomatoes, onions, and spices.',
    price: 3.60,
    category_id: 'Sides',
    category_display_name: 'SIDES',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/rice.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 10, spice_level: null, prep_time_minutes: 2, allergens: null
  },
  {
    id: 'f853cc7c-be5f-4723-83c7-900cfbf20289',
    name: 'Beans',
    description: 'Seasoned black beans cooked with onions, garlic, and Mexican spices.',
    price: 3.60,
    category_id: 'Sides',
    category_display_name: 'SIDES',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/food/beans.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 10, spice_level: null, prep_time_minutes: 2, allergens: null
  },

  // ========== BOARDS ==========
  {
    id: '35df6b01-fc2f-445e-b663-c1e9a41fd502',
    name: 'Margarita Board',
    description: 'Hornitos, Combier, Lime Juice, Fresh Fruit - Pineapple, Mango, Coconut, and Watermelon',
    price: 35.00,
    category_id: 'Boards',
    category_display_name: 'BOARDS',
    is_featured: true,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/margarita-board.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 11, spice_level: null, prep_time_minutes: 8, allergens: null
  },
  {
    id: 'd0793d2a-c9d9-43ef-ba9c-b90a0d12d470',
    name: 'Mimosa Board',
    description: 'Brut Champagne - CHOOSE TWO: Orange Juice, Cranberry Juice, Pineapple Juice',
    price: 19.00,
    category_id: 'Boards',
    category_display_name: 'BOARDS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/mimosa-board.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 11, spice_level: null, prep_time_minutes: 5, allergens: null
  },

  // ========== FLIGHTS ==========
  {
    id: '36bae18d-3c81-43de-8895-0de8aca9e240',
    name: 'Patron Flight',
    description: 'Patron, Fresh lime juice, and Combier - CHOOSE FOUR: Strawberry, Watermelon, Mango, Peach, Passion Fruit',
    price: 35.00,
    category_id: 'Flights',
    category_display_name: 'FLIGHTS',
    is_featured: true,
    has_video: true,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/patron-flight.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 12, spice_level: null, prep_time_minutes: 5, allergens: null
  },

  // ========== TOWERS ==========
  {
    id: '5e8c34ea-2af2-4fe2-8562-dc3f43703f77',
    name: 'Texas Margarita Tower',
    description: '88 OZ - Patron, Fresh Lime Juice, Orange Juice, Combier, and Salt',
    price: 65.00,
    category_id: 'Towers',
    category_display_name: 'TOWERS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/margarita-tower.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 13, spice_level: null, prep_time_minutes: 8, allergens: null
  },
  {
    id: 'c1bd23d6-905a-4b2d-9be2-ca153830ee16',
    name: 'Beer Tower',
    description: 'CHOOSE BEER: COORS, MODELO, NEGRA MODELO, CORONA, PACIFICO, HEFE, and CIDERS',
    price: 27.00,
    category_id: 'Towers',
    category_display_name: 'TOWERS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/beer-tower.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 13, spice_level: null, prep_time_minutes: 3, allergens: null
  },
  {
    id: 'dba15a66-8034-4aa7-929b-4f009f751146',
    name: 'Hustle Margarita Tower',
    description: 'Tower serving of Hustle Margarita (serves 4-6)',
    price: 50.00,
    category_id: 'Towers',
    category_display_name: 'TOWERS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/margarita-tower.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 13, spice_level: null, prep_time_minutes: 6, allergens: null
  },

  // ========== HOUSE FAVORITES ==========
  {
    id: '0b0eb4ca-6394-4dcd-a52b-81608731521d',
    name: 'Michelada',
    description: 'Beer, Michelada Mix, and Fresh Lime',
    price: 12.00,
    category_id: 'House Favorites',
    category_display_name: 'HOUSE FAVORITES',
    is_featured: true,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/michelada.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 14, spice_level: 1, prep_time_minutes: 3, allergens: null
  },
  {
    id: '107b18d9-f91a-43e0-9a33-9ff8fac61870',
    name: 'Peachy Beachy',
    description: 'Titos, Champaign, and Peach syrup',
    price: 12.00,
    category_id: 'House Favorites',
    category_display_name: 'HOUSE FAVORITES',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/specialty-cocktail.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 14, spice_level: null, prep_time_minutes: 4, allergens: null
  },
  {
    id: '558989b0-19ad-44fb-9ee5-9a9ecc16beb7',
    name: 'Mango Tamarindo',
    description: 'Spicy Tamarindo, Mango, and Pineapple',
    price: 12.50,
    category_id: 'House Favorites',
    category_display_name: 'HOUSE FAVORITES',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/specialty-cocktail.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 14, spice_level: 2, prep_time_minutes: 4, allergens: null
  },
  {
    id: '716b6fc4-6a50-48b9-8769-0c41ae7416fd',
    name: 'Iced Doña 70',
    description: 'Don 70, Strawberry Syrup, Peach Syrup, Lime Juice',
    price: 22.00,
    category_id: 'House Favorites',
    category_display_name: 'HOUSE FAVORITES',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/specialty-cocktail.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 14, spice_level: null, prep_time_minutes: 5, allergens: null
  },
  {
    id: '7595f4c8-1480-49c0-825b-520f7f9754ae',
    name: 'Iced Margatira',
    description: 'Don Julio Blanco, Mango, Lime Juice, Chamoy, and Tajin',
    price: 17.00,
    category_id: 'House Favorites',
    category_display_name: 'HOUSE FAVORITES',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/specialty-cocktail.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 14, spice_level: 1, prep_time_minutes: 4, allergens: null
  },
  {
    id: '863cc3cb-ff39-4945-936a-87b596b321f0',
    name: 'Pineapple Paradise',
    description: 'Grey Goose, Passion Fruit, and Pineapple',
    price: 11.00,
    category_id: 'House Favorites',
    category_display_name: 'HOUSE FAVORITES',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/specialty-cocktail.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 14, spice_level: null, prep_time_minutes: 4, allergens: null
  },
  {
    id: '8c9e7661-520e-4b13-a963-1fa6fc9e45b3',
    name: 'Iced Pina Colada',
    description: 'Captain Morgan, Coconut Syrup, and Coconut Milk',
    price: 15.00,
    category_id: 'House Favorites',
    category_display_name: 'HOUSE FAVORITES',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/pina-colada.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 14, spice_level: null, prep_time_minutes: 4, allergens: null
  },
  {
    id: '7d1702ea-246e-4943-b7d7-c9bc181403b0',
    name: 'Cantarito',
    description: 'Herradura Blanco, Orange, Lime, and Salt',
    price: 12.00,
    category_id: 'House Favorites',
    category_display_name: 'HOUSE FAVORITES',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/cantarito.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 14, spice_level: null, prep_time_minutes: 3, allergens: null
  },
  {
    id: 'ac68820f-2e5d-47f1-a61d-120118732ebc',
    name: 'Paloma',
    description: 'Cazadores, Orange, Grape Fruit Juice, Lime, and Salt',
    price: 11.00,
    category_id: 'House Favorites',
    category_display_name: 'HOUSE FAVORITES',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/paloma.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 14, spice_level: null, prep_time_minutes: 3, allergens: null
  },
  {
    id: 'a274d844-959d-4319-8048-ebb5213199af',
    name: 'Coconut Berry Dream',
    description: 'Vanilla Vodka, Huckleberry, Coconut, and Pineapple',
    price: 12.00,
    category_id: 'House Favorites',
    category_display_name: 'HOUSE FAVORITES',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/specialty-cocktail.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 14, spice_level: null, prep_time_minutes: 4, allergens: null
  },
  {
    id: 'a6a70362-3358-45db-b242-d634785011fb',
    name: 'Bloody Mary',
    description: 'Titos, Bloody Mary Mix, Pickles, Banana Peppers, Olives, and Spices',
    price: 12.00,
    category_id: 'House Favorites',
    category_display_name: 'HOUSE FAVORITES',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/bloody-mary.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 14, spice_level: 2, prep_time_minutes: 4, allergens: null
  },

  // ========== MARTINIS ==========
  {
    id: '779cdada-abb1-4de9-a0c5-9b056648262f',
    name: 'Passion Fruit Drop',
    description: 'Fresh Lemon Juice, Black Berry Syrup, and Grey Goose',
    price: 11.00,
    category_id: 'Martinis',
    category_display_name: 'MARTINIS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/martini.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 15, spice_level: null, prep_time_minutes: 3, allergens: null
  },
  {
    id: '932645d7-08cd-48f4-9e36-97b063cf7cdd',
    name: 'Lechera Espresso',
    description: 'Kahlua, Bay Leaves, Condensed Milk, and Espresso Shot',
    price: 12.00,
    category_id: 'Martinis',
    category_display_name: 'MARTINIS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/espresso-martini.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 15, spice_level: null, prep_time_minutes: 4, allergens: null
  },
  {
    id: 'a23fd3ea-3811-4af9-8ac3-bcae598447c7',
    name: 'Classic Martini',
    description: 'Gin, Vermouth, and Olive',
    price: 11.00,
    category_id: 'Martinis',
    category_display_name: 'MARTINIS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/martini.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 15, spice_level: null, prep_time_minutes: 3, allergens: null
  },
  {
    id: 'b6fa59af-8d9f-4fdc-9a13-665692e0bee4',
    name: 'Fresh Lemon Drop',
    description: 'Fresh Lemon Juice, Syrup, and Grey Goose',
    price: 11.00,
    category_id: 'Martinis',
    category_display_name: 'MARTINIS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/lemon-drop.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 15, spice_level: null, prep_time_minutes: 3, allergens: null
  },
  {
    id: 'f8e115f6-b4db-4654-8a1b-18413ab4b9ed',
    name: 'Espresso Martini',
    description: 'Espresso Shot and Kahlua',
    price: 11.00,
    category_id: 'Martinis',
    category_display_name: 'MARTINIS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/espresso-martini.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 15, spice_level: null, prep_time_minutes: 4, allergens: null
  },

  // ========== MARGARITAS ==========
  {
    id: '4d16d18f-14e2-4d32-b872-3e4dcd61ffa0',
    name: 'Hustle Margarita',
    description: 'Single serving Hustle Margarita',
    price: 15.00,
    category_id: 'Margaritas',
    category_display_name: 'MARGARITAS',
    is_featured: true,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/margarita.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 16, spice_level: null, prep_time_minutes: 3, allergens: null
  },
  {
    id: '9b286ecb-41f1-46d2-912f-114947b913fd',
    name: 'Skinny Margarita',
    description: 'Luna Azul and Fresh Lime Juice',
    price: 14.00,
    category_id: 'Margaritas',
    category_display_name: 'MARGARITAS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/margarita.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 16, spice_level: null, prep_time_minutes: 3, allergens: null
  },
  {
    id: 'd8d26f1c-7dec-48d9-97be-3e8c808f6079',
    name: 'Spicy Margarita',
    description: '818, Fresh Lime Juice, Blue Guava, and Infused Jalapenos',
    price: 14.00,
    category_id: 'Margaritas',
    category_display_name: 'MARGARITAS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/spicy-margarita.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 16, spice_level: 2, prep_time_minutes: 3, allergens: null
  },

  // ========== MALIBU BUCKETS ==========
  {
    id: '1e3e4877-2c1d-485a-b6dd-8f7b8cde9b68',
    name: 'Tropical Malibu',
    description: 'Malibu, Passion Fruit Syrup, Orange Juice, and Pineapple Juice',
    price: 15.00,
    category_id: 'Malibu Buckets',
    category_display_name: 'MALIBU BUCKETS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/tropical-cocktail.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 17, spice_level: null, prep_time_minutes: 4, allergens: null
  },
  {
    id: '2cbb4946-fea7-4671-9a23-15fb3e930687',
    name: 'Cinnamon Horchata',
    description: 'Malibu, Horchata, Sprite, and Cinnamon',
    price: 15.00,
    category_id: 'Malibu Buckets',
    category_display_name: 'MALIBU BUCKETS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/horchata.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 17, spice_level: null, prep_time_minutes: 4, allergens: null
  },
  {
    id: '2d7252d8-8e0d-4ba5-a437-58017743f1fb',
    name: 'Juicy Malibu',
    description: 'Malibu, Watermelon Syrup, Pineapple Juice, and Watermelon Redbull',
    price: 18.00,
    category_id: 'Malibu Buckets',
    category_display_name: 'MALIBU BUCKETS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/watermelon-cocktail.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 17, spice_level: null, prep_time_minutes: 4, allergens: null
  },
  {
    id: '4daf8d62-7a24-4311-ac69-52e58f481807',
    name: 'Malibu Guava',
    description: 'Malibu, Guava Syrup, and Pineapple Juice',
    price: 15.00,
    category_id: 'Malibu Buckets',
    category_display_name: 'MALIBU BUCKETS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/guava-cocktail.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 17, spice_level: null, prep_time_minutes: 4, allergens: null
  },

  // ========== REFRESHERS ==========
  {
    id: 'db0ac0bb-5ec3-4333-af22-a8ba91cf4a60',
    name: 'Mosco Mulle',
    description: 'House Vodka, Ginger Bear, Mint, and Lime',
    price: 11.00,
    category_id: 'Refreshers',
    category_display_name: 'REFRESHERS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/moscow-mule.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 18, spice_level: null, prep_time_minutes: 3, allergens: null
  },
  {
    id: 'f141de3a-61e2-4edb-99ce-6c0815986833',
    name: 'Mojito',
    description: 'Bacardi or Hornitos - Lime, Mint, Syrup, and Soda Water',
    price: 10.00,
    category_id: 'Refreshers',
    category_display_name: 'REFRESHERS',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/mojito.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 18, spice_level: null, prep_time_minutes: 4, allergens: null
  },

  // ========== BOTTLE BEER ==========
  {
    id: '11013415-3463-469d-ad82-80c7eeebef49',
    name: 'Corona',
    description: 'Classic Mexican lager beer served ice cold',
    price: 5.00,
    category_id: 'Bottle Beer',
    category_display_name: 'BEER',
    is_featured: true,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/corona.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 19, spice_level: null, prep_time_minutes: 1, allergens: null
  },
  {
    id: 'ae2d1f2d-48c7-4f91-b183-fe4d9a58d5ff',
    name: 'Modelo',
    description: 'Premium Mexican beer with a rich, full flavor',
    price: 5.00,
    category_id: 'Bottle Beer',
    category_display_name: 'BEER',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/modelo.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 19, spice_level: null, prep_time_minutes: 1, allergens: null
  },
  {
    id: '5bfba4f1-cc6e-437f-94db-c13afdab6044',
    name: 'Dos Equis',
    description: 'Mexican lager with balanced flavor',
    price: 5.25,
    category_id: 'Bottle Beer',
    category_display_name: 'BEER',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/dos-equis.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 19, spice_level: null, prep_time_minutes: 1, allergens: null
  },
  {
    id: '7b259014-954c-4a06-9213-f9e5f5d5348b',
    name: 'Negra Modelo',
    description: 'Dark Mexican beer with rich malty flavor',
    price: 5.50,
    category_id: 'Bottle Beer',
    category_display_name: 'BEER',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/negra-modelo.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 19, spice_level: null, prep_time_minutes: 1, allergens: null
  },
  {
    id: 'c3cde5e6-ec5b-4801-baf7-5cdebbde8f05',
    name: 'Pacifico',
    description: 'Light Mexican beer with crisp taste',
    price: 5.25,
    category_id: 'Bottle Beer',
    category_display_name: 'BEER',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/pacifico.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 19, spice_level: null, prep_time_minutes: 1, allergens: null
  },
  {
    id: '8428d564-d9ef-4770-a30c-14d01afcb26b',
    name: 'White Claw',
    description: 'Hard seltzer with natural fruit flavors',
    price: 5.00,
    category_id: 'Bottle Beer',
    category_display_name: 'BEER',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/white-claw.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 19, spice_level: null, prep_time_minutes: 1, allergens: null
  },

  // ========== WINE ==========
  {
    id: '22a26eba-4778-4572-9011-5f36f0a92484',
    name: 'SeaGlass Chardonnay',
    description: 'Chardonnay, Riesling',
    price: 9.00,
    category_id: 'Wine',
    category_display_name: 'WINE',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/white-wine.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 20, spice_level: null, prep_time_minutes: 2, allergens: null
  },
  {
    id: '58cc3fd3-9258-44c9-b115-dd73d98e2e14',
    name: 'Domaine Saint Vincent',
    description: 'Sparkling Brut',
    price: 8.00,
    category_id: 'Wine',
    category_display_name: 'WINE',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/champagne.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 20, spice_level: null, prep_time_minutes: 2, allergens: null
  },
  {
    id: 'd6b7d53d-43e6-4d51-a378-738222b93779',
    name: 'Lindeman Moscato',
    description: 'Sweet moscato wine',
    price: 7.50,
    category_id: 'Wine',
    category_display_name: 'WINE',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/moscato.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 20, spice_level: null, prep_time_minutes: 2, allergens: null
  },

  // ========== NON ALCOHOLIC ==========
  {
    id: '1d61aadb-332c-46db-baa6-ae109dbd11ee',
    name: 'Fountain Drinks',
    description: 'Coke, Diet Coke, Sprite, Dr Pepper, Lemonade, Sweet Ice Tea',
    price: 3.00,
    category_id: 'Non Alcoholic',
    category_display_name: 'NON-ALCOHOLIC',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/fountain-drink.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 21, spice_level: null, prep_time_minutes: 1, allergens: null
  },
  {
    id: 'cc07d884-3a79-455c-83cd-9a8e6127864c',
    name: 'Coffee',
    description: 'Fresh brewed coffee',
    price: 4.75,
    category_id: 'Non Alcoholic',
    category_display_name: 'NON-ALCOHOLIC',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/coffee.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 21, spice_level: null, prep_time_minutes: 2, allergens: null
  },
  {
    id: '80dd9af3-6004-4c17-a81d-18dc43de2d27',
    name: 'Smoothies',
    description: 'Comes w/ Whip - Flavors: Strawberry, Watermelon, Mango, Peach, Passion Fruit, Raspberry, Prickly Pear',
    price: 13.00,
    category_id: 'Non Alcoholic',
    category_display_name: 'NON-ALCOHOLIC',
    is_featured: false,
    has_video: false,
    is_available: true,
    image_display_url: 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-images/drinks/smoothie.png',
    created_at: null, updated_at: null, image_url: null, video_url: null, video_thumbnail_url: null,
    display_order: 21, spice_level: null, prep_time_minutes: 4, allergens: null
  }
];

// Helper functions
export const getCompleteItemsByCategory = (category: string): ExtendedMenuItem[] => {
  return COMPLETE_MENU_DATA.filter(item => 
    item.category_id?.toLowerCase() === category.toLowerCase() ||
    item.category_display_name?.toLowerCase() === category.toLowerCase()
  );
};

export const getCompleteFeaturedItems = (): ExtendedMenuItem[] => {
  return COMPLETE_MENU_DATA.filter(item => item.is_featured);
};

export const getCompleteItemsByType = (type: 'food' | 'drink'): ExtendedMenuItem[] => {
  const foodCategories = ['BIRRIA', 'Main', 'BREAKFAST', 'SEA FOOD', 'WINGS', 'Keto', 'Specials', 'Small Bites', 'Sides'];
  const drinkCategories = ['Boards', 'Flights', 'Towers', 'House Favorites', 'Martinis', 'Margaritas', 'Malibu Buckets', 'Refreshers', 'Bottle Beer', 'Wine', 'Non Alcoholic'];
  
  if (type === 'food') {
    return COMPLETE_MENU_DATA.filter(item => 
      foodCategories.some(cat => 
        item.category_id?.toLowerCase().includes(cat.toLowerCase()) ||
        item.category_display_name?.toLowerCase().includes(cat.toLowerCase())
      )
    );
  } else {
    return COMPLETE_MENU_DATA.filter(item => 
      drinkCategories.some(cat => 
        item.category_id?.toLowerCase().includes(cat.toLowerCase()) ||
        item.category_display_name?.toLowerCase().includes(cat.toLowerCase())
      )
    );
  }
};

export const getCompleteAllCategories = (): string[] => {
  const categories = COMPLETE_MENU_DATA.map(item => item.category_display_name || item.category_id || '');
  return Array.from(new Set(categories)).filter(cat => cat !== '').sort();
};

// Stats
export const MENU_STATS = {
  totalItems: COMPLETE_MENU_DATA.length,
  foodItems: getCompleteItemsByType('food').length,
  drinkItems: getCompleteItemsByType('drink').length,
  featuredItems: getCompleteFeaturedItems().length,
  categories: getCompleteAllCategories().length
};