import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Location de fauteuil coiffure à Montpellier',
  description: 'Louez un fauteuil professionnel chez PHENO&CO à Montpellier : formules horaires, journée, semaine ou mois.',
  alternates: { canonical: '/location' },
}

export default function LocationLayout({ children }: { children: React.ReactNode }) {
  return children
}
