// app/(main)/menu/MenuClient.tsx

'use client';

import SliderMenu from '@/components/menu/SliderMenu';

export default function MenuClient() {
  return (
    <div className="w-full">
      <SliderMenu 
        initialType="all"
        showSearch={true}
        autoPlay={false}
        className="w-full"
      />
    </div>
  );
}