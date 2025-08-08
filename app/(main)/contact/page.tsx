'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Instagram, MessageSquare, Send, ArrowLeft, Users, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    location: 'salem'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-orange-900/20 via-orange-600/10 to-amber-600/20 border-b border-orange-600/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-600/10 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 py-8 sm:py-16 relative z-10">
          <div className="max-w-4xl mx-auto">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center text-gray-300 hover:text-white mb-6 sm:mb-8 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4 sm:mb-6">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 mr-2 sm:mr-3" />
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white">
                  Get In Touch
                </h1>
              </div>
              <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed px-4">
                Questions about events, reservations, or private parties? We're here to help make your Side Hustle experience unforgettable.
              </p>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                <Badge variant="secondary" className="bg-orange-600/20 text-orange-300 border-orange-600/30">
                  <Users className="h-4 w-4 mr-2" />
                  Two Locations
                </Badge>
                <Badge variant="secondary" className="bg-orange-600/20 text-orange-300 border-orange-600/30">
                  <Music className="h-4 w-4 mr-2" />
                  Live Events
                </Badge>
                <Badge variant="secondary" className="bg-orange-600/20 text-orange-300 border-orange-600/30">
                  <Phone className="h-4 w-4 mr-2" />
                  (503) 391-9977
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-7xl mx-auto">
          
          {/* Contact Form */}
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-orange-600/20 rounded-2xl p-4 sm:p-8">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">Send Us a Message</h2>
              <p className="text-gray-300 text-sm sm:text-base">
                Whether you're planning a private event, have questions about our menu, or want to book our venue for your celebration, we'd love to hear from you.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                    First Name *
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Your first name"
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name *
                  </label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Your last name"
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              {/* Email and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(503) 555-0123"
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Location and Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                    Preferred Location
                  </label>
                  <select
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-md px-3 py-2 focus:border-orange-500 focus:ring-orange-500"
                  >
                    <option value="salem">Salem Location</option>
                    <option value="portland">Portland Location</option>
                    <option value="both">Both Locations</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-md px-3 py-2 focus:border-orange-500 focus:ring-orange-500"
                    required
                  >
                    <option value="">Select a topic</option>
                    <option value="reservation">Table Reservation</option>
                    <option value="private-event">Private Event Booking</option>
                    <option value="menu">Menu Questions</option>
                    <option value="live-music">Live Music & Events</option>
                    <option value="catering">Catering Services</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  Message *
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Tell us how we can help you..."
                  rows={5}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500 resize-none"
                  required
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Send className="h-5 w-5 mr-2" />
                Send Message
              </Button>
            </form>
          </div>

          {/* Location Information */}
          <div className="space-y-6 sm:space-y-8">
            {/* Salem Location */}
            <Card className="bg-zinc-900/50 border-orange-600/20 backdrop-blur-sm overflow-hidden">
              <div className="relative h-40 sm:h-48">
                <Image
                  src="/icons/salem-location.jpg"
                  alt="Side Hustle Bar Salem"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">Salem Flagship</h3>
                  <p className="text-gray-300 text-sm sm:text-base">Where it all started</p>
                </div>
              </div>
              <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium text-sm sm:text-base">145 Liberty Street NE, Suite #101</p>
                    <p className="text-gray-400 text-sm sm:text-base">Salem, OR 97301</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  <a href="tel:5033919977" className="text-white hover:text-orange-400 transition-colors">
                    (503) 391-9977
                  </a>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  <a href="mailto:contact@thesidehustlesalem.com" className="text-white hover:text-orange-400 transition-colors">
                    contact@thesidehustlesalem.com
                  </a>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium mb-2">Hours:</p>
                    <div className="space-y-1 text-sm text-gray-300">
                      <p><span className="text-white">Mon-Thu:</span> 10 AM - 12 AM</p>
                      <p><span className="text-white">Fri-Sat:</span> 10 AM - 2 AM</p>
                      <p><span className="text-white">Sunday:</span> 10 AM - 12 AM</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Portland Location */}
            <Card className="bg-zinc-900/50 border-orange-600/20 backdrop-blur-sm overflow-hidden">
              <div className="relative h-40 sm:h-48">
                <Image
                  src="/icons/portland-side-hustle.jpg"
                  alt="Side Hustle Bar Portland"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">Portland Expansion</h3>
                  <p className="text-gray-300 text-sm sm:text-base">Downtown vibes</p>
                </div>
                <Badge className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-green-600 hover:bg-green-700 text-xs sm:text-sm">
                  Opened March 2025
                </Badge>
              </div>
              <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium text-sm sm:text-base">327 SW Morrison Street</p>
                    <p className="text-gray-400 text-sm sm:text-base">Portland, OR 97204</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  <a href="tel:5033919977" className="text-white hover:text-orange-400 transition-colors">
                    (503) 391-9977
                  </a>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  <a href="mailto:contact@thesidehustleportland.com" className="text-white hover:text-orange-400 transition-colors">
                    contact@thesidehustleportland.com
                  </a>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium mb-2">Extended Hours:</p>
                    <div className="space-y-1 text-sm text-gray-300">
                      <p><span className="text-white">Sun-Wed:</span> 10 AM - 12 AM</p>
                      <p><span className="text-white">Thursday:</span> 10 AM - 1 AM</p>
                      <p><span className="text-white">Fri-Sat:</span> 10 AM - 3 AM</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media & Quick Contact */}
            <Card className="bg-gradient-to-r from-orange-600/10 to-amber-600/10 border-orange-600/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold text-white mb-4">Follow the Wolf Pack</h3>
                <p className="text-gray-300 mb-6">
                  Stay connected for the latest events, menu updates, and exclusive offers from both locations.
                </p>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <a 
                      href="https://instagram.com/sidehustle_bar" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-white hover:text-orange-400 transition-colors"
                    >
                      <Instagram className="h-5 w-5" />
                      <span className="text-sm sm:text-base">@sidehustle_bar</span>
                    </a>
                    <div className="hidden sm:block text-gray-400">•</div>
                    <span className="text-gray-300 text-sm sm:text-base">101K+ followers</span>
                  </div>
                  
                  <Button
                    onClick={() => window.open('https://instagram.com/sidehustle_bar', '_blank')}
                    variant="outline"
                    className="border-orange-600/50 text-orange-400 hover:bg-orange-600/10 w-full sm:w-auto"
                  >
                    Follow Us
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}