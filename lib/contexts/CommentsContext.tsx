'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface wolfpack_commentsContextType {
  iswolfpack_commentsOpen: boolean;
  setIswolfpack_commentsOpen: (open: boolean) => void;
}

const wolfpack_commentsContext = createContext<wolfpack_commentsContextType | undefined>(undefined);

export function wolfpack_commentsProvider({ children }: { children: ReactNode }) {
  const [iswolfpack_commentsOpen, setIswolfpack_commentsOpen] = useState(false);

  return (
    <wolfpack_commentsContext.Provider value={{ iswolfpack_commentsOpen, setIswolfpack_commentsOpen }}>
      {children}
    </wolfpack_commentsContext.Provider>
  );
}

export function usewolfpack_comments() {
  const context = useContext(wolfpack_commentsContext);
  if (context === undefined) {
    throw new Error('usewolfpack_comments must be used within a wolfpack_commentsProvider');
  }
  return context;
}