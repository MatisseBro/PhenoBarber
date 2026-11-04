import type { Metadata } from 'next'
import './admin-dashboard.css'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
