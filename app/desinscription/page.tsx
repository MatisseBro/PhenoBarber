'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function DesinscriptionPage() {
  const [token, setToken] = useState('')
  const [state, setState] = useState<'ready' | 'loading' | 'done' | 'error'>('ready')

  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? ''
    setToken(value)
    window.history.replaceState(null, '', '/desinscription')
  }, [])

  async function unsubscribe() {
    setState('loading')
    try {
      const response = await fetch('/api/marketing/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      setState(response.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <main className="cgv-wrap" style={{ minHeight: '70vh', paddingTop: '8rem', textAlign: 'center' }}>
      <h1>Désinscription</h1>
      {state === 'done' ? (
        <p role="status">Votre désinscription a bien été enregistrée.</p>
      ) : (
        <>
          <p>Confirmez que vous ne souhaitez plus recevoir les offres PHENO&amp;CO.</p>
          {state === 'error' && <p role="alert">Ce lien est invalide ou la désinscription est temporairement indisponible.</p>}
          <button type="button" className="btn" onClick={unsubscribe} disabled={!token || state === 'loading'}>
            {state === 'loading' ? 'Traitement…' : 'Confirmer la désinscription'}
          </button>
        </>
      )}
      <p><Link href="/">Retour à l&apos;accueil</Link></p>
    </main>
  )
}
