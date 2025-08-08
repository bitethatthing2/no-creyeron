import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { initializeFirebaseAdmin, getAdminMessaging, isFirebaseAdminInitialized } from '@/lib/firebase/admin';
import { NOTIFICATION_TOPICS } from '@/types/features/firebase';
import type { NotificationTopicKey, FcmResponse, BulkNotificationResult } from '@/types/features/firebase';
import type { TopicMessage, MulticastMessage } from 'firebase-admin/messaging';

// Define the structure for notification requests
interface NotificationRequestBody {
  title: string;
  body: string;
  data?: Record<string, string>;
  image?: string;
  link?: string;
  
  // Target options (only one should be specified)
  topic?: NotificationTopicKey | string;
  userId?: string;
  tokens?: string[];
  
  // Optional settings
  requireInteraction?: boolean;
  silent?: boolean;
  badge?: string;
  icon?: string;
  tag?: string;
}

/**
 * Validate that only one target type is specified
 */
function validateTargetOptions(body: NotificationRequestBody): string | null {
  const targets = [body.topic, body.userId, body.tokens].filter(Boolean);
  
  if (targets.length === 0) {
    return 'Must specify one target: topic, userId, or tokens';
  }
  
  if (targets.length > 1) {
    return 'Only one target type allowed: topic, userId, or tokens';
  }
  
  return null;
}

/**
 * Get device tokens for a specific user
 */
async function getUserTokens(userId: string, supabase: Awaited<ReturnType<typeof createClient>>): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (error) {
      console.error('Error fetching user tokens:', error);
      return [];
    }
    
    return data?.map((row: { token: string }) => row.token) || [];
  } catch (error) {
    console.error('Exception in getUserTokens:', error);
    return [];
  }
}

/**
 * Send notification to a topic
 */
