// app/(main)/menu/MenuClient.tsx

'use client';

export default function MenuClient() {
  return (
    <div className="content-container">
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-6">Menu</h1>
        <div className="max-w-md mx-auto p-6 bg-zinc-800/50 rounded-lg border border-zinc-700">
          <h2 className="text-xl font-semibold text-white mb-4">Coming Soon!</h2>
          <p className="text-zinc-300 mb-6">
            Our digital menu system is being updated. Please visit us in person to see our full menu offerings.
          </p>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>📍 Portland: 123 Main St</p>
            <p>📍 Salem: 456 Oak Ave</p>
            <p>📞 Call us for current specials</p>
          </div>
        </div>
      </div>
    </div>
  );
}