'use client';

import { useState } from 'react';
import { Smile, Heart, ThumbsUp, PartyPopper, Coffee, Music } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const EMOJI_CATEGORIES = {
  recent: {
    name: '⏰ Recent',
    emojis: ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '🎉', '🐺', '🌙']
  },
  wolfpack: {
    name: '🐺 Wolf Pack',
    emojis: ['🐺', '🌙', '⭐', '🔥', '💫', '🌟', '✨', '🎯', '🎲', '🃏', '🏆', '👑', '💎', '⚡', '🌊', '🎪', '🎭', '🎨', '📸', '🎸', '🥁', '🎹', '🎺', '🎷', '🎻']
  },
  reactions: {
    name: '😀 Faces', 
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳']
  },
  party: {
    name: '🎉 Party',
    emojis: ['🎉', '🎊', '🥳', '🍾', '🥂', '🍻', '🍺', '🍹', '🍸', '🍷', '🍶', '🥃', '🍽️', '🎵', '🎶', '🎤', '🎧', '🎼', '🎸', '🥁', '🎺', '🎷', '🔊', '📢', '📣', '📯', '🎪', '🎭', '🎨', '🎬']
  },
  food: {
    name: '🍔 Food',
    emojis: ['🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥘', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦']
  },
  drinks: {
    name: '🥤 Drinks',
    emojis: ['☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🧊', '🥛', '🍼', '🫖', '🧉', '🍯', '🥥', '🍋', '🍊', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🫐']
  },
  activities: {
    name: '🎯 Games',
    emojis: ['🎯', '🎱', '🎮', '🎰', '🃏', '🎲', '🧩', '♠️', '♥️', '♦️', '♣️', '♟️', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵']
  },
  hearts: {
    name: '❤️ Hearts',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐']
  },
  symbols: {
    name: '⚡ Symbols',
    emojis: ['⚡', '💥', '🔥', '💫', '⭐', '🌟', '✨', '💎', '🎭', '🎨', '🎪', '🎯', '🎲', '🃏', '♠️', '♥️', '♦️', '♣️', '🔮', '🎱', '🧿', '📿', '🪬', '💊', '🔬', '🔭', '📡', '💡', '🔦', '🕯️']
  }
};

export function EmojiPicker({ onEmojiSelect, isOpen, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState('recent');

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-black/90 backdrop-blur-md border border-primary/30 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
      {/* Category Tabs */}
      <div className="flex overflow-x-auto border-b border-primary/20 bg-black/50">
        {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`flex-shrink-0 px-4 py-3 text-xs font-medium transition-all duration-200 ${
              activeCategory === key
                ? 'text-primary border-b-2 border-primary bg-primary/20'
                : 'text-gray-300 hover:text-primary hover:bg-primary/10'
            }`}
          >
            {category.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="p-4 max-h-64 overflow-y-auto">
        <h3 className="text-sm font-medium text-blue-300 mb-3">
          {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].name}
        </h3>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].emojis.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              onClick={() => handleEmojiClick(emoji)}
              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xl sm:text-2xl hover:bg-blue-500/20 rounded-lg transition-all duration-150 hover:scale-110 active:scale-95"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-primary/20 p-3 bg-black/50">
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => handleEmojiClick('👍')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary/20 text-primary rounded-full hover:bg-primary/30 transition-all duration-200 hover:scale-105"
          >
            <ThumbsUp className="w-4 h-4" />
            👍
          </button>
          <button
            onClick={() => handleEmojiClick('❤️')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-500/20 text-red-300 rounded-full hover:bg-red-500/30 transition-all duration-200 hover:scale-105"
          >
            <Heart className="w-4 h-4" />
            ❤️
          </button>
          <button
            onClick={() => handleEmojiClick('🔥')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-500/20 text-orange-300 rounded-full hover:bg-orange-500/30 transition-all duration-200 hover:scale-105"
          >
            🔥
          </button>
          <button
            onClick={() => handleEmojiClick('🐺')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-500/20 text-purple-300 rounded-full hover:bg-purple-500/30 transition-all duration-200 hover:scale-105"
          >
            🐺
          </button>
        </div>
      </div>

      {/* Close overlay */}
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose}
      />
    </div>
  );
}