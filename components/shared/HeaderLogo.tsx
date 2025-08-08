'use client';

import { DynamicLogo } from './DynamicLogo';

export default function HeaderLogo() {
  return (
    <div className="flex items-center">
      <DynamicLogo 
        type="wolf"
        width={150}
        height={24}
        className="w-auto h-auto max-w-[150px]"
        alt="Side Hustle Logo"
      />
    </div>
  );
}
