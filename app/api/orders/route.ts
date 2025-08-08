import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { CartItem } from '@/types/features/wolfpack-unified';

interface CreateOrderRequest {
  items: CartItem[];
  notes?: string;
  total: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CreateOrderRequest = await request.json();
    const { items, notes, total } = body;

    // Validate request
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    if (!total || total <= 0) {
      return NextResponse.json(
        { error: 'Invalid order total' },
        { status: 400 }
      );
    }

    // Get user's wolfpack status 
    const { data: wolfpackData, error: wolfpackError } = await supabase
      .from("users")
      .select('is_wolfpack_member, wolfpack_status')
      .eq('id', user.id)
      .eq('is_wolfpack_member', true)
      .eq('wolfpack_status', 'active')
      .single();

    if (wolfpackError || !wolfpackData) {
      return NextResponse.json(
        { error: 'Must be a WolfPack member to place orders' },
        { status: 403 }
      );
    }

    // Create the order
    const { data: orderData, error: orderError } = await supabase
      .from('bartender_orders')
      .insert({
        customer_id: user.id,
        total_amount: total,
        status: 'pending',
        customer_notes: notes || null
      })
      .select()
      .single();

    if (orderError || !orderData) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Insert order items
    const orderItems = items.map(item => ({
      order_id: orderData.id,
      menu_item_id: item.item_id || item.id,
      item_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.subtotal || (item.price * item.quantity),
      special_instructions: item.notes || null
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Clean up the order if items fail to insert
      await supabase.from('bartender_orders').delete().eq('id', orderData.id);
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      );
    }

    // Order created successfully
    console.log(`New order created: ${orderData.id}`);

    return NextResponse.json({
      success: true,
      order: {
        id: orderData.id,
        status: orderData.status,
        total_amount: orderData.total_amount,
        created_at: orderData.created_at
      }
    });

  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's orders
    const { data: orders, error: ordersError } = await supabase
      .from('bartender_orders')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orders: orders || []
    });

  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
