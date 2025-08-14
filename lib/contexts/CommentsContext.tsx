'use client';

import * as React from 'react';

interface wolfpack_commentsContextType {
  iswolfpack_commentsOpen: boolean;
  setIswolfpack_commentsOpen: (open: boolean) => void;
}

const wolfpack_commentsContext = React.createContext<wolfpack_commentsContextType | undefined>(undefined);

export function wolfpack_commentsProvider({ children }: { children: ReactNode }) {
  const [iswolfpack_commentsOpen, setIswolfpack_commentsOpen] = React.useState(false);

  return (
    <wolfpack_commentsContext.Provider value={{ iswolfpack_commentsOpen, setIswolfpack_commentsOpen }}>
      {children}
    </wolfpack_commentsContext.Provider>
  );
}

export function usewolfpack_comments() {
  const context = React.useContext(wolfpack_commentsContext);
  if (context === undefined) {
    throw new Error('usewolfpack_comments must be used within a wolfpack_commentsProvider');
  }
  return context;
}