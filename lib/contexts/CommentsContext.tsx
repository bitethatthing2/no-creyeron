'use client';

import * as React from 'react';
import { ReactNode } from 'react';

interface content_commentsContextType {
  iscontent_commentsOpen: boolean;
  setIscontent_commentsOpen: (open: boolean) => void;
}

const content_commentsContext = React.createContext<content_commentsContextType | undefined>(undefined);

export function WolfpackCommentsProvider({ children }: { children: ReactNode }) {
  const [iscontent_commentsOpen, setIscontent_commentsOpen] = React.useState(false);

  return (
    <content_commentsContext.Provider value={{ iscontent_commentsOpen, setIscontent_commentsOpen }}>
      {children}
    </content_commentsContext.Provider>
  );
}

export function useWolfpackComments() {
  const context = React.useContext(content_commentsContext);
  if (context === undefined) {
    throw new Error('useWolfpackComments must be used within a WolfpackCommentsProvider');
  }
  return context;
}