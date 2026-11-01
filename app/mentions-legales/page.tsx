import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mentions légales & Confidentialité - PHENO BARBER',
  description: 'Mentions légales et politique de confidentialité du site PHENO BARBER, barbershop à Montpellier.',
  alternates: { canonical: '/mentions-legales' },
}

export default function MentionsLegalesPage() {
  return (
    <main>
      <div className="cgv-wrap">

        <nav className="cgv-nav">
          <Link href="/" className="back-link">← Retour à l&apos;accueil</Link>
        </nav>

        <h1 className="cgv-heading">Mentions légales</h1>
        <p className="cgv-sub">Informations légales et politique de confidentialité - PHENO BARBER · Montpellier</p>

        {/* ── MENTIONS LÉGALES ── */}

        <div className="cgv-article">
          <h2>1. Éditeur du site</h2>
          <p><strong>Dénomination :</strong> PHENO BARBER (PHENO&amp;CO)</p>
          <p style={{ marginTop: '0.5rem' }}><strong>Adresse :</strong> 18 Rue d&apos;Alger, 34000 Montpellier</p>
          <p style={{ marginTop: '0.5rem' }}><strong>Téléphone :</strong>{' '}
            <a href="tel:0769432605" style={{ color: 'var(--yellow)' }}>07 69 43 26 05</a>
          </p>
          <p style={{ marginTop: '0.5rem' }}><strong>Email :</strong>{' '}
            <a href="mailto:location.phenoandco@gmail.com" style={{ color: 'var(--yellow)' }}>
              location.phenoandco@gmail.com
            </a>
          </p>
        </div>

        <div className="cgv-article">
          <h2>2. Directeur de la publication</h2>
          <p>Le directeur de la publication est le gérant de PHENO BARBER, joignable à l&apos;adresse email indiquée ci-dessus.</p>
        </div>

        <div className="cgv-article">
          <h2>3. Hébergement</h2>
          <p><strong>Hébergeur :</strong> Netlify, Inc.</p>
          <p style={{ marginTop: '0.5rem' }}><strong>Adresse :</strong> 512 Second Street, Suite 200, San Francisco, CA 94107, États-Unis</p>
          <p style={{ marginTop: '0.5rem' }}><strong>Site :</strong>{' '}
            <a href="https://www.netlify.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--yellow)' }}>
              www.netlify.com
            </a>
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            Les données saisies dans les formulaires sont stockées dans une base de données hébergée par
            <strong> Supabase Inc.</strong> (San Francisco, CA, États-Unis), dans des datacenters situés en Europe (région eu-west).
          </p>
        </div>

        <div className="cgv-article">
          <h2>4. Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble du contenu de ce site (textes, visuels, logo, structure) est la propriété exclusive de
            PHENO BARBER, sauf mention contraire. Toute reproduction, distribution ou utilisation sans autorisation
            écrite préalable est strictement interdite.
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            Les photographies de la galerie sont issues de la bibliothèque Unsplash et sont utilisées sous licence libre.
          </p>
        </div>

        <div className="cgv-article">
          <h2>5. Responsabilité</h2>
          <p>
            PHENO BARBER s&apos;efforce de maintenir les informations de ce site à jour et exactes. Toutefois, nous ne
            pouvons garantir l&apos;exhaustivité ou la disponibilité permanente du site. Les tarifs et disponibilités
            affichés sont donnés à titre indicatif et peuvent être modifiés sans préavis.
          </p>
        </div>

        {/* ── POLITIQUE DE CONFIDENTIALITÉ ── */}

        <h2 className="cgv-heading" style={{ marginTop: '3rem', marginBottom: '0.5rem' }}>
          Politique de confidentialité
        </h2>
        <p className="cgv-sub">Conformément au RGPD (Règlement Général sur la Protection des Données) - en vigueur depuis le 25 mai 2018</p>

        <div className="cgv-article">
          <h2>6. Responsable du traitement</h2>
          <p>
            Le responsable du traitement de vos données personnelles est PHENO BARBER, 18 Rue d&apos;Alger,
            34000 Montpellier. Pour toute question relative à vos données, contactez-nous à{' '}
            <a href="mailto:location.phenoandco@gmail.com" style={{ color: 'var(--yellow)' }}>
              location.phenoandco@gmail.com
            </a>.
          </p>
        </div>

        <div className="cgv-article">
          <h2>7. Données collectées</h2>
          <p style={{ marginBottom: '0.75rem' }}>
            Nous collectons uniquement les données nécessaires au traitement de vos rendez-vous, demandes de contact et locations de fauteuil :
          </p>
          <ul>
            <li><strong>Identité :</strong> nom, prénom</li>
            <li><strong>Coordonnées :</strong> adresse email, numéro de téléphone</li>
            <li><strong>Informations professionnelles :</strong> statut juridique, années d&apos;expérience, spécialités</li>
            <li><strong>Données de réservation :</strong> dates, horaires, formule choisie</li>
            <li><strong>Données financières indicatives :</strong> montant estimé de la location (aucun moyen de paiement collecté sur ce site)</li>
          </ul>
          <div className="cgv-highlight" style={{ marginTop: '1rem' }}>
            Aucune donnée bancaire ou carte de crédit n&apos;est collectée ou stockée sur ce site.
            Le paiement de l&apos;acompte s&apos;effectue via un lien sécurisé transmis séparément.
          </div>
        </div>

        <div className="cgv-article">
          <h2>8. Finalités et base légale</h2>

          <h3>8.1 Gestion des demandes de location</h3>
          <p>
            Vos données sont utilisées pour traiter et gérer votre demande de location de fauteuil,
            vous contacter, et établir les documents contractuels.
            <br /><strong>Base légale :</strong> exécution d&apos;un contrat (art. 6.1.b RGPD).
          </p>

          <h3>8.2 Envoi de confirmations par email</h3>
          <p>
            Votre adresse email et, lorsque nécessaire, votre numéro de téléphone sont utilisés pour envoyer
            les confirmations et rappels transactionnels via Resend et Twilio. Aucun envoi commercial n&apos;est
            effectué sans votre consentement explicite préalable.
            <br /><strong>Base légale :</strong> exécution d&apos;un contrat (art. 6.1.b RGPD).
          </p>

          <h3>8.3 Obligations légales</h3>
          <p>
            Certaines données peuvent être conservées pour répondre à nos obligations comptables et fiscales.
            <br /><strong>Base légale :</strong> obligation légale (art. 6.1.c RGPD).
          </p>
        </div>

        <div className="cgv-article">
          <h2>9. Durée de conservation</h2>
          <ul>
            <li>Données de réservation : <strong>3 ans</strong> à compter de la fin de la relation contractuelle</li>
            <li>Données comptables : <strong>10 ans</strong> conformément au Code de commerce</li>
            <li>Données non suivies d&apos;une location : supprimées sous <strong>12 mois</strong></li>
          </ul>
        </div>

        <div className="cgv-article">
          <h2>10. Vos droits</h2>
          <p style={{ marginBottom: '0.75rem' }}>
            Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :
          </p>
          <ul>
            <li><strong>Droit d&apos;accès :</strong> obtenir une copie des données vous concernant</li>
            <li><strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes</li>
            <li><strong>Droit à l&apos;effacement :</strong> demander la suppression de vos données</li>
            <li><strong>Droit à la limitation :</strong> limiter le traitement de vos données</li>
            <li><strong>Droit à la portabilité :</strong> récupérer vos données dans un format lisible</li>
            <li><strong>Droit d&apos;opposition :</strong> vous opposer à certains traitements</li>
          </ul>
          <p style={{ marginTop: '0.75rem' }}>
            Pour exercer vos droits, contactez-nous par email à{' '}
            <a href="mailto:location.phenoandco@gmail.com" style={{ color: 'var(--yellow)' }}>
              location.phenoandco@gmail.com
            </a>{' '}
            en précisant votre demande. Nous répondons dans un délai maximum de <strong>30 jours</strong>.
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            En cas de réponse insatisfaisante, vous pouvez adresser une réclamation à la{' '}
            <strong>CNIL</strong> (Commission Nationale de l&apos;Informatique et des Libertés) :{' '}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--yellow)' }}>
              www.cnil.fr
            </a>.
          </p>
        </div>

        <div className="cgv-article">
          <h2>11. Cookies et traceurs</h2>
          <p style={{ marginBottom: '0.75rem' }}>
            Ce site utilise des cookies strictement nécessaires à son fonctionnement :
          </p>
          <ul>
            <li>
              <strong>Cookie de session admin</strong> (<code>pheno_admin_session</code>) :
              cookie httpOnly utilisé uniquement pour l&apos;authentification au tableau de bord d&apos;administration.
              Durée maximale : 8 heures. Non accessible aux scripts.
            </li>
          </ul>
          <p style={{ marginTop: '0.75rem' }}>
            Ce site n&apos;utilise pas de cookies publicitaires, de tracking marketing, ni de cookies tiers
            de réseaux sociaux. Google Fonts est chargé directement depuis nos serveurs. La carte Google Maps
            n&apos;est chargée qu&apos;après une action volontaire sur le bouton prévu à cet effet.
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            Pour faciliter une réservation interrompue, le navigateur conserve temporairement les informations
            du formulaire et les coordonnées uniquement dans la session de l&apos;onglet, pendant au plus
            <strong> 8 heures</strong>. Elles disparaissent à la fermeture de l&apos;onglet ou peuvent être supprimées
            à tout moment depuis les données du site dans le navigateur.
          </p>
          <div className="cgv-highlight" style={{ marginTop: '1rem' }}>
            Aucun consentement aux cookies n&apos;est requis car seuls des cookies strictement nécessaires
            sont utilisés (exemptés de consentement selon les lignes directrices de la CNIL).
          </div>
          <p style={{ marginTop: '0.75rem' }}>
            Le consentement aux offres commerciales est facultatif et distinct de la réservation. Chaque message
            concerné contient un lien permettant de retirer ce consentement immédiatement.
          </p>
        </div>

        <div className="cgv-article">
          <h2>12. Sous-traitants</h2>
          <p style={{ marginBottom: '0.75rem' }}>
            Nous faisons appel aux sous-traitants suivants dans le cadre de notre service :
          </p>
          <ul>
            <li>
              <strong>Supabase Inc.</strong> - Stockage des données de réservation.
              Données hébergées en Europe. Politique :{' '}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--yellow)' }}>
                supabase.com/privacy
              </a>
            </li>
            <li>
              <strong>Resend</strong> - Service d&apos;envoi d&apos;emails transactionnels et, uniquement avec consentement,
              de messages de fidélisation.
              Politique :{' '}
              <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--yellow)' }}>
                resend.com/legal/privacy-policy
              </a>
            </li>
            <li>
              <strong>Twilio</strong> - Envoi de confirmations et rappels par SMS lorsque ce canal est configuré.
              Politique :{' '}
              <a href="https://www.twilio.com/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--yellow)' }}>
                twilio.com/legal/privacy
              </a>
            </li>
            <li>
              <strong>Google Maps</strong> - Carte externe chargée uniquement à la demande de l&apos;utilisateur.
            </li>
            <li>
              <strong>Netlify Inc.</strong> - Hébergement du site. Les logs de connexion peuvent
              être temporairement conservés. Politique :{' '}
              <a href="https://www.netlify.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--yellow)' }}>
                netlify.com/privacy
              </a>
            </li>
          </ul>
        </div>

        <div className="cgv-article">
          <h2>13. Mise à jour</h2>
          <p>
            Cette politique de confidentialité peut être mise à jour à tout moment. La date de dernière
            révision est indiquée ci-dessous. Nous vous encourageons à la consulter régulièrement.
          </p>
          <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Dernière mise à jour : octobre 2026
          </p>
        </div>

      </div>

      <footer className="site-footer">
        <p>PHENO BARBER - Barbershop &amp; Coworking · Montpellier</p>
        <p>
          <Link href="/" className="link-yellow">← Retour à l&apos;accueil</Link>
          {' · '}
          <Link href="/location" className="link-yellow">Louer un fauteuil</Link>
          {' · '}
          <Link href="/cgv-location" className="link-yellow">CGV location</Link>
        </p>
      </footer>
    </main>
  )
}
