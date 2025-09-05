'use client';

import * as React from 'react';
import { FileText, MessageCircle, Calendar, UserCheck, Clock, CheckCircle } from 'lucide-react';

export function ApplicationProcess() {
  const steps = [
    {
      icon: FileText,
      title: "Submit Application",
      description: "Fill out our comprehensive application form focusing on your experience and personality",
      timeline: "Takes 10-15 minutes",
      status: "active"
    },
    {
      icon: MessageCircle,
      title: "Initial Review",
      description: "Our hiring team reviews your application and personality responses",
      timeline: "1-2 business days",
      status: "upcoming"
    },
    {
      icon: Calendar,
      title: "Interview",
      description: "Meet with our management team - could be in-person or video call",
      timeline: "30-45 minutes",
      status: "upcoming"
    },
    {
      icon: UserCheck,
      title: "Trial Shift",
      description: "Experience our environment firsthand with a paid trial shift",
      timeline: "3-4 hours",
      status: "upcoming"
    },
    {
      icon: CheckCircle,
      title: "Welcome to the Pack",
      description: "Complete onboarding and start your Side Hustle journey!",
      timeline: "Orientation day",
      status: "upcoming"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-black mb-6">
          <span className="text-white">APPLICATION</span>
          <br />
          <span className="bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
            PROCESS
          </span>
        </h2>
        <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
          We want to get to know the real you. Our process is designed to ensure 
          you're a great fit for our team and we're a great fit for you.
        </p>
      </div>

      <div className="space-y-8">
        {steps.map((step, index) => {
          const IconComponent = step.icon;
          return (
            <div
              key={index}
              className={`relative flex items-start gap-8 p-8 rounded-2xl transition-all duration-300 ${
                step.status === 'active'
                  ? 'bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30'
                  : 'bg-black/20 border border-white/10 hover:bg-black/40 hover:border-white/20'
              }`}
            >
              {/* Step Number */}
              <div className="flex-shrink-0">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  step.status === 'active'
                    ? 'bg-gradient-to-br from-red-500 to-orange-500'
                    : 'bg-white/10'
                }`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <div className={`text-center mt-2 text-sm font-bold ${
                  step.status === 'active' ? 'text-red-400' : 'text-white/60'
                }`}>
                  Step {index + 1}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-white mb-2 lg:mb-0">
                    {step.title}
                  </h3>
                  <div className="flex items-center gap-2 text-orange-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">{step.timeline}</span>
                  </div>
                </div>
                <p className="text-white/70 text-lg leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-8 top-24 w-0.5 h-16 bg-gradient-to-b from-white/20 to-transparent"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* What We Look For */}
      <div className="mt-20">
        <h3 className="text-3xl font-bold text-center text-white mb-12">
          What We Look For
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Personality",
              description: "High energy, positive attitude, and genuine love for hospitality",
              color: "from-red-500 to-pink-500"
            },
            {
              title: "Adaptability", 
              description: "Ability to handle fast-paced environment and changing priorities",
              color: "from-orange-500 to-yellow-500"
            },
            {
              title: "Work Ethic",
              description: "Self-motivated during slow periods and dedicated to excellence",
              color: "from-green-500 to-teal-500"
            },
            {
              title: "Team Player",
              description: "Collaborative spirit and willingness to help teammates succeed",
              color: "from-blue-500 to-purple-500"
            }
          ].map((quality, index) => (
            <div
              key={index}
              className="bg-black/40 border border-white/10 rounded-xl p-6 text-center hover:bg-black/60 transition-colors"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${quality.color} rounded-full mx-auto mb-4`}></div>
              <h4 className="text-lg font-bold text-white mb-3">{quality.title}</h4>
              <p className="text-white/70 text-sm">{quality.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-16 text-center">
        <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 border border-red-500/30 rounded-2xl p-8 backdrop-blur-sm">
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h3>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Don't wait - great opportunities move fast in the hospitality industry. 
            Join the Wolf Pack today and start building an exciting career with us.
          </p>
          <button 
            onClick={() => document.getElementById('positions')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105"
          >
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
}