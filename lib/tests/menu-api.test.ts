// Test file for Menu API integration
import { menuApiService } from '../services/menu-api.service';

/**
 * Manual test functions for Menu API
 * Run these in the browser console or Node environment
 */

export const testMenuAPI = {
  /**
   * Test basic menu items endpoint
   */
  async testGetMenuItems() {
    console.log('🧪 Testing getMenuItems...');
    try {
      const result = await menuApiService.getMenuItems({ limit: 5 });
      console.log('✅ getMenuItems success:', result);
      return result;
    } catch (error) {
      console.error('❌ getMenuItems failed:', error);
      throw error;
    }
  },

  /**
   * Test menu items with filters
   */
  async testGetMenuItemsWithFilters() {
    console.log('🧪 Testing getMenuItems with filters...');
    try {
      const result = await menuApiService.getMenuItems({
        type: 'appetizer',
        is_active: true,
        is_available: true,
        limit: 10
      });
      console.log('✅ getMenuItems with filters success:', result);
      return result;
    } catch (error) {
      console.error('❌ getMenuItems with filters failed:', error);
      throw error;
    }
  },

  /**
   * Test search functionality
   */
  async testSearchMenuItems() {
    console.log('🧪 Testing searchMenuItems...');
    try {
      const result = await menuApiService.searchMenuItems('salmon');
      console.log('✅ searchMenuItems success:', result);
      return result;
    } catch (error) {
      console.error('❌ searchMenuItems failed:', error);
      throw error;
    }
  },

  /**
   * Test advanced search with filters
   */
  async testAdvancedSearch() {
    console.log('🧪 Testing advancedSearch...');
    try {
      const result = await menuApiService.advancedSearch({
        query: 'tacos',
        type: 'main_course',
        minPrice: 10,
        maxPrice: 20
      });
      console.log('✅ advancedSearch success:', result);
      return result;
    } catch (error) {
      console.error('❌ advancedSearch failed:', error);
      throw error;
    }
  },

  /**
   * Test featured items
   */
  async testGetFeaturedItems() {
    console.log('🧪 Testing getFeaturedItems...');
    try {
      const result = await menuApiService.getFeaturedItems();
      console.log('✅ getFeaturedItems success:', result);
      return result;
    } catch (error) {
      console.error('❌ getFeaturedItems failed:', error);
      throw error;
    }
  },

  /**
   * Test menu types
   */
  async testGetMenuTypes() {
    console.log('🧪 Testing getMenuTypes...');
    try {
      const result = await menuApiService.getMenuTypes();
      console.log('✅ getMenuTypes success:', result);
      return result;
    } catch (error) {
      console.error('❌ getMenuTypes failed:', error);
      throw error;
    }
  },

  /**
   * Test menu categories
   */
  async testGetMenuCategories() {
    console.log('🧪 Testing getMenuCategories...');
    try {
      const result = await menuApiService.getMenuCategories();
      console.log('✅ getMenuCategories success:', result);
      return result;
    } catch (error) {
      console.error('❌ getMenuCategories failed:', error);
      throw error;
    }
  },

  /**
   * Test grouped items
   */
  async testGetGroupedItems() {
    console.log('🧪 Testing getGroupedItems...');
    try {
      const result = await menuApiService.getGroupedItems('type');
      console.log('✅ getGroupedItems success:', result);
      return result;
    } catch (error) {
      console.error('❌ getGroupedItems failed:', error);
      throw error;
    }
  },

  /**
   * Test metadata batch fetch
   */
  async testGetMenuMetadata() {
    console.log('🧪 Testing getMenuMetadata...');
    try {
      const result = await menuApiService.getMenuMetadata();
      console.log('✅ getMenuMetadata success:', result);
      return result;
    } catch (error) {
      console.error('❌ getMenuMetadata failed:', error);
      throw error;
    }
  },

  /**
   * Test homepage data fetch
   */
  async testGetHomepageItems() {
    console.log('🧪 Testing getHomepageItems...');
    try {
      const result = await menuApiService.getHomepageItems();
      console.log('✅ getHomepageItems success:', result);
      return result;
    } catch (error) {
      console.error('❌ getHomepageItems failed:', error);
      throw error;
    }
  },

  /**
   * Test health check
   */
  async testHealthCheck() {
    console.log('🧪 Testing healthCheck...');
    try {
      const result = await menuApiService.healthCheck();
      console.log('✅ healthCheck success:', result);
      return result;
    } catch (error) {
      console.error('❌ healthCheck failed:', error);
      throw error;
    }
  },

  /**
   * Run all tests sequentially
   */
  async runAllTests() {
    console.log('🚀 Running all Menu API tests...');
    const results = {};
    
    const tests = [
      'testHealthCheck',
      'testGetMenuTypes',
      'testGetMenuCategories', 
      'testGetMenuMetadata',
      'testGetMenuItems',
      'testGetMenuItemsWithFilters',
      'testGetFeaturedItems',
      'testGetGroupedItems',
      'testSearchMenuItems',
      'testAdvancedSearch',
      'testGetHomepageItems'
    ];

    for (const testName of tests) {
      try {
        console.log(`\n--- Running ${testName} ---`);
        results[testName] = await this[testName]();
        console.log(`✅ ${testName} passed`);
      } catch (error) {
        console.error(`❌ ${testName} failed:`, error);
        results[testName] = { error: error.message };
      }
    }

    console.log('\n📊 Test Results Summary:');
    console.table(
      Object.entries(results).map(([test, result]) => ({
        Test: test,
        Status: result.error ? '❌ Failed' : '✅ Passed',
        Error: result.error || 'None'
      }))
    );

    return results;
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testMenuAPI = testMenuAPI;
}

// Example usage:
// await testMenuAPI.runAllTests()
// await testMenuAPI.testGetMenuItems()
// await testMenuAPI.testSearchMenuItems()