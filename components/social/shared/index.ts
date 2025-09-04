"use client"; // ADD THIS LINE - Required when re-exporting client components

// Export all chat-related components
export { MessageItem } from "./MessageItem";
export { default as ChatInput } from "./ChatInput";
export { ReactionButtons } from "./ReactionButtons";

// Type exports (if needed)
export type { MessageItemProps } from "./MessageItem";

// If you have other chat components, add them here:
// export { ChatHeader } from './ChatHeader';
// export { ChatList } from './ChatList';
// export { ConversationList } from './ConversationList';
// export { TypingIndicator } from './TypingIndicator';
// export { MessageBubble } from './MessageBubble';
// export { ChatContainer } from './ChatContainer';
