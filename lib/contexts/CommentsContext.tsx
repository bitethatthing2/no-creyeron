'use client';
import * as React from 'react';

interface CommentsUIContextType {
  isCommentsOpen: boolean;
  setIsCommentsOpen: (open: boolean) => void;
}

const CommentsUIContext = React.createContext<CommentsUIContextType | undefined>(undefined);

export function CommentsUIProvider({ children }: { children: React.ReactNode }) {
  const [isCommentsOpen, setIsCommentsOpen] = React.useState(false);
  
  return (
    <CommentsUIContext.Provider value={{ isCommentsOpen, setIsCommentsOpen }}>
      {children}
    </CommentsUIContext.Provider>
  );
}

export function useCommentsUI() {
  const context = React.useContext(CommentsUIContext);
  if (!context) {
    throw new Error('useCommentsUI must be used within CommentsUIProvider');
  }
  return context;
}