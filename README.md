# History Voice

History Voice est une application mobile Android qui génère des histoires personnalisées pour enfants et adultes, puis les raconte à voix haute, comme un livre audio.

Site web : [history-voice.belgacai.com](https://history-voice.belgacai.com)

## Ce que fait l'app

- L'utilisateur choisit quelques paramètres : âge, sexe du héros, genre, moment de la journée, durée et, au choix, une description libre.
- Une histoire unique est générée par intelligence artificielle, avec un nombre de mots calibré pour que la durée audio corresponde à la durée demandée (calibration réalisée sur 240 tests réels, par langue, âge et durée).
- L'histoire est narrée par une voix de synthèse naturelle (voix féminine ou masculine, adaptées à la langue et à l'âge).
- 10 langues : français, anglais, espagnol, portugais, italien, néerlandais, allemand, arabe, turc, polonais.
- 6 genres, tous adaptés aux enfants : aventure, fantastique, animaux, prince/princesse, science-fiction, comédie.

## Fonctionnalités

- **Connexion** avec un compte Google.
- **Bibliothèque d'histoires** : sauvegarde du texte et de l'audio, réécoute sans régénérer, suppression. Limites : 3 histoires en gratuit, 20 en premium.
- **Rappel du soir** : notification programmable pour rappeler l'heure de l'histoire.
- **Crédits** : le temps d'histoire se paie en minutes, avec un solde visible sur l'écran principal et des packs de recharge.
- **Demande d'avis** sur le Play Store, déclenchée après un certain temps d'écoute cumulé.
- **Mises à jour** : un écran bloquant impose la mise à jour quand la version installée est inférieure à un seuil réglable à distance, et la mise à jour immédiate de Google Play est proposée automatiquement quand une version plus récente existe.
- **Interface multilingue** : détection de la langue de l'appareil, textes de l'app, fiche Play Store et site web traduits dans les 10 langues.

## Modèle économique

