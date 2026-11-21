import { esc } from '../ui.js';
import { footer, priceLabel } from '../components.js';
import { state } from '../api.js';

export async function legal(root) {
  const L = state.settings.legal || {};
  const owner = L.owner ? esc(L.owner) : '<em>Identité de l\'éditeur en cours de mise à jour.</em>';
  const contact = L.email ? `<a href="mailto:${esc(L.email)}">${esc(L.email)}</a>` : 'le formulaire de contact de nos réseaux sociaux';
  root.innerHTML = `
    <h1 class="section-title comic" style="margin-top:26px">MENTIONS, CGV & CONFIDENTIALITÉ</h1>
    <div class="prose">
      <h2>Mentions légales</h2>
      <p><strong>Éditeur :</strong> ${owner}<br><strong>Contact :</strong> ${contact}</p>
      <p><strong>Hébergement du site :</strong> GitHub Pages, GitHub Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, États-Unis.<br>
      <strong>Hébergement des données :</strong> Supabase, serveurs situés à Francfort (Union européenne).<br>
      <strong>Paiements :</strong> Stripe Payments Europe Ltd., Dublin, Irlande.</p>
      <p>VICE CITY NEWS est un média de fans <strong>indépendant et non officiel</strong>. Il n'est ni approuvé, ni sponsorisé, ni affilié à Rockstar Games ou Take-Two Interactive. « Grand Theft Auto », « GTA » et les noms associés sont des marques de Take-Two Interactive, citées uniquement pour informer. Les illustrations de l'application sont des créations originales.</p>

      <h2>Conditions générales de vente (VICE+)</h2>
      <h3>1. Objet</h3>
      <p>Les présentes conditions encadrent l'abonnement payant « VICE+ », qui donne accès aux contenus exclusifs de l'application : articles réservés, lieux secrets de la carte, questions bonus du quiz et fonctions associées.</p>
      <h3>2. Prix</h3>
      <p>Les prix sont indiqués en euros, toutes taxes comprises, sur la page VICE+ au moment de la commande (actuellement ${esc(priceLabel('monthly'))} par mois ou ${esc(priceLabel('yearly'))} par an). Toute évolution de prix est annoncée au moins 30 jours avant de s'appliquer au renouvellement suivant.</p>
      <h3>3. Commande et paiement</h3>
      <p>L'abonnement se souscrit depuis un compte VICE CITY NEWS. Le paiement est traité par Stripe ; VICE CITY NEWS n'a jamais accès à tes données bancaires. L'abonnement est payable d'avance et se renouvelle automatiquement à chaque échéance (mois ou année) jusqu'à résiliation.</p>
      <h3>4. Accès immédiat et droit de rétractation</h3>
      <p>L'accès aux contenus VICE+ est ouvert dès la confirmation du paiement. Conformément à l'article L221-28 13° du Code de la consommation, en demandant cet accès immédiat et en cochant la case prévue, tu reconnais renoncer à ton droit de rétractation de 14 jours.</p>
      <h3>5. Résiliation</h3>
      <p>Tu peux résilier à tout moment depuis « Gérer mon abonnement », sans frais. La résiliation prend effet à la fin de la période déjà payée, jusqu'à laquelle l'accès reste actif. Aucune période entamée n'est remboursée, sauf obligation légale.</p>
      <h3>6. Service</h3>
      <p>Nous faisons notre maximum pour que l'application soit disponible en permanence, sans pouvoir le garantir (maintenance, panne d'un prestataire…). Les informations publiées sont vérifiées avec soin à partir de sources publiques ; les estimations et analyses sont présentées comme telles.</p>
      <h3>7. Réclamations et médiation</h3>
      <p>Pour toute réclamation, contacte-nous via ${contact}. En cas de litige non résolu, tu peux recourir gratuitement à un médiateur de la consommation${L.mediator ? ` : ${esc(L.mediator)}` : ''}, ou à la plateforme européenne de règlement en ligne des litiges. Les présentes conditions sont soumises au droit français.</p>

      <h2>Confidentialité</h2>
      <p><strong>Données collectées :</strong> ton e-mail, ton pseudo et ton avatar, ainsi que ton activité dans l'appli (favoris, réponses au quiz, votes, lieux trouvés) et le statut de ton abonnement. Le pseudo et l'avatar sont visibles dans le classement.</p>
      <p><strong>Pourquoi :</strong> pour gérer ton compte, ton abonnement et les fonctions de l'appli. Aucune donnée n'est vendue ni utilisée pour de la publicité.</p>
      <p><strong>Prestataires :</strong> Supabase (comptes et données, UE), Stripe (paiements), GitHub Pages (hébergement du site), jsDelivr (bibliothèque technique) et Bunny Fonts (polices d'écriture, UE).</p>
      <p><strong>Cookies :</strong> l'appli n'utilise ni cookie publicitaire ni traceur. Seul un stockage technique garde ta session ouverte sur ton appareil.</p>
      <p><strong>Durée :</strong> tes données sont gardées tant que ton compte existe, puis supprimées, sauf obligations légales (factures).</p>
      <p><strong>Tes droits :</strong> accès, rectification, suppression, portabilité et opposition, en nous écrivant via ${contact}. Tu peux aussi saisir la CNIL (cnil.fr).</p>
    </div>
    ${footer()}`;
}
