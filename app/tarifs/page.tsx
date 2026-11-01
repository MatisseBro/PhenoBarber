'use client'

import { useState } from 'react'
import Link from 'next/link'
import SiteFooter from '@/components/SiteFooter'
import './tarifs.css'

type Cat = 'homme' | 'femme' | 'enfant'

const SERVICES: Record<Cat, { id: string; name: string; price: string; dur: string; note?: string; wa?: boolean; subtypes?: { name: string; price: string; dur: string }[] }[]> = {
  homme: [
    {
      id: 'degrade', name: 'Dégradé', price: 'dès 25 €', dur: 'dès 30 min',
      note: 'Skin fade, taper, burst, high top - avec ou sans barbe et design',
      subtypes: [
        { name: 'Dégradé simple',             price: '25 €', dur: '30 min' },
        { name: 'Dégradé + barbe',             price: '30 €', dur: '30 min' },
        { name: 'Dégradé + mèches',            price: '30 €', dur: '35 min' },
        { name: 'Dégradé + design',            price: '30 €', dur: '35 min' },
        { name: 'Dégradé + barbe + design',    price: '35 €', dur: '40 min' },
      ],
    },
    { id: 'coupe-barbe-r', name: 'Coupe + barbe (rasoir)',    price: '30 €', dur: '45 min', note: 'Coupe + mise en forme barbe au rasoir' },
    { id: 'coupe-barbe-c', name: 'Coupe + barbe (complète)',  price: '35 €', dur: '60 min', note: 'Coupe + barbe complète, serviette chaude' },
    { id: 'buzz',          name: 'Buzz cut',                  price: '25 €', dur: '25 min' },
    { id: 'waves',         name: 'Waves',                     price: '30 €', dur: '60 min', note: 'Coupe + brossage intensif' },
    { id: 'forfait-soin',  name: 'Forfait soin',              price: '45 €', dur: '60 min', note: 'Coupe + shampoing + soin + coiffage' },
    { id: 'forfait-curly', name: 'Forfait curly',             price: '55 €', dur: '75 min', note: 'Coupe + shampoing + soin + coiffage + retour des boucles' },
    { id: 'color-caramel', name: 'Coloration caramel',        price: '45 €', dur: '90 min', wa: true },
    { id: 'coloration',    name: 'Coloration',                price: '50 €', dur: '90 min', wa: true },
    { id: 'decoloration',  name: 'Décoloration',              price: '80 €', dur: '120 min', wa: true },
    { id: 'tresses-h',     name: 'Tresses',                   price: '30 €', dur: '90 min', wa: true },
    { id: 'produits-h',    name: 'Application de produits',   price: '25 €', dur: '45 min' },
  ],
  femme: [
    { id: 'big-chop',      name: 'Big chop (courte)',         price: '35 €', dur: '45 min', note: 'Coupe courte afro' },
    { id: 'buzz-f',        name: 'Buzz cut',                  price: '25 €', dur: '25 min' },
    { id: 'big-chop-s',    name: 'Big chop + soin',           price: '55 €', dur: '75 min', note: 'Coupe + shampoing + soin + coiffage' },
    { id: 'forfait-f',     name: 'Forfait coupe',             price: '55 €', dur: '75 min', note: 'Coupe + shampoing + coiffage' },
    { id: 'forfait-f-curl',name: 'Forfait curly',             price: '65 €', dur: '90 min', note: 'Coupe + shampoing + soin + retour des boucles + coiffage' },
    { id: 'color-f',       name: 'Coloration',                price: '55 €', dur: '90 min', wa: true },
    { id: 'blond-patine',  name: 'Blond + patine',            price: '85 €', dur: '120 min', wa: true },
    { id: 'blanc-polaire', name: 'Blanc polaire',             price: '95 €', dur: '150 min', wa: true },
    { id: 'tresses-f',     name: 'Tresses',                   price: '30 €', dur: '90 min', wa: true },
    { id: 'produits-f',    name: 'Application de produits',   price: '25 €', dur: '45 min' },
  ],
  enfant: [
    { id: 'coupe-e',   name: 'Coupe enfant',   price: '18 €', dur: '25 min', note: 'Moins de 12 ans' },
    { id: 'degrade-e', name: 'Dégradé enfant', price: '20 €', dur: '30 min', note: 'Moins de 12 ans' },
    { id: 'tresses-e', name: 'Tresses enfant', price: '30 €', dur: '60 min', wa: true },
  ],
}

