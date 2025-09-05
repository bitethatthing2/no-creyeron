'use client';

import * as React from 'react';
import { Zap, Users, TrendingUp, Heart } from 'lucide-react';
import Image from 'next/image';

export function CareersHero() {
  return (
    <section className="relative h-screen bg-gradient-to-br from-black via-gray-900 to-red-900 flex items-center justify-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(239,68,68,0.1)_50%,transparent_70%)]"></div>
      </div>
      
      {/* Wolf Pack Logo */}
      <div className="absolute top-8 right-8 opacity-20 z-10">
        <Image
          src="https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png"
          alt="Wolf Pack"
          width={120}
          height={120}
          className="filter brightness-150"
        />
      </div>

      <div className="relative z-20 text-center px-4 max-w-5xl mx-auto">
        {/* Main Headline */}
        <div className="mb-8">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black mb-6">
            <span className="bg-gradient-to-r from-red-400 via-red-500 to-orange-500 bg-clip-text text-transparent">
              JOIN THE
            </span>
            <br />
            <span className="text-white">
              WOLF PACK
            </span>
          </h1>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px bg-gradient-to-r from-transparent via-red-500 to-transparent flex-1"></div>
            <div className="text-red-500 text-xl font-bold">★</div>
            <div className="h-px bg-gradient-to-r from-transparent via-red-500 to-transparent flex-1"></div>
          </div>
          
          <p className="text-xl sm:text-2xl lg:text-3xl text-white/90 font-medium max-w-3xl mx-auto leading-relaxed">
            Ready for a <span className="text-red-400 font-bold">fast-paced</span> career where 
            <span className="text-orange-400 font-bold"> personality</span> and 
            <span className="text-red-400 font-bold"> experience</span> matter most?
          </p>
        </div>

        {/* Key Points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-black/30 backdrop-blur-sm border border-red-500/20 rounded-xl p-6 transform hover:scale-105 transition-all duration-300">
            <Zap className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">High-Energy</h3>
            <p className="text-white/80 text-sm">Thrive in our fast-paced, exciting environment</p>
          </div>
          
          <div className="bg-black/30 backdrop-blur-sm border border-orange-500/20 rounded-xl p-6 transform hover:scale-105 transition-all duration-300">
            <Users className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Team Spirit</h3>
            <p className="text-white/80 text-sm">Join a tight-knit crew that has your back</p>
          </div>
          
          <div className="bg-black/30 backdrop-blur-sm border border-red-500/20 rounded-xl p-6 transform hover:scale-105 transition-all duration-300">
            <TrendingUp className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Growth</h3>
            <p className="text-white/80 text-sm">Advance your career with real opportunities</p>
          </div>
          
          <div className="bg-black/30 backdrop-blur-sm border border-orange-500/20 rounded-xl p-6 transform hover:scale-105 transition-all duration-300">
            <Heart className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Passion</h3>
            <p className="text-white/80 text-sm">Love what you do in an amazing atmosphere</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button 
            onClick={() => document.getElementById('positions')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            View Open Positions
          </button>
          <p className="mt-4 text-white/60 text-sm">
            Salem • Portland • Oregon
          </p>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-8 w-2 h-2 bg-red-500 rounded-full animate-pulse opacity-60"></div>
      <div className="absolute top-1/3 right-12 w-3 h-3 bg-orange-500 rounded-full animate-pulse opacity-40 animation-delay-1000"></div>
      <div className="absolute bottom-1/4 left-12 w-1 h-1 bg-red-400 rounded-full animate-pulse opacity-50 animation-delay-2000"></div>
    </section>
  );
}