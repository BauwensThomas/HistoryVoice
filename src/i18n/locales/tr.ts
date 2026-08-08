export default {
  // App
  app_name: 'Hikaye Üreticisi',
  app_name_titre: 'History Voice',
  sous_titre: 'Bir sonraki maceranı yapılandır',

  // Sections
  titre_auditeur: 'DİNLEYİCİ',
  titre_histoire: 'HİKAYE',

  // Hints / Labels
  hint_age: 'Yaş',
  hint_sexe: 'Cinsiyet',
  hint_genre: 'Tür',
  hint_duree: 'Süre',
  hint_moment: 'An',
  hint_langue: 'Dil',
  hint_voix: 'Ses',
  hint_details: 'Sihirli detaylar (örn: Mavi bir tavşan...)',

  // Boutons
  btn_creer: 'SİHİR YARAT',
  btn_raconter_encore: 'YENİDEN ANLAT',
  btn_ecouter: 'HİKAYEYİ DİNLE',
  btn_pause: 'DURAKLAT',
  btn_reprendre: 'DEVAM ET',
  btn_entrer_atelier: 'ATÖLYEYE GİR',
  btn_google_login: 'Google ile giriş yap',
  btn_deconnexion: 'Çıkış yap',
  btn_calibration: 'Kalibrasyon',
  btn_recharger: 'Şarj et',

  // Recharge
  recharge_title: 'Kredilerinizi şarj edin',
  recharge_subtitle: 'Hikaye oluşturmaya devam etmek için bir paket seçin',
  recharge_back: 'Geri',
  recharge_pack_starter: 'Başlangıç',
  recharge_pack_standard: 'Standart',
  recharge_pack_premium: 'Premium',
  recharge_price_starter: '4,99 €',
  recharge_price_standard: '9,99 €',
  recharge_price_premium: '19,99 €',
  recharge_minutes: 'dakika',
  recharge_popular: 'POPÜLER',
  recharge_buy: 'Satın al',
  recharge_info: 'Krediler ödeme sonrasında anında eklenir. Satın almalar Google Play tarafından yönetilir.',
  recharge_premium_included: 'Premium: {{days}} gün reklamsız · 20 hikayelik kitaplık',
  recharge_success_title: 'Teşekkürler!',
  recharge_success_message: 'Kredileriniz başarıyla eklendi.',
  recharge_error_title: 'Hata',
  recharge_error_unavailable: 'Bu paket şu an mevcut değil.',
  recharge_error_purchase: 'Satın alma sırasında bir hata oluştu. Lütfen tekrar deneyin.',

  // Kitaplık
  library_title: 'Kitaplık',
  library_count: '{{count}}/{{limit}} kaydedilen hikaye',
  library_empty: 'Henüz kaydedilmiş hikaye yok. Bir hikaye oluşturun ve burada bulmak için "Kaydet"e dokunun.',
  library_save: 'Kaydet',
  library_saved: 'Kaydedildi ✓',
  library_delete_title: 'Bu hikaye silinsin mi?',
  library_delete_confirm: 'Bu işlem geri alınamaz.',
  library_delete: 'Sil',
  library_limit_title: 'Kitaplık dolu',
  library_limit_message: '3 kaydedilen hikaye sınırına ulaştınız. 20\'ye kadar kaydetmek için premium olun.',
  library_limit_cta: 'Premium\'u gör',
  library_limit_message_premium: '20 kaydedilen hikaye sınırına ulaştınız. Yeni bir tane eklemek için birini silin.',
  library_limit_cta_premium: 'Kitaplığımı gör',
  library_premium_promo: '20\'ye kadar hikaye kaydetmek için premium olun (3 yerine).',

  // Hikaye hatırlatıcısı
  notif_section_title: 'Hikaye hatırlatıcısı',
  notif_heure_label: 'Saat',
  notif_titre: '🌙 Hikaye zamanı',
  notif_message: 'Yeni bir uyku hikayesi oluşturma zamanı!',
  notif_message_sans_credits: 'Hikayelerinize devam etmek için kredi satın alın!',
  notif_permission_refusee: 'Bu hatırlatıcıyı etkinleştirmek için telefon ayarlarınızdan bildirimlere izin vermeniz gerekir.',

  // Messages
  msg_histoire_prete: 'Hikaye hazır!',
  msg_erreur_audio: 'Ses hatası',
  msg_erreur_generale: 'Bir hata oluştu.',
  msg_credits_insuffisants:
    'Yetersiz bakiye ({{minutes}} dak. kaldı). Lütfen hesabınızı şarj edin.',
  msg_generation_en_cours: 'Oluşturuluyor...',

  // Home
  home_description:
    'Her fısıltının bir destana dönüştüğü bir dünyanın kapısını aralayın. Günlerinizi maceraya, gecelerinizi sonsuz rüya yolculuklarına dönüştüren özel hikayeler.',
  copyright_text: '© Copyright {{year}}',
  contact_text: 'Bize ulaşın',
  email_subject: 'History Voice hakkında soru',

  // Privacy
  website_link: 'Web sitesi',
  privacy_link: 'Gizlilik politikası',
  privacy_back: 'Geri',
  privacy_title: 'Gizlilik Politikası',
  privacy_last_updated: 'Son güncelleme: 24 Şubat 2026',
  privacy_sections: [
    {
      title: '1. Giriş',
      content: 'BelgaCai, çocuklar ve yetişkinler için kişiselleştirilmiş bir hikaye üreticisi olan History Voice uygulamasını yayınlamaktadır. Bu politika, hangi verileri topladığımızı, nasıl kullandığımızı ve haklarınızın neler olduğunu açıklar.',
    },
    {
      title: '2. Toplanan Veriler',
      content: 'Aşağıdaki verileri topluyoruz:\n- E-posta adresi (Google girişi aracılığıyla)\n- Kredi bakiyesi (kalan üretim süresi)\n\nToplamadıklarımız:\n- Oluşturulan hikayelerin içeriği\n- Üretim parametreleri (yaş, tür vb.)\n- Konum\n- Kişiler veya fotoğraflar',
    },
    {
      title: '3. Veri Kullanımı',
      content: 'Verileriniz yalnızca şunlar için kullanılır:\n- Kimlik doğrulama ve hesap yönetimi\n- Kredi bakiyenizin takibi\n- Parametrelerinize göre hikaye üretimi\n- Kredi satın alma işlemlerinizin işlenmesi',
    },
    {
      title: '4. Üçüncü Taraf Hizmetler',
      content: 'Uygulama, aşağıdaki amaçlar için uzmanlaşmış üçüncü taraf hizmetler kullanmaktadır:\n- Kullanıcı kimlik doğrulama\n- Hikayelerin sesli üretimi\n- Yapay zeka ile metin üretimi\n- Uygulama içi satın alma yönetimi\n- Güvenli veri depolama\n\nBu sağlayıcılar verilerinizi yalnızca görevleri kapsamında işler ve her birinin kendi gizlilik politikası bulunmaktadır.',
    },
    {
      title: '5. Depolama ve Güvenlik',
      content: "Verileriniz Avrupa'da barındırılan sunucularda güvenli bir şekilde saklanmaktadır. İletişimler HTTPS üzerinden şifrelenmektedir. Kişisel verilerinizi ticari amaçlarla üçüncü taraflara satmıyor veya paylaşmıyoruz.",
    },
    {
      title: '6. Haklarınız',
      content: 'GDPR kapsamında şunları yapabilirsiniz:\n- Kişisel verilerinize erişim\n- Verilerinizin düzeltilmesini talep etme\n- Hesabınızın ve verilerinizin silinmesini talep etme',
    },
    {
      title: '7. Aile Kitlesi',
      content: 'History Voice aile kullanımı için tasarlanmıştır. Çocuklar uygulamayı bir ebeveyn veya vasi gözetiminde kullanmalıdır. 13 yaşın altındaki çocuklardan ebeveyn izni olmaksızın bilerek kişisel veri toplamıyoruz.',
    },
    {
      title: '8. İletişim',
      content: 'Bu gizlilik politikasıyla ilgili sorularınız için:\n\nBelgaCai\nE-posta: historyvoice@belgacai.com',
    },
  ],

  // Review
  review_title: "History Voice'i beğeniyor musunuz?",
  review_message: 'Play Store\'da bize bir değerlendirme bırakın, bu bize çok yardımcı olur!',
  review_yes: '⭐ Değerlendirme yap',
  review_later: 'Daha sonra',

  // Login
  login_title: 'Atölyeye Giriş',
  error_google_login: 'Google girişi başarısız',

  // Dropdowns
  ages: ['2-4 yaş', '5-7 yaş', '8-11 yaş', '12-15 yaş', '16-20 yaş', '20+ yaş'],
  sexes: ['Erkek', 'Kız'],
  langues: ['Fransızca', 'İngilizce', 'İtalyanca', 'İspanyolca', 'Portekizce (BR)', 'Hollandaca', 'Almanca', 'Arapça', 'Türkçe', 'Lehçe'],
  durees: ['1 dak', '2 dak', '3 dak', '4 dak'],
  moments: ['Gündüz hikayesi', 'Gece hikayesi'],
  genres: ['Macera', 'Fantezi', 'Hayvanlar', 'Prens / Prenses', 'Bilim kurgu', 'Korku', 'Dedektif', 'Komedi'],
  voix: ['Kadın', 'Erkek'],
};
