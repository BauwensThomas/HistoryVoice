#!/usr/bin/env python3
"""
HistoryVoice — Script de calibration local
Appelle Groq et Google TTS directement (sans Supabase).
Génère les tables de mots cible par langue/âge/durée.

Prérequis :
    pip install requests mutagen

Configuration :
    Copie .env.example vers .env et renseigne tes clés.

Utilisation :
    python calibration.py
"""

import json
import time
import base64
import os
import tempfile
import statistics
import requests
from mutagen.mp3 import MP3


def _load_dotenv(path=".env"):
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())


_load_dotenv()

# ══════════════════════════════════════════════════════════════
# CONFIGURATION — clés lues depuis .env (voir .env.example)
# ══════════════════════════════════════════════════════════════
GROQ_API_KEY      = os.environ.get("GROQ_API_KEY", "")
CEREBRAS_API_KEY  = os.environ.get("CEREBRAS_API_KEY", "")   # cloud.cerebras.ai → Settings → API Keys
GEMINI_API_KEY    = os.environ.get("GEMINI_API_KEY", "")   # aistudio.google.com → Get API key
GOOGLE_TTS_KEY    = os.environ.get("GOOGLE_TTS_KEY", "")

# Providers IA (ordre de priorité — rotation automatique sur 429)
PROVIDERS = [
    p for p in [
        {
            "name": "Cerebras",
            "url":   "https://api.cerebras.ai/v1/chat/completions",
            "key":   CEREBRAS_API_KEY,
            "model": "llama-3.1-8b",
        } if CEREBRAS_API_KEY else None,
        {
            "name": "Gemini Flash",
            "url":   "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
            "key":   GEMINI_API_KEY,
            "model": "gemini-2.0-flash",
        } if GEMINI_API_KEY else None,
        {
            "name": "Groq",
            "url":   "https://api.groq.com/openai/v1/chat/completions",
            "key":   GROQ_API_KEY,
            "model": "llama-3.1-8b-instant",
        } if GROQ_API_KEY else None,
    ] if p is not None
]

_provider_idx = 0  # index du provider actif

# ══════════════════════════════════════════════════════════════
# DONNÉES DE CALIBRATION (identiques à l'app)
# ══════════════════════════════════════════════════════════════

CALIBRATION_CONFIGS = [
    ("Français",    "fr-FR", "fr-FR-Wavenet-A"),
    ("Anglais",     "en-US", "en-US-Wavenet-F"),
    ("Italien",     "it-IT", "it-IT-Wavenet-A"),
    ("Espagnol",    "es-ES", "es-ES-Wavenet-C"),
    ("Néerlandais", "nl-NL", "nl-NL-Wavenet-A"),
    ("Portugais",   "pt-BR", "pt-BR-Wavenet-A"),
    ("Allemand",    "de-DE", "de-DE-Neural2-C"),
    ("Arabe",       "ar-XA", "ar-XA-Wavenet-A"),
    ("Turc",        "tr-TR", "tr-TR-Wavenet-A"),
    ("Polonais",    "pl-PL", "pl-PL-Wavenet-A"),
]

AGE_IDS = [3, 6, 10, 14, 18, 25]
DUREES  = [1, 2, 3, 4]
NB_CYCLES = 3        # jusqu'à 3 cycles pour la médiane
TOLERANCE = 20       # tolérance élargie pour moins de retries IA
MAX_TENTATIVES = 3   # 3 essais max (au lieu de 5)
SEUIL_PARFAIT = 5    # ±5 secondes = parfait → arrêt anticipé (1 seul cycle)


