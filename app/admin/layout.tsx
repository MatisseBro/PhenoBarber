import type { Metadata } from 'next'
import './admin-dashboard.css'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: '.site-nav-shell{display:none!important}' }} />
      {children}
    </>
  )
}
