import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'CGV & Contrat de Location - PHENO&CO',
  description: 'Conditions générales de location de fauteuil chez PHENO&CO, barbershop à Montpellier.',
  alternates: { canonical: '/cgv-location' },
}

export default function CgvPage() {
  return (
    <main>
      <div className="cgv-wrap">
        <nav className="cgv-nav">
          <Link href="/location" className="back-link">← Retour au formulaire</Link>
        </nav>

        <h1 className="cgv-heading">CGV &amp; Contrat de Location</h1>
        <p className="cgv-sub">Conditions générales de location de fauteuil - PHENO&CO Montpellier</p>

        <div className="cgv-article">
          <h2>Article 1 - Objet du Contrat</h2>
          <p>
            Le présent contrat a pour objet de définir les conditions de mise à disposition d&apos;un poste de
            travail (fauteuil) au sein du salon de coiffure <strong>PHENO&CO</strong>, situé à Montpellier.
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            Le locataire, professionnel de la coiffure indépendant, loue un espace équipé pour exercer son
            activité auprès de sa propre clientèle, dans le respect du règlement intérieur du salon.
          </p>
        </div>

        <div className="cgv-article">
          <h2>Article 2 - Conditions d&apos;Éligibilité</h2>
          <p style={{ marginBottom: '0.75rem' }}>Pour louer un fauteuil chez PHENO&CO, le locataire doit :</p>
          <ul>
            <li>Justifier d&apos;au moins 3 ans d&apos;expérience professionnelle</li>
            <li>Être titulaire d&apos;un CAP/BP Coiffure ou diplôme équivalent</li>
            <li>Être immatriculé en tant qu&apos;indépendant ou société</li>
            <li>Disposer d&apos;une assurance responsabilité civile professionnelle valide</li>
            <li>Fournir les justificatifs correspondants avant la première location</li>
          </ul>
          <div className="cgv-highlight" style={{ marginTop: '1rem' }}>
            <strong>Important :</strong> toute fausse déclaration entraîne l&apos;annulation immédiate de la
            réservation sans remboursement.
          </div>
        </div>

        <div className="cgv-article">
          <h2>Article 3 - Tarification</h2>

          <h3>3.1 Location Courte Durée</h3>
          <table>
            <thead>
              <tr>
                <th>Formule</th>
                <th>Tarif HT</th>
                <th>Acompte</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>À l&apos;heure</td><td>10 €/h HT</td><td>50 %</td></tr>
              <tr><td>Demi-journée (4h)</td><td>35 € HT</td><td>50 %</td></tr>
              <tr><td>Journée complète (8h)</td><td>65 € HT</td><td>50 %</td></tr>
            </tbody>
          </table>

          <h3>3.2 Location Longue Durée</h3>
          <table>
            <thead>
              <tr>
                <th>Formule</th>
                <th>Tarif HT / jour</th>
                <th>Acompte</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Semaine</td><td>60 € HT / jour</td><td>25 %</td></tr>
              <tr><td>Mensuel</td><td>55 € HT / jour</td><td>25 %</td></tr>
            </tbody>
          </table>

          <h3>3.3 Packs Matériel (option)</h3>
          <table>
            <thead>
              <tr>
                <th>Pack</th>
                <th>Contenu</th>
                <th>Tarif HT / jour</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Essentiel</td>
                <td>Tondeuses, outils de finition, cape, serviettes</td>
                <td>+20 € HT</td>
              </tr>
              <tr>
                <td>Premium</td>
                <td>Essentiel + rasoir + serviettes supplémentaires</td>
                <td>+30 € HT</td>
              </tr>
            </tbody>
          </table>

          <p style={{ marginTop: '0.75rem', fontSize: '0.82rem' }}>
            TVA applicable au taux de 20 %. Tous les tarifs s&apos;entendent hors taxes, la TVA est affichée
            séparément lors de la réservation.
          </p>
        </div>

        <div className="cgv-article">
          <h2>Article 4 - Réservation et Paiement</h2>
          <ol>
            <li>Remplir le formulaire de demande en ligne</li>
            <li>Recevoir un e-mail de confirmation avec récapitulatif</li>
            <li>Transmettre les justificatifs requis (assurance, SIRET)</li>
            <li>Recevoir le lien de paiement de l&apos;acompte</li>
            <li>Obtenir la confirmation définitive après paiement de l&apos;acompte</li>
          </ol>
          <p style={{ marginTop: '0.75rem' }}>
            L&apos;acompte est de <strong>50 %</strong> pour la courte durée et de <strong>25 %</strong> pour la
            longue durée. Le solde est à régler sur place le jour de la location.
          </p>
        </div>

        <div className="cgv-article">
          <h2>Article 5 - Annulation</h2>
          <ul>
            <li>Plus de 48h avant le début : remboursement intégral de l&apos;acompte</li>
            <li>Entre 24h et 48h avant : remboursement de 50 % de l&apos;acompte</li>
            <li>Moins de 24h avant : acompte non remboursable</li>
            <li>Non-présentation sans préavis : acompte définitivement acquis</li>
          </ul>
        </div>

        <div className="cgv-article">
          <h2>Article 6 - Contact</h2>
          <p><strong>PHENO&CO</strong> - Barbershop &amp; Coworking, Montpellier</p>
          <p style={{ marginTop: '0.5rem' }}>
            E-mail :{' '}
            <a href="mailto:location.phenoandco@gmail.com" style={{ color: 'var(--yellow)' }}>
              location.phenoandco@gmail.com
            </a>
          </p>
          <p>
            WhatsApp :{' '}
            <a href="https://wa.me/message/MZYDVEN32I55L1" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--yellow)' }}>
              Nous contacter
            </a>
          </p>
        </div>
      </div>

      <footer className="site-footer">
        <p>PHENO&CO - Barbershop &amp; Coworking · Montpellier</p>
        <p style={{ marginTop: '0.4rem' }}>
          <Link href="/location">← Retour au formulaire de réservation</Link>
        </p>
      </footer>
    </main>
  )
}