# ══════════════════════════════════════════════════════════════
# TABLES PAR DÉFAUT (utilisées comme point de départ)
# ══════════════════════════════════════════════════════════════
DEFAULT_TABLES = {
    "fr-FR": [[164,321,493,655],[170,341,502,717],[170,368,546,698],[182,366,591,745],[188,390,585,793],[192,381,578,802]],
    "en-US": [[134,267,383,562],[128,287,429,490],[141,309,457,570],[165,270,444,555],[142,332,470,568],[146,283,484,584]],
    "it-IT": [[120,249,383,497],[137,270,398,512],[131,270,429,567],[136,283,444,560],[153,306,465,628],[141,312,484,634]],
    "es-ES": [[148,289,410,520],[148,302,455,618],[153,297,430,604],[163,306,501,670],[177,359,518,715],[176,356,545,688]],
    "nl-NL": [[159,306,454,633],[162,321,507,692],[171,346,525,697],[184,392,580,748],[200,397,602,781],[185,395,579,806]],
    "pt-BR": [[120,237,374,478],[128,254,377,505],[135,263,389,552],[136,288,421,552],[140,303,433,606],[146,284,447,594]],
    "de-DE": [[155,305,460,620],[162,325,490,665],[168,348,520,690],[178,368,558,730],[185,382,572,768],[190,378,565,790]],
    "ar-XA": [[110,220,340,450],[118,238,358,478],[125,252,378,505],[132,268,400,530],[138,280,418,558],[140,285,425,570]],
    "tr-TR": [[130,258,390,520],[138,275,415,555],[145,292,438,582],[155,312,468,622],[162,326,488,652],[165,332,496,665]],
    "pl-PL": [[148,295,445,595],[155,312,470,628],[162,328,494,660],[172,348,522,698],[180,362,544,728],[182,368,552,740]],
}


# ══════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════

def get_tranche_index(age: int) -> int:
    if age <= 4:  return 0
    if age <= 7:  return 1
    if age <= 11: return 2
    if age <= 15: return 3
    if age <= 20: return 4
    return 5

def calculer_vitesse_lecture(age: int) -> float:
    if age <= 4:  return 0.8
    if age <= 7:  return 0.85
    if age <= 11: return 0.9
    if age <= 15: return 0.95
    return 1.0

def get_mots_cible(tables: dict, langue_id: str, age: int, duree: int) -> int:
    table = tables.get(langue_id)
    if table is None:
        return 150 * duree
    tranche = get_tranche_index(age)
    d_idx   = max(0, min(duree - 1, 3))
    return table[tranche][d_idx]

def median(values: list) -> int:
    s = sorted(values)
    n = len(s)
    mid = n // 2
    if n % 2 == 0:
        return round((s[mid - 1] + s[mid]) / 2)
    return s[mid]

def compter_mots(texte: str) -> int:
    return len(texte.split())

def get_mp3_duration(audio_bytes: bytes) -> float:
    """Retourne la durée du MP3 en secondes."""
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name
    try:
        audio = MP3(tmp_path)
        return audio.info.length
    finally:
        os.unlink(tmp_path)


# ══════════════════════════════════════════════════════════════
# CONSTRUCTION DU PROMPT (identique à construirePromptSimple)
# ══════════════════════════════════════════════════════════════

