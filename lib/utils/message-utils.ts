// lib/utils/message-utils.ts

interface SanitizeOptions {
  maxLength: number;
  allowLineBreaks: boolean;
  trimWhitespace: boolean;
}

// Enhanced message sanitization
export function sanitizeMessage(
  message: string, 
  options: SanitizeOptions = {
    maxLength: 500,
    allowLineBreaks: true,
    trimWhitespace: true
  }
): string {
  if (!message || typeof message !== 'string') {
    return '';
  }

  let sanitized = message;

  // Trim whitespace if requested
  if (options.trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // Handle line breaks
  if (!options.allowLineBreaks) {
    sanitized = sanitized.replace(/\r?\n|\r/g, ' ');
  } else {
    // Normalize line breaks and limit consecutive breaks
    sanitized = sanitized.replace(/\r\n/g, '\n');
    sanitized = sanitized.replace(/\r/g, '\n');
    sanitized = sanitized.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive line breaks
  }

  // Remove or replace potentially harmful characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Control characters
  
  // Basic HTML entity encoding for safety
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  // Limit length
  if (sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
}

// Enhanced spam detection
export function detectSpam(message: string): boolean {
  if (!message || typeof message !== 'string') {
    return false;
  }

  const lowerMessage = message.toLowerCase();
  
  // Common spam patterns
  const spamPatterns = [
    // URLs (basic detection)
    /https?:\/\/[^\s]+/gi,
    /www\.[^\s]+/gi,
    /[a-zA-Z0-9-]+\.(com|net|org|edu|gov|mil|int|biz|info|name|museum|coop|aero|pro|tv|cc|me|io|ly|co|uk|ca|au|de|fr|jp|cn)[^\s]*/gi,
    
    // Email addresses
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    
    // Phone numbers (basic patterns)
    /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/gi,
    
    // Excessive repetition
    /(.)\1{10,}/gi, // Same character repeated 10+ times
    /(\b\w+\b\s*){5,}\1/gi, // Same word repeated 5+ times
    
    // Common spam words/phrases
    /\b(free\s+money|get\s+rich|work\s+from\s+home|click\s+here|limited\s+time|act\s+now|urgent|congratulations\s+you\s+won)\b/gi,
    
    // Excessive capitalization
    /[A-Z]{20,}/g, // 20+ consecutive capital letters
    
    // Excessive special characters
    /[!@#$%^&*()_+={}\[\]:";'<>?,.\/\\|`~]{10,}/g
  ];

  // Check each pattern
  for (const pattern of spamPatterns) {
    if (pattern.test(message)) {
      return true;
    }
  }

  // Check for excessive capitalization (more than 70% of message)
  const upperCaseCount = (message.match(/[A-Z]/g) || []).length;
  const letterCount = (message.match(/[a-zA-Z]/g) || []).length;
  if (letterCount > 10 && upperCaseCount / letterCount > 0.7) {
    return true;
  }

  // Check for excessive non-alphabetic characters
  const nonAlphaCount = (message.match(/[^a-zA-Z\s]/g) || []).length;
  if (message.length > 20 && nonAlphaCount / message.length > 0.5) {
    return true;
  }

  return false;
}

// Rate limiting with memory cleanup
interface RateLimit {
  count: number;
  timestamp: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimit>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 300000; // 5 minutes
  for (const [key, limit] of rateLimitStore.entries()) {
    if (limit.timestamp < cutoff) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);

export function checkRateLimit(
  userId: string, 
  maxRequests: number = 20, 
  windowMs: number = 60000, // 1 minute
  keyPrefix: string = 'message'
): boolean {
  const key = `${keyPrefix}_${userId}`;
  const now = Date.now();
  const limit = rateLimitStore.get(key);

  if (!limit) {
    rateLimitStore.set(key, {
      count: 1,
      timestamp: now,
      windowStart: now
    });
    return true;
  }

  // Reset window if enough time has passed
  if (now - limit.windowStart >= windowMs) {
    rateLimitStore.set(key, {
      count: 1,
      timestamp: now,
      windowStart: now
    });
    return true;
  }

  // Check if limit exceeded
  if (limit.count >= maxRequests) {
    limit.timestamp = now; // Update timestamp but don't increment count
    return false;
  }

  // Increment count
  limit.count++;
  limit.timestamp = now;
  return true;
}

// Get remaining rate limit quota
export function getRateLimitStatus(
  userId: string,
  maxRequests: number = 20,
  windowMs: number = 60000,
  keyPrefix: string = 'message'
): { remaining: number; resetTime: number } {
  const key = `${keyPrefix}_${userId}`;
  const now = Date.now();
  const limit = rateLimitStore.get(key);

  if (!limit) {
    return { remaining: maxRequests, resetTime: now + windowMs };
  }

  // Check if window has reset
  if (now - limit.windowStart >= windowMs) {
    return { remaining: maxRequests, resetTime: now + windowMs };
  }

  return {
    remaining: Math.max(0, maxRequests - limit.count),
    resetTime: limit.windowStart + windowMs
  };
}

// Message validation
export interface MessageValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: string;
}

export function validateMessage(
  message: string,
  options: SanitizeOptions & {
    checkSpam?: boolean;
    userId?: string;
    checkRateLimit?: boolean;
  } = {
    maxLength: 500,
    allowLineBreaks: true,
    trimWhitespace: true
  }
): MessageValidationResult {
  const errors: string[] = [];

  // Basic validation
  if (!message || typeof message !== 'string') {
    errors.push('Message is required');
    return { isValid: false, errors };
  }

  // Sanitize message
  const sanitized = sanitizeMessage(message, options);

  if (!sanitized.trim()) {
    errors.push('Message cannot be empty');
    return { isValid: false, errors };
  }

  if (sanitized.length > options.maxLength) {
    errors.push(`Message too long (max ${options.maxLength} characters)`);
  }

  // Check for spam
  if (options.checkSpam && detectSpam(sanitized)) {
    errors.push('Message appears to contain spam or inappropriate content');
  }

  // Check rate limit
  if (options.checkRateLimit && options.userId) {
    if (!checkRateLimit(options.userId)) {
      errors.push('Rate limit exceeded. Please slow down.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined
  };
}

// Typing indicator debouncer
export class TypingIndicator {
  private timeouts = new Map<string, NodeJS.Timeout>();
  private callbacks = new Map<string, (isTyping: boolean) => void>();

  setTyping(userId: string, isTyping: boolean, callback: (isTyping: boolean) => void) {
    const key = `typing_${userId}`;
    
    // Clear existing timeout
    const existingTimeout = this.timeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Store callback
    this.callbacks.set(key, callback);

    if (isTyping) {
      // Send typing indicator
      callback(true);
      
      // Auto-clear after 3 seconds
      const timeout = setTimeout(() => {
        callback(false);
        this.timeouts.delete(key);
        this.callbacks.delete(key);
      }, 3000);
      
      this.timeouts.set(key, timeout);
    } else {
      // Clear typing indicator immediately
      callback(false);
      this.timeouts.delete(key);
      this.callbacks.delete(key);
    }
  }

  cleanup() {
    // Clear all timeouts
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
    this.callbacks.clear();
  }
}

// Message formatting utilities
export function formatMessageTime(timestamp: string | null): string {
  if (!timestamp) return 'Unknown time';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Less than 1 minute ago
  if (diff < 60000) {
    return 'Just now';
  }
  
  // Less than 1 hour ago
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }
  
  // Same day
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Older than yesterday
  return date.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Message grouping for better UI
export interface MessageGroup {
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  messages: Array<{
    id: string;
    content: string;
    timestamp: string;
    isRead?: boolean;
    message: string;
    created_at: string;
    is_read: boolean | null;
    reply_to_message_id?: string | null;
    reactions?: Array<{
      emoji: string;
      reaction_count: number;
      user_ids: string[];
    }>;
  }>;
  timestamp: string;
}

export function groupMessages(messages: any[], currentUserId: string): MessageGroup[] {
  // Reverse messages to handle them in chronological order (oldest first) for proper grouping
  const sortedMessages = [...messages].reverse();
  
  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;
  
  for (const message of sortedMessages) {
    const isSameSender = currentGroup?.senderId === message.sender_id;
    const timeDiff = currentGroup ? 
      new Date(message.created_at).getTime() - new Date(currentGroup.timestamp).getTime() : 
      0;
    
    // Start new group if different sender or more than 5 minutes apart
    if (!isSameSender || timeDiff > 300000) {
      currentGroup = {
        senderId: message.sender_id,
        senderName: message.sender_id === currentUserId ? 'You' : 
          (message.sender_user?.display_name || 'Unknown'),
        senderAvatar: message.sender_user?.profile_image_url,
        messages: [],
        timestamp: message.created_at
      };
      groups.push(currentGroup);
    }
    
    // Add message to current group
    currentGroup!.messages.push({
      id: message.id,
      content: message.message,
      timestamp: message.created_at,
      isRead: message.is_read,
      message: message.message,
      created_at: message.created_at,
      is_read: message.is_read,
      reply_to_message_id: message.reply_to_message_id,
      reactions: message.reactions
    });
  }
  
  // Return groups in newest-first order for display
  return groups.reverse();
}