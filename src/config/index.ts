// Configuration de l'application
// Les clés API sensibles (Groq, Google TTS) sont stockées dans la table Supabase `ia`
// et accessibles uniquement via les Edge Functions côté serveur.
export const Config = {
  SUPABASE_URL: 'https://dqxaxgvncoxgwfzumvfg.supabase.co',
  SUPABASE_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxeGF4Z3ZuY294Z3dmenVtdmZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjA1MDksImV4cCI6MjA4NjAzNjUwOX0.HuicCQPb7ekYOJspvoIbrliN4w9c2OMGTOj63rlZ7h0',
  CONTACT_EMAIL: 'historyvoice@belgacai.com',
  WEBSITE_URL: 'https://history-voice.belgacai.com',
  PRIVACY_URL: 'https://history-voice.belgacai.com/policy.html',
  DELETE_ACCOUNT_URL: 'https://history-voice.belgacai.com/delete-account.html',
};
