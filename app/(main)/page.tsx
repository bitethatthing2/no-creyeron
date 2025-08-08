"use client";

import { useState, useEffect, useCallback } from 'react';
import { useLocationState } from '@/lib/hooks/useLocationState';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, Download, Bell, Star, Users, MapPin, Clock, Loader2 } from "lucide-react";
import dynamic from 'next/dynamic';
import { PwaInstallGuide } from '@/components/shared/PwaInstallGuide';
import { NotificationErrorBoundary } from '@/components/shared/NotificationErrorBoundary';
import { DynamicLogo } from '@/components/shared/DynamicLogo';
import { DynamicGoogleMaps } from '@/components/shared/DynamicGoogleMaps';
import { InstagramEmbed } from '@/components/shared/InstagramEmbed';
import React, { Suspense } from 'react';
import { VideoBackground } from '@/components/shared/VideoBackground';
import { FoodDrinkCarousel } from '@/components/shared/FoodDrinkCarousel';
import { Footer } from '@/components/shared/Footer';
import { TopNav } from '@/components/shared/TopNav';
import { getSmartCacheBustedUrl } from '@/lib/utils/image-cache';

// Dynamically import components that use browser APIs
const NotificationIndicator = dynamic(
  () => import('@/components/notifications/NotificationIndicator').then(mod => ({ default: mod.NotificationIndicator })),
  { ssr: false }
);

// Loading fallback component
const NotificationIndicatorFallback = () => (
  <Button className="gap-1.5">
    <span className="h-4 w-4 animate-pulse bg-muted rounded-full"></span>
    <span>Loading...</span>
  </Button>
);