def construire_prompt(langue_id: str, age: int, nombre_mots: int) -> str:
    if langue_id.startswith("fr"):
        return (f"Écris une histoire complète en français pour un enfant de {age} ans avec environ {nombre_mots} mots. "
                "Commence directement sans titre, sans introduction et sans commentaire. "
                "Sépare chaque paragraphe par une ligne vide. "
                "Règles narratives : (1) Orthographe irréprochable, vocabulaire précis, varié, sans répétitions lexicales. "
                "(2) Cohésion : début, développement et fin liés par un même fil thématique. "
                "(3) Principe de Tchekhov : chaque élément introduit (objet, lieu, personnage) doit jouer un rôle dans la résolution. "
                "(4) Interdiction de réutiliser les mêmes axes narratifs ou formulations. "
                "(5) Dialogues vivants qui révèlent les personnages et font avancer l'intrigue. "
                "(6) Conclusion logique qui découle des événements de l'histoire, pas uniquement du moment de la journée.")
    if langue_id.startswith("pt"):
        return (f"Escreva uma história completa em português brasileiro para uma criança de {age} anos com aproximadamente {nombre_mots} palavras. "
                "Comece diretamente sem título, sem introdução e sem comentário. Separe cada parágrafo com uma linha em branco. "
                "Regras narrativas: (1) Ortografia impecável, vocabulário preciso, variado, sem repetições lexicais. "
                "(2) Coesão: início, desenvolvimento e fim ligados por um mesmo fio temático. "
                "(3) Princípio de Tchekhov: cada elemento introduzido (objeto, lugar, personagem) deve ter um papel na resolução. "
                "(4) Proibido reutilizar os mesmos eixos narrativos ou formulações. "
                "(5) Diálogos vivos que revelam os personagens e fazem avançar a intriga. "
                "(6) Conclusão lógica que decorre dos eventos da história.")
    if langue_id.startswith("it"):
        return (f"Scrivi una storia completa in italiano per un bambino di {age} anni con circa {nombre_mots} parole. "
                "Inizia direttamente senza titolo, senza introduzione e senza commento. Separa ogni paragrafo con una riga vuota. "
                "Regole narrative: (1) Ortografia impeccabile, vocabolario preciso, vario, senza ripetizioni lessicali. "
                "(2) Coesione: inizio, sviluppo e fine legati da un unico filo tematico. "
                "(3) Principio di Cechov: ogni elemento introdotto (oggetto, luogo, personaggio) deve avere un ruolo nella risoluzione. "
                "(4) Vietato riutilizzare gli stessi assi narrativi o formulazioni. "
                "(5) Dialoghi vivaci che rivelano i personaggi e fanno avanzare la trama. "
                "(6) Conclusione logica che scaturisce dagli eventi della storia.")
    if langue_id.startswith("es"):
        return (f"Escribe una historia completa en español para un niño de {age} años con aproximadamente {nombre_mots} palabras. "
                "Comienza directamente sin título, sin introducción y sin comentario. Separa cada párrafo con una línea en blanco. "
                "Reglas narrativas: (1) Ortografía impecable, vocabulario preciso, variado, sin repeticiones léxicas. "
                "(2) Cohesión: inicio, desarrollo y final unidos por un mismo hilo temático. "
                "(3) Principio de Chéjov: cada elemento introducido (objeto, lugar, personaje) debe tener un papel en la resolución. "
                "(4) Prohibido reutilizar los mismos ejes narrativos o formulaciones. "
                "(5) Diálogos vivos que revelan a los personajes y hacen avanzar la trama. "
                "(6) Conclusión lógica que surge de los eventos de la historia.")
    if langue_id.startswith("nl"):
        return (f"Schrijf een compleet verhaal in het Nederlands voor een kind van {age} jaar met ongeveer {nombre_mots} woorden. "
                "Begin direct zonder titel, zonder inleiding en zonder commentaar. Scheid elk alinea met een lege regel. "
                "Vertelregels: (1) Onberispelijke spelling, precies en gevarieerd vocabulaire zonder lexicale herhalingen. "
                "(2) Samenhang: begin, ontwikkeling en einde verbonden door één thematische draad. "
                "(3) Tsjechov-principe: elk geïntroduceerd element (voorwerp, plaats, personage) moet een rol spelen in de oplossing. "
                "(4) Verboden dezelfde vertelassen of formuleringen te hergebruiken. "
                "(5) Levendige dialogen die de personages onthullen en de intrige vooruithelpen. "
                "(6) Logische conclusie die voortvloeit uit de gebeurtenissen van het verhaal.")
    if langue_id.startswith("de"):
        return (f"Schreibe eine vollständige Geschichte auf Deutsch für ein {age}-jähriges Kind mit ungefähr {nombre_mots} Wörtern. "
                "Beginne direkt ohne Titel, ohne Einleitung und ohne Kommentar. Trenne jeden Absatz durch eine Leerzeile. "
                "Erzählregeln: (1) Tadellose Rechtschreibung, präzises und abwechslungsreiches Vokabular ohne lexikalische Wiederholungen. "
                "(2) Kohäsion: Anfang, Entwicklung und Ende durch einen einzigen thematischen Faden verbunden. "
                "(3) Tschechows Prinzip: jedes eingeführte Element (Gegenstand, Ort, Figur) muss eine Rolle in der Auflösung spielen. "
                "(4) Verboten, dieselben Erzählachsen oder Formulierungen wiederzuverwenden. "
                "(5) Lebendige Dialoge, die die Figuren enthüllen und die Handlung vorantreiben. "
                "(6) Logische Schlussfolgerung, die sich aus den Ereignissen der Geschichte ergibt.")
    if langue_id.startswith("ar"):
        return (f"اكتب قصة كاملة باللغة العربية لطفل عمره {age} سنوات بحوالي {nombre_mots} كلمة. "
                "ابدأ مباشرة دون عنوان ودون مقدمة ودون تعليق. افصل كل فقرة بسطر فارغ. "
                "قواعد السرد: (1) إملاء لا تشوبه شائبة، مفردات دقيقة ومتنوعة دون تكرار معجمي. "
                "(2) التماسك: بداية وتطور ونهاية مرتبطة بخيط موضوعي واحد. "
                "(3) مبدأ تشيخوف: كل عنصر مُدخَل (شيء، مكان، شخصية) يجب أن يؤدي دوراً في الحل. "
                "(4) ممنوع إعادة استخدام نفس المحاور السردية أو الصياغات. "
                "(5) حوارات حية تكشف الشخصيات وتدفع الحبكة إلى الأمام. "
                "(6) خاتمة منطقية تنبع من أحداث القصة.")
    if langue_id.startswith("tr"):
        return (f"{age} yaşındaki bir çocuk için yaklaşık {nombre_mots} kelimelik Türkçe tam bir hikaye yaz. "
                "Başlık, giriş ve yorum olmadan doğrudan başla. Her paragrafı boş bir satırla ayır. "
                "Anlatı kuralları: (1) Kusursuz yazım, sözcük tekrarı olmadan kesin ve çeşitli kelime dağarcığı. "
                "(2) Bütünlük: tek bir tematik iplikle bağlı başlangıç, gelişme ve son. "
                "(3) Çehov ilkesi: tanıtılan her unsur (nesne, yer, karakter) çözümde bir rol oynamalı. "
                "(4) Aynı anlatı eksenlerini veya ifadeleri yeniden kullanmak yasak. "
                "(5) Karakterleri ortaya çıkaran ve olay örgüsünü ileriye taşıyan canlı diyaloglar. "
                "(6) Hikayenin olaylarından kaynaklanan mantıklı bir sonuç.")
    if langue_id.startswith("pl"):
        return (f"Napisz pełną historię po polsku dla {age}-letniego dziecka z około {nombre_mots} słowami. "
                "Zacznij bezpośrednio bez tytułu, bez wprowadzenia i bez komentarza. Oddziel każdy akapit pustą linią. "
                "Zasady narracyjne: (1) Nienaganна pisownia, precyzyjne i zróżnicowane słownictwo bez powtórzeń leksykalnych. "
                "(2) Spójność: początek, rozwój i zakończenie połączone jednym wątkiem tematycznym. "
                "(3) Zasada Czechowa: każdy wprowadzony element (przedmiot, miejsce, postać) musi odegrać rolę w rozwiązaniu. "
                "(4) Zakazane jest ponowne używanie tych samych osi narracyjnych lub sformułowań. "
                "(5) Żywe dialogi, które ujawniają postacie i posuwają intrygę do przodu. "
                "(6) Logiczne zakończenie wynikające z wydarzeń historii.")
    # Anglais (défaut)
    return (f"Write a complete story in English for a {age}-year-old child with approximately {nombre_mots} words. "
            "Start directly without any title, introduction or comment. Separate each paragraph with a blank line. "
            "Narrative rules: (1) Impeccable spelling, precise and varied vocabulary with no lexical repetitions. "
            "(2) Cohesion: beginning, development and ending connected by a single thematic thread. "
            "(3) Chekhov's gun: every element introduced (object, place, character) must play a role in the resolution. "
            "(4) Never reuse the same narrative axes or phrasing. "
            "(5) Vivid dialogues that reveal characters and advance the plot. "
            "(6) Logical conclusion that flows from the story's events.")


