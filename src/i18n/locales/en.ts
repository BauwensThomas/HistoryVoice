export default {
  // App
  app_name: 'Story Generator',
  app_name_titre: 'History Voice',
  sous_titre: 'Set up your next adventure',

  // Sections
  titre_auditeur: 'THE LISTENER',
  titre_histoire: 'THE STORY',

  // Hints / Labels
  hint_age: 'Age',
  hint_sexe: 'Gender',
  hint_genre: 'Genre',
  hint_duree: 'Duration',
  hint_moment: 'Moment',
  hint_langue: 'Language',
  hint_voix: 'Voice',
  hint_details: 'Magic details (e.g. A blue rabbit...)',

  // Boutons
  btn_creer: 'CREATE MAGIC',
  btn_raconter_encore: 'TELL AGAIN',
  btn_ecouter: 'LISTEN TO STORY',
  btn_pause: 'PAUSE',
  btn_reprendre: 'RESUME',
  btn_entrer_atelier: 'ENTER THE WORKSHOP',
  btn_google_login: 'Sign in with Google',
  btn_deconnexion: 'Logout',
  btn_calibration: 'Calibration',
  btn_recharger: 'Top Up',

  // Recharge
  recharge_title: 'Top Up Credits',
  recharge_subtitle: 'Choose a pack to keep creating stories',
  recharge_back: 'Back',
  recharge_pack_starter: 'Starter',
  recharge_pack_standard: 'Standard',
  recharge_pack_premium: 'Premium',
  recharge_price_starter: '€4.99',
  recharge_price_standard: '€9.99',
  recharge_price_premium: '€19.99',
  recharge_minutes: 'minutes',
  recharge_popular: 'POPULAR',
  recharge_buy: 'Buy',
  recharge_info: 'Credits are added instantly after payment. Purchases are managed by Google Play.',
  recharge_premium_included: 'Premium: {{days}} ad-free days · 20-story library',
  recharge_success_title: 'Thank you!',
  recharge_success_message: 'Your credits have been added successfully.',
  recharge_error_title: 'Error',
  recharge_error_unavailable: 'This pack is not available at the moment.',
  recharge_error_purchase: 'An error occurred during the purchase. Please try again.',

  // Library
  library_title: 'Library',
  library_count: '{{count}}/{{limit}} saved stories',
  library_empty: 'No saved stories yet. Generate a story and tap "Save" to find it here.',
  library_save: 'Save',
  library_saved: 'Saved ✓',
  library_delete_title: 'Delete this story?',
  library_delete_confirm: 'This action cannot be undone.',
  library_delete: 'Delete',
  library_limit_title: 'Library full',
  library_limit_message: 'You\'ve reached the limit of 3 saved stories. Go premium to save up to 20.',
  library_limit_cta: 'See premium',
  library_limit_message_premium: 'You\'ve reached the limit of 20 saved stories. Delete one to add a new one.',
  library_limit_cta_premium: 'See my library',
  library_premium_promo: 'Go premium to save up to 20 stories (instead of 3).',

  // Bedtime reminder
  notif_section_title: 'Bedtime reminder',
  notif_heure_label: 'Time',
  notif_titre: '🌙 Story time',
  notif_message: 'Time to create a new bedtime story!',
  notif_message_sans_credits: 'Buy credits to keep creating your bedtime stories!',
  notif_permission_refusee: 'You need to allow notifications in your phone settings to enable this reminder.',

  // Mandatory update
  update_required_title: 'Update available',
  update_required_message: 'A new version of History Voice is available. Please update the app to continue.',
  update_required_cta: 'Update',

  // Messages
  msg_histoire_prete: 'The story is ready!',
  msg_erreur_audio: 'Audio error',
  msg_erreur_generale: 'An error occurred during input.',
  msg_credits_insuffisants:
    'Insufficient balance ({{minutes}} min. remaining). Please top up your account.',
  msg_generation_en_cours: 'Generating...',

  // Home
  home_description:
    'Open the gateway to a world where every whisper becomes an epic. Tailor-made tales that turn your days into adventures and your nights into infinite journeys through dreamland.',
  copyright_text: '© Copyright {{year}}',
  contact_text: 'Contact me',
  email_subject: 'Question about History Voice',

  // Privacy
  website_link: 'Website',
  privacy_link: 'Privacy Policy',
  privacy_back: 'Back',
  privacy_title: 'Privacy Policy',
  privacy_last_updated: 'Last updated: February 24, 2026',
  privacy_sections: [
    {
      title: '1. Introduction',
      content: 'BelgaCai publishes History Voice, a personalised story generator for children and adults. This policy explains what data we collect, how we use it, and what your rights are.',
    },
    {
      title: '2. Data Collected',
      content: "We collect the following data:\n- Email address (via Google Sign-In)\n- Credit balance (remaining generation time)\n\nWe do NOT collect:\n- Content of generated stories\n- Generation parameters (age, genre, etc.)\n- Location data\n- Contacts or photos",
    },
    {
      title: '3. Use of Data',
      content: 'Your data is used solely to:\n- Authenticate and manage your account\n- Track your credit balance\n- Generate stories based on your parameters\n- Process your credit purchases',
    },
    {
      title: '4. Third-Party Services',
      content: 'The application uses specialised third-party services for:\n- User authentication\n- Voice generation of stories\n- AI text generation\n- In-app purchase management\n- Secure data storage\n\nThese providers process your data strictly within the scope of their services and each has their own privacy policy.',
    },
    {
      title: '5. Storage and Security',
      content: 'Your data is stored securely on servers hosted in Europe. Communications are encrypted via HTTPS. We do not sell or share your personal data with third parties for commercial purposes.',
    },
    {
      title: '6. Your Rights',
      content: 'Under the GDPR, you can:\n- Access your personal data\n- Request correction of your data\n- Request deletion of your account and data',
    },
    {
      title: '7. Family Audience',
      content: 'History Voice is intended for family use. Children must use the application under the supervision of a parent or guardian. We do not knowingly collect personal data from children under 13 without parental consent.',
    },
    {
      title: '8. Contact',
      content: 'For any questions about this privacy policy:\n\nBelgaCai\nEmail: historyvoice@belgacai.com',
    },
  ],

  // Review
  review_title: 'Enjoying History Voice?',
  review_message: 'Leave us a review on the Play Store, it helps a lot!',
  review_yes: '⭐ Leave a review',
  review_later: 'Later',

  // Login
  login_title: 'Welcome to the Workshop',
  error_google_login: 'Google Sign-in failed',

  // Dropdowns
  ages: ['2-4 years', '5-7 years', '8-11 years', '12-15 years', '16-20 years', '20+ years'],
  sexes: ['Boy', 'Girl'],
  langues: ['French', 'English', 'Italian', 'Spanish', 'Portuguese (BR)', 'Dutch', 'German', 'Arabic', 'Turkish', 'Polish'],
  durees: ['1 min', '2 min', '3 min', '4 min'],
  moments: ['Daytime Story', 'Nighttime Story'],
  genres: ['Adventure', 'Fantasy', 'Animals', 'Prince / Princess', 'Science fiction', 'Comedy'],
  voix: ['Woman', 'Man'],
};
