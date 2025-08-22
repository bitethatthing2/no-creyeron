#!/bin/bash

# Script to remove food ordering components from the codebase
echo "🧹 Starting cleanup of food ordering components..."

# List of files and directories to remove
FILES_TO_REMOVE=(
  # Menu pages
  "app/(main)/menu/page.tsx"
  "app/(main)/menu/MenuClient.tsx"
  "app/(main)/menu/MenuServer.tsx"
  "app/(main)/menu/confirmation/page.tsx"
  "app/(main)/menu/layout.tsx"
  
  # Admin order pages
  "app/admin/orders/page.tsx"
  
  # Employee dashboard if it contains order management
  "app/(main)/employee/dashboard/page.tsx"
  
  # Menu components
  "components/menu/MenuCategoryNav.tsx"
  "components/menu/MenuItemCard.tsx"
  "components/menu/MenuSearch.tsx"
  "components/menu/MenuItemDetail.tsx"
  "components/menu/MenuItemGrid.tsx"
  "components/menu/MenuSkeletons.tsx"
  "components/menu/Menu.tsx"
  "components/menu/MenuGrid.tsx"
  "components/menu/MenuItemOptions.tsx"
  "components/menu/AppInstallSection.tsx"
  "components/menu/WatchItMadeModal.tsx"
  "components/menu/MenuSkeleton.tsx"
  "components/menu/MenuOptionsConfig.ts"
  "components/menu/MenuErrorFallback.tsx"
  
  # Order components
  "components/unified/OrderManagement.tsx"
  "components/orders/OrderList.tsx"
  "components/orders/OrderDetail.tsx"
  "components/orders/OrderStatus.tsx"
  
  # Cart components
  "components/cart/Cart.tsx"
  "components/cart/CartContext.tsx"
  "components/cart/CartButton.tsx"
  "components/cart/CartItem.tsx"
  
  # API routes
  "app/api/menu-items/route.ts"
  "app/api/menu-items/[categoryId]/route.ts"
  "app/api/orders/route.ts"
  "app/api/orders/wolfpack/route.ts"
  "app/api/orders/[id]/route.ts"
  "app/api/menu-debug/route.ts"
  "app/api/fix-menu-rls/route.ts"
  
  # Hooks
  "hooks/useCart.ts"
  "hooks/useOrders.ts"
  "hooks/useMenuItems.ts"
  "hooks/useUnifiedOrders.ts"
  
  # Services
  "lib/services/menu.service.ts"
  "lib/services/order.service.ts"
  "lib/supabase/menu.ts"
  
  # Database functions
  "lib/database/menu.ts"
  "lib/database/orders.ts"
  
  # Types
  "types/menu.ts"
  "types/orders.ts"
  "types/features/menu.ts"
  "types/features/order.ts"
  "types/features/checkout.ts"
  
  # Static assets
  "components/shared/food-menu-header.tsx"
  "components/shared/FoodDrinkCarousel.tsx"
  "lib/menu-data.ts"
  "lib/menu-data-public-fixed.ts"
  "styles/consolidated-menu.css"
)

# Create backup directory
BACKUP_DIR="backup_food_ordering_$(date +%Y%m%d_%H%M%S)"
echo "📁 Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Backup and remove files
for file in "${FILES_TO_REMOVE[@]}"; do
  if [ -f "$file" ]; then
    echo "📄 Backing up and removing: $file"
    # Create directory structure in backup
    mkdir -p "$BACKUP_DIR/$(dirname "$file")"
    # Copy file to backup
    cp "$file" "$BACKUP_DIR/$file"
    # Remove original file
    rm "$file"
  else
    echo "⏭️  File not found, skipping: $file"
  fi
done

# Remove empty directories
echo "🗑️  Removing empty directories..."
find app/\(main\)/menu -type d -empty -delete 2>/dev/null || true
find components/menu -type d -empty -delete 2>/dev/null || true
find components/orders -type d -empty -delete 2>/dev/null || true
find components/cart -type d -empty -delete 2>/dev/null || true

echo "✅ Cleanup completed! Backup saved in: $BACKUP_DIR"
echo ""
echo "⚠️  Additional manual steps required:"
echo "1. Remove menu/order imports from app/layout.tsx"
echo "2. Remove CartProvider from your providers"
echo "3. Update navigation to remove menu links"
echo "4. Remove menu-related feature flags"
echo "5. Update database.types.ts to remove menu/order types"