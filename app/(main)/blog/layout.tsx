import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Side Hustle Blog - Salem\'s Premier Entertainment Venue | Artist Roster & Event Coverage',
  description: 'Complete guide to Side Hustle Bar\'s artist lineup, DJ roster, and event programming. Featuring major entertainment acts like ILOVEMAKONNEN, Trinidad James, Kirko Bangz, and Casey Veggies in Salem and Portland, Oregon.',
  keywords: [
    'Side Hustle Bar',
    'Salem entertainment venue',
    'Portland entertainment',
    'ILOVEMAKONNEN Salem', 
    'Trinidad James Oregon',
    'Kirko Bangz',
    'Casey Veggies tour',
    'DJ Inferno',
    'Live music events',
    'Oregon live music shows',
    'Salem nightlife',
    'Pacific Northwest entertainment',
    'R&B events Oregon',
    'entertainment blog Salem'
  ].join(', '),
  openGraph: {
    title: 'Side Hustle Blog - Complete Artist Roster & Event Coverage',
    description: 'Salem\'s premier entertainment destination featuring major touring artists, resident DJs, and weekly event programming. 101K+ Instagram followers, 750+ five-star reviews.',
    url: 'https://sidehustlelounge.com/blog',
    siteName: 'Side Hustle Bar',
    images: [
      {
        url: '/icons/wolf-and-title.png',
        width: 1200,
        height: 630,
        alt: 'Side Hustle Bar - Salem & Portland Entertainment Venue',
      },
    ],
    locale: 'en_US',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Side Hustle Blog - Live Music Artist Roster & Event Coverage',
    description: 'Complete guide to Salem\'s premier entertainment venue featuring major artists, DJs, and event programming.',
    images: ['/icons/wolf-and-title.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://sidehustlelounge.com/blog',
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {children}
    </div>
  )
}