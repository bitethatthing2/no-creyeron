'use client';

// components/menu/Menu-optimized.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  UtensilsCrossed, 
  AlertCircle, 
  RefreshCw,
  ArrowLeft,
  ShoppingCart,
  WifiOff,
  Wifi
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { errorService, ErrorSeverity, ErrorCategory } from '@/lib/services/error-service';
import { dataService } from '@/lib/services/data-service';
import { authService, Permission } from '@/lib/services/auth-service';
import { toast } from 'sonner';
import CategoryChipBar from './CategoryChipBar';
import MenuItemCard, { CompactMenuItemCard } from './MenuItemCard';
import Cart from '@/components/cart/Cart';
import { useCart } from '@/components/cart/CartContext';
import { AppInstallSection } from './AppInstallSection';
import { useAuth } from '@/contexts/AuthContext';
import { createCartItem, ItemCustomization } from '@/types/features/wolfpack-unified';
import type {
  MenuCategoryWithCount,
  MenuItemWithModifiers,
  CartOrderData,
  APIModifierGroup
} from '@/types/features/menu';

// Enhanced types for better error handling
interface MenuState {
  categories: MenuCategoryWithCount[];
  items: MenuItemWithModifiers[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

// Optimized debounce hook
function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  return debouncedCallback;
}

export default function OptimizedMenu() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [useCompactView, setUseCompactView] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Enhanced menu state
  const [menuState, setMenuState] = useState<MenuState>({
    categories: [],
    items: [],
    loading: true,
    error: null,
    lastUpdated: null,
    connectionStatus: 'connected'
  });

  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  
  // Cart management and auth
  const { cartCount, addToCart } = useCart();
  const { user } = useAuth();

  // Debounced refresh for real-time updates
  const debouncedRefresh = useDebouncedCallback(async () => {
    await fetchMenuData(false);
  }, 1000);

  // Initialize client-side state
  useEffect(() => {
    const checkMobile = () => {
      setUseCompactView(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Enhanced menu data fetching with comprehensive error handling
  const fetchMenuData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setMenuState(prev => ({ ...prev, loading: true, error: null }));
      }

      // Check permissions first
      if (!authService.hasPermission(Permission.VIEW_MENU)) {
        throw errorService.handleBusinessLogicError(
          'fetchMenuData',
          'Insufficient permissions',
          'You need to be logged in to view the menu',
          { component: 'Menu' }
        );
      }

      console.log('🍽️ Fetching optimized menu data...');

      // Use Data Service for parallel, cached data loading
      const operations = [
        () => dataService.getMenuCategories(),
        () => dataService.getMenuItems()
      ];

      const [categoriesData, itemsData] = await dataService.batchExecute(
        operations,
        'menuData'
      );

      console.log('📂 Categories loaded:', categoriesData?.length || 0);
      console.log('🍕 Items loaded:', itemsData?.length || 0);

      // Transform categories with enhanced error handling
      const transformedCategories: MenuCategoryWithCount[] = categoriesData.map(category => {
        try {
          const itemCount = itemsData.filter(
            item => item.category_id === category.id && item.is_available
          ).length;

          return {
            id: category.id,
            name: category.name,
            type: category.type as 'food' | 'drink',
            icon: category.icon || (category.type === 'food' ? 'utensils' : 'wine'),
            display_order: category.display_order || 0,
            item_count: itemCount,
            is_active: category.is_active
          };
        } catch (transformError) {
          errorService.handleUnknownError(
            transformError as Error,
            { 
              component: 'Menu',
              action: 'transformCategory',
              metadata: { categoryId: category.id }
            }
          );
          return null;
        }
      }).filter(Boolean) as MenuCategoryWithCount[];

      // Transform items with comprehensive validation
      const transformedItems: MenuItemWithModifiers[] = itemsData.map(item => {
        try {
          // Validate required fields
          if (!item.id || !item.name || typeof item.price !== 'number') {
            throw new Error(`Invalid menu item data: ${item.id}`);
          }

          return {
            id: item.id,
            name: item.name,
            description: item.description || '',
            price: item.price,
            is_available: item.is_available,
            display_order: item.display_order || 0,
            category_id: item.category_id,
            category: item.category || {
              id: item.category_id,
              name: 'Unknown Category',
              type: 'food' as const
            },
            modifiers: item.modifiers as APIModifierGroup[] || [],
            image_url: item.image_url
          };
        } catch (transformError) {
          errorService.handleUnknownError(
            transformError as Error,
            { 
              component: 'Menu',
              action: 'transformItem',
              metadata: { itemId: item.id }
            }
          );
          return null;
        }
      }).filter(Boolean) as MenuItemWithModifiers[];

      // Default to 'all' category if not set
      if (!activeCategory) {
        setActiveCategory('all');
      }

      // Update state
      setMenuState({
        categories: transformedCategories,
        items: transformedItems,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        connectionStatus: 'connected'
      });

      // Success feedback for initial load
      if (showLoading && !hasInitialized) {
        toast.success(`Menu loaded: ${transformedItems.length} items available`);
        setHasInitialized(true);
      }

    } catch (error) {
      const appError = errorService.handleUnknownError(
        error as Error,
        {
          component: 'Menu',
          action: 'fetchMenuData',
          metadata: { activeCategory, showLoading }
        }
      );

      setMenuState(prev => ({
        ...prev,
        loading: false,
        error: appError.userMessage,
        connectionStatus: 'disconnected'
      }));

      // Show user-friendly error message
      if (showLoading) {
        toast.error(appError.userMessage);
      }

      console.error('Menu loading failed:', appError);
    }
  }, [activeCategory, hasInitialized]);

