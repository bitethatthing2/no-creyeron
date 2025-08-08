// Test script for notification system
// This script tests the notification functionality

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNotificationSystem() {
  console.log('Testing notification system...');
  
  try {
    // Test 1: Check if the functions exist
    console.log('\n1. Testing fetch_notifications function...');
    const { data: notifications, error: fetchError } = await supabase.rpc('fetch_notifications', {
      p_user_id: null, // Current user
      p_limit: 10,
      p_offset: 0
    });
    
    if (fetchError) {
      console.error('Error fetching notifications:', fetchError);
    } else {
      console.log('✅ fetch_notifications works!');
      console.log(`Found ${notifications ? notifications.length : 0} notifications`);
      if (notifications && notifications.length > 0) {
        console.log('Sample notification:', notifications[0]);
      }
    }
    
    // Test 2: Check if mark_notification_read function exists
    console.log('\n2. Testing mark_notification_read function...');
    // We'll just check if the function exists by calling it with a fake ID
    const { data: markResult, error: markError } = await supabase.rpc('mark_notification_read', {
      p_notification_id: '00000000-0000-0000-0000-000000000000'
    });
    
    if (markError) {
      console.error('Error with mark_notification_read:', markError);
    } else {
      console.log('✅ mark_notification_read function exists!');
      console.log('Result:', markResult);
    }
    
    // Test 3: Check if mark_all_notifications_read function exists
    console.log('\n3. Testing mark_all_notifications_read function...');
    const { data: markAllResult, error: markAllError } = await supabase.rpc('mark_all_notifications_read');
    
    if (markAllError) {
      console.error('Error with mark_all_notifications_read:', markAllError);
    } else {
      console.log('✅ mark_all_notifications_read function exists!');
      console.log('Marked as read:', markAllResult);
    }
    
    // Test 4: Check table structure
    console.log('\n4. Testing table structure...');
    const { data: tableData, error: tableError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error querying notifications table:', tableError);
    } else {
      console.log('✅ Notifications table is accessible!');
      if (tableData && tableData.length > 0) {
        console.log('Table structure:', Object.keys(tableData[0]));
      }
    }
    
    console.log('\n✅ Notification system test completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testNotificationSystem();