const OPTIONS = [
  { id: 'sham',     name: 'Shampoing',                   price: '+10 €', dur: '+10 min', cats: 'Homme · Femme · Enfant' },
  { id: 'pointes',  name: 'Coupe des pointes',           price: '+10 €', dur: '+10 min', cats: 'Femme' },
  { id: 'soin',     name: 'Soin / retour des boucles',   price: '+20 €', dur: '+20 min', cats: 'Homme · Femme' },
  { id: 'twist',    name: 'Twist éponge',                price: '+5 €',  dur: '+10 min', cats: 'Homme' },
  { id: 'design-s', name: 'Design simple',               price: '+5 €',  dur: '+5 min',  cats: 'Homme' },
  { id: 'design-c', name: 'Design complexe',             price: '+10 €', dur: '+10 min', cats: 'Homme' },
  { id: 'design-x', name: 'Design complet',              price: '+25 €', dur: '+20 min', cats: 'Homme' },
  { id: 'sc',       name: 'Shampoing + coiffage',        price: '+15 €', dur: '+20 min', cats: 'Femme' },
  { id: 'ssc',      name: 'Shampoing + soin + coiffage', price: '+25 €', dur: '+30 min', cats: 'Femme' },
  { id: 'contour',  name: 'Contour + dégradé barbe',     price: '+8 €',  dur: '+10 min', cats: 'Homme' },
]

const catLabels: Record<Cat, string> = { homme: 'Homme', femme: 'Femme', enfant: 'Enfant' }
const catSubs: Record<Cat, string> = {
  homme: 'Dégradés, coupes, barbe, colorations, tresses - toutes les prestations pour hommes.',
  femme: 'Coupes courtes afro, big chop, colorations, forfaits soin - prestations pour femmes.',
  enfant: 'Coupes et dégradés pour enfants de moins de 12 ans.',
}

export default function TarifsPage() {
  const [active, setActive] = useState<Cat>('homme')

  const svcs = SERVICES[active]

  return (
    <div className="t-page">
      <section className="t-hero">
        <div className="t-hero-glow" aria-hidden="true" />
        <div className="t-hero-inner">
          <div className="t-hero-copy">
            <p className="t-eyebrow">Barbershop &amp; Coiffure Afro · Montpellier</p>
            <h1 className="t-h1">Nos<br /><span>tarifs.</span></h1>
            <p className="t-hero-sub">Tous les prix de nos prestations. Réservez en ligne en 2 minutes.</p>
          </div>
          <div className="t-hero-index" aria-label="Prestations pour hommes, femmes et enfants">
            <span className="t-hero-index-label">Prestations</span>
            <strong>03</strong>
            <div className="t-hero-index-line" />
            <p>Homme<br />Femme<br />Enfant</p>
          </div>
        </div>
      </section>

      <nav className="t-tabs-wrap" aria-label="Catégories de tarifs">
        <div className="t-tabs" role="tablist">
          {(['homme', 'femme', 'enfant'] as Cat[]).map((cat, index) => (
            <button key={cat} className={`t-tab${active === cat ? ' active' : ''}`} onClick={() => setActive(cat)} role="tab" aria-selected={active === cat}>
              <span>0{index + 1}</span>{catLabels[cat]}
            </button>
          ))}
        </div>
      </nav>

      <section className="t-services" key={active}>
        <header className="t-section-head">
          <div>
            <p className="t-section-index">01 / Prestations</p>
            <h2>{catLabels[active]}</h2>
          </div>
          <p>{catSubs[active]}</p>
        </header>

        <div className="t-service-list">
          {svcs.map((svc, index) => (
            <article className="t-service-card" key={svc.id} style={{ '--t-delay': `${index * 35}ms` } as React.CSSProperties}>
              <span className="t-service-number">{String(index + 1).padStart(2, '0')}</span>
              <div className="t-service-content">
                <h3>{svc.name}{svc.wa && <span className="t-wa-badge">Sur confirmation WhatsApp</span>}</h3>
                {svc.note && <p>{svc.note}</p>}
                {svc.subtypes && (
                  <div className="t-subtypes">
                    {svc.subtypes.map(st => (
                      <div key={st.name} className="t-subtype-row">
                        <span>{st.name}</span><span>{st.dur}</span><strong>{st.price}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="t-service-meta"><strong>{svc.price}</strong><span>{svc.dur}</span></div>
            </article>
          ))}
        </div>
      </section>

      <section className="t-options-block">
        <header className="t-options-head">
          <div><p className="t-section-index">02 / Sur mesure</p><h2>Options<br /><span>complémentaires.</span></h2></div>
          <p>Ajoutez les finitions adaptées à votre prestation.</p>
        </header>
        <div className="t-opts-grid">
          {OPTIONS.map((opt, index) => (
            <article key={opt.id} className="t-opt-card">
              <span className="t-opt-index">{String(index + 1).padStart(2, '0')}</span>
              <h3>{opt.name}</h3>
              <div className="t-opt-row"><strong>{opt.price}</strong><span>{opt.dur}</span></div>
              <p>{opt.cats}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="t-cta">
        <p className="t-section-index">03 / Réserver</p>
        <h2>Prêt à<br /><span>réserver ?</span></h2>
        <p>Choisissez votre prestation et réservez en ligne en 2 minutes.</p>
        <div className="t-cta-actions">
          <Link href="/rdv" className="t-btn-gold">Prendre rendez-vous <span>→</span></Link>
          <a href="https://wa.me/33769432605" target="_blank" rel="noopener noreferrer" className="t-btn-outline">Une question ? WhatsApp</a>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
