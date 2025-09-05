'use client';

import { useState } from 'react';
import { MapPin, Users, Clock, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { JobApplicationModal } from './JobApplicationModal';

export function OpenPositions() {
  const [expandedPosition, setExpandedPosition] = useState<number | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);

  const positions = [
    {
      title: "Bartender",
      location: "Salem & Portland",
      type: "Full-time / Part-time",
      experience: "1+ years preferred",
      description: "Join our high-energy bartending team! We're looking for experienced bartenders who can handle fast-paced service while creating amazing experiences for our guests.",
      responsibilities: [
        "Craft cocktails, pour beer, and serve wine with speed and precision",
        "Handle multiple orders during busy periods with a smile",
        "Maintain bar cleanliness and organization throughout shift",
        "Build relationships with regular customers",
        "Stay busy during slower periods with prep and cleaning tasks",
        "Work collaboratively with servers and kitchen staff"
      ],
      requirements: [
        "1+ years bartending experience preferred (will train the right personality)",
        "Ability to multitask in fast-paced environment",
        "Positive attitude and strong work ethic",
        "Reliable and punctual",
        "Must be 21+ and have OLCC certification",
        "Weekend and evening availability required"
      ],
      personality: [
        "High energy and enthusiasm",
        "Calm under pressure",
        "Natural people person",
        "Self-motivated during slow periods"
      ]
    },
    {
      title: "Server",
      location: "Salem & Portland", 
      type: "Full-time / Part-time",
      experience: "Experience preferred, will train right person",
      description: "We're seeking energetic servers who love hospitality and can thrive in our sports bar atmosphere. Great earning potential with our high-volume locations!",
      responsibilities: [
        "Provide exceptional customer service to all guests",
        "Take accurate orders and deliver food/drinks efficiently", 
        "Handle multiple tables during busy periods",
        "Process payments and handle cash accurately",
        "Maintain dining area cleanliness",
        "Stay productive during slower periods with side work"
      ],
      requirements: [
        "Previous serving experience preferred but not required",
        "Strong communication and multitasking skills",
        "Ability to work in fast-paced environment",
        "Must be 18+ (21+ for alcohol service)",
        "Food handlers permit required",
        "Flexible schedule including weekends/evenings"
      ],
      personality: [
        "Outgoing and friendly demeanor",
        "Adaptable and flexible", 
        "Team player mentality",
        "Proactive during downtime"
      ]
    },
    {
      title: "Kitchen Team Member",
      location: "Salem & Portland",
      type: "Full-time / Part-time", 
      experience: "All experience levels welcome",
      description: "Join our kitchen crew preparing fresh Mexican cuisine! We'll teach you our systems - we just need your energy and reliability.",
      responsibilities: [
        "Prepare fresh ingredients and cook menu items to spec",
        "Maintain food safety and kitchen cleanliness standards",
        "Work efficiently during rush periods",
        "Communicate with front of house staff",
        "Prep and clean during slower periods",
        "Learn and follow all recipes and procedures"
      ],
      requirements: [
        "Ability to work in hot, fast-paced kitchen environment",
        "Strong work ethic and attention to detail", 
        "Reliable attendance and punctuality",
        "Ability to lift 40+ lbs",
        "Food handlers permit required",
        "Willingness to learn and take direction"
      ],
      personality: [
        "Hard-working and dependable",
        "Works well under pressure",
        "Takes pride in food quality",
        "Stays busy and organized"
      ]
    },
    {
      title: "Security/Door Staff",
      location: "Salem & Portland",
      type: "Part-time / Weekend",
      experience: "Security experience preferred",
      description: "Keep our Wolf Pack safe! We need reliable security staff for busy nights and events. Great supplemental income opportunity.",
      responsibilities: [
        "Check IDs and monitor entrance during busy periods",
        "Maintain safe environment for staff and guests",
        "Handle difficult situations professionally and calmly",
        "Communicate with management about any issues",
        "Assist with crowd control during events",
        "Stay alert and engaged throughout shift"
      ],
      requirements: [
        "Must be 21+ years old",
        "Security experience strongly preferred",
        "Excellent judgment and de-escalation skills",
        "Physical ability to handle confrontations",
        "Clean background check required",
        "Available Friday/Saturday nights and special events"
      ],
      personality: [
        "Calm and level-headed",
        "Strong communication skills", 
        "Authoritative but approachable",
        "Vigilant and responsible"
      ]
    }
  ];

  const handleApplyClick = (position: any) => {
    setSelectedPosition(position);
    setShowApplicationModal(true);
  };

  const toggleExpanded = (index: number) => {
    setExpandedPosition(expandedPosition === index ? null : index);
  };

  return (
    <div id="positions" className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-black mb-6">
          <span className="bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
            OPEN
          </span>
          <br />
          <span className="text-white">POSITIONS</span>
        </h2>
        <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
          Ready to join the Wolf Pack? Check out our current openings and find your perfect fit.
        </p>
      </div>

      <div className="space-y-6">
        {positions.map((position, index) => (
          <div
            key={index}
            className="bg-gradient-to-r from-gray-900/80 to-black/80 border border-red-500/20 rounded-2xl overflow-hidden backdrop-blur-sm"
          >
            {/* Position Header */}
            <div className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
                <div className="mb-4 lg:mb-0">
                  <h3 className="text-2xl font-bold text-white mb-2">{position.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {position.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {position.type}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {position.experience}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => toggleExpanded(index)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-full hover:bg-white/20 transition-colors"
                  >
                    Details
                    {expandedPosition === index ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleApplyClick(position)}
                    className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-full hover:from-red-700 hover:to-orange-700 transition-all transform hover:scale-105"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
              
              <p className="text-white/80 leading-relaxed">{position.description}</p>
            </div>

            {/* Expanded Details */}
            {expandedPosition === index && (
              <div className="border-t border-white/10 bg-black/40 p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Responsibilities
                    </h4>
                    <ul className="space-y-2">
                      {position.responsibilities.map((resp, idx) => (
                        <li key={idx} className="text-white/70 text-sm">• {resp}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-orange-400 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Requirements  
                    </h4>
                    <ul className="space-y-2">
                      {position.requirements.map((req, idx) => (
                        <li key={idx} className="text-white/70 text-sm">• {req}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-yellow-400 mb-4">
                      Ideal Personality
                    </h4>
                    <ul className="space-y-2">
                      {position.personality.map((trait, idx) => (
                        <li key={idx} className="text-white/70 text-sm">• {trait}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                  <button
                    onClick={() => handleApplyClick(position)}
                    className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-full hover:from-red-700 hover:to-orange-700 transition-all transform hover:scale-105 text-lg"
                  >
                    Apply for {position.title}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Application Modal */}
      {showApplicationModal && selectedPosition && (
        <JobApplicationModal
          position={selectedPosition}
          isOpen={showApplicationModal}
          onClose={() => {
            setShowApplicationModal(false);
            setSelectedPosition(null);
          }}
        />
      )}
    </div>
  );
}