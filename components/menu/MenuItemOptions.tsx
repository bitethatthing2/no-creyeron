'use client';

import React, { useState } from 'react';
import { 
  MENU_OPTIONS_CONFIG, 
  detectItemOptions
} from './MenuOptionsConfig';

interface MenuOptions {
  wingFlavor?: string;
  meatChoice?: string;
  chefaSauces?: string[];
}

interface MenuItemOptionsProps {
  item: {
    name?: string;
    description?: string;
  };
  category: {
    name?: string;
  };
  onOptionsChange: (options: MenuOptions) => void;
  selectedOptions?: MenuOptions;
}

const MenuItemOptions = ({ 
  item,
  category, 
  onOptionsChange, 
  selectedOptions = {} 
}: MenuItemOptionsProps) => {
  const [options, setOptions] = useState(selectedOptions);

  const handleOptionChange = (optionType: string, value: string | string[]) => {
    const newOptions = { ...options, [optionType]: value };
    setOptions(newOptions);
    onOptionsChange(newOptions);
  };

  const handleSauceToggle = (sauceValue: string) => {
    const currentSauces = options.chefaSauces || [];
    const newSauces = currentSauces.includes(sauceValue)
      ? currentSauces.filter((s: string) => s !== sauceValue)
      : [...currentSauces, sauceValue];
    
    handleOptionChange('chefaSauces', newSauces);
  };

  // Detect which options to show
  const itemOptions = detectItemOptions(item, category);
  const showWingFlavors = itemOptions.showWingFlavors;
  const showMeatChoices = itemOptions.showMeatChoices;
  const showChefaSauce = itemOptions.showChefaSauce;

  return (
    <div className="space-y-4">
      {/* Wing Flavors - Only for WINGS category */}
      {showWingFlavors && (
        <div className="border rounded-lg p-4 bg-orange-50">
          <h3 className="font-medium mb-3 text-orange-600 flex items-center gap-2">
            🔥 Wing Flavors
            <span className="text-xs bg-orange-100 px-2 py-1 rounded-full">Required</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {MENU_OPTIONS_CONFIG.wingFlavors.map((flavor) => (
              <label key={flavor} className="flex items-center space-x-2 cursor-pointer hover:bg-orange-100 p-2 rounded transition-colors">
                <input
                  type="radio"
                  name="wingFlavor"
                  value={flavor}
                  checked={options.wingFlavor === flavor}
                  onChange={(e) => handleOptionChange('wingFlavor', e.target.value)}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm font-medium">{flavor}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Meat Choices - Only for items that require meat */}
      {showMeatChoices && (
        <div className="border rounded-lg p-4 bg-red-50">
          <h3 className="font-medium mb-3 text-red-600 flex items-center gap-2">
            🥩 Choice of Meat
            <span className="text-xs bg-red-100 px-2 py-1 rounded-full">Required</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {MENU_OPTIONS_CONFIG.meatChoices.map((meat) => (
              <label key={meat} className="flex items-center space-x-2 cursor-pointer hover:bg-red-100 p-2 rounded transition-colors">
                <input
                  type="radio"
                  name="meatChoice"
                  value={meat}
                  checked={options.meatChoice === meat}
                  onChange={(e) => handleOptionChange('meatChoice', e.target.value)}
                  className="text-red-500 focus:ring-red-500"
                />
                <span className="text-sm font-medium">{meat}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Chefa Sauce - Only for main section items */}
      {showChefaSauce && (
        <div className="border rounded-lg p-4 bg-green-50">
          <h3 className="font-medium mb-3 text-green-600 flex items-center gap-2">
            🌶️ Chefa Sauce
            <span className="text-xs bg-green-100 px-2 py-1 rounded-full">Optional</span>
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {MENU_OPTIONS_CONFIG.chefaSauces.map((sauce) => (
              <label key={sauce} className="flex items-center space-x-2 cursor-pointer hover:bg-green-100 p-2 rounded transition-colors">
                <input
                  type="checkbox"
                  value={sauce}
                  checked={(options.chefaSauces || []).includes(sauce)}
                  onChange={() => handleSauceToggle(sauce)}
                  className="text-green-500 focus:ring-green-500 rounded"
                />
                <span className="text-sm font-medium">{sauce}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Show message if no options available */}
      {!showWingFlavors && !showMeatChoices && !showChefaSauce && (
        <div className="text-center py-8 text-gray-400 bg-gray-900 rounded-lg border-2 border-dashed border-gray-700">
          <div className="text-4xl mb-2">🍽️</div>
          <p className="font-medium">Ready to add to cart!</p>
          <p className="text-sm mt-1">No additional options needed for this item</p>
        </div>
      )}

      {/* Current selections summary */}
      {(options.wingFlavor || options.meatChoice || (options.chefaSauces && options.chefaSauces.length > 0)) && (
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium text-sm text-gray-600 mb-2">Your Selections:</h4>
          <div className="space-y-1 text-sm">
            {options.wingFlavor && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span>Wing Flavor: {options.wingFlavor}</span>
              </div>
            )}
            {options.meatChoice && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span>Meat: {options.meatChoice}</span>
              </div>
            )}
            {options.chefaSauces && options.chefaSauces.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Sauces: {options.chefaSauces.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuItemOptions;
