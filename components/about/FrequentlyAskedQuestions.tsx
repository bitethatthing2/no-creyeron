/**
 * FrequentlyAskedQuestions - FAQ section with factual information only
 * Uses only verified information about Side Hustle
 */

'use client';

import { useState } from 'react';

export function FrequentlyAskedQuestions() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What are your locations and hours?",
      answer: "We have two locations: Salem at 145 Liberty St NE Suite #101 (503-585-7827) and Portland at 327 SW Morrison St (coming soon). Salem hours: Mon-Wed 10AM-11PM, Thu closed, Fri 10AM-12AM, Sat-Sun 10AM-2AM. Portland hours will be Mon-Wed & Sun 10AM-12AM, Thu 10AM-1AM, Fri-Sat 10AM-2:30AM."
    },
    {
      question: "What type of food do you serve?",
      answer: "We specialize in Mexican cuisine in a high-energy sports bar atmosphere."
    },
    {
      question: "Do you show sports events?",
      answer: "Yes! We're a sports bar that shows UFC, boxing, and live sports on multiple screens."
    },
    {
      question: "What is the Wolf Pack community?",
      answer: "The Wolf Pack is our interactive social app that connects local members and enhances your Side Hustle experience."
    },
    {
      question: "Is the Portland location open?",
      answer: "Yes! The Portland location at 327 SW Morrison St opened on March 9, 2025. We now have two fully operational locations."
    },
    {
      question: "How can I contact you?",
      answer: "You can call our Salem location at 503-585-7827. Our Portland location is now open - contact information will be updated soon."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div 
            key={index}
            className="bg-gray-900 border border-red-600/20 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-6 py-4 text-left focus:outline-none focus:ring-2 focus:ring-red-600 hover:bg-gray-800 transition-colors"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">
                  {faq.question}
                </h3>
                <span className="text-red-400 text-xl">
                  {openIndex === index ? '−' : '+'}
                </span>
              </div>
            </button>
            
            {openIndex === index && (
              <div className="px-6 pb-4">
                <p className="text-gray-300 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}