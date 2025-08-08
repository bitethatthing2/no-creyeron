import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseAdmin, getAdminMessaging, isFirebaseAdminInitialized } from '@/lib/firebase/admin';
import { createAdminClient } from '@/lib/supabase/server';

// Define the structure for the expected request body
interface SubscribeRequestBody {
  token: string;
  topic: string;
}

/**
 * API route to subscribe a device token to a topic
 */
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const data = await request.json();
    const { token, topic } = data as SubscribeRequestBody;
    
    // Validate required fields
    if (!token || !topic) {
      return NextResponse.json(
        { error: 'Missing required fields: token and topic' },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin - now using our centralized initialization
    initializeFirebaseAdmin();
    
    // Check if initialization was successful
    if (!isFirebaseAdminInitialized()) {
      console.log('Firebase Admin SDK not initialized, simulating success in development');
      
      // In development, return simulated success
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          simulated: true,
          message: `Token would be subscribed to topic: ${topic}`
        });
      }
      
      return NextResponse.json(
        { error: 'Firebase Admin SDK not initialized' },
        { status: 500 }
      );
    }
    
    // Get the Firebase Messaging instance
    const messaging = getAdminMessaging();
    if (!messaging) {
      console.error('Failed to get Firebase Messaging instance');
      return NextResponse.json(
        { error: 'Failed to get Firebase Messaging instance' },
        { status: 500 }
      );
    }

    // Subscribe the token to the topic
    await messaging.subscribeToTopic(token, topic);
    
    // If successful, store the subscription in Supabase
    const supabaseAdmin = createAdminClient();
    
    // Check if a record exists for this token and topic
    const { data: existingData, error: fetchError } = await supabaseAdmin
      .from('topic_subscriptions')
      .select('*')
      .eq('token', token)
      .eq('topic', topic);
      
    if (fetchError) {
      console.error('Error checking for existing subscription:', fetchError);
    }
    
    // Only create a new record if one doesn't already exist
    if (!existingData || existingData.length === 0) {
      const { error: insertError } = await supabaseAdmin
        .from('topic_subscriptions')
        .insert([
          {
            token,
            topic,
            created_at: new Date().toISOString()
          }
        ]);
        
      if (insertError) {
        console.error('Error storing subscription in the database:', insertError);
        // Continue despite database error, as the Firebase subscription was successful
      }
    } else {
      console.log(`Token is already subscribed to topic ${topic} in the database`);
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to topic: ${topic}`
    });
  } catch (error) {
    console.error('Error in subscribe to topic API:', error);
    
    // Check for Firebase-specific errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Handle invalid token errors
    if (errorMessage.includes('messaging/registration-token-not-registered')) {
      return NextResponse.json(
        { error: 'The provided registration token is not valid or not registered' },
        { status: 400 }
      );
    }
    
    // Handle topic errors
    if (errorMessage.includes('messaging/invalid-argument')) {
      return NextResponse.json(
        { error: 'Invalid topic name format' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to subscribe to topic: ${errorMessage}` },
      { status: 500 }
    );
  }
}
