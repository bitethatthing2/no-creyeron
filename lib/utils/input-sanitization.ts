/**
 * Input sanitization utilities for user-generated content
 * Protects against XSS and other malicious input
 */

export interface SanitizationOptions {
  maxLength?: number;
  allowLineBreaks?: boolean;
  trimWhitespace?: boolean;
}

/**
 * Sanitize text input to prevent XSS attacks and limit length
 */
export const sanitizeMessage = (input: string, options: SanitizationOptions = {}): string => {
  const {
    maxLength = 500,
    allowLineBreaks = true,
    trimWhitespace = true
  } = options;

  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Trim whitespace if enabled
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // Remove or escape potentially dangerous HTML/script tags
  sanitized = sanitized
    // Remove script tags completely
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove object/embed tags
    .replace(/<(object|embed|form|input|button|select|textarea)\b[^>]*>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove style attributes that could contain expressions
    .replace(/\s*style\s*=\s*["'][^"']*["']/gi, '')
    // Escape remaining HTML tags
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Escape quotes to prevent attribute injection
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  // Handle line breaks
  if (!allowLineBreaks) {
    sanitized = sanitized.replace(/[\r\n]/g, ' ');
  }

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
};

/**
 * Sanitize display names and usernames
 */
export const sanitizeDisplayName = (input: string): string => {
  return sanitizeMessage(input, {
    maxLength: 50,
    allowLineBreaks: false,
    trimWhitespace: true
  });
};

/**
 * Sanitize bio/description text
 */
export const sanitizeBio = (input: string): string => {
  return sanitizeMessage(input, {
    maxLength: 200,
    allowLineBreaks: true,
    trimWhitespace: true
  });
};

/**
 * Validate and sanitize emoji input
 */
export const sanitizeEmoji = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '🐺'; // Default wolf emoji
  }

  // Simple emoji validation - allow only Unicode emoji characters
  const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]$/u;
  
  const trimmed = input.trim();
  
  // Take only the first emoji character
  const firstChar = [...trimmed][0];
  
  if (firstChar && emojiRegex.test(firstChar)) {
    return firstChar;
  }
  
  return '🐺'; // Default if invalid
};

/**
 * Check if content contains potential spam or inappropriate content
 */
export const detectSpam = (input: string): boolean => {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const spamPatterns = [
    // Excessive repetition
    /(.)\1{10,}/i,
    // Common spam phrases
    /\b(click here|free money|win now|guaranteed)\b/i,
    // Excessive caps
    /[A-Z]{20,}/,
    // Too many special characters
    /[!@#$%^&*()]{10,}/
  ];

  return spamPatterns.some(pattern => pattern.test(input));
};

/**
 * Rate limiting helper - simple in-memory implementation
 */
const messageCounts = new Map<string, { count: number; lastReset: number }>();

export const checkRateLimit = (userId: string, maxMessages = 10, windowMs = 60000): boolean => {
  const now = Date.now();
  const userStats = messageCounts.get(userId);

  if (!userStats || now - userStats.lastReset > windowMs) {
    messageCounts.set(userId, { count: 1, lastReset: now });
    return true;
  }

  if (userStats.count >= maxMessages) {
    return false;
  }

  userStats.count++;
  return true;
};