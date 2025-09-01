'use client';

import * as React from 'react';
import { Send, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatInputProps } from '@/types/chat';

export function ChatInput({
  conversationId,
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
  replyToId,
  className
}: ChatInputProps): React.ReactElement {
  const [message, setMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = React.useCallback(async () => {
    if (!message.trim() || isSubmitting || disabled) return;

    const messageContent = message.trim();
    setMessage('');
    setIsSubmitting(true);

    try {
      await onSendMessage(conversationId, messageContent, 'text', undefined, replyToId);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessage(messageContent);
    } finally {
      setIsSubmitting(false);
    }
  }, [message, isSubmitting, disabled, conversationId, onSendMessage, replyToId]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }, []);

  return (
    <div className={cn(
      "flex items-end gap-3 p-4 bg-gray-900 border-t border-gray-800",
      className
    )}>
      <button
        type="button"
        disabled={disabled || isSubmitting}
        className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-300 disabled:opacity-50 transition-colors"
        aria-label="Attach file"
      >
        <Paperclip className="w-5 h-5" />
      </button>

      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          className={cn(
            "w-full min-h-[40px] max-h-[120px] px-4 py-2 pr-12",
            "bg-gray-800 border border-gray-700 rounded-2xl",
            "text-white placeholder-gray-400",
            "resize-none outline-none",
            "focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors"
          )}
          rows={1}
          maxLength={2000}
        />
        
        {message.length > 1800 && (
          <div className="absolute -top-6 right-0 text-xs text-gray-400">
            {message.length}/2000
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!message.trim() || disabled || isSubmitting}
        className={cn(
          "flex-shrink-0 p-2 rounded-full transition-all",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          message.trim() && !disabled && !isSubmitting
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-gray-700 text-gray-400"
        )}
        aria-label="Send message"
      >
        {isSubmitting ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}