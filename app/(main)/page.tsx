"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Utensils, Star, Users, MapPin, Clock, RefreshCw } from "lucide-react";
import { VideoBackground } from '@/components/shared/VideoBackground';
import SliderMenu from '@/components/menu/SliderMenu';
import { Footer } from '@/components/shared/Footer';
import { TopNav } from '@/components/shared/TopNav';
import { getSmartCacheBustedUrl, clearBrowserImageCache } from '@/lib/utils/image-cache';
import { DynamicGoogleMaps } from '@/components/shared/DynamicGoogleMaps';
import { InstagramEmbed } from '@/components/shared/InstagramEmbed';

// Type for video props
interface VideoProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
}

// Video component with proper attributes
const VideoPlayer: React.FC<VideoProps> = ({ 
  src, 
  className = '', 
  autoPlay = true, 
  muted = true, 
  loop = true, 
  playsInline = true,
  preload = 'metadata'
}) => {
  return (
    <video
      className={className}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      preload={preload}
      {...{
        'webkit-playsinline': 'true',
        'x5-playsinline': 'true'
      } as React.VideoHTMLAttributes<HTMLVideoElement>}
    >
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

export default function Page() {
  // Removed unused variables - mounted and location were not being used

  return (
    <div className="main-content bg-black text-white min-h-screen">
      <TopNav />
      
      {/* Hero Section with Video Background - Responsive Height */}
      <div className="relative h-screen w-full overflow-hidden mb-8 sm:mb-16">
        <div className="absolute inset-0 -top-14">
          <VideoBackground 
            content_postsrc="https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/front-end-videos/hero-video.mp4"
            overlayOpacity={0.4}
          />
        </div>
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col z-10 px-2 sm:px-4 text-center pt-8 sm:pt-12 md:pt-16 pb-8 sm:pb-12 md:pb-16 min-h-screen">
          {/* Logo - Even Lower */}
          <div className="mb-2 sm:mb-3 md:mb-4 mt-28 sm:mt-36 md:mt-44 animate-fade-in">
            <Image 
              src="https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/front-end-images/wolf-and-title.png?v=20250825"
              alt="Side Hustle Bar"
              width={400}
              height={200}
              className="mx-auto w-full max-w-[280px] xs:max-w-[320px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] xl:max-w-[700px] h-auto"
              priority
              unoptimized
            />
          </div>
          
          {/* Main Content Area - Centered */}
          <div className="flex-1 flex flex-col justify-center items-center">
            {/* Better Typography */}
            <div className="w-full text-center max-w-6xl mx-auto">
              <h1 className="font-bold text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white leading-none drop-shadow-2xl mb-6 sm:mb-8 md:mb-10 tracking-wide">
                Expect Everything.
                <br />
                <span className="text-red-500 font-medium">Experience More.</span>
              </h1>
              
              <p className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white/90 leading-relaxed drop-shadow-lg mb-8 sm:mb-10 md:mb-12">
                The place where memories are born
                <br />
                and family means everyone.
              </p>
              
              {/* Dual Location Text - Always Side by Side */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 max-w-5xl mx-auto px-2">
                {/* Salem Location */}
                <div className="text-white text-center">
                  <h3 className="text-sm sm:text-lg md:text-xl font-bold text-red-500 mb-2 sm:mb-3">Salem</h3>
                  <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm md:text-base lg:text-lg font-bold">
                    <p className="hidden sm:block">145 Liberty St NE #101</p>
                    <p className="block sm:hidden">145 Liberty St</p>
                    <p>Salem, OR 97301</p>
                    <p className="text-yellow-400 text-sm sm:text-base md:text-lg">📞 (503) 391-9977</p>
                  </div>
                  <div className="mt-2 sm:mt-3 pt-2 sm:pt-3">
                    <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm md:text-base font-bold">
                      <p><span>M-Th:</span> 10AM-12AM</p>
                      <p><span>F-Sa:</span> 10AM-2AM</p>
                      <p><span>Sun:</span> 10AM-12AM</p>
                    </div>
                  </div>
                </div>

                {/* Portland Location */}
                <div className="text-white text-center">
                  <h3 className="text-sm sm:text-lg md:text-xl font-bold text-red-500 mb-2 sm:mb-3">Portland</h3>
                  <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm md:text-base lg:text-lg font-bold">
                    <p className="hidden sm:block">327 SW Morrison St</p>
                    <p className="block sm:hidden">327 Morrison</p>
                    <p>Portland, OR 97204</p>
                    <p className="text-yellow-400 text-sm sm:text-base md:text-lg">📞 (503) 555-0123</p>
                  </div>
                  <div className="mt-2 sm:mt-3 pt-2 sm:pt-3">
                    <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm md:text-base font-bold">
                      <p><span>M-Th:</span> 11AM-1AM</p>
                      <p><span>F-Sa:</span> 11AM-3AM</p>
                      <p><span>Sun:</span> 11AM-1AM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Clear Cache Button - Temporary */}
          <div className="max-w-md mx-auto mb-4">
            {process.env.NODE_ENV === 'development' && (
              <Button 
                onClick={() => clearBrowserImageCache()}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Clear Image Cache
              </Button>
            )}
          </div>

          {/* Order Online - Inline Icons */}
          <div className="max-w-md mx-auto mb-8 sm:mb-12 md:mb-16">
            <h3 className="text-white text-lg sm:text-xl md:text-2xl font-semibold text-center mb-4 sm:mb-6">
              Order Online
            </h3>
            <div className="flex items-center justify-center space-x-4 sm:space-x-6">
              <a 
                href="https://www.doordash.com/store/side-hustle-bar-salem-25388462/27964950/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 w-12 sm:h-16 sm:w-16 bg-white rounded-xl flex items-center justify-center hover:bg-red-50 transition-all group shadow-lg hover:shadow-xl hover:scale-110"
                aria-label="Order on DoorDash"
              >
                <Image 
                  src={getSmartCacheBustedUrl('/icons/doordash_icon.png')} 
                  alt="DoorDash" 
                  width={28} 
                  height={28}
                  className="sm:w-8 sm:h-8 group-hover:scale-110 transition-transform w-auto h-auto"
                />
              </a>
              <a 
                href="https://www.ubereats.com/store/side-hustle-bar/n5ak1cjlRvuf0Hefn7Iddw"
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 w-12 sm:h-16 sm:w-16 bg-white rounded-xl flex items-center justify-center hover:bg-green-50 transition-all group shadow-lg hover:shadow-xl hover:scale-110"
                aria-label="Order on Uber Eats"
              >
                <Image 
                  src={getSmartCacheBustedUrl('/icons/uber-eats.png')} 
                  alt="Uber Eats" 
                  width={28} 
                  height={28}
                  className="sm:w-8 sm:h-8 group-hover:scale-110 transition-transform w-auto h-auto"
                />
              </a>
              <a 
                href="https://postmates.com/store/side-hustle-bar/n5ak1cjlRvuf0Hefn7Iddw"
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 w-12 sm:h-16 sm:w-16 bg-white rounded-xl flex items-center justify-center hover:bg-orange-50 transition-all group shadow-lg hover:shadow-xl hover:scale-110"
                aria-label="Order on Postmates"
              >
                <Image 
                  src={getSmartCacheBustedUrl('/icons/postmates.png')} 
                  alt="Postmates" 
                  width={28} 
                  height={28}
                  className="sm:w-8 sm:h-8 group-hover:scale-110 transition-transform w-auto h-auto"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <section className="pt-16 pb-16 px-4 bg-zinc-900">
        <div className="container mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-center mb-4 text-white leading-tight">
            Executive Chef Rebecca Sanchez&apos;s <span className="text-red-400">Culinary Vision</span>
          </h2>
          <p className="text-base sm:text-lg text-white/90 mb-8 leading-relaxed max-w-3xl mx-auto text-center">
            Under Chef Rebecca&apos;s leadership, our kitchen has become the talk of Salem. Every dish is crafted with passion, 
            from our signature birria that melts in your mouth to our innovative fusion creations that push boundaries. 
            With house-made salsas prepared fresh daily and locally-sourced ingredients whenever possible, 
            we&apos;re not just serving food – we&apos;re creating experiences.
          </p>
          
          {/* Variety Image Section with Overlay */}
          <div className="mb-12">
            <div className="max-w-4xl mx-auto">
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <Image 
                  src="https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/front-end-images/variety.png"
                  alt="Our Diverse Menu Selection"
                  width={1200}
                  height={600}
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-black/50"></div>
                
                {/* Overlay Content */}
                <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
                  <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-6 leading-tight">
                    Experience Our Kitchen&apos;s
                    <br />
                    <span className="text-red-400">Signature Creations</span>
                  </h3>
                  <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 max-w-2xl leading-relaxed">
                    From legendary birria to innovative fusion dishes,
                    <br className="hidden sm:block" />
                    every plate tells a story of passion and authenticity
                  </p>
                </div>
              </div>
            </div>
          </div>
          
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
                From our &quot;bomb&quot; salsas to fresh guacamole and hand-pressed tortillas, 
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
                doesn&apos;t have to break the bank.
              </p>
            </div>
          </div>
          
          {/* Featured Menu Items - New Slider */}
          <div className="mb-16">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-serif text-center mb-8 text-white">
              Browse Our <span className="text-red-400">Featured Menu</span>
            </h3>
            <SliderMenu 
              className="max-w-6xl mx-auto"
              initialType="all"
              showSearch={false}
              autoPlay={false}
            />
          </div>

          {/* Text Content - Salem Flagship */}
          <div className="max-w-6xl mx-auto mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
              <div className="lg:col-span-2 text-center lg:text-left">
                <h3 className="text-3xl font-serif text-red-400 mb-6">Salem&apos;s Premier Entertainment Destination</h3>
                <p className="text-lg text-white/90 leading-relaxed mb-6">
                  Since opening in late 2023, our flagship Salem location at 145 Liberty St NE has redefined Oregon&apos;s bar scene. 
                  Executive Chef Rebecca Sanchez leads our kitchen with an innovative Mexican menu that goes far beyond typical bar food. 
                  From our legendary birria tacos that locals can&apos;t stop raving about to our house-made salsas crafted fresh daily, 
                  every dish reflects our commitment to authentic flavors and quality ingredients.
                </p>
                <p className="text-lg text-white/80 leading-relaxed">
                  With over <span className="text-red-400 font-semibold">750+ five-star reviews</span> and a growing community of 
                  <span className="text-red-400 font-semibold"> 101,000+ Instagram followers</span>, we&apos;ve proven that Salem was ready 
                  for something different - a place where exceptional food meets high-energy entertainment.
                </p>
              </div>
              <div className="lg:col-span-3 relative">
                <div className="aspect-[4/3] lg:aspect-video rounded-xl overflow-hidden shadow-2xl bg-black">
                  <VideoPlayer
                    src="https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/front-end-videos/2nd-video.mp4"
                    className="absolute inset-0 w-full h-full object-cover transform-gpu"
                  />
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
                  Oregon&apos;s Premier <span className="text-red-400">UFC House</span>
                </h2>
                <p className="text-base text-white/90 mb-4 leading-relaxed">
                  We&apos;ve earned our reputation as the ultimate fight destination with multiple large screens, 
                  no cover charges, and an electric atmosphere that draws capacity crowds for every major event. 
                  Whether it&apos;s UFC, boxing, or your favorite team&apos;s big game, our state-of-the-art viewing setup 
                  ensures you won&apos;t miss a second of the action.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-white/90 text-sm">Multiple 75&quot; screens throughout the venue</span>
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
                <Link href="/social/feed">
                  <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 text-base font-semibold rounded-full">
                    Connect & Share
                  </Button>
                </Link>
              </div>
              <div className="relative h-[350px] rounded-xl overflow-hidden shadow-2xl">
                <Image 
                  src="https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/front-end-images/ufc-section.jpeg"
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
            <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] rounded-xl overflow-hidden shadow-2xl bg-black">
              <VideoPlayer
                src="https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/front-end-videos/3rd-video.mp4"
                className="absolute inset-0 w-full h-full object-cover transform-gpu"
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
                With gaming areas, outdoor parklet seating, and intimate lounges, there&apos;s a perfect spot for every occasion and every member of the pack.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                  <span className="text-white/90 text-lg">Game Night Live with trivia and R0CK&apos;N Bingo</span>
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
              electric atmosphere, and community spirit to Oregon&apos;s biggest city. With extended late-night hours and 
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
                <p className="text-white/90 text-lg">Downtown Portland&apos;s newest entertainment destination</p>
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
                327 SW Morrison Street puts us in the heart of Portland&apos;s entertainment district, 
                perfect for pre-game drinks or post-work celebrations.
              </p>
            </div>

            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Extended Hours</h3>
              <p className="text-white/80">
                Open until 3 AM on weekends, we&apos;re here for Portland&apos;s night owls who want 
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