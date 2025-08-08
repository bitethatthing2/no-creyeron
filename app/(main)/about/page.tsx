// AboutPage.tsx
import { Metadata } from 'next';
import { AboutHero } from '@/components/about/AboutHero';
import { ValuesHighlight } from '@/components/about/ValuesHighlight';
import { LocationsSection } from '@/components/about/LocationsSection';
import { FrequentlyAskedQuestions } from '@/components/about/FrequentlyAskedQuestions';
import { BackButton } from '@/components/shared/BackButton';

export const metadata: Metadata = {
  title: 'About Side Hustle | Salem & Portland Sports Bar',
  description: 'Learn about Side Hustle, Salem and Portland\'s premier high-energy sports bar and Mexican restaurant. Discover our values and commitment to creating an exceptional experience for the Wolf Pack community.',
  keywords: 'Side Hustle, sports bar, Salem, Portland, Oregon, Wolf Pack, community, about us, locations, Mexican food, UFC, boxing',
  openGraph: {
    title: 'About Side Hustle - Your Local Sports Bar & Community Hub',
    description: 'Discover the story behind Side Hustle, where sports, Mexican cuisine, and great times come together in Salem and Portland.',
    type: 'website',
    url: 'https://sidehustlelounge.com/about', // Assuming this is the intended URL
    images: [
      {
        url: '/images/about/hero-og.jpg', // Keep placeholder, as no specific image was found
        width: 1200,
        height: 630,
        alt: 'Side Hustle Sports Bar'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Side Hustle | Salem & Portland Sports Bar',
    description: 'Learn about Salem and Portland\'s premier high-energy sports bar and Mexican restaurant.',
    images: ['/images/about/hero-og.jpg'] // Keep placeholder
  },
  alternates: {
    canonical: 'https://sidehustlelounge.com/about' // Assuming this is the intended URL
  }
};

// Structured data for local business - UPDATED WITH FACTS
const structuredData = {
  "@context": "https://schema.org",
  "@type": "BarOrPub",
  "name": "Side Hustle",
  "description": "High-energy sports bar and entertainment venue specializing in Mexican cuisine in Salem and Portland, Oregon.",
  "url": "https://sidehustlelounge.com", // Assuming this is the intended URL
  "priceRange": "$$", // Keep as placeholder, no specific info found
  "servesCuisine": "Mexican",
  "hasMenu": "https://sidehustlelounge.com/menu", // Assuming this is the intended URL
  "telephone": "503-585-7827", // Confirmed from image
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
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 44.9429, // Keep placeholder, no new geo data found
        "longitude": -123.0351 // Keep placeholder, no new geo data found
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday"],
          "opens": "10:00",
          "closes": "23:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Friday"],
          "opens": "10:00",
          "closes": "00:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Saturday", "Sunday"],
          "opens": "10:00",
          "closes": "02:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Thursday"],
          "opens": "00:00", // Represents closed
          "closes": "00:00" // Represents closed
        }
      ]
    },
    {
      "@type": "Place",
      "name": "Side Hustle Portland",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "327 SW Morrison St",
        "addressLocality": "Portland",
        "addressRegion": "OR",
        "postalCode": "97204",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 45.5152, // Keep placeholder, no new geo data found
        "longitude": -122.6784 // Keep placeholder, no new geo data found
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday"],
          "opens": "10:00",
          "closes": "23:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Thursday"],
          "opens": "10:00",
          "closes": "01:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Friday", "Saturday"],
          "opens": "10:00",
          "closes": "02:30"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Sunday"],
          "opens": "10:00",
          "closes": "00:00"
        }
      ]
    }
  ]
};

export default function AboutPage( ) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <main className="min-h-screen bg-black text-white">
        {/* Back Button */}
        <div className="fixed top-4 left-4 z-50">
          <BackButton 
            variant="ghost" 
            className="bg-black/80 backdrop-blur-sm border border-white/20 text-white hover:bg-white/10"
            fallbackHref="/"
            showLabel={true}
            label="Back"
          />
        </div>

        {/* Hero Section */}
        <AboutHero />
        
        {/* Our Story - REMOVED as no factual story was found */}
        {/* Values */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <ValuesHighlight />
          </div>
        </section>

        {/* Locations */}
        <LocationsSection />

        {/* Community Involvement - REMOVED as no specific community involvement was found */}

        {/* FAQ */}
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-white">Frequently Asked Questions</h2>
            <p className="text-lg text-white/80 text-center mb-12 max-w-2xl mx-auto">
              Got questions? We&apos;ve got answers!
            </p>
            <FrequentlyAskedQuestions />
          </div>
        </section>

      </main>
    </>
  );
}
