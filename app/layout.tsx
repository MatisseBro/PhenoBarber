import type { Metadata } from 'next'
import './globals.css'
import '../components/site-nav.css'
import '../components/site-footer.css'
import SiteNav from '../components/SiteNav'

export const metadata: Metadata = {
  metadataBase: new URL('https://phenoandco.fr'),
  title: {
    default: 'PHENO&CO - Barbershop & Coiffure Afro Montpellier',
    template: '%s | PHENO&CO Barbershop Montpellier',
  },
  description: 'Barbershop & coiffure afro à Montpellier depuis 2009. Dégradé, coupe homme, barbe - 18 rue d\'Alger, Saint-Roch. Réservation en ligne 24h/24, sans attente.',
  keywords: [
    'barbershop montpellier',
    'coiffeur afro montpellier',
    'dégradé montpellier',
    'coupe homme montpellier',
    'barbe montpellier',
    'skin fade montpellier',
    'coiffure afro montpellier',
    'barbier saint-roch montpellier',
    'pheno barber',
    'pheno and co',
  ],
  authors: [{ name: 'PHENO&CO Barbershop' }],
  creator: 'PHENO&CO',
  icons: {
    icon: [
      { url: '/favicon-pheno-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-pheno.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon-pheno-32.png',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    title: 'PHENO&CO - Barbershop & Coiffure Afro Montpellier',
    description: 'Barbershop & coiffure afro depuis 2009. Dégradé, coupe, barbe - réservez en ligne.',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://phenoandco.fr',
    siteName: 'PHENO&CO Barbershop',
    images: [{
      url: '/logo-pheno.png',
      width: 512,
      height: 512,
      alt: 'PHENO&CO Barbershop & Coiffure Afro Montpellier',
    }],
  },
  twitter: {
    card: 'summary',
    title: 'PHENO&CO - Barbershop & Coiffure Afro Montpellier',
    description: 'Barbershop & coiffure afro depuis 2009. Dégradé, coupe, barbe - réservez en ligne.',
    images: ['/logo-pheno.png'],
  },
  alternates: { canonical: 'https://phenoandco.fr' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HairSalon',
  name: 'PHENO&CO Barbershop',
  image: 'https://phenoandco.fr/logo-pheno.png',
  description: 'Barbershop & coiffure afro à Montpellier. Dégradé, coupe homme, barbe - depuis 2009.',
  '@id': 'https://phenoandco.fr',
  url: 'https://phenoandco.fr',
  telephone: '+33769432605',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '18 Rue d\'Alger',
    addressLocality: 'Montpellier',
    postalCode: '34000',
    addressCountry: 'FR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 43.6093,
    longitude: 3.8797,
  },
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '10:00',
    closes: '18:00',
  }],
  priceRange: '€€',
  sameAs: [
    'https://www.instagram.com/pheno_barber/',
    'https://www.tiktok.com/@pheno_barber',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <SiteNav />
        {children}
      </body>
    </html>
  )
}
