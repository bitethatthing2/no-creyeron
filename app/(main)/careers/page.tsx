// CareersPage.tsx
import { Metadata } from 'next';
import { CareersHero } from '@/components/careers/CareersHero';
import { WhyWorkHere } from '@/components/careers/WhyWorkHere';
import { OpenPositions } from '@/components/careers/OpenPositions';
import { ApplicationProcess } from '@/components/careers/ApplicationProcess';
import { TeamCulture } from '@/components/careers/TeamCulture';
import { BackButton } from '@/components/shared/BackButton';

export const metadata: Metadata = {
  title: 'Careers at Side Hustle | Join the Wolf Pack Team',
  description: 'Join the Side Hustle team in Salem and Portland! We\'re looking for high-energy individuals who thrive in fast-paced environments. Experience the excitement of working with the Wolf Pack.',
  keywords: 'Side Hustle careers, jobs Salem Oregon, jobs Portland Oregon, bartender jobs, server jobs, restaurant jobs, hospitality careers, Wolf Pack jobs',
  openGraph: {
    title: 'Join the Wolf Pack - Careers at Side Hustle',
    description: 'Looking for an exciting career in hospitality? Join our fast-paced team at Side Hustle sports bars in Salem and Portland.',
    type: 'website',
    url: 'https://sidehustlelounge.com/careers',
    images: [
      {
        url: '/images/careers/hero-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Careers at Side Hustle Sports Bar'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Join the Wolf Pack - Careers at Side Hustle',
    description: 'Looking for an exciting career in hospitality? Join our fast-paced team at Side Hustle sports bars.',
    images: ['/images/careers/hero-og.jpg']
  },
  alternates: {
    canonical: 'https://sidehustlelounge.com/careers'
  }
};

// Structured data for job postings
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Side Hustle",
  "description": "High-energy sports bar and entertainment venue specializing in Mexican cuisine",
  "url": "https://sidehustlelounge.com",
  "logo": "https://sidehustlelounge.com/images/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "503-585-7827",
    "contactType": "HR",
    "availableLanguage": "English"
  },
  "address": [
    {
      "@type": "PostalAddress",
      "streetAddress": "145 Liberty St NE Suite #101",
      "addressLocality": "Salem",
      "addressRegion": "OR",
      "postalCode": "97301",
      "addressCountry": "US"
    },
    {
      "@type": "PostalAddress",
      "streetAddress": "327 SW Morrison St",
      "addressLocality": "Portland",
      "addressRegion": "OR",
      "postalCode": "97204",
      "addressCountry": "US"
    }
  ]
};

export default function CareersPage() {
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
        <CareersHero />
        
        {/* Why Work Here */}
        <section className="py-16 bg-gradient-to-b from-gray-900 to-black">
          <div className="container mx-auto px-4">
            <WhyWorkHere />
          </div>
        </section>

        {/* Team Culture */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <TeamCulture />
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-16 bg-gradient-to-b from-black to-gray-900">
          <div className="container mx-auto px-4">
            <OpenPositions />
          </div>
        </section>

        {/* Application Process */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <ApplicationProcess />
          </div>
        </section>

      </main>
    </>
  );
}