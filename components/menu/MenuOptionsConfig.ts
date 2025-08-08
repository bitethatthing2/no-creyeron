// Configuration for menu options based on categories and item types
export const MENU_OPTIONS_CONFIG = {
  wingFlavors: [
    'Buffalo', 'BBQ', 'Honey Mustard', 'Teriyaki', 
    'Lemon Pepper', 'Garlic Parmesan', 'Spicy Ranch',
    'Nashville Hot', 'Mango Habanero', 'Sweet Chili'
  ],
  
  chefaSauces: [
    'Chefa Original', 'Chefa Spicy', 'Chefa Mild', 
    'Chefa Verde', 'Chefa Chipotle', 'Chefa Fire'
  ],
  
  meatChoices: [
    'Chicken', 'Beef', 'Pork', 'Turkey', 'Chorizo', 'Carnitas'
  ],
  
  // Define which categories show which options
  categoryOptions: {
    'WINGS': ['wingFlavors'],
    'Wings': ['wingFlavors'],
    'wings': ['wingFlavors'],
    'MAIN': ['chefaSauces', 'meatChoices'],
    'Main': ['chefaSauces', 'meatChoices'],
    'main': ['chefaSauces', 'meatChoices'],
    'BREAKFAST': ['meatChoices'],
    'Breakfast': ['meatChoices'],
    'breakfast': ['meatChoices'],
    'SPECIALS': ['meatChoices', 'chefaSauces'],
    'Specials': ['meatChoices', 'chefaSauces'],
    'specials': ['meatChoices', 'chefaSauces']
  } as Record<string, string[]>,
  
  // Define which specific items require meat choices
  itemsRequiringMeat: [
    'taco', 'tacos', 'burrito', 'quesadilla', 'nachos', 
    'loaded fries', 'loaded nacho', 'loaded', 'fries', 
    'breakfast-burrito', 'omelet', 'sandwich', 'torta', 
    'bowl', 'salad'
  ],
  
  // Define which items get Chefa sauce options (main entrees)
  itemsWithChefaSauce: [
    'taco', 'tacos', 'burrito', 'quesadilla', 'nachos', 
    'loaded fries', 'loaded nacho', 'loaded', 'fries',
    'rice-bowl', 'bowl', 'salad', 'torta', 'sandwich'
  ]
};

interface MenuCategory {
  name?: string;
}

interface MenuItem {
  name?: string;
  description?: string;
}

interface ItemOptions {
  showWingFlavors: boolean;
  showMeatChoices: boolean;
  showChefaSauce: boolean;
}

// Helper functions to determine what options to show
export const getOptionsForCategory = (category: string | undefined): string[] => {
  if (!category) return [];
  
  // Try exact match first
  if (MENU_OPTIONS_CONFIG.categoryOptions[category]) {
    return MENU_OPTIONS_CONFIG.categoryOptions[category];
  }
  
  // Try case-insensitive match
  const categoryLower = category.toLowerCase();
  for (const [key, value] of Object.entries(MENU_OPTIONS_CONFIG.categoryOptions)) {
    if (key.toLowerCase() === categoryLower) {
      return value;
    }
  }
  
  return [];
};

export const shouldShowWingFlavors = (category: string | undefined): boolean => {
  if (!category) return false;
  const categoryLower = category.toLowerCase();
  return categoryLower.includes('wing') || getOptionsForCategory(category).includes('wingFlavors');
};

export const shouldShowMeatChoices = (category: string | undefined, itemType: string | undefined): boolean => {
  if (!category || !itemType) return false;
  
  const categoryAllowsMeat = getOptionsForCategory(category).includes('meatChoices');
  const itemRequiresMeat = MENU_OPTIONS_CONFIG.itemsRequiringMeat.some(
    meat => itemType.toLowerCase().includes(meat.toLowerCase())
  );
  
  return categoryAllowsMeat && itemRequiresMeat;
};

export const shouldShowChefaSauce = (category: string | undefined, itemType: string | undefined): boolean => {
  if (!category || !itemType) return false;
  
  const categoryAllowsSauce = getOptionsForCategory(category).includes('chefaSauces');
  const itemAllowsSauce = MENU_OPTIONS_CONFIG.itemsWithChefaSauce.some(
    sauce => itemType.toLowerCase().includes(sauce.toLowerCase())
  );
  
  return categoryAllowsSauce && itemAllowsSauce;
};

// Enhanced detection based on item name and description
export const detectItemOptions = (item: MenuItem, category: MenuCategory): ItemOptions => {
  const itemName = item.name?.toLowerCase() || '';
  const itemDescription = item.description?.toLowerCase() || '';
  const categoryName = category?.name?.toLowerCase() || '';
  
  const options: ItemOptions = {
    showWingFlavors: false,
    showMeatChoices: false,
    showChefaSauce: false
  };
  
  // Wing flavors - only for wings
  if (shouldShowWingFlavors(categoryName) || itemName.includes('wing')) {
    options.showWingFlavors = true;
  }
  
  // Meat choices - for items that typically need meat selection
  if (shouldShowMeatChoices(categoryName, itemName) || 
      shouldShowMeatChoices(categoryName, itemDescription)) {
    options.showMeatChoices = true;
  }
  
  // Chefa sauce - for main section items
  if (shouldShowChefaSauce(categoryName, itemName) || 
      shouldShowChefaSauce(categoryName, itemDescription)) {
    options.showChefaSauce = true;
  }
  
  return options;
};
