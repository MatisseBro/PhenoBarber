'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/notre-histoire', label: 'Notre histoire' },
  { href: '/#services', label: 'Prestations' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/#galerie', label: 'Réalisations' },
  { href: '/location', label: 'Location' },
  { href: '/#contact', label: 'Contact' },
]

export default function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const shellRef = useRef<HTMLElement>(null)

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: MouseEvent) => {
      if (!shellRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      document.removeEventListener('keydown', closeEscape)
    }
  }, [open])

  if (pathname.startsWith('/admin')) return null

  return (
    <header className="site-nav-shell" ref={shellRef}>
      <nav className="site-nav" aria-label="Navigation principale">
        <div className="site-nav-start">
          <button
            type="button"
            className={`site-nav-toggle${open ? ' is-open' : ''}`}
            onClick={() => setOpen(value => !value)}
            aria-expanded={open}
            aria-controls="site-nav-mobile"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            <span /><span /><span />
          </button>
          <Link href="/" className="site-nav-brand" aria-label="PHENO&CO - Accueil">
            PHENO<span>&amp;</span>CO
          </Link>
        </div>

        <div className="site-nav-links">
          {links.map(link => {
            const active = link.href.startsWith('/#')
              ? false
              : pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link key={link.href} href={link.href} className={`site-nav-link${active ? ' is-active' : ''}`}>
                {link.label}
              </Link>
            )
          })}
        </div>

        <div className="site-nav-actions">
          <a href="tel:0769432605" className="site-nav-phone" aria-label="Appeler le 07 69 43 26 05">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 12 19.79 19.79 0 0 1 1.06 3.4 2 2 0 0 1 3.04 1.4h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91A16 16 0 0 0 13 15.83l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>07 69 43 26 05</span>
          </a>
          <Link href="/rdv" className="site-nav-cta">Réserver</Link>
        </div>
      </nav>

      <div id="site-nav-mobile" className={`site-nav-mobile${open ? ' is-open' : ''}`} aria-hidden={!open}>
        {links.map(link => (
          <Link key={link.href} href={link.href} className="site-nav-mobile-link" onClick={() => setOpen(false)}>
            {link.label}<span aria-hidden="true">↗</span>
          </Link>
        ))}
        <a href="https://wa.me/33769432605" target="_blank" rel="noopener noreferrer" className="site-nav-mobile-link site-nav-mobile-wa">
          WhatsApp<span aria-hidden="true">↗</span>
        </a>
      </div>
    </header>
  )
}
