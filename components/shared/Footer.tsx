'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Clock, Instagram, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-zinc-950 text-white border-t border-orange-600/20 mt-0 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black opacity-60"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-600/5 via-transparent to-transparent"></div>
      
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Section */}
          <div className="space-y-6 lg:col-span-1">
            <div className="flex items-center justify-center lg:justify-start space-x-3">
              <Image 
                src="/icons/wolf-and-title.png"
                alt="Side Hustle Bar"
                width={200}
                height={80}
                className="h-16 w-auto brightness-110"
              />
            </div>
            <p className="text-lg text-gray-300 leading-relaxed text-center lg:text-left">
              Oregon's premier <span className="text-orange-400 font-semibold">UFC House</span> • 
              Legendary <span className="text-orange-400 font-semibold">Birria</span> • 
              <span className="text-orange-400 font-semibold">Live Music</span>
            </p>
            <div className="flex justify-center lg:justify-start space-x-4">
              <a 
                href="https://instagram.com/sidehustle_bar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-400 transition-colors p-2 hover:bg-orange-400/10 rounded-lg"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a 
                href="mailto:info@sidehustlelounge.com" 
                aria-label="Email us"
                className="text-gray-400 hover:text-orange-400 transition-colors p-2 hover:bg-orange-400/10 rounded-lg"
              >
                <Mail className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Salem Location */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold text-white mb-3">Salem Location</h3>
              <div className="h-1 w-16 bg-gradient-to-r from-orange-600 to-orange-400 rounded-full mx-auto lg:mx-0"></div>
            </div>
            
            {/* Salem Location Image */}
            <div className="relative h-48 rounded-xl overflow-hidden">
              <Image
                src="/icons/salem-location.jpg"
                alt="Side Hustle Bar Salem Location"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-2 left-3">
                <p className="text-white font-semibold text-sm">Historic Downtown Salem</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-orange-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-orange-500" />
                </div>
                <address className="not-italic text-gray-300 text-base">
                  <div className="font-semibold text-white">Historic Downtown</div>
                  <div>145 Liberty St NE #101, Salem</div>
                </address>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-orange-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-orange-500" />
                </div>
                <a href="tel:+15033919977" className="text-gray-300 hover:text-orange-400 text-lg font-semibold">
                  (503) 391-9977
                </a>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-orange-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-orange-500" />
                  </div>
                  <span className="font-semibold text-white text-base">Hours</span>
                </div>
                <div className="pl-14 space-y-1 text-base text-gray-300">
                  <div>Mon-Wed: <span className="text-white">10AM-11PM</span></div>
                  <div>Thursday: <span className="text-white">10AM-12AM</span></div>
                  <div>Fri-Sat: <span className="text-orange-400 font-semibold">10AM-2AM</span></div>
                  <div>Sunday: <span className="text-white">10AM-11PM</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Portland Location */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold text-white mb-3">Portland Location</h3>
              <div className="h-1 w-16 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full mx-auto lg:mx-0"></div>
            </div>
            
            {/* Portland Location Image */}
            <div className="relative h-64 rounded-xl overflow-hidden">
              <Image
                src="/icons/portland-side-hustle.jpg"
                alt="Side Hustle Bar Portland Location"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-2 left-3">
                <p className="text-white font-semibold text-sm">Downtown Portland</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-blue-500" />
                </div>
                <address className="not-italic text-gray-300 text-base">
                  <div className="font-semibold text-white">Downtown Portland</div>
                  <div>327 SW Morrison St, Portland</div>
                </address>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-blue-500" />
                </div>
                <span className="text-gray-300 text-lg font-semibold">Coming Soon</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="font-semibold text-white text-base">Hours</span>
                </div>
                <div className="pl-14 space-y-1 text-base text-gray-300">
                  <div>Mon-Wed & Sun: <span className="text-white">10AM-1AM</span></div>
                  <div>Thursday: <span className="text-white">10AM-1AM</span></div>
                  <div>Fri-Sat: <span className="text-blue-400 font-semibold">10AM-3AM</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Experience & Links */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold text-white mb-3">Order Online</h3>
              <div className="h-1 w-16 bg-gradient-to-r from-green-600 to-green-400 rounded-full mx-auto lg:mx-0"></div>
            </div>
            
            {/* Quick Order Online */}
            <div className="space-y-4">
              <p className="text-base text-gray-300 text-center lg:text-left">Get your favorite dishes delivered</p>
              <div className="flex items-center justify-center lg:justify-start space-x-3">
                <a 
                  href="https://www.doordash.com/store/side-hustle-bar-salem-25388462/27964950/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-14 w-14 bg-white rounded-xl flex items-center justify-center hover:bg-red-50 transition-all group border border-zinc-600 shadow-lg hover:shadow-xl"
                  aria-label="Order on DoorDash"
                >
                  <Image 
                    src="/icons/doordash_icon.png" 
                    alt="DoorDash" 
                    width={36} 
                    height={36}
                    className="group-hover:scale-110 transition-transform"
                    style={{width: 'auto', height: 'auto'}}
                  />
                </a>
                <a 
                  href="https://www.ubereats.com/store/side-hustle-bar/n5ak1cjlRvuf0Hefn7Iddw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-14 w-14 bg-white rounded-xl flex items-center justify-center hover:bg-green-50 transition-all group border border-zinc-600 shadow-lg hover:shadow-xl"
                  aria-label="Order on Uber Eats"
                >
                  <Image 
                    src="/icons/uber-eats.png" 
                    alt="Uber Eats" 
                    width={36} 
                    height={36}
                    className="group-hover:scale-110 transition-transform"
                    style={{width: 'auto', height: 'auto'}}
                  />
                </a>
                <a 
                  href="https://postmates.com/store/side-hustle-bar/n5ak1cjlRvuf0Hefn7Iddw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-14 w-14 bg-white rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all group border border-zinc-600 shadow-lg hover:shadow-xl"
                  aria-label="Order on Postmates"
                >
                  <Image 
                    src="/icons/postmates.png" 
                    alt="Postmates" 
                    width={36} 
                    height={36}
                    className="group-hover:scale-110 transition-transform"
                    style={{width: 'auto', height: 'auto'}}
                  />
                </a>
              </div>
            </div>

            {/* Key Features */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-base text-gray-300">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-500 text-xl">★</span>
                  <span className="font-semibold">4.7 Rating</span>
                </div>
                <div className="text-orange-400 font-semibold">UFC House</div>
                <div className="text-orange-400 font-semibold">Live Music</div>
              </div>
              <div className="text-base text-gray-300 text-center lg:text-left">
                Executive Chef <span className="text-orange-400 font-semibold">Rebecca Sanchez</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-gradient-to-r from-transparent via-zinc-600 to-transparent" />

      {/* Bottom Footer */}
      <div className="container mx-auto px-4 py-10 relative z-10">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="h-3 w-3 bg-orange-500 rounded-full animate-pulse"></div>
            <p className="text-base text-gray-300">© {currentYear} Side Hustle Bar. All rights reserved.</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-base">
            <Link href="/privacy" className="text-gray-400 hover:text-orange-400 transition-colors font-medium">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-orange-400 transition-colors font-medium">
              Terms of Service
            </Link>
            <Link href="/accessibility" className="text-gray-400 hover:text-orange-400 transition-colors font-medium">
              Accessibility
            </Link>
          </div>
          
          <div className="text-base text-gray-500">
            Founded by <span className="text-white font-semibold">James Mullins</span> & <span className="text-white font-semibold">Becky Sanchez Mullins</span> • 
            Crafted with <span className="text-orange-500">❤️</span> for the Wolf Pack
          </div>
        </div>

        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Restaurant",
              "name": "Side Hustle Bar",
              "description": "High-energy sports bar and entertainment venue specializing in Mexican cuisine in Salem and Portland, Oregon.",
              "url": "https://sidehustlelounge.com",
              "telephone": "+15033919977",
              "priceRange": "$$",
              "servesCuisine": "Mexican",
              "image": "/icons/side-hustle-exterior.jpg",
              "logo": "/icons/wolf-and-title.png",
              "sameAs": [
                "https://instagram.com/sidehustle_bar",
                "https://www.doordash.com/store/side-hustle-bar-salem-25388462/27964950/",
                "https://www.ubereats.com/store/side-hustle-bar/n5ak1cjlRvuf0Hefn7Iddw"
              ],
              "location": [
                {
                  "@type": "Place",
                  "name": "Side Hustle Salem",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "145 Liberty St NE Suite #101",
                    "addressLocality": "Salem",
                    "addressRegion": "OR",
                    "postalCode": "97301",
                    "addressCountry": "US"
                  },
                  "telephone": "+15033919977",
                  "openingHoursSpecification": [
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": ["Monday", "Tuesday", "Wednesday"],
                      "opens": "10:00",
                      "closes": "23:00"
                    },
                    {
                      "@type": "OpeningHoursSpecification", 
                      "dayOfWeek": "Thursday",
                      "opens": "10:00",
                      "closes": "00:00"
                    },
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": ["Friday", "Saturday"], 
                      "opens": "10:00",
                      "closes": "02:00"
                    },
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": "Sunday",
                      "opens": "10:00", 
                      "closes": "23:00"
                    }
                  ]
                },
                {
                  "@type": "Place",
                  "name": "Side Hustle Portland",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "327 SW Morrison Street",
                    "addressLocality": "Portland", 
                    "addressRegion": "OR",
                    "postalCode": "97204",
                    "addressCountry": "US"
                  },
                  "openingHoursSpecification": [
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Sunday"],
                      "opens": "10:00",
                      "closes": "01:00"
                    },
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": "Thursday", 
                      "opens": "10:00",
                      "closes": "01:00"
                    },
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": ["Friday", "Saturday"],
                      "opens": "10:00",
                      "closes": "03:00"
                    }
                  ]
                }
              ],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.7",
                "reviewCount": "750"
              }
            })
          }}
        />
      </div>
    </footer>
  );
}