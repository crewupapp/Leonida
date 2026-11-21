# VICE CITY NEWS · l'appli d'actu GTA 6

Application web (installable sur téléphone) de **VICE CITY NEWS** : news GTA 6 en français, secrets, carte illustrée de Leonida, quiz, sondages et abonnement payant **VICE+**.

> Média de fans non officiel, sans lien avec Rockstar Games ni Take-Two Interactive. Toutes les illustrations sont des créations originales.

## Ce que contient l'appli

| Écran | Gratuit | VICE+ |
|---|---|---|
| Accueil animé (scène Vice City, flash info, chiffres, une, fil d'actus, sondage) | ✅ | ✅ |
| Articles gratuits | ✅ | ✅ |
| Articles exclusifs (secrets, guides, analyses) | chapeau + paywall | ✅ |
| Carte de Leonida | régions et lieux publics | + lieux secrets, easter eggs, suivi « trouvé » |
| Quiz | questions gratuites | + questions bonus, classement |
| Favoris, profil, avatar, sondages | ✅ (compte gratuit) | ✅ |
| Espace admin (articles, carte, quiz, sondages, réglages, prix) | staff | staff |

Le contenu payant est protégé **côté serveur** (règles RLS de Supabase) : un non-abonné ne peut pas le lire, même en fouillant le code.

## Technique

- Site statique sans compilation : `index.html`, `css/`, `js/` (modules ES), service worker `sw.js`, `manifest.webmanifest`.
- Données, comptes et stockage : Supabase (projet `eqkyyrepsybgrsxzrbof`). Schéma dans `supabase/migrations/`.
- Paiement : Stripe Checkout via les fonctions `supabase/functions/billing` et `supabase/functions/stripe-webhook`.
- Hébergement : GitHub Pages (branche `main`, dossier racine).

## Activer le paiement (une seule fois)

1. Crée ou ouvre ton compte sur [stripe.com](https://dashboard.stripe.com) et récupère ta **clé secrète** (`sk_live_…`, ou `sk_test_…` pour tester).
2. Supabase > projet VICE CITY NEWS > **Edge Functions > Secrets** : ajoute `STRIPE_SECRET_KEY`.
3. Stripe > Développeurs > Webhooks : ajoute l'adresse
   `https://eqkyyrepsybgrsxzrbof.supabase.co/functions/v1/stripe-webhook`
   avec les événements `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, puis ajoute le secret de signature `STRIPE_WEBHOOK_SECRET` dans Supabase.
4. Stripe > Paramètres > **Portail client** : enregistre la configuration (pour le bouton « Gérer mon abonnement »).

Les prix (2,99 €/mois et 24,99 €/an par défaut) se changent dans **Admin > Réglages** : ils servent à la fois à l'affichage et au paiement.

## Compte administrateur

Le compte inscrit avec l'adresse e-mail définie dans la table `admin_emails` devient administrateur automatiquement dès que son adresse est confirmée. L'espace admin est ensuite accessible depuis **Moi > Espace admin**.