- Système de crédits (minutes d'histoire) achetables en packs, via RevenueCat et Google Play Billing.
- Un pack premium offre une période sans publicité et une bibliothèque plus grande.
- Les utilisateurs gratuits voient des publicités AdMob **non personnalisées** (bandeau + interstitiel avant l'histoire).

## Public et conformité

Application à usage familial, conçue pour être adaptée aux enfants et conforme à la politique Google Play « Familles » :

- contenu classé « Tout public » (genres sans horreur ni violence) ;
- publicités limitées au classement G, non personnalisées, traitement « destiné aux enfants » activé ;
- consentement RGPD / États américains (UMP) demandé au lancement avant les publicités ;
- aucune collecte de localisation ni de contacts ;
- politique de confidentialité accessible dans l'app et sur le site.

## Architecture

| Couche | Technologie |
|---|---|
| App | React Native 0.83 + TypeScript, React Navigation |
| Traductions | i18next (10 langues) |
| Backend | Supabase (base Postgres, authentification, stockage, Edge Functions) |
| Génération de texte | Groq puis Gemini (secours automatique de l'un vers l'autre) |
| Voix | Google Cloud Text-to-Speech |
| Achats | RevenueCat |
| Publicités | Google AdMob |
| Notifications | Notifee |
| E-mails | Resend |

### Edge Functions (`supabase/functions`)

| Fonction | Rôle |
|---|---|
| `generate-story` | Génère le texte via Groq, avec secours Gemini |
| `generate-audio` | Synthèse vocale Google TTS (texte découpé pour les longues histoires) |
| `verify-user`, `get-credits` | Création du compte et lecture du solde |
| `deduct-credits` | Déduction des crédits calculée côté serveur |
| `add-purchase-credits`, `handle-payment` | Ajout de crédits après achat, webhook RevenueCat |
| `save-story`, `list-stories`, `delete-story` | Bibliothèque d'histoires |
| `check-app-version` | Version minimale exigée (modifiable sans nouveau build) |
| `report-error` | Reçoit les erreurs affichées dans l'app et les transmet par mail |
| `send-report` | Rapport mensuel par mail (utilisateurs, histoires, revenus, coûts IA) |
| `_shared` | Vérification du jeton d'authentification et contrôle d'usage |

## Sécurité

- **Clés API** (Groq, Gemini, Google TTS) : stockées dans les secrets des Edge Functions, jamais dans la base ni dans l'app, donc absentes des sauvegardes.
- **Tables sensibles** protégées par RLS : aucune lecture ni écriture possible avec la clé publique de l'app.
- **Crédits** : le solde est lu et déduit uniquement côté serveur.
- **Contrôle d'usage** (`_shared/usage-guard.ts`) : refus si le solde est nul, et limite horaire par utilisateur (40 appels texte, 20 appels audio) pour protéger les quotas et les coûts.
- **Authentification** : chaque appel de fonction vérifie la signature du jeton Supabase.

## Suivi et exploitation

- **Alertes par e-mail** quand tous les fournisseurs d'IA échouent, et rapports d'erreur envoyés depuis l'app (limités à un par type d'erreur toutes les 10 minutes).
- **Rapport mensuel** automatique avec graphiques d'évolution.
- **Sauvegarde hebdomadaire** de Supabase (`scripts/backup-supabase.ps1`) : schéma, données, comptes, stockage.
- **Anti-pause Supabase** : un appel planifié à l'API évite la mise en pause du projet gratuit (routine cloud + workflow GitHub Actions `supabase-keepalive.yml`).

## Commandes utiles

```bash
# Développement
npm install
npm start
npm run android

# Vérification TypeScript
npx tsc --noEmit

# Déployer une Edge Function (indépendant de l'app)
supabase functions deploy <nom> --project-ref dqxaxgvncoxgwfzumvfg

# Changer une clé API (sans redéploiement)
supabase secrets set GROQ_API_KEY=...
supabase secrets set GEMINI_API_KEY=...
supabase secrets set GOOGLE_TTS_API_KEY=...
```

### Générer l'AAB de release (Windows)

Windows limite les chemins à 260 caractères : le build se fait depuis une copie à chemin court, `C:\HV`.

1. Synchroniser le projet vers `C:\HV` (robocopy, en conservant `android\keystore.properties` et la clé de signature).
2. Dans `C:\HV\android` : `.\gradlew.bat bundleRelease`.
3. Récupérer `android\app\build\outputs\bundle\release\app-release.aab` et l'envoyer sur la Play Console.

La version se règle dans `android/app/build.gradle` (`versionCode`, `versionName`) et dans `package.json` (`version`, affichée dans l'app et comparée au seuil de `check-app-version`).

### Mise à jour obligatoire

La fonction `check-app-version` renvoie la version minimale autorisée. Pour forcer une mise à jour, modifier `MIN_VERSION_ANDROID` puis la redéployer, **uniquement après** que la nouvelle version est réellement disponible sur le Play Store.

### Mise à jour automatique Google Play

Au lancement, `forcePlayStoreUpdate` (`src/services/versionCheckService.ts`) demande à Google Play s'il existe une version plus récente pour l'appareil. Si oui, la mise à jour immédiate de Google s'affiche ; en cas de refus, l'écran bloquant prend le relais. Elle repose sur la librairie `sp-react-native-in-app-updates` et ne se déclenche que pour une app installée depuis le Play Store.

Cette librairie importe `react-native-device-info`, dont le module natif n'est **pas** lié à l'app (dépendance indirecte, non autolinkée) : l'importer ferait planter l'app au démarrage. `metro.config.js` le remplace donc par `src/stubs/deviceInfoStub.js`, qui renvoie simplement la version de `package.json`. Ne pas retirer ce remplacement.

### Points d'attention pour le build et la publication

- **Plugin Kotlin** : `android/build.gradle` fixe `kotlin-gradle-plugin:2.3.0`. Nécessaire, car le SDK Google Ads est compilé avec les métadonnées Kotlin 2.3 ; sans cela, la librairie des publicités ne compile pas.
- **Copie `C:\HV`** : ne pas exclure les dossiers nommés `web` dans robocopy (cela retirerait `node_modules/react-native-device-info/src/web`), et ne pas écrire de BOM dans les fichiers `.gradle`.
- **Code de version** : chaque envoi sur la Play Console exige un `versionCode` jamais utilisé, tous canaux confondus.
- **Tester avant la production** : toute nouvelle librairie native se teste d'abord sur les Tests internes (ou en installant l'APK de release avec `adb install`). Un plantage au démarrage sur le Play Store est refusé par Google (règle « fonctionnalités défectueuses »).
- **Artefacts actifs** : un ancien AAB resté dans un canal (Tests internes, Tests fermés – Alpha), même suspendu, compte pour certaines vérifications de la Play Console (par exemple la permission `AD_ID`). Envoyer le nouvel AAB dans ces canaux aussi.
- **Envoi en examen** : les changements restent en brouillon tant que « Envoyer N modifications pour examen » n'est pas cliqué sur la Vue d'ensemble de la publication.

## Structure du projet

```
src/
  screens/      Écrans (connexion, accueil, génération, histoire, bibliothèque, recharge, mise à jour requise...)
  services/     Accès Supabase, IA, voix, notifications, avis, version, rapports d'erreur
  components/   Composants partagés (publicité, modales, icônes, fond animé...)
  config/       Voix TTS, publicités, configuration générale
  stubs/        Modules JavaScript de remplacement (voir « Mise à jour automatique Google Play »)
  i18n/         Traductions (10 langues)
  utils/        Construction du prompt, calcul du nombre de mots
supabase/
  functions/    Edge Functions
  migrations/   Schéma de la base
store-listing/  Fiche Play Store optimisée (titre, descriptions) dans les 10 langues
web/            Site web
scripts/        Sauvegarde Supabase
```
