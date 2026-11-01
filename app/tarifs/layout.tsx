import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tarifs coiffure et barbershop à Montpellier',
  description: 'Consultez les tarifs PHENO&CO pour les coupes, dégradés, barbe et prestations afro à Montpellier.',
  alternates: { canonical: '/tarifs' },
}

export default function TarifsLayout({ children }: { children: React.ReactNode }) {
  return children
}