export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);
  const { location } = useLocationState();

  // Wait for component to mount to ensure client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orderDropdownOpen && !(event.target as Element).closest('.order-dropdown')) {
        setOrderDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [orderDropdownOpen]);

  // Optimized click handlers to prevent performance violations
  const handleToggleDropdown = useCallback(() => {
    setOrderDropdownOpen(prev => !prev);
  }, []);

  const handleDoorDashClick = useCallback(() => {
    window.open('https://www.doordash.com/store/side-hustle-bar-salem-25388462/27964950/', '_blank');
    setOrderDropdownOpen(false);
  }, []);

  const handleUberEatsClick = useCallback(() => {
    window.open('https://www.ubereats.com/store/side-hustle-bar/n5ak1cjlRvuf0Hefn7Iddw', '_blank');
    setOrderDropdownOpen(false);
  }, []);

  const handlePostmatesClick = useCallback(() => {
    window.open('https://postmates.com/store/side-hustle-bar/n5ak1cjlRvuf0Hefn7Iddw', '_blank');
    setOrderDropdownOpen(false);
  }, []);

  return (
    <div className="main-content bg-black text-white min-h-screen">
      <TopNav />
      {/* Hero Section with Video Background - Full Screen */}
      <div className="relative h-screen w-full overflow-visible mb-16 pt-14">
        <VideoBackground 
          wolfpack_videosrc="/icons/main-page-only.mp4"
          overlayOpacity={0.4}
        />
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-center z-10 px-4 text-center pt-24 sm:pt-32 md:pt-40 pb-20 sm:pb-32 overflow-y-auto">
          {/* Combined Logo with Wolf and Title */}
          <div className="mb-2 sm:mb-4 mt-4 sm:mt-8 md:mt-12 animate-fade-in">
            <Image 
              src={getSmartCacheBustedUrl('/icons/wolf-and-title.png')}
              alt="Side Hustle Bar"
              width={400}
              height={200}
              className="mx-auto w-full max-w-[240px] sm:max-w-[280px] md:max-w-[350px] lg:max-w-[450px] h-auto"
              priority
              unoptimized
            />
          </div>
          
          {/* Main Hero Text */}
          <h1 className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3 max-w-4xl leading-tight drop-shadow-2xl px-2 sm:px-4">
            Experience Salem's Best Tacos
            <br />
            <span className="text-red-500 font-serif">7 Days a Week</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xs sm:text-sm md:text-lg text-white/90 mb-3 sm:mb-6 max-w-2xl leading-relaxed drop-shadow-lg px-2 sm:px-4">
            Authentic flavors, vibrant atmosphere, and unforgettable experiences at both locations
          </p>
          
          {/* Dual Location & Hours Cards */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4 max-w-4xl lg:max-w-6xl mb-6 mx-auto px-2">
            {/* Salem Location Card */}
            <div className="backdrop-blur-lg bg-black/50 rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 lg:p-6 shadow-2xl border border-white/20">
              <div className="text-white text-center">
                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-red-500 mb-2 lg:mb-3">Salem Location</h3>
                <div className="space-y-1 lg:space-y-2 text-[10px] sm:text-xs lg:text-sm">
                  <p className="font-medium hidden sm:block">145 Liberty St NE Suite #101</p>
                  <p className="font-medium block sm:hidden">145 Liberty St NE</p>
                  <p className="font-medium">Salem, OR 97301</p>
                  <p className="font-semibold text-yellow-400">📞 (503) 391-9977</p>
                </div>
                <div className="mt-2 lg:mt-4 pt-2 lg:pt-3 border-t border-white/20">
                  <h4 className="text-xs sm:text-sm font-bold text-red-400 mb-1 lg:mb-2">Hours</h4>
                  <div className="space-y-0.5 lg:space-y-1 text-[9px] sm:text-[10px] lg:text-xs">
                    <p><span className="font-medium">M-Th:</span> 10AM-12AM</p>
                    <p><span className="font-medium">F-Sa:</span> 10AM-2AM</p>
                    <p><span className="font-medium">Sun:</span> 10AM-12AM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Portland Location Card */}
            <div className="backdrop-blur-lg bg-black/50 rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 lg:p-6 shadow-2xl border border-white/20">
              <div className="text-white text-center">
                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-red-500 mb-2 lg:mb-3">Portland Location</h3>
                <div className="space-y-1 lg:space-y-2 text-[10px] sm:text-xs lg:text-sm">
                  <p className="font-medium hidden sm:block">327 SW Morrison Street</p>
                  <p className="font-medium block sm:hidden">327 SW Morrison</p>
                  <p className="font-medium">Portland, OR 97204</p>
                  <p className="font-semibold text-yellow-400">📞 (503) 555-0123</p>
                </div>
                <div className="mt-2 lg:mt-4 pt-2 lg:pt-3 border-t border-white/20">
                  <h4 className="text-xs sm:text-sm font-bold text-red-400 mb-1 lg:mb-2">Hours</h4>
                  <div className="space-y-0.5 lg:space-y-1 text-[9px] sm:text-[10px] lg:text-xs">
                    <p><span className="font-medium">M-Th:</span> 11AM-1AM</p>
                    <p><span className="font-medium">F-Sa:</span> 11AM-3AM</p>
                    <p><span className="font-medium">Sun:</span> 11AM-1AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* App Install & Notifications Section */}
          <div className="mb-4 px-4 w-full max-w-md">
            <div className="flex gap-2">
              {/* Install App Button */}
              <PwaInstallGuide className="flex-1 bg-red-600/90 hover:bg-red-700/90 backdrop-blur-sm text-white py-1.5 px-3 text-xs font-medium rounded-full border border-white/20 flex items-center justify-center gap-1.5 transition-all" 
                buttonText={
                  <div className="flex items-center gap-1.5">
                    <Download className="h-3 w-3" />
                    <span>Install App</span>
                  </div>
                }
              />

              {/* Enable Notifications Button */}
              <Button 
                className="flex-1 bg-green-600/90 hover:bg-green-700/90 backdrop-blur-sm text-white py-1.5 px-3 text-xs font-medium rounded-full border border-white/20 transition-all"
                onClick={async () => {
                  try {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                      alert('🎉 Notifications enabled!');
                    } else if (permission === 'denied') {
                      alert('Notifications blocked. Enable in browser settings.');
                    } else {
                      alert('Notification permission dismissed.');
                    }
                  } catch (error) {
                    alert('Error enabling notifications.');
                  }
                }}
              >
                <Bell className="h-3 w-3 mr-1" />
                Notifications
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 relative z-20 px-4 w-full max-w-md sm:max-w-none">
            <div className="relative order-dropdown w-full sm:w-auto">
              <div 
                onClick={handleToggleDropdown}
                className="w-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-semibold rounded-full border-2 border-white/30 hover:border-white/50 transition-all shadow-lg hover:shadow-xl cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span>Order Online</span>
                  <svg className={`w-5 h-5 text-white transition-transform ${orderDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {orderDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 shadow-xl z-[1000]">
                  <div className="py-1">
                    <div 
                      onClick={handleDoorDashClick}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <div className="w-5 h-5 bg-white rounded-full p-0.5 flex items-center justify-center">
                        <Image src={getSmartCacheBustedUrl('/icons/doordash_icon.png')} alt="DoorDash" width={16} height={16} className="rounded" style={{width: 'auto', height: 'auto'}} />
                      </div>
                      <span className="text-sm text-white">DoorDash</span>
                    </div>
                    <div 
                      onClick={handleUberEatsClick}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <div className="w-5 h-5 bg-white rounded-full p-0.5 flex items-center justify-center">
                        <Image src={getSmartCacheBustedUrl('/icons/uber-eats.png')} alt="Uber Eats" width={16} height={16} className="rounded" />
                      </div>
                      <span className="text-sm text-white">Uber Eats</span>
                    </div>
                    <div 
                      onClick={handlePostmatesClick}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <div className="w-5 h-5 bg-white rounded-full p-0.5 flex items-center justify-center">
                        <Image src={getSmartCacheBustedUrl('/icons/postmates.png')} alt="Postmates" width={16} height={16} className="rounded" style={{width: 'auto', height: 'auto'}} />
                      </div>
                      <span className="text-sm text-white">Postmates</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>

      {/* Featured Section */}
      <section className="pt-16 pb-16 px-4 bg-zinc-900">
        <div className="container mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-center mb-4 text-white leading-tight">
            Executive Chef Rebecca Sanchez's <span className="text-red-400">Culinary Vision</span>
          </h2>
          <p className="text-base sm:text-lg text-white/90 mb-8 leading-relaxed max-w-3xl mx-auto text-center">
            Under Chef Rebecca's leadership, our kitchen has become the talk of Salem. Every dish is crafted with passion, 
            from our signature birria that melts in your mouth to our innovative fusion creations that push boundaries. 
            With house-made salsas prepared fresh daily and locally-sourced ingredients whenever possible, 
            we're not just serving food – we're creating experiences.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-16">
            <div className="text-center p-3">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Utensils className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white">Legendary Birria</h3>
              <p className="text-xs sm:text-sm text-white/80">
                Our birria tacos, ramen, and burritos have earned a cult following, with tender meat 
                slow-cooked to perfection in our secret blend of spices.
              </p>
            </div>
            <div className="text-center p-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white">House-Made Everything</h3>
              <p className="text-xs sm:text-sm text-white/80">
                From our "bomb" salsas to fresh guacamole and hand-pressed tortillas, 
                we believe authentic flavor comes from doing things the right way.
              </p>
            </div>
            <div className="text-center p-3">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white">Value Meets Quality</h3>
              <p className="text-xs sm:text-sm text-white/80">
                With most dishes between $10-20, we prove that exceptional Mexican cuisine 
                doesn't have to break the bank.
              </p>
            </div>
          </div>
          
          {/* Food & Drink Carousel */}
          <div className="mb-16">
            <FoodDrinkCarousel />
          </div>

          {/* Text Content - Salem Flagship */}
          <div className="max-w-6xl mx-auto mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
              <div className="lg:col-span-2 text-center lg:text-left">
                <h3 className="text-3xl font-serif text-red-400 mb-6">Salem's Premier Entertainment Destination</h3>
                <p className="text-lg text-white/90 leading-relaxed mb-6">
                  Since opening in late 2023, our flagship Salem location at 145 Liberty St NE has redefined Oregon's bar scene. 
                  Executive Chef Rebecca Sanchez leads our kitchen with an innovative Mexican menu that goes far beyond typical bar food. 
                  From our legendary birria tacos that locals can't stop raving about to our house-made salsas crafted fresh daily, 
                  every dish reflects our commitment to authentic flavors and quality ingredients.
                </p>
                <p className="text-lg text-white/80 leading-relaxed">
                  With over <span className="text-red-400 font-semibold">750+ five-star reviews</span> and a growing community of 
                  <span className="text-red-400 font-semibold"> 101,000+ Instagram followers</span>, we've proven that Salem was ready 
                  for something different - a place where exceptional food meets high-energy entertainment.
                </p>
              </div>
              <div className="lg:col-span-3 relative">
                <div className="aspect-[4/3] lg:aspect-video rounded-xl overflow-hidden shadow-2xl bg-black">
                  <video 
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                    className="absolute inset-0 w-full h-full"
                    style={{ 
                      objectFit: 'cover',
                      objectPosition: 'center',
                      width: '100%',
                      height: '100%',
                      minWidth: '100%',
                      minHeight: '100%'
                    }}
                  >
                    <source src="/icons/priemer-destination.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
      {/* Oregon's UFC House Section */}
      <section className="py-8 sm:py-12 lg:py-16 px-4 bg-black">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif mb-4 text-white leading-tight">
                  Oregon's Premier <span className="text-red-400">UFC House</span>
                </h2>
                <p className="text-base text-white/90 mb-4 leading-relaxed">
                  We've earned our reputation as the ultimate fight destination with multiple large screens, 
                  no cover charges, and an electric atmosphere that draws capacity crowds for every major event. 
                  Whether it's UFC, boxing, or your favorite team's big game, our state-of-the-art viewing setup 
                  ensures you won't miss a second of the action.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-white/90 text-sm">Multiple 75" screens throughout the venue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-white/90 text-sm">No cover charge for UFC events</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-white/90 text-sm">Premium sound system for full immersion</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-white/90 text-sm">VIP table reservations available</span>
                  </div>
                </div>
                <Link href="/wolfpack">
                  <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 text-base font-semibold rounded-full">
                    Join the Wolf Pack
                  </Button>
                </Link>
              </div>
              <div className="relative h-[350px] rounded-xl overflow-hidden shadow-2xl">
                <Image 
                  src={getSmartCacheBustedUrl('/icons/ufc-section.jpeg')}
                  alt="UFC Night at Side Hustle Bar"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-semibold text-base">Experience the Energy</p>
                  <p className="text-white/80 text-sm">Every fight, every round, every knockout</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Wolf Pack Community Section */}
      <section className="py-20 px-4 bg-black">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif mb-6 text-white leading-tight">
              Join the <span className="text-red-400">Wolf Pack</span> Community
            </h2>
            <p className="text-lg sm:text-xl text-white/90 leading-relaxed">
              More than just a bar, Side Hustle is where the Wolf Pack comes together. 
              Our community of over 101,000 Instagram followers knows that this is where 
              you unlock your potential, reach your goals, and live your best life. 
              From daily regulars to weekend warriors, everyone finds their place in the pack.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-[500px] rounded-xl overflow-hidden shadow-2xl">
              <video
                className="absolute inset-0 w-full h-full object-cover"
                src="/icons/welcome-to-hustle.mp4"
                autoPlay
                muted
                loop
                playsInline
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-white font-bold text-2xl mb-2">Every Day, Every Night</h3>
                <p className="text-white/90">From lunch meetings to late-night celebrations</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-3xl font-serif mb-6 text-white">From Family-Friendly to Nightlife Destination</h3>
              <p className="text-lg text-white/80 mb-8 leading-relaxed">
                Our multi-level venue seamlessly transitions from family-friendly restaurant by day to vibrant nightclub by night. 
                With gaming areas, outdoor parklet seating, and intimate lounges, there's a perfect spot for every occasion and every member of the pack.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                  <span className="text-white/90 text-lg">Game Night Live with trivia and R0CK'N Bingo</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                  <span className="text-white/90 text-lg">Live music Thursday through Sunday evenings</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                  <span className="text-white/90 text-lg">Major acts: MARIO, KIRKO BANGZ, JOHN HART, LUNIZ, ATM Danny, J Balvin After Party, Shawty Bae, ILOVEMAKONNEN, Trinidad James, Casey Veggies & Adrian Marcel</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                  <span className="text-white/90 text-lg">Pool, giant Jenga, and giant Connect Four gaming</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-8">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-amber-400 fill-amber-400" />
                ))}
                <span className="text-white/80 font-semibold text-lg ml-2">4.7 stars • 750+ reviews</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Portland Expansion Section */}
      <section className="py-20 px-4 bg-zinc-900">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif mb-6 text-white leading-tight">
              Expanding to <span className="text-red-400">Portland</span>
            </h2>
            <p className="text-lg sm:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto">
              The Wolf Pack is growing. Our Portland location at 327 SW Morrison Street brings the same legendary food, 
              electric atmosphere, and community spirit to Oregon's biggest city. With extended late-night hours and 
              an even bigger stage for live music, Portland is ready for the Side Hustle experience.
            </p>
          </div>

          {/* Portland Location Image */}
          <div className="mb-16">
            <div className="relative h-[400px] md:h-[500px] rounded-xl overflow-hidden shadow-2xl mx-auto max-w-4xl">
              <Image 
                src={getSmartCacheBustedUrl('/icons/portland-side-hustle.jpg')}
                alt="Side Hustle Bar Portland Location"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-white font-bold text-2xl mb-2">327 SW Morrison Street</h3>
                <p className="text-white/90 text-lg">Downtown Portland's newest entertainment destination</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Prime Downtown Location</h3>
              <p className="text-white/80">
                327 SW Morrison Street puts us in the heart of Portland's entertainment district, 
                perfect for pre-game drinks or post-work celebrations.
              </p>
            </div>

            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Extended Hours</h3>
              <p className="text-white/80">
                Open until 3 AM on weekends, we're here for Portland's night owls who want 
                authentic Mexican food and craft cocktails until the early hours.
              </p>
            </div>

            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Live Entertainment Hub</h3>
              <p className="text-white/80">
                Our booking network brings major touring artists and 
                resident DJs to create unforgettable live music experiences.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-lg text-white/80 mb-6">
              Same legendary birria, same Wolf Pack energy, now in two locations
            </p>
          </div>
        </div>
      </section>



      {/* Find Us Section */}
      <section className="py-20 px-4 bg-black">
        <div className="container mx-auto">
          <h2 className="text-4xl font-serif text-center mb-12">Find Us</h2>
          <div className="max-w-5xl mx-auto rounded-lg overflow-hidden">
            <DynamicGoogleMaps 
              className="w-full" 
              height="500px" 
              showLocationSwitcher={true}
            />
          </div>
        </div>
      </section>

      {/* Instagram Section */}
      <section className="py-20 px-4 bg-zinc-900">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-serif text-center mb-12">Follow @sidehustle_bar</h2>
          <div className="bg-black p-8 rounded-lg">
            <InstagramEmbed className="w-full" />
          </div>
        </div>
      </section>

      {/* Footer - Only on main page */}
      <Footer />

    </div>
  );
}