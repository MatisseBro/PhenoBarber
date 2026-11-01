import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-main">
        <div className="lp-footer-brand">
          <Link href="/" className="lp-footer-brand-name" aria-label="PHENO&CO - Accueil">PHENO<span>&amp;CO</span></Link>
          <p className="lp-footer-brand-sub">Barbershop &amp; Coiffure Afro · Montpellier</p>
          <p className="lp-footer-brand-tagline">Depuis 2009, on sublime chaque profil.</p>
        </div>

        <nav className="lp-footer-nav" aria-label="Pied de page">
          <Link href="/">Accueil</Link>
          <Link href="/#services">Prestations</Link>
          <Link href="/rdv">Réservation</Link>
          <Link href="/location">Location fauteuil</Link>
          <Link href="/#contact">Contact</Link>
        </nav>

        <div className="lp-footer-right">
          <p className="lp-footer-addr">18 rue d&apos;Alger · 34000 Montpellier</p>
          <p className="lp-footer-hours">Mar – Sam · 10h–18h</p>
          <div className="lp-footer-social" aria-label="Réseaux sociaux">
            <a href="https://www.instagram.com/pheno_barber/" target="_blank" rel="noopener noreferrer" className="lp-social-icon" aria-label="Instagram">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.02 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85s.01-3.58.07-4.85c.15-3.23 1.66-4.77 4.92-4.92C8.42 2.18 8.8 2.16 12 2.16Zm0 3.68A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84Zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" /></svg>
            </a>
            <a href="https://www.tiktok.com/@pheno_barber" target="_blank" rel="noopener noreferrer" className="lp-social-icon" aria-label="TikTok">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-2.88-3.28c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 1 0 6.33 6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78c-.35 0-.68-.03-1.01-.09Z" /></svg>
            </a>
          </div>
        </div>
      </div>

      <div className="lp-footer-bar">
        <span>© 2026 PHENO&amp;CO - Montpellier</span>
        <div className="lp-footer-bar-links">
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/admin">Admin</Link>
        </div>
      </div>
    </footer>
  )
}