# ══════════════════════════════════════════════════════════════
# APPELS API
# ══════════════════════════════════════════════════════════════

def generer_histoire(prompt: str) -> tuple[str, int, str]:
    """Appelle le provider actif et bascule automatiquement sur 429."""
    global _provider_idx
    for _ in range(len(PROVIDERS)):
        provider = PROVIDERS[_provider_idx]
        try:
            resp = requests.post(
                provider["url"],
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {provider['key']}",
                },
                json={
                    "model":       provider["model"],
                    "max_tokens":  4096,
                    "temperature": 0.9,
                    "messages":    [{"role": "user", "content": prompt}],
                },
                timeout=60,
            )
            if resp.status_code == 429:
                print(f"    ⚠️ {provider['name']} rate limit → bascule provider suivant")
                _provider_idx = (_provider_idx + 1) % len(PROVIDERS)
                time.sleep(2)
                continue
            resp.raise_for_status()
            data   = resp.json()
            texte  = data["choices"][0]["message"]["content"]
            tokens = data.get("usage", {}).get("total_tokens", 0)
            return texte, tokens, provider["name"]
        except Exception as e:
            print(f"    ❌ {provider['name']} erreur: {e} → bascule")
            _provider_idx = (_provider_idx + 1) % len(PROVIDERS)
            time.sleep(2)
    raise Exception("Tous les providers ont échoué")


