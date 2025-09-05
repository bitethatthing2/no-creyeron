'use client';

import * as React from 'react';
import { Clock, Trophy, Smile, DollarSign, Calendar, Star } from 'lucide-react';

export function WhyWorkHere() {
  const benefits = [
    {
      icon: DollarSign,
      title: "Competitive Pay & Tips",
      description: "Great base pay plus excellent tip opportunities in high-volume locations",
      highlight: "$$$ Earning Potential"
    },
    {
      icon: Clock,
      title: "Flexible Scheduling",
      description: "We understand life happens - flexible scheduling that works with your lifestyle",
      highlight: "Work-Life Balance"
    },
    {
      icon: Trophy,
      title: "Performance Recognition",
      description: "Monthly bonuses, performance incentives, and recognition for outstanding work",
      highlight: "Rewards & Incentives"
    },
    {
      icon: Star,
      title: "Career Advancement",
      description: "Clear paths for promotion - many of our managers started as servers or bartenders",
      highlight: "Grow Your Career"
    },
    {
      icon: Smile,
      title: "Fun Work Environment",
      description: "Work where people come to have the best time - sports, great food, and amazing energy",
      highlight: "Love Where You Work"
    },
    {
      icon: Calendar,
      title: "Paid Time Off",
      description: "Earn PTO from day one, plus holiday pay and special event bonuses",
      highlight: "Time to Recharge"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-black mb-6">
          <span className="bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
            WHY CHOOSE
          </span>
          <br />
          <span className="text-white">SIDE HUSTLE?</span>
        </h2>
        <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
          We're not just another restaurant. We're a high-energy, fast-paced environment where 
          <span className="text-red-400 font-semibold"> your personality shines</span> and 
          <span className="text-orange-400 font-semibold"> your experience pays off</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {benefits.map((benefit, index) => {
          const IconComponent = benefit.icon;
          return (
            <div
              key={index}
              className="group bg-gradient-to-br from-gray-900 to-black border border-red-500/20 rounded-2xl p-8 hover:border-red-500/40 transition-all duration-300 transform hover:scale-105"
            >
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-2">
                  {benefit.highlight}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {benefit.title}
                </h3>
              </div>
              <p className="text-white/70 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Call to Action */}
      <div className="mt-16 text-center">
        <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 border border-red-500/30 rounded-2xl p-8 backdrop-blur-sm">
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to Join the Pack?
          </h3>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            We're looking for high-energy individuals who can handle our fast-paced environment 
            and thrive during both busy rushes and quieter moments. If you love hospitality 
            and want to be part of something special, we want to hear from you.
          </p>
          <button 
            onClick={() => document.getElementById('positions')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105"
          >
            See Open Positions
          </button>
        </div>
      </div>
    </div>
  );
}