async function sendToTopic(
  topic: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  options?: {
    image?: string;
    icon?: string;
    badge?: string;
    link?: string;
    requireInteraction?: boolean;
    silent?: boolean;
    tag?: string;
  }
): Promise<FcmResponse> {
  const messaging = getAdminMessaging();
  if (!messaging) {
    return {
      success: false,
      error: {
        code: 'messaging-unavailable',
        message: 'Firebase messaging not available'
      }
    };
  }
  
  try {
    // Ensure all data values are strings
    const stringifiedData: Record<string, string> = {};
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        stringifiedData[key] = String(value);
      });
    }
    
    // Add required fields as strings
    stringifiedData.title = title;
    stringifiedData.body = body;
    stringifiedData.timestamp = new Date().toISOString();
    
    // Build the message payload for Firebase Admin SDK
    const message: TopicMessage = {
      topic,
      notification: {
        title,
        body,
      },
      data: stringifiedData,
      webpush: {
        headers: {},
        notification: {
          title,
          body,
          icon: options?.icon || '/icons/android-big-icon.png',
          badge: options?.badge || '/icons/android-lil-icon-white.png',
          requireInteraction: options?.requireInteraction || false,
          silent: options?.silent || false,
          tag: options?.tag,
          image: options?.image,
          data: {
            url: options?.link || '/',
            ...stringifiedData
          }
        },
        fcmOptions: {
          link: options?.link || '/'
        }
      }
    };
    
    const response = await messaging.send(message);
    
    return {
      success: true,
      messageId: response
    };
  } catch (error) {
    console.error('Error sending to topic:', error);
    return {
      success: false,
      error: {
        code: 'send-failed',
        message: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

/**
 * Send notification to multiple tokens
 */
async function sendToTokens(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
  options?: {
    image?: string;
    icon?: string;
    badge?: string;
    link?: string;
    requireInteraction?: boolean;
    silent?: boolean;
    tag?: string;
  }
): Promise<BulkNotificationResult> {
  const messaging = getAdminMessaging();
  if (!messaging) {
    return {
      successCount: 0,
      failureCount: tokens.length,
      responses: tokens.map(() => ({
        success: false,
        error: {
          code: 'messaging-unavailable',
          message: 'Firebase messaging not available'
        }
      })),
      invalidTokens: []
    };
  }
  
  if (tokens.length === 0) {
    return {
      successCount: 0,
      failureCount: 0,
      responses: [],
      invalidTokens: []
    };
  }
  
  try {
    // Ensure all data values are strings
    const stringifiedData: Record<string, string> = {};
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        stringifiedData[key] = String(value);
      });
    }
    
    // Add required fields as strings
    stringifiedData.title = title;
    stringifiedData.body = body;
    stringifiedData.timestamp = new Date().toISOString();
    
    // Build the message payload
    const baseMessage = {
      notification: {
        title,
        body,
      },
      data: stringifiedData,
      webpush: {
        headers: {},
        notification: {
          title,
          body,
          icon: options?.icon || '/icons/android-big-icon.png',
          badge: options?.badge || '/icons/android-lil-icon-white.png',
          requireInteraction: options?.requireInteraction || false,
          silent: options?.silent || false,
          tag: options?.tag,
          image: options?.image,
          data: {
            url: options?.link || '/',
            ...stringifiedData
          }
        },
        fcmOptions: {
          link: options?.link || '/'
        }
      }
    };
    
    // Send to multiple tokens
    const multicastMessage: MulticastMessage = {
      tokens,
      ...baseMessage
    };
    
    const response = await messaging.sendEachForMulticast(multicastMessage);
    
    // Process results
    const responses: FcmResponse[] = [];
    const invalidTokens: string[] = [];
    
    response.responses.forEach((result, index) => {
      if (result.success) {
        responses.push({
          success: true,
          messageId: result.messageId
        });
      } else {
        responses.push({
          success: false,
          error: {
            code: result.error?.code || 'unknown',
            message: result.error?.message || 'Unknown error'
          }
        });
        
        // Check if token is invalid
        const errorCode = result.error?.code;
        if (
          errorCode === 'messaging/registration-token-not-registered' ||
          errorCode === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });
    
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses,
      invalidTokens
    };
  } catch (error) {
    console.error('Error sending to tokens:', error);
    
    // Return error for all tokens
    return {
      successCount: 0,
      failureCount: tokens.length,
      responses: tokens.map(() => ({
        success: false,
        error: {
          code: 'send-failed',
          message: error instanceof Error ? error.message : String(error)
        }
      })),
      invalidTokens: []
    };
  }
}

/**
 * Log notification to database
 */
async function logNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  title: string,
  body: string,
  data: Record<string, string> | undefined,
  target: {
    topic?: string;
    userId?: string;
    tokenCount?: number;
  },
  result: FcmResponse | BulkNotificationResult
): Promise<void> {
  try {
    const logEntry = {
      title,
      body,
      data: data ? JSON.stringify(data) : null,
      topic: target.topic || null,
      user_id: target.userId || null,
      status: 'success' in result && result.success ? 'sent' : 
              'successCount' in result && result.successCount > 0 ? 'partial' : 'failed',
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('push_notifications')
      .insert([logEntry]);
    
    if (error) {
      console.error('Error logging notification:', error);
    }
  } catch (error) {
    console.error('Exception in logNotification:', error);
  }
}

/**
 * Clean up invalid tokens from database
 */
async function cleanupInvalidTokens(supabase: Awaited<ReturnType<typeof createClient>>, invalidTokens: string[]): Promise<void> {
  if (invalidTokens.length === 0) return;
  
  try {
    const { error } = await supabase
      .from('device_tokens')
      .update({
        is_active: false,
        last_error: 'Token invalid or unregistered',
        error_count: 1,
        updated_at: new Date().toISOString()
      })
      .in('token', invalidTokens);
    
    if (error) {
      console.error('Error cleaning up invalid tokens:', error);
    } else {
      console.log(`Marked ${invalidTokens.length} tokens as inactive`);
    }
  } catch (error) {
    console.error('Exception in cleanupInvalidTokens:', error);
  }
}

/**
 * API route to send push notifications
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Send notification API called');
    
    // Initialize Firebase Admin
    if (!isFirebaseAdminInitialized()) {
      console.log('Initializing Firebase Admin in send notification API');
      initializeFirebaseAdmin();
    }
    
    // Parse request body with error handling
    let body: NotificationRequestBody;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { title, body: messageBody, data, topic, userId, tokens, ...options } = body;
    
    // Validate required fields
    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields: title and body' },
        { status: 400 }
      );
    }
    
    // Validate field lengths to match database constraints
    if (title.length > 100) {
      return NextResponse.json(
        { error: 'Title must be 100 characters or less' },
        { status: 400 }
      );
    }
    
    if (messageBody.length > 1000) {
      return NextResponse.json(
        { error: 'Body must be 1000 characters or less' },
        { status: 400 }
      );
    }
    
    // Validate target options
    const targetError = validateTargetOptions(body);
    if (targetError) {
      return NextResponse.json(
        { error: targetError },
        { status: 400 }
      );
    }
    
    // Initialize Supabase with error handling
    let supabase;
    try {
      supabase = await createClient();
    } catch (supabaseError) {
      console.error('Error creating Supabase client:', supabaseError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    let result: FcmResponse | BulkNotificationResult;
    let targetInfo: { topic?: string; userId?: string; tokenCount?: number };
    
    // Handle different target types
    if (topic) {
      // Validate topic exists in NOTIFICATION_TOPICS if it's a predefined topic
      const predefinedTopics = Object.values(NOTIFICATION_TOPICS) as string[];
      if (typeof topic === 'string' && !predefinedTopics.includes(topic)) {
        console.warn(`Topic '${topic}' not found in predefined topics, using as custom topic`);
      }
      
      console.log(`Sending notification to topic: ${topic}`);
      result = await sendToTopic(topic, title, messageBody, data, options);
      targetInfo = { topic };
      
    } else if (userId) {
      // Validate userId format (should be UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        return NextResponse.json(
          { error: 'Invalid userId format' },
          { status: 400 }
        );
      }
      
      console.log(`Sending notification to user: ${userId}`);
      const userTokens = await getUserTokens(userId, supabase);
      
      if (userTokens.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No active tokens found for user'
        }, { status: 404 });
      }
      
      result = await sendToTokens(userTokens, title, messageBody, data, options);
      targetInfo = { userId, tokenCount: userTokens.length };
      
    } else if (tokens && Array.isArray(tokens) && tokens.length > 0) {
      // Validate tokens array
      if (tokens.length > 1000) {
        return NextResponse.json(
          { error: 'Too many tokens, maximum 1000 allowed' },
          { status: 400 }
        );
      }
      
      // Validate each token is a non-empty string
      for (const token of tokens) {
        if (typeof token !== 'string' || token.trim().length === 0) {
          return NextResponse.json(
            { error: 'All tokens must be non-empty strings' },
            { status: 400 }
          );
        }
      }
      
      console.log(`Sending notification to ${tokens.length} tokens`);
      result = await sendToTokens(tokens, title, messageBody, data, options);
      targetInfo = { tokenCount: tokens.length };
      
    } else {
      return NextResponse.json(
        { error: 'No valid target specified' },
        { status: 400 }
      );
    }
    
    // Log notification with error handling
    try {
      await logNotification(supabase, title, messageBody, data, targetInfo, result);
    } catch (logError) {
      console.error('Error logging notification:', logError);
      // Don't fail the request if logging fails
    }
    
    // Clean up invalid tokens if any
    if ('invalidTokens' in result && result.invalidTokens.length > 0) {
      try {
        await cleanupInvalidTokens(supabase, result.invalidTokens);
      } catch (cleanupError) {
        console.error('Error cleaning up invalid tokens:', cleanupError);
        // Don't fail the request if cleanup fails
      }
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      result,
      target: targetInfo
    });
    
  } catch (error) {
    console.error('Error in send notification API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests - return available topics and basic info
 */
export async function GET() {
  try {
    return NextResponse.json({
      availableTopics: Object.values(NOTIFICATION_TOPICS),
      info: {
        supportedTargets: ['topic', 'userId', 'tokens'],
        requiredFields: ['title', 'body'],
        optionalFields: ['data', 'image', 'link', 'requireInteraction', 'silent', 'badge', 'icon', 'tag'],
        constraints: {
          title: 'Maximum 100 characters',
          body: 'Maximum 1000 characters',
          tokens: 'Maximum 1000 tokens per request'
        }
      }
    });
  } catch (error) {
    console.error('Error in GET /api/notifications/send:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}