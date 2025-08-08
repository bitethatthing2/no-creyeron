'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Smile, Plus } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSendMessage: (message: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  isConnected?: boolean;
  variant?: 'default' | 'mobile';
  maxLength?: number;
  showEmojiPicker?: boolean;
  showMediaOptions?: boolean;
  onEmojiToggle?: () => void;
  onMediaToggle?: () => void;
  onEmojiSelect?: (emoji: string) => void;
  typingUsers?: string[];
  className?: string;
}

export function ChatInput({
  value,
  onChange,
  onSendMessage,
  placeholder = "Type a message...",
  disabled = false,
  isConnected = true,
  variant = 'default',
  maxLength = 500,
  showEmojiPicker = false,
  showMediaOptions = false,
  onEmojiToggle,
  onMediaToggle,
  onEmojiSelect,
  typingUsers = [],
  className = ''
}: ChatInputProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isSubmitting || !isConnected) return;

    setIsSubmitting(true);
    try {
      await onSendMessage(value);
      onChange('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // Mobile variant
  if (variant === 'mobile') {
    const effectivePlaceholder = typingUsers.length > 0 
      ? `${typingUsers.join(', ')} typing...` 
      : placeholder;

    return (
      <div className={`flex-none p-4 bg-gray-800 border-t border-gray-700 safe-area-inset-bottom relative ${className}`}>
        <div className="flex items-center gap-3">
          {onMediaToggle && (
            <button
              onClick={onMediaToggle}
              className="p-3 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              type="button"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex-1 relative">
            <input 
              ref={inputRef}
              type="text"
              className="w-full bg-gray-700 border border-gray-600 rounded-full px-4 py-3 text-white placeholder-gray-400 text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder={effectivePlaceholder}
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              disabled={disabled || !isConnected}
              maxLength={maxLength}
            />
          </div>
          
          {onEmojiToggle && (
            <button
              onClick={onEmojiToggle}
              className="p-3 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              type="button"
            >
              <Smile className="w-5 h-5" />
            </button>
          )}
          
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || isSubmitting || !isConnected}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center shadow-lg"
            type="button"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {/* Character counter for mobile */}
        {value.length > maxLength * 0.9 && (
          <p className="text-xs text-gray-400 mt-2 text-right">
            {maxLength - value.length} characters remaining
          </p>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`p-4 border-t ${className}`}>
      {!isConnected ? (
        <div className="flex items-center justify-center py-3 text-gray-500">
          <Button size="sm" variant="outline">
            Sign In
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isSubmitting || !isConnected}
            maxLength={maxLength}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!value.trim() || isSubmitting || !isConnected}
            size="sm"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      )}
      
      {/* Character counter for default */}
      {value.length > maxLength * 0.9 && (
        <p className="text-xs text-gray-500 mt-1 text-right">
          {maxLength - value.length} characters remaining
        </p>
      )}
    </div>
  );
}