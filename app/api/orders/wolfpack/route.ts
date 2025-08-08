// app/api/wolfpack/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Types
interface OrderItemInput {
  menu_item_id: string;
  quantity: number;
  notes?: string;
  customizations?: Record<string, unknown>;
}


// Price utility functions
function safeParsePrice(price: string | number | null | undefined): number {
  if (price === null || price === undefined) return 0;
  if (typeof price === 'number') return price;
  if (typeof price === 'string') {
    const parsed = parseFloat(price);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function calculateItemTotal(price: string | number | null | undefined, quantity: number): number {
  const numericPrice = safeParsePrice(price);
  return numericPrice * quantity;
}

// Get recent orders for wolfpack members at current location
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('location_id');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Verify user is wolfpack member at this location
    const { data: membership, error: membershipError } = await supabase
      .from('users')
      .select('id, location_id, is_wolfpack_member, wolfpack_status')
      .eq('id', user.id)
      .eq('location_id', locationId)
      .eq('is_wolfpack_member', true)
      .eq('wolfpack_status', 'active')
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Not a wolfpack member at this location', code: 'ACCESS_DENIED' },
        { status: 403 }
      );
    }

    // Get recent orders from wolfpack members at this location
    const { data: locationMembers, error: membersError } = await supabase
      .from('users')
      .select('id')
      .eq('location_id', locationId)
      .eq('is_wolfpack_member', true)
      .eq('wolfpack_status', 'active');

    if (membersError || !locationMembers || locationMembers.length === 0) {
      return NextResponse.json({
        success: true,
        orders: [],
        location_id: locationId,
        total_count: 0
      });
    }

    const memberUserIds = locationMembers.map(m => m.id);

    // Get orders from these users with their items
    const { data: orders, error: ordersError } = await supabase
      .from('bartender_orders')
      .select(`
        id,
        status,
        total_amount,
        created_at,
        customer_id,
        table_location,
        order_items (
          id,
          menu_item_id,
          item_name,
          quantity,
          unit_price,
          subtotal,
          special_instructions
        )
      `)
      .in('customer_id', memberUserIds)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (ordersError) {
      throw ordersError;
    }

    // Get user details for the orders
    const customerIds = [...new Set(orders?.map(order => order.customer_id).filter((id): id is string => typeof id === 'string') || [])];
    const { data: customers } = await supabase
      .from('users')
      .select('id, first_name, avatar_url, email')
      .in('id', customerIds);

    // Create a customer lookup map
    const customerMap = new Map(
      customers?.map(customer => [
        customer.id, 
        {
          id: customer.id,
          display_name: customer.first_name || customer.email?.split('@')[0] || 'Anonymous Wolf',
          avatar_url: customer.avatar_url
        }
      ]) || []
    );

    // Transform the orders data
    const transformedOrders = orders?.map(order => {
      const customerId = typeof order.customer_id === 'string' ? order.customer_id : '';
      const customer = customerMap.get(customerId) || {
        id: order.customer_id,
        display_name: 'Anonymous Wolf',
        avatar_url: null
      };

      // Get items from the relation
      const orderItems = order.order_items || [];
      const itemCount = orderItems.reduce((sum: number, item) => sum + (item.quantity || 0), 0);

      return {
        id: order.id,
        status: order.status,
        total_amount: order.total_amount,
        created_at: order.created_at,
        table_location: order.table_location,
        customer,
        items: orderItems,
        item_count: itemCount
      };
    }) || [];

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
      location_id: locationId,
      total_count: transformedOrders.length
    });

  } catch (error) {
    console.error('Get wolfpack orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

// Place order as wolfpack member with shared visibility
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { location_id, items, share_with_pack = true, table_location }: {
      location_id: string;
      items: OrderItemInput[];
      share_with_pack?: boolean;
      table_location?: string;
    } = body;

    if (!location_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Location ID and order items are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Verify user is wolfpack member at this location
    const { data: membership, error: membershipError } = await supabase
      .from('users')
      .select('id, location_id, is_wolfpack_member, wolfpack_status, table_location, display_name')
      .eq('id', user.id)
      .eq('location_id', location_id)
      .eq('is_wolfpack_member', true)
      .eq('wolfpack_status', 'active')
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Not a wolfpack member at this location', code: 'ACCESS_DENIED' },
        { status: 403 }
      );
    }

    // Calculate total amount and validate items
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const { data: menuItem, error: menuError } = await supabase
        .from('food_drink_items')
        .select('id, name, price, is_available')
        .eq('id', item.menu_item_id)
        .single();

      if (menuError || !menuItem || !menuItem.is_available) {
        return NextResponse.json(
          { error: `Menu item ${item.menu_item_id} not available`, code: 'ITEM_UNAVAILABLE' },
          { status: 400 }
        );
      }

      const itemPrice = safeParsePrice(menuItem.price);
      const itemTotal = calculateItemTotal(menuItem.price, item.quantity);
      totalAmount += itemTotal;

      processedItems.push({
        id: crypto.randomUUID(),
        item_id: item.menu_item_id,
        name: menuItem.name,
        price: itemPrice,
        quantity: item.quantity,
        subtotal: itemTotal,
        notes: item.notes || null,
        customizations: item.customizations || null
      });
    }

    // Get user details for display name
    const { data: userData } = await supabase
      .from('users')
      .select('first_name, email, avatar_url')
      .eq('id', user.id)
      .single();

    const displayName = userData?.first_name || 
                       userData?.email?.split('@')[0] || 
                       'Anonymous Wolf';

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('bartender_orders')
      .insert({
        customer_id: user.id,
        location_id: location_id,
        status: 'pending',
        total_amount: totalAmount,
        order_type: 'wolfpack',
        table_location: table_location || 'Wolf Pack',
        customer_notes: null
      })
      .select('id, created_at, status, total_amount, table_location')
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw orderError;
    }

    // Insert order items
    const orderItemsToInsert = processedItems.map(item => ({
      order_id: order.id,
      menu_item_id: item.item_id,
      item_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.subtotal,
      special_instructions: item.notes
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) {
      console.error('Order items creation error:', itemsError);
      // Clean up the order if items fail to insert
      await supabase.from('bartender_orders').delete().eq('id', order.id);
      throw itemsError;
    }

    // Share order with wolfpack if requested
    if (share_with_pack) {
      try {
        const itemNames = processedItems.map(item => `${item.quantity}x ${item.name}`).join(', ');
        const shareMessage = `🍽️ ${displayName} just ordered: ${itemNames} ($${totalAmount.toFixed(2)})`;

        // Insert into wolfpack chat
        await supabase
          .from('wolfpack_chat_messages')
          .insert({
            session_id: `location_${location_id}`,
            user_id: user.id,
            display_name: displayName,
            avatar_url: userData?.avatar_url,
            content: shareMessage,
            message_type: 'order_share',
            created_at: new Date().toISOString(),
            is_flagged: false,
            is_deleted: false
          });
      } catch (chatError) {
        console.warn('Failed to share order with pack:', chatError);
        // Don't fail the entire order if chat sharing fails
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        total_amount: totalAmount,
        created_at: order.created_at,
        table_location: order.table_location,
        items: processedItems,
        shared_with_pack: share_with_pack
      }
    });

  } catch (error) {
    console.error('Create wolfpack order error:', error);
    return NextResponse.json(
      { error: 'Failed to create order', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}