import Link from 'next/link'
import type { Metadata } from 'next'
import SiteFooter from '@/components/SiteFooter'
import './notre-histoire.css'

export const metadata: Metadata = {
  title: 'Notre histoire - PHENO&CO Barbershop Montpellier',
  description: 'Depuis 2009, PHENO&CO est le barbershop afro de référence à Montpellier. Découvrez notre histoire, nos valeurs et notre équipe.',
  alternates: { canonical: '/notre-histoire' },
}

export default function NotreHistoirePage() {
  return (
    <main className="nh-page">
      <section className="nh-hero">
        <div className="nh-hero-orbit" aria-hidden="true" />
        <div className="nh-hero-grid">
          <div className="nh-hero-copy">
            <p className="nh-eyebrow"><span>Montpellier</span> · Depuis 2009</p>
            <h1 className="nh-h1">Notre<br /><em>histoire</em></h1>
            <p className="nh-hero-place">Saint-Roch · 18 rue d&apos;Alger</p>
          </div>
          <div className="nh-year-card" aria-label="PHENO&CO depuis 2009">
            <span className="nh-year-kicker">Une histoire de précision</span>
            <strong className="nh-year">2009</strong>
            <div className="nh-year-rule"><span /></div>
            <span className="nh-year-now">Aujourd&apos;hui</span>
            <span className="nh-year-mark">PHENO<span>&amp;</span>CO</span>
          </div>
        </div>
        <a href="#histoire" className="nh-scroll-cue">Découvrir <span aria-hidden="true">↓</span></a>
      </section>

      <section className="nh-story" id="histoire">
        <div className="nh-story-head">
          <p className="nh-section-index">01 / L&apos;origine</p>
          <blockquote className="nh-quote">« Bienvenue chez moi.<br />Bienvenue chez <span>PHENO&amp;CO.</span> »</blockquote>
        </div>
        <div className="nh-story-copy">
          <p className="nh-dropcap">
            PHENO&amp;CO, c'est un barbershop né à Montpellier en 2009, dans le quartier Saint-Roch,
            au cœur de la ville. Depuis plus de 15 ans, nous accueillons hommes, femmes et enfants
            pour des coupes courtes afro et bouclées, des dégradés précis, des soins de barbe et
            des colorations.
          </p>
          <p>
            Notre spécialité : les cheveux crépus, bouclés et frisés. Tapered cut, buzz cut femme,
            big chop, skin fade, dégradé homme - chaque prestation est réalisée avec le soin et
            l'exigence d'un vrai professionnel formé à ces techniques.
          </p>
        </div>
      </section>

      <section className="nh-values-section">
        <div className="nh-values-heading">
          <p className="nh-section-index">02 / Nos piliers</p>
          <h2>Ce qui nous<br /><span>définit.</span></h2>
        </div>
          <div className="nh-values">
            <article className="nh-value">
              <span className="nh-value-index">01</span>
              <span className="nh-value-title">Expertise technique</span>
              <p className="nh-value-desc">15 ans à perfectionner les techniques sur cheveux afro et bouclés. Chaque coupe est un travail de précision.</p>
            </article>
            <article className="nh-value">
              <span className="nh-value-index">02</span>
              <span className="nh-value-title">Accueil sincère</span>
              <p className="nh-value-desc">Un salon à taille humaine où chaque client est connu, reconnu, et pris en charge avec attention.</p>
            </article>
            <article className="nh-value">
              <span className="nh-value-index">03</span>
              <span className="nh-value-title">Ancrage local</span>
              <p className="nh-value-desc">18 rue d'Alger, Saint-Roch - Montpellier. Au cœur du quartier, depuis le premier jour.</p>
            </article>
          </div>
      </section>

      <section className="nh-visit">
        <div className="nh-visit-intro">
          <p className="nh-section-index">03 / Le salon</p>
          <h2>Au cœur de<br /><span>Montpellier.</span></h2>
          <p className="nh-visit-note">PHENO&amp;CO · Saint-Roch</p>
        </div>
        <div className="nh-visit-panel">
          <div className="nh-info-row">
            <div className="nh-info-item">
              <span className="nh-info-number">01</span>
              <span className="nh-info-label">Adresse</span>
              <span className="nh-info-val">18 rue d&apos;Alger · 34000 Montpellier</span>
            </div>
            <div className="nh-info-item">
              <span className="nh-info-number">02</span>
              <span className="nh-info-label">Horaires</span>
              <span className="nh-info-val">Mar–Jeu–Ven–Sam 10h–18h · Mer 12h–17h30</span>
            </div>
            <div className="nh-info-item">
              <span className="nh-info-number">03</span>
              <span className="nh-info-label">Contact</span>
              <a href="tel:0769432605" className="nh-info-val nh-info-link">07 69 43 26 05</a>
            </div>
          </div>
          <div className="nh-cta-row">
            <Link href="/rdv" className="nh-btn-gold">Prendre rendez-vous <span>→</span></Link>
            <Link href="/" className="nh-btn-outline">Retour à l&apos;accueil</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
