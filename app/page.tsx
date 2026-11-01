'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import SiteFooter from '@/components/SiteFooter'
import './landing.css'

const services = [
  {
    num: '01',
    title: 'Dégradé',
    price: 'À partir de 25 €',
    desc: "Dégradé classique, skin fade, taper, burst, high top… Finition rasoir et styling soigné. Chaque passage chez PHENO, un résultat qui se voit.",
  },
  {
    num: '02',
    title: 'Coupe + Barbe',
    price: 'À partir de 30 €',
    desc: "Coupe complète et barbe mise en forme, serviette chaude, mousse artisanale. La combinaison pour ceux qui ne font pas de compromis.",
  },
  {
    num: '03',
    title: 'Forfait Complet',
    price: 'À partir de 45 €',
    desc: "Coupe, shampoing, soin, coiffage - prise en charge complète au même niveau d'exigence. Le package de ceux qui veulent repartir parfaits.",
  },
]

const whyItems = [
  { title: 'Sans compromis', sub: "Coupe homme, dégradé, barbe - chaque prestation est réalisée avec le soin d'un vrai barbershop professionnel." },
  { title: 'Réservation en ligne', sub: "Réservez votre coupe ou votre soin barbe à Montpellier en 2 minutes, sans appel, 24h/24." },
  { title: 'Cœur de ville', sub: "18 rue d'Alger, Saint-Roch, Montpellier. À deux pas du tram, au centre de tout." },
  { title: 'Expertise & savoir-faire', sub: "15 ans de métier, des techniques maîtrisées et un œil affûté pour sublimer chaque profil." },
]

