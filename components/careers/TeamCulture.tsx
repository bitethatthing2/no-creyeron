'use client';

import * as React from 'react';
import { Activity, Coffee, Gamepad2, Users2, Zap, MessageSquare } from 'lucide-react';

export function TeamCulture() {
  const culturePoints = [
    {
      icon: Activity,
      title: "High-Energy Environment",
      description: "Every shift brings new energy. From UFC fights to game day celebrations, there's never a dull moment."
    },
    {
      icon: Users2,
      title: "Team First Mentality",
      description: "We've got each other's backs. When it gets busy, we work as one unit to deliver an amazing experience."
    },
    {
      icon: Zap,
      title: "Fast-Paced Excellence",
      description: "We thrive under pressure. Quick service, multitasking, and staying cool when things get intense."
    },
    {
      icon: Coffee,
      title: "Always Stay Busy",
      description: "During slower times, there's always something to do. Prep, clean, learn, improve - we make every minute count."
    },
    {
      icon: MessageSquare,
      title: "Open Communication",
      description: "Ideas matter here. Whether you're new or experienced, your voice is heard and valued."
    },
    {
      icon: Gamepad2,
      title: "Fun at Work",
      description: "Work hard, have fun. We create an atmosphere where both staff and customers love to be."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-black mb-6">
          <span className="text-white">OUR</span>
          <br />
          <span className="bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
            PACK CULTURE
          </span>
        </h2>
        <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
          At Side Hustle, we know that great teams are built on shared values. 
          Here's what makes our Wolf Pack special.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {culturePoints.map((point, index) => {
          const IconComponent = point.icon;
          return (
            <div
              key={index}
              className="group bg-black/40 border border-white/10 rounded-2xl p-8 hover:bg-black/60 hover:border-red-500/30 transition-all duration-300"
            >
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-3">
                    {point.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed">
                    {point.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* The Reality Check Section */}
      <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/20 rounded-2xl p-8 backdrop-blur-sm">
        <h3 className="text-2xl font-bold text-white mb-6 text-center">
          Let's Be Real About the Hospitality Industry
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-semibold text-red-400 mb-3">The Ups</h4>
            <ul className="space-y-2 text-white/80">
              <li>• Great tips on busy nights</li>
              <li>• Exciting, energetic atmosphere</li>
              <li>• Amazing team camaraderie</li>
              <li>• Skills that transfer everywhere</li>
              <li>• Never boring or repetitive</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-orange-400 mb-3">The Downs</h4>
            <ul className="space-y-2 text-white/80">
              <li>• Some shifts are slower than others</li>
              <li>• Weekend and holiday work required</li>
              <li>• Dealing with difficult customers occasionally</li>
              <li>• Physical demands of standing/moving</li>
              <li>• Industry can be unpredictable</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 p-6 bg-black/40 rounded-xl border border-yellow-500/20">
          <p className="text-white text-center font-semibold">
            <span className="text-yellow-400">We're looking for people who understand this reality</span> 
            and still love the industry. If you can roll with the ups and downs, 
            stay busy during quiet times, and bring positive energy every shift - you'll thrive here.
          </p>
        </div>
      </div>
    </div>
  );
}