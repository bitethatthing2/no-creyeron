'use client';

import * as React from 'react';
import { ReactNode } from 'react';

interface wolfpack_commentsContextType {
  iswolfpack_commentsOpen: boolean;
  setIswolfpack_commentsOpen: (open: boolean) => void;
}

const wolfpack_commentsContext = React.createContext<wolfpack_commentsContextType | undefined>(undefined);

export function WolfpackCommentsProvider({ children }: { children: ReactNode }) {
  const [iswolfpack_commentsOpen, setIswolfpack_commentsOpen] = React.useState(false);

  return (
    <wolfpack_commentsContext.Provider value={{ iswolfpack_commentsOpen, setIswolfpack_commentsOpen }}>
      {children}
    </wolfpack_commentsContext.Provider>
  );
}

export function useWolfpackComments() {
  const context = React.useContext(wolfpack_commentsContext);
  if (context === undefined) {
    throw new Error('useWolfpackComments must be used within a WolfpackCommentsProvider');
  }
  return context;
}