const galleryPhotos = [
  { url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=700&h=460&q=80', alt: 'Intérieur barbershop' },
  { url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=700&h=460&q=80', alt: 'Barber au travail' },
  { url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=700&h=460&q=80', alt: 'Coupe précise' },
  { url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=700&h=460&q=80', alt: 'Finition dégradé' },
  { url: 'https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?auto=format&fit=crop&w=700&h=460&q=80', alt: 'Soin barbe' },
  { url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=700&h=460&q=80', alt: 'Ambiance salon' },
]

export default function LandingPage() {
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')
  const [mapAllowed, setMapAllowed] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const prenom  = (fd.get('prenom')  as string).trim()
    const nom     = (fd.get('nom')     as string).trim()
    const email   = (fd.get('email')   as string).trim()
    const tel     = (fd.get('telephone') as string).trim()
    const message = (fd.get('message') as string).trim()
    if (!prenom || !email || !message) return
    setContactStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: `${prenom} ${nom}`.trim(),
          email,
          telephone: tel || undefined,
          message,
        }),
      })
      if (!res.ok) throw new Error()
      setContactStatus('ok')
      formRef.current?.reset()
    } catch {
      setContactStatus('err')
    }
  }

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' }
    )
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <div className="lp">

      {/* ── HERO ── */}
      <section className="lp-hero">
        <Image
          src="/logo-pheno.png"
          alt="PHENO&CO Barbershop"
          width={280}
          height={100}
          className="lp-hero-logo"
          priority
        />
        <h1 className="lp-hero-tagline">
          Barbershop &amp; Coiffure<br />Afro · Montpellier
        </h1>
        <div className="lp-hero-sep">
          <div className="lp-hero-sep-line" />
          <div className="lp-hero-sep-dot" />
          <div className="lp-hero-sep-line" />
        </div>
        <div className="lp-hero-btns">
          <Link href="/rdv" className="lp-btn-gold">PRENDRE RENDEZ-VOUS</Link>
          <Link href="/location" className="lp-btn-outline">LOUER UN FAUTEUIL</Link>
        </div>
        <div className="lp-hero-eyebrow">18 rue d&apos;Alger · Saint-Roch · Montpellier</div>
        <div className="lp-hero-stats">
          <span><strong>1 200+</strong> clients</span>
          <span className="lp-hstat-dot">·</span>
          <span><strong>★ 5.0</strong> Google</span>
          <span className="lp-hstat-dot">·</span>
          <span><strong>15 ans</strong> d&apos;expérience</span>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="lp-services lp-section lp-section-center lp-section-light" id="services">
        <p className="lp-eyebrow" data-reveal>Nos prestations</p>
        <h2 className="lp-h2" data-reveal data-delay="1">Ce qu&apos;on fait,<br />on le fait bien</h2>
        <div className="lp-section-div" data-reveal data-delay="2" />
        <div className="lp-svcs-grid">
          {services.map((s, i) => (
            <div key={s.num} className="lp-svc-card" data-reveal="rise" data-delay={String(i + 1)}>
              <div className="lp-svc-num">{s.num}</div>
              <div className="lp-svc-title">{s.title}</div>
              <div className="lp-svc-sep" />
              <div className="lp-svc-price">{s.price}</div>
              <p className="lp-svc-desc">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="lp-svcs-cta" data-reveal data-delay="2">
          <Link href="/tarifs" className="lp-btn-outline-sm">Voir tous les tarifs →</Link>
        </div>
      </section>

      {/* ── POURQUOI PHENO ── */}
      <section className="lp-why lp-section lp-section-center">
        <p className="lp-eyebrow" data-reveal>Pourquoi nous</p>
        <h2 className="lp-h2" data-reveal data-delay="1">Pourquoi PHENO&amp;CO ?</h2>
        <div className="lp-section-div" data-reveal data-delay="2" />
        <div className="lp-why-cols">
          {whyItems.map((item, i) => (
            <div key={item.title} className="lp-why-col" data-reveal="soft" data-delay={String(i + 1)}>
              <span className="lp-why-num">0{i + 1}</span>
              <span className="lp-why-title">{item.title}</span>
              <div className="lp-why-line" />
              <p className="lp-why-sub">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── GALERIE ── */}
      <section className="lp-gallery-section lp-section lp-section-light">
        <p className="lp-eyebrow" data-reveal>Réalisations</p>
        <h2 className="lp-h2" id="galerie" data-reveal data-delay="1">Nos coupes parlent</h2>
        <div className="lp-section-div" data-reveal data-delay="2" style={{ margin: '.6rem 0 2rem' }} />
        <div className="lp-gallery-grid">
          {galleryPhotos.map((photo, i) => (
            <div
              key={i}
              className="lp-gallery-photo"
              data-reveal="scale"
              data-delay={String((i % 3) + 1)}
              style={{ backgroundImage: `url(${photo.url})` }}
              role="img"
              aria-label={photo.alt}
            />
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta lp-section lp-section-center">
        <h2 className="lp-cta-h2" data-reveal>Prêt à vous<br />transformer&nbsp;?</h2>
        <p className="lp-cta-sub" data-reveal data-delay="1">
          Un créneau de libre, moins de 2 minutes.<br />
          Le reste, c&apos;est nous qui nous en occupons.
        </p>
        <Link href="/rdv" className="lp-btn-cta" data-reveal data-delay="2">RÉSERVER MAINTENANT →</Link>
        <a href="tel:0769432605" className="lp-cta-phone" data-reveal data-delay="3">Ou appelez-nous directement · 07 69 43 26 05</a>
      </section>

      {/* ── CONTACT ── */}
      <section className="lp-contact-section lp-section lp-section-light" id="contact">
        <div className="lp-contact-grid">
          <div className="lp-contact-left" data-reveal="left">
            <p className="lp-eyebrow">Nous trouver</p>
            <h2 className="lp-h2">Venez<br />nous voir</h2>
            <div className="lp-section-div" style={{ margin: '.6rem 0 1.75rem' }} />
            <div className="lp-contact-details">
              <div className="lp-contact-detail-row">
                <span className="lp-contact-detail-label">Adresse</span>
                <span className="lp-contact-detail-val">18 Rue d&apos;Alger, Montpellier 34000</span>
              </div>
              <div className="lp-contact-detail-row">
                <span className="lp-contact-detail-label">Horaires</span>
                <span className="lp-contact-detail-val">Mardi – Samedi · 10h–18h</span>
              </div>
              <div className="lp-contact-detail-row">
                <span className="lp-contact-detail-label">Téléphone</span>
                <a href="tel:0769432605" className="lp-contact-detail-val lp-contact-link">07 69 43 26 05</a>
              </div>
              <div className="lp-contact-detail-row">
                <span className="lp-contact-detail-label">WhatsApp</span>
                <a href="https://wa.me/33769432605" target="_blank" rel="noopener noreferrer" className="lp-contact-detail-val lp-contact-link">Nous écrire</a>
              </div>
            </div>
            <div className="lp-map">
              {mapAllowed ? (
                <iframe
                  src="https://maps.google.com/maps?q=18+Rue+d%27Alger+34000+Montpellier&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  title="PHENO&CO - 18 Rue d'Alger, Montpellier"
                />
              ) : (
                <button type="button" className="lp-map-consent" onClick={() => setMapAllowed(true)}>
                  Afficher la carte Google
                  <span>La carte externe ne se charge qu&apos;après votre action.</span>
                </button>
              )}
            </div>
          </div>

          <div className="lp-contact-right" data-reveal="right" data-delay="1">
            <h3 className="lp-form-title">Nous écrire</h3>
            <p className="lp-form-subtitle">Une question ? Un projet ? On vous répond sous 24h.</p>
            <form ref={formRef} onSubmit={handleContact} className="lp-contact-form">
              <div className="lp-form-row">
                <input type="text" name="prenom" placeholder="Votre prénom *" aria-label="Votre prénom" autoComplete="given-name" className="lp-finput" required />
                <input type="text" name="nom" placeholder="Votre nom" aria-label="Votre nom" autoComplete="family-name" className="lp-finput" />
              </div>
              <div className="lp-form-row">
                <input type="email" name="email" placeholder="Votre email *" aria-label="Votre adresse e-mail" autoComplete="email" className="lp-finput" required />
                <input type="tel" name="telephone" placeholder="Votre téléphone" aria-label="Votre téléphone" autoComplete="tel" className="lp-finput" />
              </div>
              <textarea name="message" placeholder="Votre message… *" aria-label="Votre message" className="lp-ftextarea" rows={5} required />
              <button type="submit" className="lp-btn-submit" disabled={contactStatus === 'sending'}>
                {contactStatus === 'sending' ? 'Envoi…' : 'ENVOYER'}
              </button>
              {contactStatus === 'ok' && (
                <p className="lp-form-success" role="status">✓ Message envoyé - nous vous répondrons rapidement.</p>
              )}
              {contactStatus === 'err' && (
                <p className="lp-form-error-msg" role="alert">
                  ⚠ Erreur d&apos;envoi - écrivez-nous à{' '}
                  <a href="mailto:location.phenoandco@gmail.com">location.phenoandco@gmail.com</a>
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      <SiteFooter />

    </div>
  )
}
