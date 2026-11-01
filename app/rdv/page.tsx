import type { Metadata } from 'next'
import RdvMultiForm from '@/components/RdvMultiForm'
import './rdv.css'

export const metadata: Metadata = {
  title: 'Prendre un rendez-vous - PHENO&CO Barbershop Montpellier',
  description: 'Réservez votre coupe, dégradé ou soin chez PHENO&CO Barbershop. Système de réservation en ligne - 18 rue d\'Alger, Saint-Roch, Montpellier.',
  alternates: { canonical: '/rdv' },
}

export default function RdvPage() {
  return <RdvMultiForm />
}
