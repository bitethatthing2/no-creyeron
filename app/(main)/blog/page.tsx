'use client';

import { Suspense } from 'react';
import { Calendar, Music, Users, MapPin, Clock, Star, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-red-900/20 via-red-600/10 to-orange-600/20 border-b border-red-600/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/10 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center text-gray-300 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
            <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Music className="h-8 w-8 text-red-500 mr-3" />
              <h1 className="text-4xl md:text-6xl font-bold text-white">
                Side Hustle Blog
              </h1>
            </div>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Salem's Premier Entertainment Destination - Artist Spotlights, Event Coverage & Music Scene Updates
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="bg-red-600/20 text-red-300 border-red-600/30">
                <Users className="h-4 w-4 mr-2" />
                101K+ Followers
              </Badge>
              <Badge variant="secondary" className="bg-red-600/20 text-red-300 border-red-600/30">
                <Star className="h-4 w-4 mr-2" />
                750+ Five-Star Reviews
              </Badge>
              <Badge variant="secondary" className="bg-red-600/20 text-red-300 border-red-600/30">
                <MapPin className="h-4 w-4 mr-2" />
                Salem & Portland
              </Badge>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Featured Article */}
          <Card className="mb-12 bg-zinc-900/50 border-red-600/20 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <Badge className="bg-red-600 hover:bg-red-700">Featured Article</Badge>
                <div className="flex items-center text-gray-400 text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Updated {new Date().toLocaleDateString()}
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-4">
                Complete Artist Roster at Side Hustle Bar
              </CardTitle>
              <p className="text-gray-300 text-lg leading-relaxed">
                Side Hustle Bar has established itself as Salem's premier hip-hop and R&B venue since opening in late 2023, 
                bringing major touring artists and local talent to Oregon's capital city.
              </p>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              
              {/* Major Hip-Hop Headliners Section */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-red-400 mb-6 flex items-center">
                  <Music className="h-6 w-6 mr-3" />
                  Major Hip-Hop and R&B Headliners
                </h2>
                <div className="bg-zinc-800/50 rounded-lg p-6 border border-red-600/20">
                  <p className="text-gray-300 leading-relaxed mb-6">
                    The venue has successfully booked several nationally recognized artists, marking Salem as a legitimate stop on hip-hop touring circuits.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="border-l-4 border-red-500 pl-4">
                        <h4 className="font-bold text-white">MARIO</h4>
                        <p className="text-gray-400 text-sm">R&B Icon • Major Show</p>
                        <p className="text-gray-300 text-sm">The R&B legend himself</p>
                      </div>
                      
                      <div className="border-l-4 border-red-500 pl-4">
                        <h4 className="font-bold text-white">KIRKO BANGZ</h4>
                        <p className="text-gray-400 text-sm">June 22, 2024 + Major Return</p>
                        <p className="text-gray-300 text-sm">Bringing the vibes back to Salem</p>
                      </div>
                      
                      <div className="border-l-4 border-red-500 pl-4">
                        <h4 className="font-bold text-white">JOHN HART</h4>
                        <p className="text-gray-400 text-sm">R&B Artist • Mood Setter</p>
                        <p className="text-gray-300 text-sm">Setting the perfect vibe</p>
                      </div>
                      
                      <div className="border-l-4 border-red-500 pl-4">
                        <h4 className="font-bold text-white">LUNIZ</h4>
                        <p className="text-gray-400 text-sm">December 6, 2024 • 9 PM - 2 AM</p>
                        <p className="text-gray-300 text-sm">Ugly Christmas Sweater Party • "I Got 5 on It"</p>
                      </div>
                      
                      <div className="border-l-4 border-red-500 pl-4">
                        <h4 className="font-bold text-white">ATM Danny</h4>
                        <p className="text-gray-400 text-sm">April 26 • Side Hustle Portland</p>
                        <p className="text-gray-300 text-sm">7 PM doors • 18+ event</p>
                      </div>
                      
                      <div className="border-l-4 border-red-500 pl-4">
                        <h4 className="font-bold text-white">ILOVEMAKONNEN</h4>
                        <p className="text-gray-400 text-sm">April 27, 2024 • $15-19 tickets</p>
                        <p className="text-gray-300 text-sm">First-ever Salem appearance</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="border-l-4 border-red-500 pl-4">
                        <h4 className="font-bold text-white">J Balvin After Party</h4>
                        <p className="text-gray-400 text-sm">May 17 • Side Hustle Portland</p>
                        <p className="text-gray-300 text-sm">Official USA Tour after party • Last tour stop</p>
                      </div>
                      
                      <div className="border-l-4 border-red-500 pl-4">
                        <h4 className="font-bold text-white">Shawty Bae Day Fade</h4>
                        <p className="text-gray-400 text-sm">May 25 • 1 PM - 5 PM</p>
                        <p className="text-gray-300 text-sm">Salem location • 21+ daytime event</p>
                      </div>
                      
                      <div className="border-l-4 border-red-500 pl-4">
                        <h4 className="font-bold text-white">Trinidad James</h4>
                        <p className="text-gray-400 text-sm">October 4, 2024</p>
                        <p className="text-gray-300 text-sm">High-energy signature performance</p>
                      </div>
                      
                      <div className="border-l-4 border-red-500 pl-4">
                        <h4 className="font-bold text-white">Casey Veggies</h4>
                        <p className="text-gray-400 text-sm">August 16, 2024</p>
                        <p className="text-gray-300 text-sm">Two-city Oregon tour</p>
                      </div>
                      
                      <div className="border-l-4 border-red-500 pl-4">
                        <h4 className="font-bold text-white">Adrian Marcel</h4>
                        <p className="text-gray-400 text-sm">R&B Artist</p>
                        <p className="text-gray-300 text-sm">Live music events</p>
                      </div>
                      
                      <div className="border-l-4 border-red-500 pl-4">
                        <h4 className="font-bold text-white">CNG</h4>
                        <p className="text-gray-400 text-sm">May 18, 2024 • $20 tickets</p>
                        <p className="text-gray-300 text-sm">Summer Nights series</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-red-600/10 rounded-lg border border-red-600/20">
                    <p className="text-gray-300 text-sm">
                      <strong className="text-red-400">Additional touring artists include:</strong> Cuuhraig from Los Angeles (July 19, 2024), 
                      DoKnowsWorld (Latin and hip-hop fusion), Shawtybae (@shawtybaeofficial_), and many more through our live music events.
                    </p>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-600/10 rounded-lg border border-blue-600/20">
                    <h4 className="font-semibold text-blue-400 mb-2">J Balvin After Party Sponsors</h4>
                    <p className="text-gray-300 text-sm">
                      The official J Balvin USA Tour after party was proudly sponsored by: 
                      <strong className="text-white">Xicha Brewing (@xichabrewing)</strong>, 
                      <strong className="text-white">IX Construction (@ixconstruction_)</strong>, 
                      <strong className="text-white">MC Spectrum LLC (@m_c_spectrumllc)</strong>, and 
                      <strong className="text-white">Nebula9 Vodka (@nebula9vodka)</strong>. 
                      Hosted by DJ Denver PDX (@djdenverpdx) with "Back to the Rayo" theming.
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-8 bg-red-600/20" />

              {/* DJ Lineup Section */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-red-400 mb-6 flex items-center">
                  <Users className="h-6 w-6 mr-3" />
                  DJ Lineup and Regular Performers
                </h2>
                <div className="bg-zinc-800/50 rounded-lg p-6 border border-red-600/20">
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Resident & Featured DJs</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-zinc-700/50 rounded-lg p-4">
                        <h4 className="font-bold text-red-400">DJ Inferno</h4>
                        <p className="text-gray-300 text-sm">(Albert Ramon Jr)</p>
                        <p className="text-gray-400 text-xs mt-2">Live Music Coordinator • West Coast Hip-Hop</p>
                      </div>
                      
                      <div className="bg-zinc-700/50 rounded-lg p-4">
                        <h4 className="font-bold text-red-400">Kaniel The One & Finxx Live</h4>
                        <p className="text-gray-300 text-sm">Portland's HOTTEST DJs</p>
                        <p className="text-gray-400 text-xs mt-2">RnB, Love series • 90s/2000s nostalgia</p>
                      </div>
                      
                      <div className="bg-zinc-700/50 rounded-lg p-4">
                        <h4 className="font-bold text-red-400">DJ Denver PDX</h4>
                        <p className="text-gray-300 text-sm">@djdenverpdx • Denver Orozco</p>
                        <p className="text-gray-400 text-xs mt-2">Radio & Traveling DJ • 11.2K followers</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Special Guest DJs</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded bg-zinc-700/30">
                        <div>
                          <span className="font-semibold text-white">DJ Infamous</span>
                          <span className="text-gray-400 text-sm ml-2">(Ludacris's tour DJ)</span>
                        </div>
                        <span className="text-red-400 text-sm">Aug 29, 2024 • Oregon State Fair afterparty</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded bg-zinc-700/30">
                        <div>
                          <span className="font-semibold text-white">DJ New Era</span>
                          <span className="text-gray-400 text-sm ml-2">(Alabama Crimson Tide official DJ)</span>
                        </div>
                        <span className="text-red-400 text-sm">NYE 2025 countdown</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-600/10 rounded-lg border border-blue-600/20">
                    <h4 className="font-semibold text-blue-400 mb-2">Featured DJs</h4>
                    <p className="text-gray-300 text-sm">
                      <strong className="text-white">DJ Denver PDX</strong> (@djdenverpdx - Denver Orozco) has opened for major acts including J Balvin, Maluma, Pitbull, Daddy Yankee, Don Omar, Ozuna, Grupo Firme, and Farruko. 
                      <strong className="text-white">DJ Carlos</strong> (@djcarlosofficial_ - Carlos Rodriguez) also performs at Side Hustle events.
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-8 bg-red-600/20" />

              {/* Event Series Section */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-red-400 mb-6 flex items-center">
                  <Calendar className="h-6 w-6 mr-3" />
                  Event Series and Special Programming
                </h2>
                <div className="bg-zinc-800/50 rounded-lg p-6 border border-red-600/20">
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4">Signature Series</h3>
                      
                      <div className="space-y-4">
                        <div className="border border-red-600/30 rounded-lg p-4 bg-red-600/5">
                          <h4 className="font-bold text-red-400">Live Music Events</h4>
                          <p className="text-gray-300 text-sm mt-2">
                            Founded March 2023 by DJ Inferno and Miguel Canchola. Mission: "infuse the Pacific Northwest with West Coast hip-hop vibes" 
                            while emphasizing minority community empowerment.
                          </p>
                        </div>
                        
                        <div className="border border-red-600/30 rounded-lg p-4 bg-red-600/5">
                          <h4 className="font-bold text-red-400">"RnB, Love" Series</h4>
                          <p className="text-gray-300 text-sm mt-2">
                            "Salem's Biggest RnB & Hip-Hop Party" • Regular events 10 PM - 2 AM
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4">Weekly Programming</h3>
                      
                      <div className="space-y-4">
                        <div className="border border-blue-600/30 rounded-lg p-4 bg-blue-600/5">
                          <h4 className="font-bold text-blue-400">Night Show</h4>
                          <p className="text-gray-300 text-sm mt-2">
                            Hip-hop and rap showcases • All-ages until 10PM, then 21+ afterparties
                          </p>
                        </div>
                        
                        <div className="border border-green-600/30 rounded-lg p-4 bg-green-600/5">
                          <h4 className="font-bold text-green-400">Game Night Live</h4>
                          <p className="text-gray-300 text-sm mt-2">
                            Weekly trivia and R0CK'N Bingo • Music spanning hip-hop, country, and rock
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-yellow-600/10 rounded-lg border border-yellow-600/20">
                    <h4 className="font-semibold text-yellow-400 mb-2">Special Events</h4>
                    <p className="text-gray-300 text-sm">
                      NYE 2024 Countdown with $2,024 cash giveaway, Christmas-themed trivia nights, UFC fight night programming, 
                      and seasonal celebration events throughout the year.
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-8 bg-red-600/20" />

              {/* Venue Details Section */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-red-400 mb-6 flex items-center">
                  <MapPin className="h-6 w-6 mr-3" />
                  Venue Details and Expansion
                </h2>
                <div className="bg-zinc-800/50 rounded-lg p-6 border border-red-600/20">
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4">Salem Flagship Location</h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 text-red-500 mr-2 mt-1" />
                          <div>
                            <p className="text-white font-medium">145 Liberty Street NE, Suite #101</p>
                            <p className="text-gray-400 text-sm">Historic Downtown Salem</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <Clock className="h-5 w-5 text-red-500 mr-2 mt-1" />
                          <div>
                            <p className="text-white font-medium">Live Music Schedule:</p>
                            <p className="text-gray-400 text-sm">Thursday: 7 PM - 1 AM</p>
                            <p className="text-gray-400 text-sm">Friday-Saturday: 7 PM - 3 AM</p>
                            <p className="text-gray-400 text-sm">Sunday: 7 PM - 12 AM</p>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-red-600/10 rounded border border-red-600/20">
                          <p className="text-gray-300 text-sm">
                            <strong className="text-red-400">Executive Chef Rebecca Sanchez</strong> leads our culinary program at this 
                            "High Energy Sports Bar, UFC House, Lounge, Nightclub" destination.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4">Portland Expansion</h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 text-blue-500 mr-2 mt-1" />
                          <div>
                            <p className="text-white font-medium">327 SW Morrison Street</p>
                            <p className="text-gray-400 text-sm">Downtown Portland</p>
                            <Badge className="mt-1 bg-green-600 hover:bg-green-700 text-xs">Opened March 9, 2025</Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <Clock className="h-5 w-5 text-blue-500 mr-2 mt-1" />
                          <div>
                            <p className="text-white font-medium">Extended Hours:</p>
                            <p className="text-gray-400 text-sm">Sun-Wed: 10 AM - 12 AM</p>
                            <p className="text-gray-400 text-sm">Thursday: 10 AM - 1 AM</p>
                            <p className="text-gray-400 text-sm">Fri-Sat: 10 AM - 3 AM</p>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-blue-600/10 rounded border border-blue-600/20">
                          <p className="text-gray-300 text-sm">
                            This expansion positions Side Hustle Bar to tap into Portland's larger market while maintaining Salem roots.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 p-4 bg-green-600/10 rounded-lg border border-green-600/20">
                    <h4 className="font-semibold text-green-400 mb-2">Community Integration</h4>
                    <p className="text-gray-300 text-sm">
                      Ticketing through POSH platform for major concerts, Eventbrite for special events, and Fourth Wall Tickets for hip-hop showcases. 
                      <strong className="text-white"> Salem Main Street Association</strong> provides community integration and event promotion, 
                      establishing Side Hustle Bar as a legitimate cultural hub bringing major hip-hop acts to Oregon's capital region.
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Media Stats */}
              <div className="mt-8 p-6 bg-gradient-to-r from-red-600/10 to-orange-600/10 rounded-lg border border-red-600/20">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-4">Connect With Side Hustle Bar</h3>
                  <div className="flex flex-wrap justify-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">101K+</div>
                      <div className="text-gray-400 text-sm">Instagram Followers</div>
                      <div className="text-gray-500 text-xs">@sidehustle_bar</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">750+</div>
                      <div className="text-gray-400 text-sm">Five-Star Reviews</div>
                      <div className="text-gray-500 text-xs">Google & Yelp</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">2</div>
                      <div className="text-gray-400 text-sm">Locations</div>
                      <div className="text-gray-500 text-xs">Salem & Portland</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "Side Hustle Blog",
            "description": "Salem's premier hip-hop and R&B venue blog featuring artist spotlights, event coverage, and music scene updates",
            "url": "https://sidehustlelounge.com/blog",
            "publisher": {
              "@type": "Organization",
              "name": "Side Hustle Bar",
              "logo": {
                "@type": "ImageObject",
                "url": "https://sidehustlelounge.com/icons/wolf-and-title.png"
              },
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "145 Liberty Street NE Suite #101",
                "addressLocality": "Salem",
                "addressRegion": "OR",
                "postalCode": "97301",
                "addressCountry": "US"
              }
            },
            "mainEntity": {
              "@type": "Article",
              "headline": "Complete Artist Roster at Side Hustle Bar",
              "description": "Comprehensive guide to Side Hustle Bar's major hip-hop headliners, resident DJs, event programming, and venue expansion from Salem to Portland",
              "datePublished": new Date().toISOString(),
              "dateModified": new Date().toISOString(),
              "author": {
                "@type": "Organization",
                "name": "Side Hustle Bar"
              },
              "keywords": [
                "MARIO", "KIRKO BANGZ", "JOHN HART", "LUNIZ", "ATM Danny", "J Balvin", 
                "Shawty Bae", "ILOVEMAKONNEN", "Trinidad James", "Casey Veggies", 
                "DJ Inferno", "Live Music", "Salem hip-hop", "Portland hip-hop",
                "Oregon music venue", "Pacific Northwest hip-hop", "I Got 5 on It",
                "R&B venue Salem", "hip-hop nightclub Portland"
              ],
              "about": [
                {
                  "@type": "MusicEvent",
                  "name": "Hip-Hop & R&B Shows",
                  "location": {
                    "@type": "Place",
                    "name": "Side Hustle Bar Salem",
                    "address": {
                      "@type": "PostalAddress",
                      "addressLocality": "Salem",
                      "addressRegion": "OR"
                    }
                  }
                }
              ]
            },
            "potentialAction": {
              "@type": "ReadAction",
              "target": "https://sidehustlelounge.com/blog"
            }
          })
        }}
      />
    </div>
  );
}