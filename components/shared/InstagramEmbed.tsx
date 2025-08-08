'use client';

import React from 'react';

export function InstagramEmbed({ className = '' }: { className?: string }) {
  return (
    <div className={`${className} space-y-3`}>
      <style jsx>{`
        .instagram-iframe {
          background: #FFF;
          border-radius: 3px;
          box-shadow: 0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15);
          max-width: 540px;
          min-width: 326px;
          width: 100%;
          height: 570px;
        }
        
        @media (max-width: 768px) {
          .instagram-iframe {
            height: 420px;
            min-width: 280px;
          }
        }
        
        @media (max-width: 480px) {
          .instagram-iframe {
            height: 380px;
            min-width: 260px;
          }
        }
      `}</style>
      <iframe
        className="instagram-iframe"
        src="https://www.instagram.com/sidehustle_bar/embed"
        width="400"
        height="570"
        frameBorder="0"
        scrolling="no"
        allowtransparency="true"
      />
    </div>
  );
}