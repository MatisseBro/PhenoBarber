import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B1629',
      color: '#F0EBE1',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-poppins, Poppins, sans-serif)',
      textAlign: 'center',
      padding: '2rem',
      gap: '1.5rem',
    }}>
      <p style={{ fontSize: '5rem', fontWeight: 700, color: 'rgba(201,168,76,.15)', lineHeight: 1, margin: 0 }}>404</p>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 600, margin: 0 }}>Page introuvable</h1>
      <p style={{ color: 'rgba(240,235,225,.5)', fontSize: '.9rem', margin: 0 }}>
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link href="/" style={{
        display: 'inline-block',
        padding: '.55rem 1.4rem',
        border: '1.5px solid rgba(201,168,76,.5)',
        borderRadius: '8px',
        color: '#C9A84C',
        fontWeight: 600,
        fontSize: '.9rem',
        textDecoration: 'none',
      }}>
        ← Retour à l&apos;accueil
      </Link>
    </div>
  )
}
