export default {
  // App
  app_name: "Générateur d'Histoires",
  app_name_titre: "History Voice",
  sous_titre: 'Configurez votre prochaine aventure',

  // Sections
  titre_auditeur: "L'AUDITEUR",
  titre_histoire: "L'HISTOIRE",

  // Hints / Labels
  hint_age: 'Âge',
  hint_sexe: 'Sexe',
  hint_genre: 'Genre',
  hint_duree: 'Durée',
  hint_moment: 'Moment',
  hint_langue: 'Langue',
  hint_voix: 'Voix',
  hint_details: 'Détails magiques (ex: Un lapin bleu...)',

  // Boutons
  btn_creer: 'CRÉER LA MAGIE',
  btn_raconter_encore: 'RACONTER À NOUVEAU',
  btn_ecouter: "ÉCOUTER L'HISTOIRE",
  btn_pause: 'PAUSE',
  btn_reprendre: 'REPRENDRE',
  btn_entrer_atelier: "ENTRER DANS L'ATELIER",
  btn_google_login: 'Se connecter avec Google',
  btn_deconnexion: 'Déconnexion',
  btn_calibration: 'Calibration',
  btn_recharger: 'Recharger',

  // Recharge
  recharge_title: 'Recharger vos crédits',
  recharge_subtitle: 'Choisissez un pack pour continuer à créer des histoires',
  recharge_back: 'Retour',
  recharge_pack_starter: 'Starter',
  recharge_pack_standard: 'Standard',
  recharge_pack_premium: 'Premium',
  recharge_price_starter: '4,99 €',
  recharge_price_standard: '9,99 €',
  recharge_price_premium: '19,99 €',
  recharge_minutes: 'minutes',
  recharge_popular: 'POPULAIRE',
  recharge_buy: 'Acheter',
  recharge_info: 'Les crédits sont ajoutés instantanément après le paiement. Les achats sont gérés par Google Play.',
  recharge_premium_included: 'Premium : {{days}} jours sans pub · 20 histoires en bibliothèque',
  recharge_success_title: 'Merci !',
  recharge_success_message: 'Vos crédits ont été ajoutés avec succès.',
  recharge_error_title: 'Erreur',
  recharge_error_unavailable: 'Ce pack n\'est pas disponible pour le moment.',
  recharge_error_purchase: 'Une erreur est survenue lors de l\'achat. Veuillez réessayer.',

  // Bibliothèque
  library_title: 'Bibliothèque',
  library_count: '{{count}}/{{limit}} histoires sauvegardées',
  library_empty: 'Aucune histoire sauvegardée pour l\'instant. Générez une histoire et appuyez sur "Sauvegarder" pour la retrouver ici.',
  library_save: 'Sauvegarder',
  library_saved: 'Sauvegardée ✓',
  library_delete_title: 'Supprimer cette histoire ?',
  library_delete_confirm: 'Cette action est définitive.',
  library_delete: 'Supprimer',
  library_limit_title: 'Bibliothèque pleine',
  library_limit_message: "Vous avez atteint la limite de 3 histoires sauvegardées. Passez premium pour en sauvegarder jusqu'à 20.",
  library_limit_cta: 'Voir premium',
  library_limit_message_premium: 'Vous avez atteint la limite de 20 histoires sauvegardées. Supprimez-en une pour en ajouter une nouvelle.',
  library_limit_cta_premium: 'Voir ma bibliothèque',
  library_premium_promo: "Passez premium pour sauvegarder jusqu'à 20 histoires (au lieu de 3).",

  // Rappel du soir
  notif_section_title: 'Rappel du soir',
  notif_heure_label: 'Heure',
  notif_titre: "🌙 L'heure de l'histoire",
  notif_message: "C'est le moment de créer une nouvelle histoire du soir !",
  notif_message_sans_credits: 'Achetez des crédits pour continuer vos histoires du soir !',
  notif_permission_refusee: 'Vous devez autoriser les notifications dans les paramètres de votre téléphone pour activer ce rappel.',

  // Messages
  msg_histoire_prete: "L'histoire est prête !",
  msg_erreur_audio: 'Erreur audio',
  msg_erreur_generale: 'Une erreur est survenue lors de la saisie.',
  msg_credits_insuffisants:
    'Solde insuffisant ({{minutes}} min. restantes). Veuillez recharger votre compte.',
  msg_generation_en_cours: 'Génération en cours...',

  // Home
  home_description:
    "Ouvrez le portail d'un monde où chaque murmure devient une épopée. Des contes sur mesure qui transforment vos journées en aventures et vos nuits en voyages infinis au pays des rêves.",
  copyright_text: '© Copyright {{year}}',
  contact_text: 'Contactez-moi',
  email_subject: "Question sur History Voice",

  // Privacy
  website_link: 'Site web',
  privacy_link: 'Politique de confidentialité',
  privacy_back: 'Retour',
  privacy_title: 'Politique de confidentialité',
  privacy_last_updated: 'Dernière mise à jour : 24 février 2026',
  privacy_sections: [
    {
      title: '1. Introduction',
      content: "BelgaCai édite l'application History Voice, un générateur d'histoires personnalisées pour enfants et adultes. Cette politique explique quelles données nous collectons, comment nous les utilisons et quels sont vos droits.",
    },
    {
      title: '2. Données collectées',
      content: "Nous collectons les données suivantes :\n- Adresse email (via la connexion Google)\n- Solde de crédits (temps de génération restant)\n\nNous ne collectons PAS :\n- Le contenu des histoires générées\n- Les paramètres de génération (âge, genre, etc.)\n- La localisation\n- Les contacts ou photos",
    },
    {
      title: '3. Utilisation des données',
      content: "Vos données sont utilisées uniquement pour :\n- Vous authentifier et gérer votre compte\n- Suivre votre solde de crédits\n- Générer des histoires selon vos paramètres\n- Traiter vos achats de crédits",
    },
    {
      title: '4. Services tiers',
      content: "L'application fait appel à des services tiers spécialisés pour :\n- L'authentification des utilisateurs\n- La génération vocale des histoires\n- La génération de texte par intelligence artificielle\n- La gestion des achats intégrés\n- Le stockage sécurisé des données\n\nCes prestataires traitent vos données dans le strict cadre de leurs missions et disposent chacun de leur propre politique de confidentialité.",
    },
    {
      title: '5. Stockage et sécurité',
      content: "Vos données sont stockées de manière sécurisée sur des serveurs hébergés en Europe. Les communications sont chiffrées via HTTPS. Nous ne vendons ni ne partageons vos données personnelles avec des tiers à des fins commerciales.",
    },
    {
      title: '6. Vos droits',
      content: "Conformément au RGPD, vous pouvez :\n- Accéder à vos données personnelles\n- Demander la correction de vos données\n- Demander la suppression de votre compte et de vos données",
    },
    {
      title: '7. Public familial',
      content: "History Voice est destiné à un usage familial. Les enfants doivent utiliser l'application sous la supervision d'un parent ou tuteur. Nous ne collectons pas sciemment de données personnelles d'enfants de moins de 13 ans sans le consentement parental.",
    },
    {
      title: '8. Contact',
      content: "Pour toute question relative à cette politique de confidentialité :\n\nBelgaCai\nEmail : historyvoice@belgacai.com",
    },
  ],

  // Review
  review_title: 'Vous aimez History Voice ?',
  review_message: 'Laissez-nous un avis sur le Play Store, cela nous aide beaucoup !',
  review_yes: '⭐ Donner un avis',
  review_later: 'Plus tard',

  // Login
  login_title: "Connexion à l'Atelier",
  error_google_login: 'Échec de la connexion Google',

  // Dropdowns
  ages: ['2-4 ans', '5-7 ans', '8-11 ans', '12-15 ans', '16-20 ans', '+ de 20 ans'],
  sexes: ['Garçon', 'Fille'],
  langues: ['Français', 'Anglais', 'Italien', 'Espagnol', 'Portugais (BR)', 'Néerlandais', 'Allemand', 'Arabe', 'Turc', 'Polonais'],
  durees: ['1 min', '2 min', '3 min', '4 min'],
  moments: ['Histoire de jour', 'Histoire de nuit'],
  genres: ['Aventure', 'Fantastique', 'Animaux', 'Prince / Princesse', 'Science fiction', 'Horreur', 'Policier', 'Comédie'],
  voix: ['Femme', 'Homme'],
};
