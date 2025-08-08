/**
 * AboutHero - Hero section for the about page
 * Uses only verified real information about Side Hustle
 */

import Image from 'next/image';

export function AboutHero() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-red-900">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/icons/salem-location.jpg"
          alt="Side Hustle Salem Location"
          fill
          className="object-cover opacity-30"
          priority
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
          About Side Hustle
        </h1>
        
        <p className="text-xl sm:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed">
          Salem & Portland's premier sports bar and entertainment venue, 
          specializing in Mexican cuisine and high-energy atmosphere.
        </p>
        
        {/* Verified Business Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 border border-red-600/20">
            <h3 className="text-lg font-semibold text-red-400 mb-2">Salem Location</h3>
            <p className="text-gray-300">145 Liberty St NE Suite #101</p>
            <p className="text-gray-300">Salem, OR 97301</p>
            <p className="text-red-400 font-medium mt-2">503-585-7827</p>
          </div>
          
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 border border-red-600/20">
            <h3 className="text-lg font-semibold text-red-400 mb-2">Portland Location</h3>
            <p className="text-gray-300">327 SW Morrison St</p>
            <p className="text-gray-300">Portland, OR 97204</p>
            <p className="text-green-400 font-medium mt-2">Now Open!</p>
          </div>
        </div>
      </div>
    </section>
  );
}