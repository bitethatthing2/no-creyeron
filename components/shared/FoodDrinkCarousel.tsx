'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Utensils, Wine, Star, DollarSign, Search, Play } from 'lucide-react';
import { VideoPlayer } from '@/components/ui/VideoPlayer';
import { getSmartCacheBustedUrl } from '@/lib/utils/image-cache';
// WatchItMadeModal removed with menu cleanup
import { getMenuItemVideoUrl } from '@/lib/constants/video-urls';

interface CarouselItem {
  id: string;
  name: string;
  image: string;
  type: 'food' | 'drink';
  description: string;
  price: string;
  category: string;
  subcategory?: string;
  features?: string[];
  isPopular?: boolean;
}

const carouselItems: CarouselItem[] = [
  // FOOD ITEMS
  { 
    id: '1', 
    name: 'Birria Queso Tacos', 
    image: '/food-menu-images/queso-tacos.png', 
    type: 'food', 
    description: '3 queso birria tacos with queso oaxaca, onions, and cilantro. Served with consommé for dipping.',
    price: '$16.75',
    category: 'BIRRIA',
    subcategory: 'Food',
    features: ['Signature Item', '3 Tacos Included'],
    isPopular: true
  },
  { 
    id: '2', 
    name: 'Birria Pizza', 
    image: '/food-menu-images/birria-pizza.png', 
    type: 'food', 
    description: 'Two flour tortillas with birria, cilantro, onions, and queso oaxaca.',
    price: '$29.00',
    category: 'BIRRIA',
    subcategory: 'Food',
    features: ['Unique Creation', 'Shareable']
  },
  { 
    id: '3', 
    name: 'Birria Flautas', 
    image: '/food-menu-images/flautas.png', 
    type: 'food', 
    description: 'Corn tortilla filled with birria, served with consommé.',
    price: '$12.00',
    category: 'BIRRIA',
    subcategory: 'Food',
    features: ['Crispy Corn Tortilla', 'With Consommé']
  },
  { 
    id: '4', 
    name: 'Birria Ramen Bowl', 
    image: '/food-menu-images/birria-soup.png', 
    type: 'food', 
    description: 'Birria tapatío noodles with cilantro and onions.',
    price: '$14.75',
    category: 'BIRRIA',
    subcategory: 'Food',
    features: ['Fusion Dish', 'Hearty Bowl']
  },

  // Breakfast Items
  { 
    id: '5', 
    name: 'Chicken & Waffles', 
    image: '/food-menu-images/chicken-and-waffles.png', 
    type: 'food', 
    description: 'Crispy fried chicken served on golden waffles with maple syrup and butter.',
    price: '$19.00',
    category: 'BREAKFAST',
    subcategory: 'Food',
    features: ['Southern Style', 'Sweet & Savory']
  },
  { 
    id: '6', 
    name: 'Chilaquiles Green', 
    image: '/food-menu-images/chilaquiles-green.png', 
    type: 'food', 
    description: 'Traditional Mexican breakfast with crispy tortilla chips simmered in green salsa, topped with cheese and crema.',
    price: '$17.00',
    category: 'BREAKFAST',
    features: ['Traditional Recipe', 'Green Salsa']
  },
  { 
    id: '7', 
    name: 'Chilaquiles Red', 
    image: '/food-menu-images/chilaquiles-red.png', 
    type: 'food', 
    description: 'Traditional Mexican breakfast with crispy tortilla chips simmered in red salsa, topped with cheese and crema.',
    price: '$17.00',
    category: 'BREAKFAST',
    features: ['Traditional Recipe', 'Red Salsa']
  },
  { 
    id: '8', 
    name: 'Chorizo & Potato Breakfast Burrito', 
    image: '/food-menu-images/ham-and-potatoe-burrito.png', 
    type: 'food', 
    description: 'Breakfast burrito with scrambled eggs, chorizo, seasoned potatoes, cheese, and salsa.',
    price: '$15.00',
    category: 'BREAKFAST',
    features: ['Breakfast Item', 'Spicy Chorizo']
  },
  { 
    id: '9', 
    name: 'Ham & Potato Breakfast Burrito', 
    image: '/food-menu-images/ham-and-potatoe-burrito.png', 
    type: 'food', 
    description: 'Breakfast burrito with scrambled eggs, ham, seasoned potatoes, cheese, and salsa.',
    price: '$15.00',
    category: 'BREAKFAST',
    features: ['Breakfast Item', 'Hearty']
  },
  { 
    id: '10', 
    name: 'Monchi Pancakes', 
    image: '/food-menu-images/pancakes.jpg', 
    type: 'food', 
    description: 'Fluffy pancakes served with butter and maple syrup.',
    price: '$15.00',
    category: 'BREAKFAST',
    features: ['Fluffy', 'House Special']
  },
  { 
    id: '11', 
    name: 'Asada & Bacon', 
    image: '/food-menu-images/asada-burrito.png', 
    type: 'food', 
    description: 'Carne asada with crispy bacon, perfect breakfast combination.',
    price: '$13.00',
    category: 'BREAKFAST',
    features: ['Protein Packed', 'Breakfast Combo']
  },

  // Main Dishes
  { 
    id: '12', 
    name: 'Tacos', 
    image: '/food-menu-images/tacos.png', 
    type: 'food', 
    description: 'Authentic Mexican tacos with your choice of meat, served with onions and cilantro.',
    price: '$3.75',
    category: 'Main',
    features: ['Authentic', 'Multiple Meats Available']
  },
  { 
    id: '13', 
    name: 'Single Queso Taco', 
    image: '/food-menu-images/queso-tacos.png', 
    type: 'food', 
    description: 'Taco filled with melted cheese and your choice of meat, grilled until crispy and golden.',
    price: '$6.90',
    category: 'Main',
    features: ['Extra Cheesy', 'Grilled Crispy']
  },
  { 
    id: '14', 
    name: 'Mulita', 
    image: '/food-menu-images/mulitas.png', 
    type: 'food', 
    description: 'Grilled tortilla sandwich filled with cheese and your choice of meat, served crispy and golden.',
    price: '$7.75',
    category: 'Main',
    features: ['Crispy & Golden', 'Comfort Food']
  },
  { 
    id: '15', 
    name: 'Vampiros', 
    image: '/food-menu-images/vampiros.png', 
    type: 'food', 
    description: 'Crispy tortillas topped with beans, cheese, meat, lettuce, tomato, and crema.',
    price: '$7.75',
    category: 'Main',
    features: ['Street Food Style', 'Crispy Base']
  },
  { 
    id: '16', 
    name: 'Empanadas', 
    image: '/food-menu-images/empanadas.png', 
    type: 'food', 
    description: 'Golden pastries filled with seasoned beef, chicken, or cheese. Served with salsa for dipping.',
    price: '$7.00',
    category: 'Main',
    features: ['Golden Pastry', 'Multiple Fillings']
  },
  {
    id: '16.5',
    name: 'Burrito',
    image: '/food-menu-images/asada-burrito.png',
    type: 'food',
    description: 'Large flour tortilla filled with your choice of meat, rice, beans, cheese, lettuce, pico de gallo, and sour cream.',
    price: '$14.00',
    category: 'Main',
    features: ['Large Portion', 'Fully Loaded'],
    hasWatchItMade: true
  },
  { 
    id: '17', 
    name: 'Flautas (4)', 
    image: '/food-menu-images/flautas.png', 
    type: 'food', 
    description: 'Four crispy rolled tortillas filled with chicken or beef, served with guacamole, sour cream, and salsa verde.',
    price: '$10.00',
    category: 'Main',
    features: ['Crispy Rolled', '4 Pieces']
  },
  { 
    id: '18', 
    name: 'Quesadilla', 
    image: '/food-menu-images/quesadilla.png', 
    type: 'food', 
    description: 'Large flour tortilla filled with melted cheese and your choice of meat, grilled to perfection.',
    price: '$14.00',
    category: 'Main',
    features: ['Kid Friendly', 'Customizable']
  },
  { 
    id: '19', 
    name: 'Torta', 
    image: '/food-menu-images/torta.png', 
    type: 'food', 
    description: 'Mexican sandwich on toasted bread with your choice of meat, beans, lettuce, tomato, avocado, and chipotle mayo.',
    price: '$15.50',
    category: 'Main',
    features: ['Mexican Sandwich', 'Toasted Bread']
  },
  { 
    id: '20', 
    name: 'Hustle Bowl', 
    image: '/food-menu-images/hustle-bowl.png', 
    type: 'food', 
    description: 'Our signature bowl with rice, beans, your choice of protein, cheese, salsa, guacamole, and all the fixings.',
    price: '$15.00',
    category: 'Main',
    features: ['Build Your Own', 'Healthy Options']
  },
  { 
    id: '21', 
    name: 'Taco Salad', 
    image: '/food-menu-images/taco-salad.png', 
    type: 'food', 
    description: 'Fresh lettuce topped with your choice of meat, beans, cheese, tomatoes, and avocado in a crispy tortilla bowl.',
    price: '$14.00',
    category: 'Main',
    features: ['Fresh', 'Crispy Bowl']
  },
  { 
    id: '22', 
    name: 'Loaded Nachos', 
    image: '/food-menu-images/loaded-nacho.png', 
    type: 'food', 
    description: 'Fresh tortilla chips loaded with cheese, beans, jalapeños, sour cream, guacamole, and your choice of meat. Perfect for sharing!',
    price: '$19.00',
    category: 'Main',
    subcategory: 'Food',
    features: ['Shareable', 'Half Order $11.00'],
    isPopular: true
  },
  { 
    id: '23', 
    name: 'Loaded Nachos (Cheese Only)', 
    image: '/food-menu-images/loaded-nacho.png', 
    type: 'food', 
    description: 'Fresh tortilla chips loaded with cheese, beans, jalapeños, sour cream, and guacamole.',
    price: '$14.00',
    category: 'Main',
    features: ['Vegetarian', 'Cheese Only']
  },
  { 
    id: '24', 
    name: 'Loaded Fries', 
    image: '/food-menu-images/loaded-fries.png', 
    type: 'food', 
    description: 'Crispy fries topped with cheese, bacon, jalapeños, sour cream, and green onions.',
    price: '$19.00',
    category: 'Main',
    features: ['Fully Loaded', 'Half Order $11.00']
  },

  // Seafood
  { 
    id: '25', 
    name: 'Fried Fish Tacos (2)', 
    image: '/food-menu-images/fish-tacos.png', 
    type: 'food', 
    description: 'Two fresh white fish tacos, beer-battered and fried, served in corn tortillas with cabbage slaw and chipotle crema.',
    price: '$11.00',
    category: 'SEA FOOD',
    features: ['Fresh Fish', '2 Tacos']
  },
  { 
    id: '26', 
    name: 'Fried Shrimp Tacos (2)', 
    image: '/food-menu-images/shrimp-tacos.png', 
    type: 'food', 
    description: 'Two fried shrimp tacos with cabbage slaw and chipotle aioli on corn tortillas.',
    price: '$11.00',
    category: 'SEA FOOD',
    features: ['Fried Shrimp', '2 Tacos']
  },

  // Wings
  { 
    id: '27', 
    name: '4 Wings', 
    image: '/food-menu-images/hot-wings.png', 
    type: 'food', 
    description: 'Four crispy chicken wings tossed in your choice of buffalo, BBQ, or mango habanero sauce.',
    price: '$8.00',
    category: 'WINGS',
    features: ['Multiple Sauces', '4 Pieces']
  },
  { 
    id: '28', 
    name: '8 Wings', 
    image: '/food-menu-images/hot-wings.png', 
    type: 'food', 
    description: 'Eight crispy chicken wings tossed in your choice of buffalo, BBQ, or mango habanero sauce.',
    price: '$15.00',
    category: 'WINGS',
    features: ['Multiple Sauces', '8 Pieces']
  },
  { 
    id: '29', 
    name: 'Family Wing Pack (20 Wings)', 
    image: '/food-menu-images/hot-wings.png', 
    type: 'food', 
    description: 'Twenty crispy chicken wings tossed in your choice of buffalo, BBQ, or mango habanero sauce.',
    price: '$35.00',
    category: 'WINGS',
    features: ['Family Size', '20 Pieces']
  },

  // Keto
  { 
    id: '30', 
    name: 'Keto Taco', 
    image: '/food-menu-images/keto-tacos.png', 
    type: 'food', 
    description: 'Low-carb taco served in a crispy cheese shell with your choice of protein and keto-friendly toppings.',
    price: '$7.00',
    category: 'Keto',
    features: ['Keto-Friendly', 'Cheese Shell']
  },

  // Specials
  { 
    id: '31', 
    name: '3 Tacos Beans and Rice', 
    image: '/food-menu-images/3-tacos-beans-rice.png', 
    type: 'food', 
    description: 'Three authentic tacos with your choice of meat, served with seasoned black beans and Mexican rice.',
    price: '$15.00',
    category: 'Specials',
    features: ['Complete Meal', 'Choice of Meat']
  },
  { 
    id: '32', 
    name: 'Mango Ceviche', 
    image: '/food-menu-images/mango-civeche.png', 
    type: 'food', 
    description: 'Fresh fish marinated in lime juice with mango, red onion, cilantro, and jalapeños. Served with tortilla chips.',
    price: '$18.99',
    category: 'Specials',
    features: ['Fresh', 'Citrus Marinated']
  },
  { 
    id: '33', 
    name: 'Pork Chop Platter', 
    image: '/food-menu-images/porkchop-platter.png', 
    type: 'food', 
    description: 'Grilled pork chop served with rice, beans, and tortillas. A hearty traditional meal.',
    price: '$18.00',
    category: 'Specials',
    features: ['Hearty Meal', 'Traditional']
  },

  // Small Bites
  { 
    id: '34', 
    name: 'Basket of Fries', 
    image: '/food-menu-images/basket-of-fries.png', 
    type: 'food', 
    description: 'Golden crispy french fries served hot with your choice of dipping sauce.',
    price: '$7.00',
    category: 'Small Bites',
    subcategory: 'Appetizers',
    features: ['Crispy', 'Choice of Sauce']
  },
  { 
    id: '35', 
    name: 'Basket of Tots', 
    image: '/food-menu-images/basket-of-tots.png', 
    type: 'food', 
    description: 'Crispy tater tots served hot with ketchup or your favorite dipping sauce.',
    price: '$7.00',
    category: 'Small Bites',
    features: ['Crispy', 'Popular Side']
  },
  { 
    id: '36', 
    name: 'Chips, Guac and Salsa', 
    image: '/food-menu-images/chips-guac-salsa.png', 
    type: 'food', 
    description: 'Fresh tortilla chips served with house-made guacamole and our signature salsa.',
    price: '$12.00',
    category: 'Small Bites',
    features: ['House-Made', 'Fresh Daily']
  },

  // Sides
  { 
    id: '37', 
    name: 'Rice', 
    image: '/food-menu-images/rice.png', 
    type: 'food', 
    description: 'Fluffy Mexican rice cooked with tomatoes, onions, and spices.',
    price: '$3.60',
    category: 'Sides',
    features: ['Fluffy', 'Flavorful']
  },
  { 
    id: '38', 
    name: 'Beans', 
    image: '/food-menu-images/beans.png', 
    type: 'food', 
    description: 'Seasoned black beans cooked with onions, garlic, and Mexican spices.',
    price: '$3.60',
    category: 'Sides',
    features: ['Seasoned', 'Traditional']
  },
  { 
    id: '39', 
    name: 'Beans and Rice', 
    image: '/food-menu-images/beans-and-rice.png', 
    type: 'food', 
    description: 'Seasoned black beans and Mexican rice - the perfect complement to any meal.',
    price: '$7.20',
    category: 'Sides',
    features: ['Traditional', 'Perfect Side']
  },

  // DRINKS - Margaritas section removed (duplicates removed - see items 70-72)

  // House Favorites section removed (duplicates removed - see items 54, 61, 62)

  // Beer section removed (duplicates removed - see items 79-84)

  // Boards
  { 
    id: '48', 
    name: 'Margarita Board', 
    image: '/drink-menu-images/margarita-boards.png', 
    type: 'drink', 
    description: 'Hornitos, Combier, Lime Juice, Fresh Fruit - Pineapple, Mango, Coconut, and Watermelon',
    price: '$35.00',
    category: 'Boards',
    features: ['Shareable', 'Fresh Fruit']
  },
  { 
    id: '49', 
    name: 'Mimosa Board', 
    image: '/drink-menu-images/mimosa-board.png', 
    type: 'drink', 
    description: 'Brut Champagne - CHOOSE TWO: Orange Juice, Cranberry Juice, Pineapple Juice',
    price: '$19.00',
    category: 'Boards',
    features: ['Choose Two', 'Brunch Special']
  },

  // Flights
  { 
    id: '50', 
    name: 'Patron Flight', 
    image: '/drink-menu-images/patron-flight.png', 
    type: 'drink', 
    description: 'Patron, Fresh lime juice, and Combier - CHOOSE FOUR: Strawberry, Watermelon, Mango, Peach, Passion Fruit, Raspberry, Prickly Pear, Pineapple, Guava, Kiwi, Blackberry, Coconut',
    price: '$35.00',
    category: 'Flights',
    features: ['Premium Patron', 'Choose Four']
  },

  // Towers
  { 
    id: '51', 
    name: 'Beer Tower', 
    image: '/drink-menu-images/beer-tower.png', 
    type: 'drink', 
    description: 'CHOOSE BEER: COORS, MODELO, NEGRA MODELO, CORONA, PACIFICO, HEFE, and CIDERS',
    price: '$27.00',
    category: 'Towers',
    features: ['Choose Beer', 'Party Size']
  },
  { 
    id: '52', 
    name: 'Hustle Margarita Tower', 
    image: '/drink-menu-images/margarita-tower.png', 
    type: 'drink', 
    description: 'Tower serving of Hustle Margarita (serves 4-6)',
    price: '$50.00',
    category: 'Towers',
    features: ['Serves 4-6', 'Signature Recipe']
  },
  { 
    id: '53', 
    name: 'Texas Margarita Tower', 
    image: '/drink-menu-images/margarita-tower.png', 
    type: 'drink', 
    description: '88 OZ - Patron, Fresh Lime Juice, Orange Juice, Combier, and Salt',
    price: '$65.00',
    category: 'Towers',
    features: ['88 OZ', 'Premium Patron']
  },

  // House Favorites
  { 
    id: '54', 
    name: 'Bloody Mary', 
    image: '/drink-menu-images/bloody-mary.png', 
    type: 'drink', 
    description: 'Tito\'s, Bloody Mary Mix, Pickles, Banana Peppers, Olives, and Spices',
    price: '$12.00',
    category: 'House Favorites',
    features: ['Brunch Classic', 'Fully Loaded']
  },
  { 
    id: '55', 
    name: 'Cantarito', 
    image: '/drink-menu-images/cantarito.png', 
    type: 'drink', 
    description: 'Herradura Blanco, Orange, Lime, and Salt',
    price: '$12.00',
    category: 'House Favorites',
    features: ['Traditional', 'Citrus Fresh']
  },
  { 
    id: '56', 
    name: 'Coconut Berry Dream', 
    image: '/drink-menu-images/coconut-berry-dream.png', 
    type: 'drink', 
    description: 'Vanilla Vodka, Huckleberry, Coconut, and Pineapple',
    price: '$12.00',
    category: 'House Favorites',
    features: ['Tropical', 'Berry Blend']
  },
  { 
    id: '57', 
    name: 'Iced Doña 70', 
    image: '/drink-menu-images/iced-dona.png', 
    type: 'drink', 
    description: 'Don 70, Strawberry Syrup, Peach Syrup, Lime Juice',
    price: '$22.00',
    category: 'House Favorites',
    features: ['Premium Spirit', 'Fruity']
  },
  { 
    id: '58', 
    name: 'Iced Margatira', 
    image: '/drink-menu-images/skinny-margarita.png', 
    type: 'drink', 
    description: 'Don Julio Blanco, Mango, Lime Juice, Chamoy, and Tajin',
    price: '$17.00',
    category: 'House Favorites',
    features: ['Don Julio', 'Spicy Rim']
  },
  { 
    id: '59', 
    name: 'Iced Pina Colada', 
    image: '/drink-menu-images/iced-pina-colada.png', 
    type: 'drink', 
    description: 'Captain Morgan, Coconut Syrup, and Coconut Milk',
    price: '$15.00',
    category: 'House Favorites',
    features: ['Tropical Classic', 'Coconut']
  },
  { 
    id: '60', 
    name: 'Mango Tamarindo', 
    image: '/drink-menu-images/mango-tamarindo.png', 
    type: 'drink', 
    description: 'Spicy Tamarindo, Mango, and Pineapple',
    price: '$12.50',
    category: 'House Favorites',
    features: ['Spicy', 'Tropical']
  },
  { 
    id: '61', 
    name: 'Michelada', 
    image: '/drink-menu-images/michelada.png', 
    type: 'drink', 
    description: 'Beer, Michelada Mix, and Fresh Lime',
    price: '$12.00',
    category: 'House Favorites',
    features: ['Mexican Classic', 'Savory']
  },
  { 
    id: '62', 
    name: 'Paloma', 
    image: '/drink-menu-images/paloma.png', 
    type: 'drink', 
    description: 'Cazadores, Orange, Grape Fruit Juice, Lime, and Salt',
    price: '$11.00',
    category: 'House Favorites',
    features: ['Citrus Forward', 'Refreshing']
  },
  { 
    id: '63', 
    name: 'Peachy Beachy', 
    image: '/drink-menu-images/peachy-beachy.png', 
    type: 'drink', 
    description: 'Tito\'s, Champaign, and Peach syrup',
    price: '$12.00',
    category: 'House Favorites',
    features: ['Sparkling', 'Peachy']
  },
  { 
    id: '64', 
    name: 'Pineapple Paradise', 
    image: '/drink-menu-images/pineapple-paradise.png', 
    type: 'drink', 
    description: 'Grey Goose, Passion Fruit, and Pineapple',
    price: '$11.00',
    category: 'House Favorites',
    features: ['Premium Vodka', 'Tropical']
  },

  // Martinis
  { 
    id: '65', 
    name: 'Classic Martini', 
    image: '/drink-menu-images/classic-martini.png', 
    type: 'drink', 
    description: 'Gin, Vermouth, and Olive',
    price: '$11.00',
    category: 'Martinis',
    features: ['Classic', 'Timeless']
  },
  { 
    id: '66', 
    name: 'Espresso Martini', 
    image: '/drink-menu-images/espresso-martini.png', 
    type: 'drink', 
    description: 'Espresso Shot and Kahlua',
    price: '$11.00',
    category: 'Martinis',
    features: ['Coffee', 'Energizing']
  },
  { 
    id: '67', 
    name: 'Fresh Lemon Drop', 
    image: '/drink-menu-images/fresh-lemon-drop.png', 
    type: 'drink', 
    description: 'Fresh Lemon Juice, Syrup, and Grey Goose',
    price: '$11.00',
    category: 'Martinis',
    features: ['Fresh Citrus', 'Premium Vodka']
  },
  { 
    id: '68', 
    name: 'Lechera Espresso', 
    image: '/drink-menu-images/lechera-espresso.png', 
    type: 'drink', 
    description: 'Kahlua, Bay Leaves, Condensed Milk, and Espresso Shot',
    price: '$12.00',
    category: 'Martinis',
    features: ['Creamy', 'Unique']
  },
  { 
    id: '69', 
    name: 'Passion Fruit Drop', 
    image: '/drink-menu-images/passion-fruit-drop.png', 
    type: 'drink', 
    description: 'Fresh Lemon Juice, Black Berry Syrup, and Grey Goose',
    price: '$12.00',
    category: 'Martinis',
    features: ['Tropical', 'Berry']
  },

  // Margaritas (Updated)
  { 
    id: '70', 
    name: 'Hustle Margarita', 
    image: '/drink-menu-images/skinny-margarita.png', 
    type: 'drink', 
    description: 'Single serving Hustle Margarita',
    price: '$15.00',
    category: 'Margaritas',
    subcategory: 'Margaritas',
    features: ['Signature Drink', 'House Special'],
    isPopular: true
  },
  { 
    id: '71', 
    name: 'Skinny Margarita', 
    image: '/drink-menu-images/skinny-margarita.png', 
    type: 'drink', 
    description: 'Luna Azul and Fresh Lime Juice',
    price: '$14.00',
    category: 'Margaritas',
    features: ['Low Calorie', 'Fresh Lime']
  },
  { 
    id: '72', 
    name: 'Spicy Margarita', 
    image: '/drink-menu-images/skinny-margarita.png', 
    type: 'drink', 
    description: '818, Fresh Lime Juice, Blue Guava, and Infused Jalapenos',
    price: '$14.00',
    category: 'Margaritas',
    features: ['Spicy Heat', 'Jalapeño Infused']
  },

  // Malibu Buckets
  { 
    id: '73', 
    name: 'Cinnamon Horchata', 
    image: '/drink-menu-images/cinnamon-horchata.png', 
    type: 'drink', 
    description: 'Malibu, Horchata, Sprite, and Cinnamon',
    price: '$15.00',
    category: 'Malibu Buckets',
    features: ['Tropical', 'Cinnamon']
  },
  { 
    id: '74', 
    name: 'Juicy Malibu', 
    image: '/drink-menu-images/juicy-malibu.png', 
    type: 'drink', 
    description: 'Malibu, Watermelon Syrup, Pineapple Juice, and Watermelon Redbull',
    price: '$18.00',
    category: 'Malibu Buckets',
    features: ['Energizing', 'Fruity']
  },
  { 
    id: '75', 
    name: 'Malibu Guava', 
    image: '/drink-menu-images/malibu-guava.png', 
    type: 'drink', 
    description: 'Malibu, Guava Syrup, and Pineapple Juice',
    price: '$15.00',
    category: 'Malibu Buckets',
    features: ['Tropical', 'Guava']
  },
  { 
    id: '76', 
    name: 'Tropical Malibu', 
    image: '/drink-menu-images/tropical-malibu.png', 
    type: 'drink', 
    description: 'Malibu, Passion Fruit Syrup, Orange Juice, and Pineapple Juice',
    price: '$15.00',
    category: 'Malibu Buckets',
    features: ['Tropical Blend', 'Passion Fruit']
  },

  // Refreshers
  { 
    id: '77', 
    name: 'Mojito', 
    image: '/drink-menu-images/mojito.png', 
    type: 'drink', 
    description: 'Bacardi or Hornitos - Lime, Mint, Syrup, and Soda Water',
    price: '$10.00',
    category: 'Refreshers',
    features: ['Minty Fresh', 'Choose Spirit']
  },
  { 
    id: '78', 
    name: 'Mosco Mulle', 
    image: '/drink-menu-images/moscow-mule.png', 
    type: 'drink', 
    description: 'House Vodka, Ginger Bear, Mint, and Lime',
    price: '$11.00',
    category: 'Refreshers',
    features: ['Ginger', 'Refreshing']
  },

  // Bottle Beer
  { 
    id: '79', 
    name: 'Corona', 
    image: '/drink-menu-images/corona.png', 
    type: 'drink', 
    description: 'Classic Mexican lager beer served ice cold',
    price: '$5.00',
    category: 'Bottle Beer',
    subcategory: 'Beer',
    features: ['Mexican Lager', 'Ice Cold']
  },
  { 
    id: '80', 
    name: 'Modelo', 
    image: '/drink-menu-images/modelo.png', 
    type: 'drink', 
    description: 'Premium Mexican beer with a rich, full flavor',
    price: '$5.00',
    category: 'Bottle Beer',
    features: ['Premium Mexican', 'Full Flavor']
  },
  { 
    id: '81', 
    name: 'Negra Modelo', 
    image: '/drink-menu-images/modelo.png', 
    type: 'drink', 
    description: 'Dark Mexican beer with rich malty flavor',
    price: '$5.50',
    category: 'Bottle Beer',
    features: ['Dark Beer', 'Malty']
  },
  { 
    id: '82', 
    name: 'Pacifico', 
    image: '/drink-menu-images/pacifico.png', 
    type: 'drink', 
    description: 'Light Mexican beer with crisp taste',
    price: '$5.25',
    category: 'Bottle Beer',
    features: ['Light Beer', 'Crisp']
  },
  { 
    id: '83', 
    name: 'Dos Equis', 
    image: '/drink-menu-images/dos-equis.png', 
    type: 'drink', 
    description: 'Mexican lager with balanced flavor',
    price: '$5.25',
    category: 'Bottle Beer',
    features: ['Mexican Lager', 'Balanced']
  },
  { 
    id: '84', 
    name: 'White Claw', 
    image: '/drink-menu-images/white-claw.png', 
    type: 'drink', 
    description: 'Hard seltzer with natural fruit flavors',
    price: '$5.00',
    category: 'Bottle Beer',
    features: ['Hard Seltzer', 'Fruity']
  },

  // Wine
  { 
    id: '85', 
    name: 'Domaine Saint Vincent', 
    image: '/drink-menu-images/domaine-saint-vincent.png', 
    type: 'drink', 
    description: 'Sparkling Brut',
    price: '$8.00',
    category: 'Wine',
    features: ['Sparkling', 'Brut']
  },
  { 
    id: '86', 
    name: 'Lindeman Moscato', 
    image: '/drink-menu-images/lindeman-moscato.png', 
    type: 'drink', 
    description: 'Sweet moscato wine',
    price: '$7.50',
    category: 'Wine',
    features: ['Sweet', 'Moscato']
  },
  { 
    id: '87', 
    name: 'SeaGlass Chardonnay', 
    image: '/drink-menu-images/seaglass-chardonnay.png', 
    type: 'drink', 
    description: 'Chardonnay, Riesling',
    price: '$9.00',
    category: 'Wine',
    features: ['White Wine', 'Premium']
  },

  // Non Alcoholic
  { 
    id: '88', 
    name: 'Fountain Drinks', 
    image: '/drink-menu-images/fountain-drinks.png', 
    type: 'drink', 
    description: 'Coke, Diet Coke, Sprite, Dr Pepper, Lemonade, Sweet Ice Tea',
    price: '$3.00',
    category: 'Non Alcoholic',
    features: ['Variety', 'Refreshing']
  },
  { 
    id: '89', 
    name: 'Smoothies', 
    image: '/drink-menu-images/smoothies.png', 
    type: 'drink', 
    description: 'Comes w/ Whip - Flavors: Strawberry, Watermelon, Mango, Peach, Passion Fruit, Raspberry, Prickly Pear, Pineapple, Guava, Kiwi, Black Berry, and Coconut',
    price: '$13.00',
    category: 'Non Alcoholic',
    features: ['With Whip', 'Many Flavors']
  },
  { 
    id: '90', 
    name: 'Coffee', 
    image: '/drink-menu-images/coffee.png', 
    type: 'drink', 
    description: 'Fresh brewed coffee',
    price: '$4.75',
    category: 'Non Alcoholic',
    features: ['Fresh Brewed', 'Hot']
  }
];

