export default {
  // App
  app_name: 'Geschichten-Generator',
  app_name_titre: 'History Voice',
  sous_titre: 'Konfiguriere dein nächstes Abenteuer',

  // Sections
  titre_auditeur: 'DER ZUHÖRER',
  titre_histoire: 'DIE GESCHICHTE',

  // Hints / Labels
  hint_age: 'Alter',
  hint_sexe: 'Geschlecht',
  hint_genre: 'Genre',
  hint_duree: 'Dauer',
  hint_moment: 'Moment',
  hint_langue: 'Sprache',
  hint_voix: 'Stimme',
  hint_details: 'Magische Details (z.B. Ein blauer Hase...)',

  // Boutons
  btn_creer: 'MAGIE ERSCHAFFEN',
  btn_raconter_encore: 'NOCHMAL ERZÄHLEN',
  btn_ecouter: 'GESCHICHTE ANHÖREN',
  btn_pause: 'PAUSE',
  btn_reprendre: 'FORTSETZEN',
  btn_entrer_atelier: 'ATELIER BETRETEN',
  btn_google_login: 'Mit Google anmelden',
  btn_deconnexion: 'Abmelden',
  btn_calibration: 'Kalibrierung',
  btn_recharger: 'Aufladen',

  // Recharge
  recharge_title: 'Credits aufladen',
  recharge_subtitle: 'Wähle ein Paket, um weiter Geschichten zu erstellen',
  recharge_back: 'Zurück',
  recharge_pack_starter: 'Starter',
  recharge_pack_standard: 'Standard',
  recharge_pack_premium: 'Premium',
  recharge_price_starter: '4,99 €',
  recharge_price_standard: '9,99 €',
  recharge_price_premium: '19,99 €',
  recharge_minutes: 'Minuten',
  recharge_popular: 'BELIEBT',
  recharge_buy: 'Kaufen',
  recharge_info: 'Credits werden sofort nach der Zahlung hinzugefügt. Käufe werden über Google Play abgewickelt.',
  recharge_premium_included: 'Premium: {{days}} Tage werbefrei · Bibliothek für 20 Geschichten',
  recharge_success_title: 'Danke!',
  recharge_success_message: 'Deine Credits wurden erfolgreich hinzugefügt.',
  recharge_error_title: 'Fehler',
  recharge_error_unavailable: 'Dieses Paket ist momentan nicht verfügbar.',
  recharge_error_purchase: 'Beim Kauf ist ein Fehler aufgetreten. Bitte versuche es erneut.',

  // Bibliothek
  library_title: 'Bibliothek',
  library_count: '{{count}}/{{limit}} gespeicherte Geschichten',
  library_empty: 'Noch keine gespeicherten Geschichten. Generiere eine Geschichte und tippe auf "Speichern", um sie hier wiederzufinden.',
  library_save: 'Speichern',
  library_saved: 'Gespeichert ✓',
  library_delete_title: 'Diese Geschichte löschen?',
  library_delete_confirm: 'Diese Aktion kann nicht rückgängig gemacht werden.',
  library_delete: 'Löschen',
  library_limit_title: 'Bibliothek voll',
  library_limit_message: 'Du hast das Limit von 3 gespeicherten Geschichten erreicht. Werde Premium, um bis zu 20 zu speichern.',
  library_limit_cta: 'Premium ansehen',
  library_limit_message_premium: 'Du hast das Limit von 20 gespeicherten Geschichten erreicht. Lösche eine, um eine neue hinzuzufügen.',
  library_limit_cta_premium: 'Meine Bibliothek ansehen',
  library_premium_promo: 'Werde Premium, um bis zu 20 Geschichten zu speichern (statt 3).',

  // Erinnerung Gute-Nacht-Geschichte
  notif_section_title: 'Erinnerung Gute-Nacht-Geschichte',
  notif_heure_label: 'Uhrzeit',
  notif_titre: '🌙 Geschichtenzeit',
  notif_message: 'Zeit für eine neue Gute-Nacht-Geschichte!',
  notif_message_sans_credits: 'Kaufe Credits, um deine Geschichten fortzusetzen!',
  notif_permission_refusee: 'Du musst Benachrichtigungen in den Telefoneinstellungen erlauben, um diese Erinnerung zu aktivieren.',

  // Messages
  msg_histoire_prete: 'Die Geschichte ist fertig!',
  msg_erreur_audio: 'Audio-Fehler',
  msg_erreur_generale: 'Ein Fehler ist aufgetreten.',
  msg_credits_insuffisants:
    'Unzureichendes Guthaben ({{minutes}} Min. verbleibend). Bitte lade dein Konto auf.',
  msg_generation_en_cours: 'Wird generiert...',

  // Home
  home_description:
    'Öffne das Portal zu einer Welt, in der jedes Flüstern zu einem Epos wird. Maßgeschneiderte Geschichten, die deine Tage in Abenteuer und deine Nächte in unendliche Traumreisen verwandeln.',
  copyright_text: '© Copyright {{year}}',
  contact_text: 'Kontaktiere mich',
  email_subject: 'Frage zu History Voice',

  // Privacy
  website_link: 'Website',
  privacy_link: 'Datenschutzrichtlinie',
  privacy_back: 'Zurück',
  privacy_title: 'Datenschutzrichtlinie',
  privacy_last_updated: 'Zuletzt aktualisiert: 24. Februar 2026',
  privacy_sections: [
    {
      title: '1. Einführung',
      content: 'BelgaCai gibt die App History Voice heraus, einen personalisierten Geschichten-Generator für Kinder und Erwachsene. Diese Richtlinie erklärt, welche Daten wir erheben, wie wir sie verwenden und welche Rechte Sie haben.',
    },
    {
      title: '2. Erhobene Daten',
      content: 'Wir erheben folgende Daten:\n- E-Mail-Adresse (über Google-Anmeldung)\n- Credits-Guthaben (verbleibende Generierungszeit)\n\nWir erheben NICHT:\n- Den Inhalt generierter Geschichten\n- Generierungsparameter (Alter, Genre usw.)\n- Standort\n- Kontakte oder Fotos',
    },
    {
      title: '3. Datennutzung',
      content: 'Ihre Daten werden ausschließlich verwendet für:\n- Ihre Authentifizierung und Kontoverwaltung\n- Verfolgung Ihres Credits-Guthabens\n- Generierung von Geschichten nach Ihren Parametern\n- Verarbeitung Ihrer Credit-Käufe',
    },
    {
      title: '4. Drittanbieter-Dienste',
      content: 'Die App nutzt spezialisierte Drittanbieter-Dienste für:\n- Die Benutzerauthentifizierung\n- Die Sprachgenerierung der Geschichten\n- Die Textgenerierung durch künstliche Intelligenz\n- Die Verwaltung von In-App-Käufen\n- Die sichere Datenspeicherung\n\nDiese Dienstleister verarbeiten Ihre Daten ausschließlich im Rahmen ihrer Aufgaben und verfügen jeweils über eine eigene Datenschutzrichtlinie.',
    },
    {
      title: '5. Speicherung und Sicherheit',
      content: 'Ihre Daten werden sicher auf Servern gespeichert, die in Europa gehostet werden. Die Kommunikation ist über HTTPS verschlüsselt. Wir verkaufen oder teilen Ihre personenbezogenen Daten nicht mit Dritten zu kommerziellen Zwecken.',
    },
    {
      title: '6. Ihre Rechte',
      content: 'Gemäß DSGVO können Sie:\n- Auf Ihre personenbezogenen Daten zugreifen\n- Die Korrektur Ihrer Daten verlangen\n- Die Löschung Ihres Kontos und Ihrer Daten verlangen',
    },
    {
      title: '7. Familienpublikum',
      content: 'History Voice ist für den Familiengebrauch bestimmt. Kinder sollten die App unter Aufsicht eines Elternteils oder Erziehungsberechtigten verwenden. Wir erheben nicht wissentlich personenbezogene Daten von Kindern unter 13 Jahren ohne elterliche Zustimmung.',
    },
    {
      title: '8. Kontakt',
      content: 'Bei Fragen zu dieser Datenschutzrichtlinie:\n\nBelgaCai\nE-Mail: historyvoice@belgacai.com',
    },
  ],

  // Review
  review_title: 'Gefällt dir History Voice?',
  review_message: 'Hinterlasse uns eine Bewertung im Play Store, das hilft uns sehr!',
  review_yes: '⭐ Bewertung abgeben',
  review_later: 'Später',

  // Login
  login_title: 'Atelier-Anmeldung',
  error_google_login: 'Google-Anmeldung fehlgeschlagen',

  // Dropdowns
  ages: ['2-4 Jahre', '5-7 Jahre', '8-11 Jahre', '12-15 Jahre', '16-20 Jahre', '20+ Jahre'],
  sexes: ['Junge', 'Mädchen'],
  langues: ['Französisch', 'Englisch', 'Italienisch', 'Spanisch', 'Portugiesisch (BR)', 'Niederländisch', 'Deutsch', 'Arabisch', 'Türkisch', 'Polnisch'],
  durees: ['1 Min', '2 Min', '3 Min', '4 Min'],
  moments: ['Tagesgeschichte', 'Nachtgeschichte'],
  genres: ['Abenteuer', 'Fantasy', 'Tiere', 'Prinz / Prinzessin', 'Science-Fiction', 'Horror', 'Krimi', 'Komödie'],
  voix: ['Frau', 'Mann'],
};
