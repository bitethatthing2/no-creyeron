import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Simple rate limiting in-memory store (for production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

function sanitizeMessage(message: string, options: { maxLength: number; allowLineBreaks: boolean; trimWhitespace: boolean }): string {
  if (!message) return '';
  
  let sanitized = message;
  
  if (options.trimWhitespace) {
    sanitized = sanitized.trim();
  }
  
  if (!options.allowLineBreaks) {
    sanitized = sanitized.replace(/\n/g, ' ');
  }
  
  if (sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }
  
  // Remove potentially harmful content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  return sanitized;
}

function detectSpam(message: string): boolean {
  const spamPatterns = [
    /\b(viagra|cialis|casino|lottery|winner|congratulations|million dollars)\b/i,
    /\b(click here|visit now|act now|limited time)\b/i,
    /(.)\1{10,}/, // Repeated characters
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card pattern
  ];
  
  return spamPatterns.some(pattern => pattern.test(message));
}

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
    const { receiver_id, message, type = 'message' } = body;

    if (!receiver_id || !message) {
      return NextResponse.json(
        { error: 'Recipient and message required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Rate limiting check
    if (!checkRateLimit(user.id, 10, 60000)) {
      return NextResponse.json(
        { error: 'Too many messages sent recently. Please slow down.', code: 'RATE_LIMIT_ERROR' },
        { status: 429 }
      );
    }

    // Sanitize the message
    const sanitizedMessage = sanitizeMessage(message, {
      maxLength: 500,
      allowLineBreaks: true,
      trimWhitespace: true
    });

    if (!sanitizedMessage) {
      return NextResponse.json(
        { error: 'Message content is invalid or empty after sanitization', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Check for spam content
    if (detectSpam(sanitizedMessage)) {
      return NextResponse.json(
        { error: 'Message appears to contain spam or inappropriate content', code: 'SPAM_ERROR' },
        { status: 400 }
      );
    }

    if (receiver_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot send message to yourself', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Check if recipient exists and is in pack
    const { data: recipientData, error: recipientError } = await supabase
      .from('wolf_pack_members')
      .select('id, user_id')
      .eq('user_id', receiver_id)
      .eq('status', 'active')
      .single();

    if (recipientError || !recipientData) {
      return NextResponse.json(
        { error: 'Recipient not found in pack', code: 'USER_ERROR' },
        { status: 404 }
      );
    }

    // Check for blocks
    const { data: blockData, error: blockError } = await supabase
      .from('wolf_pack_interactions')
      .select('id')
      .eq('sender_id', receiver_id)
      .eq('receiver_id', user.id)
      .eq('interaction_type', 'block')
      .single();

    if (blockData && !blockError) {
      return NextResponse.json(
        { error: 'Message blocked by recipient', code: 'BLOCKED_ERROR' },
        { status: 403 }
      );
    }

    // Create message or interaction
    if (type === 'message') {
      const { data: messageData, error: messageError } = await supabase
        .from('wolf_private_messages')
        .insert({
          sender_id: user.id,
          receiver_id,
          message: sanitizedMessage,
          is_read: false,
          created_at: new Date().toISOString()
        })
        .select('id, created_at')
        .single();

      if (messageError) {
        console.error('Message insert error:', messageError);
        return NextResponse.json(
          { error: 'Failed to send message', code: 'DATABASE_ERROR' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message_id: messageData.id,
        created_at: messageData.created_at
      });

    } else {
      // Handle wink/hi interactions
      const { data: interactionData, error: interactionError } = await supabase
        .from('wolf_pack_interactions')
        .insert({
          sender_id: user.id,
          receiver_id: receiver_id,
          interaction_type: type,
          created_at: new Date().toISOString()
        })
        .select('id, created_at')
        .single();

      if (interactionError) {
        console.error('Interaction insert error:', interactionError);
        return NextResponse.json(
          { error: 'Failed to send interaction', code: 'DATABASE_ERROR' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        interaction_id: interactionData.id,
        type,
        created_at: interactionData.created_at
      });
    }

  } catch (error) {
    console.error('Private message error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}