// Function to get watch-it-made video URL for specific items
const getWatchItMadeVideo = (itemName: string, itemDescription: string): string | null => {
  return getMenuItemVideoUrl(itemName);
};

export function FoodDrinkCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(2);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'food' | 'drink' | 'popular'>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  // Watch It Made modal removed with menu cleanup
  const [sectionToggle, setSectionToggle] = useState<'food' | 'drinks'>('food');
  
  // Touch handling states
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Filter items based on active filter, section toggle, and search query
  const filteredItems = carouselItems.filter(item => {
    // Handle filtering logic
    let typeMatch = false;
    
    if (activeFilter === 'all') {
      // When "All" is selected, show items based on current section toggle
      typeMatch = item.type === (sectionToggle === 'drinks' ? 'drink' : 'food');
    } else if (activeFilter === 'popular') {
      // Show popular items only for the current section
      typeMatch = item.isPopular === true && item.type === (sectionToggle === 'drinks' ? 'drink' : 'food');
    } else if (activeFilter === 'food' || activeFilter === 'drink') {
      if (activeSubcategory === '') {
        // Show all items of this type
        typeMatch = item.type === activeFilter;
      } else {
        // Show items of specific category
        typeMatch = item.type === activeFilter && item.category === activeSubcategory;
      }
    }
    
    // Then filter by search query
    const searchMatch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subcategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.features?.some(feature => feature.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return typeMatch && searchMatch;
  });

  // Responsive items per view - more items on desktop for smaller cards
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1200) {
        setItemsPerView(3);
      } else {
        setItemsPerView(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset current index when filter or search changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeFilter, activeSubcategory, searchQuery]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = filteredItems.length - itemsPerView;
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [itemsPerView, isAutoPlaying, filteredItems.length]);

  const nextSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => {
      const maxIndex = filteredItems.length - itemsPerView;
      return prev >= maxIndex ? 0 : prev + 1;
    });
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => {
      const maxIndex = filteredItems.length - itemsPerView;
      return prev <= 0 ? maxIndex : prev - 1;
    });
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  const maxIndex = Math.max(0, filteredItems.length - itemsPerView);

  const handleFilterChange = (filter: 'all' | 'food' | 'drink' | 'popular') => {
    setActiveFilter(filter);
    setIsAutoPlaying(false);
    
    // Auto-sync section toggle when user selects food/drink categories
    if (filter === 'food') {
      setSectionToggle('food');
    } else if (filter === 'drink') {
      setSectionToggle('drinks');
    }
  };

  const handleSubcategoryChange = (subcategory: string) => {
    setActiveSubcategory(subcategory);
    setIsAutoPlaying(false);
  };

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  return (
    <div className="relative w-full">
      {/* Search Bar */}
      <div className="flex justify-center mb-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Food/Drinks Section Toggle - Side by Side */}
      <div className="flex justify-center gap-3 mb-4">
        <button
          onClick={() => {
            setSectionToggle('food');
            setCurrentIndex(0); // Reset to beginning when switching to food
            setActiveFilter('all');
            setActiveSubcategory('');
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all shadow-lg ${
            sectionToggle === 'food'
              ? 'bg-white text-black border-2 border-white'
              : 'bg-gray-800 text-gray-300 border-2 border-gray-700 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <Utensils className="w-4 h-4" />
          Food
        </button>
        <button
          onClick={() => {
            setSectionToggle('drinks');
            setCurrentIndex(0); // Reset to beginning when switching to drinks
            setActiveFilter('all');
            setActiveSubcategory('');
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all shadow-lg ${
            sectionToggle === 'drinks'
              ? 'bg-white text-black border-2 border-white'
              : 'bg-gray-800 text-gray-300 border-2 border-gray-700 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <Wine className="w-4 h-4" />
          Drinks
        </button>
      </div>

      {/* Horizontal Scrolling Chip Bar - Single Row */}
      <div className="relative mb-6">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 px-4 py-3 min-w-max">
            {/* All chip */}
            <button
              onClick={() => {
                handleFilterChange('all');
                handleSubcategoryChange('');
              }}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all min-h-[36px] ${
                activeFilter === 'all'
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All
            </button>

            {/* Popular chip - context-aware based on section */}
            <button
              onClick={() => {
                handleFilterChange('popular');
                handleSubcategoryChange('');
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all min-h-[36px] ${
                activeFilter === 'popular'
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              {sectionToggle === 'food' ? 'Food Popular' : 'Drink Popular'}
            </button>

            {/* Dynamic categories based on section toggle */}
            {sectionToggle === 'food' ? (
              /* Food categories */
              Array.from(new Set(carouselItems.filter(item => item.type === 'food').map(item => item.category))).map(category => (
                <button
                  key={category}
                  onClick={() => {
                    handleFilterChange('food');
                    handleSubcategoryChange(category);
                  }}
                  className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all min-h-[36px] ${
                    activeFilter === 'food' && activeSubcategory === category
                      ? 'bg-white text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))
            ) : (
              /* Drink categories */
              Array.from(new Set(carouselItems.filter(item => item.type === 'drink').map(item => item.category))).map(category => (
                <button
                  key={`drink-${category}`}
                  onClick={() => {
                    handleFilterChange('drink');
                    handleSubcategoryChange(category);
                  }}
                  className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all min-h-[36px] ${
                    activeFilter === 'drink' && activeSubcategory === category
                      ? 'bg-white text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))
            )}

            {/* End padding */}
            <div className="w-4 flex-shrink-0" />
          </div>
        </div>

        {/* Edge fade indicators */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent pointer-events-none" />
      </div>

      {/* Carousel Container */}
      <div 
        className="relative overflow-hidden rounded-xl"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ 
            transform: `translateX(-${currentIndex * (100 / filteredItems.length)}%)`,
            width: `${filteredItems.length * (100 / itemsPerView)}%`
          }}
        >
          {filteredItems.map((item) => (
            <div 
              key={item.id}
              className="flex-shrink-0 px-2"
              style={{ width: `${100 / filteredItems.length}%` }}
            >
              <div 
                className={`group rounded-xl shadow-lg hover:shadow-2xl border transition-all duration-300 overflow-hidden ${
                  item.isPopular 
                    ? 'bg-gradient-to-br from-red-900 to-red-800 border-red-500 shadow-red-500/25 hover:shadow-red-500/40' 
                    : 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-gray-600'
                }`}
              >
                {/* Professional Featured Image/Video */}
                <div className="aspect-square relative bg-gradient-to-br from-gray-800 to-gray-900">
                  {item.image.endsWith('.mp4') || item.image.endsWith('.webm') ? (
                    <VideoPlayer
                      src={item.image}
                      className="w-full h-full object-cover"
                      showControls={false}
                      autoPlay
                      loop
                      muted
                    />
                  ) : (
                    <Image 
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-contain object-center group-hover:scale-110 transition-transform duration-700 p-2"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  )}
                  {/* Gradient overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Price badge */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                      {item.price}
                    </span>
                  </div>
                  
                  {/* Category badge - moved to bottom right */}
                  <div className="absolute bottom-3 right-3">
                    <span className="bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                      {item.category}
                    </span>
                  </div>
                  
                  {/* Popular badge */}
                  {item.isPopular && (
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                        ⭐ POPULAR
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Professional Content Section */}
                <div className="p-4">
                  {/* Item Name */}
                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight mb-2 group-hover:text-red-400 transition-colors duration-300">
                    {item.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-300 text-sm leading-relaxed mb-3 line-clamp-2">
                    {item.description.length > 100 ? `${item.description.substring(0, 100)}...` : item.description}
                  </p>
                  
                  {/* Features */}
                  {item.features && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.features.slice(0, 2).map((feature, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs font-medium">
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Bottom section */}
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                      item.type === 'food' 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-blue-600 text-white'
                    }`}>
                      {item.type === 'food' ? <Utensils className="h-3 w-3" /> : <Wine className="h-3 w-3" />}
                      {item.type === 'food' ? 'Food' : 'Drink'}
                    </span>
                    
                    {/* Watch It Made Button - Only show if video exists */}
                    {getWatchItMadeVideo(item.name, item.description) && (
                      <button
                        onClick={() => console.log('Watch video for:', item.name)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors duration-200"
                      >
                        <Play className="h-3 w-3" />
                        <span className="tracking-wide">Watch It Made</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {filteredItems.length > itemsPerView && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 p-2 rounded-full transition-all duration-200 z-10 shadow-lg border border-gray-200"
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 p-2 rounded-full transition-all duration-200 z-10 shadow-lg border border-gray-200"
            disabled={currentIndex >= maxIndex}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Watch It Made functionality removed with menu cleanup */}

    </div>
  );
}