def generer_audio(texte: str, langue_code: str, voix_nom: str, vitesse: float) -> bytes:
    """Appelle Google TTS et retourne les bytes MP3."""
    url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={GOOGLE_TTS_KEY}"
    resp = requests.post(
        url,
        headers={"Content-Type": "application/json"},
        json={
            "input": {"text": texte},
            "voice": {"languageCode": langue_code, "name": voix_nom},
            "audioConfig": {"audioEncoding": "MP3", "speakingRate": vitesse},
        },
        timeout=120,
    )
    resp.raise_for_status()
    audio_b64 = resp.json()["audioContent"]
    return base64.b64decode(audio_b64)


# ══════════════════════════════════════════════════════════════
# LOGIQUE D'UN TEST (1 config, 1 cycle)
# ══════════════════════════════════════════════════════════════

def executer_un_test(
    langue_id: str, voix_id: str, age: int, duree: int,
    mots_cible: int, vitesse: float, cycle_num: int
) -> tuple[int, bool, int]:
    """
    Retourne (suggestion, est_parfait, tokens_utilises).
    est_parfait = True si l'écart audio est <= SEUIL_PARFAIT secondes.
    """
    meilleure_histoire = ""
    meilleur_ecart     = float("inf")
    meilleurs_mots     = 0
    mots_generes       = 0
    tokens_cycle       = 0
    nb_tentatives      = 0
    provider_utilise   = ""

    for tentative in range(MAX_TENTATIVES):
        if tentative == 0:
            prompt = construire_prompt(langue_id, age, mots_cible)
        else:
            manque = mots_cible - mots_generes
            if manque > 0:
                consigne = (f"L'histoire précédente était trop COURTE de {manque} mots. "
                            f"Ajoute plus de détails pour atteindre exactement {mots_cible} mots.")
            else:
                consigne = (f"L'histoire précédente était trop LONGUE de {abs(manque)} mots. "
                            f"Raccourcis pour atteindre exactement {mots_cible} mots.")
            prompt = construire_prompt(langue_id, age, mots_cible) + "\n\nIMPORTANT (Correction) : " + consigne

        texte, tokens, provider_utilise = generer_histoire(prompt)
        tokens_cycle  += tokens
        nb_tentatives += 1
        mots_actuels   = compter_mots(texte)
        ecart_actuel   = abs(mots_actuels - mots_cible)

        if ecart_actuel < meilleur_ecart:
            meilleur_ecart     = ecart_actuel
            meilleure_histoire = texte
            meilleurs_mots     = mots_actuels

        mots_generes = mots_actuels

        if ecart_actuel <= TOLERANCE:
            break
        if tentative < MAX_TENTATIVES - 1:
            time.sleep(2)

    # Générer l'audio et mesurer la durée réelle
    audio_bytes  = generer_audio(meilleure_histoire, langue_id, voix_id, vitesse)
    duree_audio  = get_mp3_duration(audio_bytes)
    duree_sec_audio  = round(duree_audio)
    duree_sec_cible  = duree * 60

    suggestion   = round(meilleurs_mots * duree_sec_cible / duree_sec_audio)
    ecart_audio  = duree_sec_audio - duree_sec_cible
    est_parfait  = abs(ecart_audio) <= SEUIL_PARFAIT
    icone        = "🎯" if est_parfait else ("✅" if abs(ecart_audio) <= 10 else "⚠️")

    min_  = duree_sec_audio // 60
    sec_  = duree_sec_audio % 60
    signe = "+" if ecart_audio > 0 else ""
    tent_str = f"×{nb_tentatives}" if nb_tentatives > 1 else ""
    print(f"    {icone} C{cycle_num} [{provider_utilise}{tent_str}]: {meilleurs_mots} mots → {min_}:{sec_:02d} "
          f"(écart {signe}{ecart_audio}s) → suggéré: {suggestion} [{tokens_cycle} tokens]")

    return suggestion, est_parfait, tokens_cycle


