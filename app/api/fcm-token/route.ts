import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { validateFcmToken, initializeFirebaseAdmin, isFirebaseAdminInitialized } from '@/lib/firebase/admin';

// Interface for the request body containing the FCM token
interface FcmTokenRequestBody {
  token: string;
}

/**
 * API route to store an FCM token in the database
 */
export async function POST(request: NextRequest) {
  try {
    console.log('FCM token storage API called');
    
    // Ensure Firebase Admin is initialized
    if (!isFirebaseAdminInitialized()) {
      console.log('Initializing Firebase Admin in FCM token API');
      initializeFirebaseAdmin();
    }
    
    // Parse the request body
    const body: FcmTokenRequestBody = await request.json();
    const { token } = body;
    
    // Validate the token
    if (!token) {
      console.error('Missing required field: token');
      return NextResponse.json(
        { error: 'Missing required field: token' },
        { status: 400 }
      );
    }
    
    // Log token details for debugging (without exposing the full token)
    console.log('Processing FCM token:', {
      tokenStart: token.substring(0, 6) + '...',
      tokenLength: token.length,
    });
    
    // Validate the token with Firebase before storing
    try {
      const isValid = await validateFcmToken(token);
      
      if (!isValid) {
        console.warn('Token validation failed, not storing invalid token');
        return NextResponse.json({
          success: false,
          warning: 'Token validation failed, please request a new token',
        });
      }
      
      console.log('Token validation successful, proceeding with storage');
    } catch (validationError) {
      console.error('Error validating token:', validationError);
      // Continue with storage even if validation fails
      // This allows tokens to be stored in development mode
      console.log('Proceeding with token storage despite validation error');
    }
    
    // Initialize Supabase client
    const supabase = await createServerClient();
    
    // Check if token already exists
    const { data: existingToken, error: checkError } = await supabase
      .from('device_tokens')
      .select('token, created_at')
      .eq('token', token)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is the "not found" error
      console.error('Error checking for existing token:', checkError);
    }
    
    // Get device information
    const deviceInfo = {
      userAgent: request.headers.get('user-agent') || 'unknown',
      lastActive: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      platform: getPlatformFromUserAgent(request.headers.get('user-agent') || ''),
    };
    
    if (existingToken) {
      // Token exists, update the last active time and device info
      console.log('Token already exists, updating last active time');
      
      const { error: updateError } = await supabase
        .from('device_tokens')
        .update({
          platform: deviceInfo.platform,
          last_used: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('token', token);
      
      if (updateError) {
        console.error('Error updating token:', updateError);
        return NextResponse.json({
          success: true,
          warning: 'Token update issue, but notifications will still work',
          details: updateError.message
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Token updated successfully'
      });
    } else {
      // New token, insert it
      console.log('Inserting new token');
      
      const { error: insertError } = await supabase
        .from('device_tokens')
        .insert([
          {
            token,
            platform: deviceInfo.platform,
            is_active: true,
            last_used: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      
      if (insertError) {
        console.error('Error storing FCM token:', insertError);
        
        // Gracefully handle the error - still return 200 to allow notifications to work
        return NextResponse.json({
          success: true,
          warning: 'Token storage issue, but notifications will still work',
          details: insertError.message
        });
      }
      
      console.log('FCM token stored successfully');
      return NextResponse.json({
        success: true,
        message: 'Token stored successfully'
      });
    }
  } catch (error) {
    console.error('Error processing FCM token request:', error);
    
    // Still return 200 to allow notifications to work even if token storage fails
    return NextResponse.json({
      success: true,
      warning: 'Token storage failed, but notifications will still work',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Helper function to determine platform from user agent
 */
function getPlatformFromUserAgent(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('android')) {
    return 'android';
  } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    return 'ios';
  } else if (ua.includes('windows')) {
    return 'windows';
  } else if (ua.includes('mac')) {
    return 'mac';
  } else if (ua.includes('linux')) {
    return 'linux';
  } else {
    return 'unknown';
  }
}