  // Enhanced real-time subscription with reconnection logic
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      try {
        // Clean up existing subscription
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
        }

        const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseBrowserClient();
        
        const channel = supabase
          .channel('menu_updates_optimized')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'menu_items'
            },
            (payload) => {
              try {
                console.log('Menu item change detected:', payload.eventType);
                
                // Invalidate menu cache and refresh
                dataService.invalidateCachePattern('menu_');
                debouncedRefresh();
                
                setMenuState(prev => ({ 
                  ...prev, 
                  connectionStatus: 'connected' 
                }));
              } catch (error) {
                errorService.handleUnknownError(
                  error as Error,
                  {
                    component: 'Menu',
                    action: 'realtimeUpdate',
                    metadata: { payload: payload.eventType }
                  }
                );
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'menu_categories'
            },
            (payload) => {
              try {
                console.log('Menu category change detected:', payload.eventType);
                
                // Invalidate category cache and refresh
                dataService.invalidateCachePattern('menu_categories_');
                debouncedRefresh();
              } catch (error) {
                errorService.handleUnknownError(
                  error as Error,
                  {
                    component: 'Menu',
                    action: 'categoryUpdate',
                    metadata: { payload: payload.eventType }
                  }
                );
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setMenuState(prev => ({ 
                ...prev, 
                connectionStatus: 'connected' 
              }));
              console.log('Menu real-time subscription active');
            } else if (status === 'CHANNEL_ERROR') {
              setMenuState(prev => ({ 
                ...prev, 
                connectionStatus: 'disconnected' 
              }));
              console.error('Menu subscription error');
              
              // Retry after delay
              setTimeout(() => {
                setMenuState(prev => ({ 
                  ...prev, 
                  connectionStatus: 'reconnecting' 
                }));
                setupRealtimeSubscription();
              }, 5000);
            }
          });

        subscriptionRef.current = { unsubscribe: () => channel.unsubscribe() };

      } catch (error) {
        const appError = errorService.handleExternalServiceError(
          'Supabase',
          error as Error,
          {
            component: 'Menu',
            action: 'setupRealtimeSubscription'
          }
        );
        
        setMenuState(prev => ({ 
          ...prev, 
          connectionStatus: 'disconnected' 
        }));
        console.error('Failed to setup menu real-time subscription:', appError);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [debouncedRefresh]);

  // Initial data loading
  useEffect(() => {
    fetchMenuData(true);
  }, [fetchMenuData]);

  // Enhanced add to cart with validation and error handling
  const handleAddToCart = useCallback(async (orderData: CartOrderData) => {
    try {
      // Extract item and customizations from orderData
      const { item, modifiers, quantity, specialInstructions } = orderData;
      
      // Check permissions
      if (!authService.hasPermission(Permission.PLACE_ORDER)) {
        throw errorService.handleBusinessLogicError(
          'addToCart',
          'Insufficient permissions',
          'You need to be logged in to add items to cart',
          { component: 'Menu', metadata: { itemId: item.id } }
        );
      }

      // Find the full item from menu state to check availability
      const fullItem = menuState.items.find(i => i.id === item.id);
      if (!fullItem?.is_available) {
        throw errorService.handleValidationError(
          'item_availability',
          false,
          'This item is currently unavailable',
          { component: 'Menu', metadata: { itemId: item.id } }
        );
      }

      // Convert modifiers to ItemCustomization format
      const customizations: ItemCustomization = {
        meat: modifiers.meat,
        sauces: modifiers.sauces
      };

      // Create cart item with validation
      const cartItem = createCartItem(
        item,
        quantity,
        customizations,
        specialInstructions
      );
      
      // Add to cart
      addToCart(cartItem);
      
      // Success feedback
      toast.success(`${item.name} added to cart`);
      
    } catch (error) {
      const appError = errorService.handleUnknownError(
        error as Error,
        {
          component: 'Menu',
          action: 'addToCart',
          metadata: {
            itemId: orderData.item.id,
            quantity: orderData.quantity
          }
        }
      );
      
      toast.error(appError.userMessage);
    }
  }, [addToCart]);

  // Manual refresh with loading feedback
  const handleRefresh = useCallback(async () => {
    setMenuState(prev => ({ ...prev, connectionStatus: 'reconnecting' }));
    await fetchMenuData(true);
  }, [fetchMenuData]);

  // Prepare merged categories list
  const mergedCategories = [
    { id: 'all', name: 'All', type: 'all' as const, item_count: menuState.items.filter(i => i.is_available).length },
    { id: 'popular', name: 'Popular', type: 'popular' as const, item_count: menuState.items.filter(i => i.is_available).length }, // You'll need to implement popular logic
    ...menuState.categories
      .filter(cat => cat.is_active && cat.type === 'food')
      .sort((a, b) => a.display_order - b.display_order)
      .map(cat => ({ ...cat, type: cat.type as 'food' | 'drink' | 'all' | 'popular' | 'special' })),
    ...menuState.categories
      .filter(cat => cat.is_active && cat.type === 'drink')
      .sort((a, b) => a.display_order - b.display_order)
      .map(cat => ({ ...cat, type: cat.type as 'food' | 'drink' | 'all' | 'popular' | 'special' }))
  ];

  // Filter items based on active category
  const filteredItems = menuState.items.filter(item => {
    if (!item.is_available) return false;
    
    switch (activeCategory) {
      case 'all':
        return true;
      case 'popular':
        // TODO: Implement popular items logic
        // For now, show items with display_order < 10 as popular
        return item.display_order !== undefined && item.display_order < 10;
      default:
        return item.category_id === activeCategory;
    }
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* App Install Section */}
      <div className="mb-6">
        <AppInstallSection />
      </div>

      {/* Enhanced Header with Connection Status */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="h-8 w-8" />
            Menu
          </h1>
          
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2 text-sm">
            {menuState.connectionStatus === 'connected' && (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="h-4 w-4" />
                <span>Live</span>
              </div>
            )}
            {menuState.connectionStatus === 'disconnected' && (
              <div className="flex items-center gap-1 text-red-600">
                <WifiOff className="h-4 w-4" />
                <span>Offline</span>
              </div>
            )}
            {menuState.connectionStatus === 'reconnecting' && (
              <div className="flex items-center gap-1 text-yellow-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Connecting</span>
              </div>
            )}
          </div>

          {/* Last Updated */}
          {menuState.lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {menuState.lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Cart and Refresh */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={menuState.loading}
          >
            <RefreshCw className={`h-4 w-4 ${menuState.loading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setIsCartOpen(true)}
            className="relative"
          >
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {cartCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Enhanced Error Display */}
      {menuState.error && (
        <Alert className="mb-6 border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{menuState.error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Category Navigation */}
      <CategoryChipBar
        categories={mergedCategories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        loading={menuState.loading}
      />

      {/* Menu Items Grid */}
      <div className="mt-6">
        {menuState.loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items available in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              useCompactView ? (
                <CompactMenuItemCard
                  key={item.id}
                  item={item}
                  onAddToCart={handleAddToCart}
                />
              ) : (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAddToCart={handleAddToCart}
                />
              )
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Cart */}
      {isCartOpen && (
        <Cart
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onCheckout={async (items, notes, total) => {
            // Handle checkout logic here
            toast.success('Order placed successfully!');
            setIsCartOpen(false);
          }}
        />
      )}

      {/* Performance Info for Development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 text-xs bg-black/80 text-white p-2 rounded">
          Cache: {dataService.getCacheStats().size} entries | 
          Hit Rate: {dataService.getCacheStats().hitRate}% |
          Items: {filteredItems.length}
        </div>
      )}
    </div>
  );
}