# ══════════════════════════════════════════════════════════════
# CALIBRATION COMPLÈTE
# ══════════════════════════════════════════════════════════════

def lancer_calibration():
    print("🚀 CALIBRATION AUTOMATIQUE (3 cycles + médiane, arrêt anticipé si ±5s)")
    print(f"📋 {len(CALIBRATION_CONFIGS)} langues × {len(AGE_IDS)} âges × {len(DUREES)} durées × {NB_CYCLES} cycles max\n")

    new_tables: dict = {}
    for _, langue_id, _ in CALIBRATION_CONFIGS:
        new_tables[langue_id] = [[0, 0, 0, 0] for _ in AGE_IDS]

    total_tests  = len(CALIBRATION_CONFIGS) * len(AGE_IDS) * len(DUREES)
    total_tokens = 0
    test_num     = 0
    debut_script = time.time()

    for langue_nom, langue_id, voix_id in CALIBRATION_CONFIGS:
        print(f"\n══════ {langue_nom.upper()} ({langue_id}) ══════")

        for age in AGE_IDS:
            vitesse = calculer_vitesse_lecture(age)
            tranche = get_tranche_index(age)

            for duree in DUREES:
                test_num += 1
                mots_cible = get_mots_cible(DEFAULT_TABLES, langue_id, age, duree)
                d_idx      = duree - 1

                print(f"📊 [{test_num}/{total_tests}] {langue_nom} {age}ans {duree}min (table={mots_cible} mots)")

                suggestions: list[int] = []
                tokens_test = 0
                arret_anticipe = False

                for cycle in range(1, NB_CYCLES + 1):
                    try:
                        suggestion, est_parfait, tokens_cycle = executer_un_test(
                            langue_id, voix_id, age, duree,
                            mots_cible, vitesse, cycle
                        )
                        suggestions.append(suggestion)
                        tokens_test += tokens_cycle
                        
                        # Si le résultat est parfait (±3s), on arrête les cycles
                        if est_parfait:
                            print(f"  ⚡ Résultat parfait (±{SEUIL_PARFAIT}s) → arrêt anticipé")
                            arret_anticipe = True
                            break
                        
                        if cycle < NB_CYCLES:
                            time.sleep(5)
                    except Exception as e:
                        msg = str(e)
                        print(f"    ❌ C{cycle} ERREUR: {msg}")
                        if "429" in msg:
                            print("    ⏳ Rate limit — pause 30s...")
                            time.sleep(30)
                        else:
                            time.sleep(10)

                total_tokens += tokens_test

                if suggestions:
                    if arret_anticipe and len(suggestions) == 1:
                        # Si on n'a fait qu'un cycle et qu'il est parfait, on garde cette valeur
                        med = suggestions[0]
                        print(f"  🎯 VALEUR UNIQUE (parfaite): {med} mots | 🪙  {tokens_test:,} tokens")
                    else:
                        # Sinon, on fait la médiane comme avant
                        med = median(suggestions)
                        print(f"  🎯 MÉDIANE ({len(suggestions)} cycle{'s' if len(suggestions) > 1 else ''}): {suggestions} → {med} mots | 🪙 {tokens_test:,} tokens")
                    new_tables[langue_id][tranche][d_idx] = med
                else:
                    new_tables[langue_id][tranche][d_idx] = mots_cible
                    print(f"  ⚠️ Aucun cycle réussi, valeur inchangée: {mots_cible}")

                print(f"  💰 TOTAL TOKENS JUSQU'ICI: {total_tokens:,}")
                time.sleep(8)

    duree_totale = time.time() - debut_script
    heures = int(duree_totale // 3600)
    minutes = int((duree_totale % 3600) // 60)
    secondes = int(duree_totale % 60)

    # ═══ RÉSUMÉ FINAL ═══
    print("\n" + "═" * 60)
    print("📊 STATISTIQUES FINALES")
    print("═" * 60)
    print(f"⏱️  Durée totale: {heures}h {minutes}min {secondes}s")
    providers_actifs = " + ".join(p["name"] for p in PROVIDERS)
    print(f"🪙 Tokens consommés ({providers_actifs}): {total_tokens:,}")
    print(f"📝 Tests effectués: {test_num}/{total_tests}")
    
    print("\n═══════════════════════════════════════")
    print("📋 NOUVELLES TABLES CALIBRÉES :")
    for langue_nom, langue_id, _ in CALIBRATION_CONFIGS:
        print(f"\n  {langue_nom} ({langue_id}):")
        for tr, age in enumerate(AGE_IDS):
            row = new_tables[langue_id][tr]
            row_str = " | ".join(str(v).rjust(4) for v in row)
            print(f"    {age:2d} ans: [ {row_str} ]")

    # ═══ EXPORT JSON ═══
    out_path = os.path.join(os.path.dirname(__file__), "calibration_result.json")
    result_data = {
        "tables": new_tables,
        "metadata": {
            "total_tokens": total_tokens,
            "duree_secondes": int(duree_totale),
            "tests_effectues": test_num,
            "date": time.strftime("%Y-%m-%d %H:%M:%S")
        }
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result_data, f, ensure_ascii=False, indent=2)
    print(f"\n💾 Tables + stats exportées → {out_path}")
    print("\n✅ CALIBRATION TERMINÉE")

    # ═══ AFFICHER LE CODE À COPIER ═══
    print("\n" + "═" * 60)
    print("COPIE CE BLOC DANS calibrationStore.ts > DEFAULT_TABLES :")
    print("═" * 60)
    for _, langue_id, _ in CALIBRATION_CONFIGS:
        rows = new_tables[langue_id]
        rows_str = ",\n    ".join(f"[{','.join(str(v) for v in row)}]" for row in rows)
        print(f"  '{langue_id}': [\n    {rows_str},\n  ],")


if __name__ == "__main__":
    lancer_calibration()