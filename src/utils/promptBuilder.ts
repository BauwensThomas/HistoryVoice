// Construction des prompts pour l'IA
// Utilise le même format simple que la calibration pour un meilleur respect du nombre de mots
import { LANGUAGE_FULLNAMES } from '../config/ttsVoices';
import { obtenirNombreMotsCible } from './wordCount';

export interface PromptParams {
  age: number;
  ageLabel: string;
  sexe: string;
  genre: string;
  moment: string;
  duree: number;
  description: string;
  langueId: string;
}

/**
 * Résout le nom de langue pour le prompt.
 */
function getLangueName(langueId: string): string {
  if (langueId.startsWith('en')) return 'English';
  if (langueId.startsWith('it')) return 'Italian';
  if (langueId.startsWith('es')) return 'Spanish';
  if (langueId.startsWith('pt')) return 'Brazilian Portuguese';
  if (langueId.startsWith('nl')) return 'Dutch';
  if (langueId.startsWith('de')) return 'German';
  if (langueId.startsWith('ar')) return 'Arabic';
  if (langueId.startsWith('tr')) return 'Turkish';
  if (langueId.startsWith('pl')) return 'Polish';
  return LANGUAGE_FULLNAMES[langueId] || 'French';
}

// Traductions des paramètres du prompt dans chaque langue
const SEXE_MAP: Record<string, { boy: string; girl: string }> = {
  fr: { boy: 'un garçon', girl: 'une fille' },
  en: { boy: 'a boy', girl: 'a girl' },
  it: { boy: 'un ragazzo', girl: 'una ragazza' },
  es: { boy: 'un niño', girl: 'una niña' },
  pt: { boy: 'um menino', girl: 'uma menina' },
  nl: { boy: 'een jongen', girl: 'een meisje' },
  de: { boy: 'ein Junge', girl: 'ein Mädchen' },
  ar: { boy: 'ولد', girl: 'بنت' },
  tr: { boy: 'bir erkek çocuk', girl: 'bir kız çocuk' },
  pl: { boy: 'chłopiec', girl: 'dziewczynka' },
};

const GENRE_MAP: Record<string, Record<string, string>> = {
  fr: { aventure: 'aventure', fantastique: 'fantastique', animaux: 'animaux', prince: 'prince / princesse',
    scifi: 'science fiction', comedie: 'comédie'
  },
  en: {
    aventure: 'adventure', fantastique: 'fantasy', animaux: 'animals', prince: 'prince / princess',
    scifi: 'science fiction', comedie: 'comedy'
  },
  it: {
    aventure: 'avventura', fantastique: 'fantasy', animaux: 'animali', prince: 'principe / principessa',
    scifi: 'fantascienza', comedie: 'commedia'
  },
  es: {
    aventure: 'aventura', fantastique: 'fantasía', animaux: 'animales', prince: 'príncipe / princesa',
    scifi: 'ciencia ficción', comedie: 'comedia'
  },
  pt: {
    aventure: 'aventura', fantastique: 'fantasia', animaux: 'animais', prince: 'príncipe / princesa',
    scifi: 'ficção científica', comedie: 'comédia'
  },
  nl: {
    aventure: 'avontuur', fantastique: 'fantasie', animaux: 'dieren', prince: 'prins / prinses',
    scifi: 'sciencefiction', comedie: 'komedie'
  },
  de: {
    aventure: 'Abenteuer', fantastique: 'Fantasy', animaux: 'Tiere', prince: 'Prinz / Prinzessin',
    scifi: 'Science-Fiction', comedie: 'Komödie'
  },
  ar: {
    aventure: 'مغامرة', fantastique: 'خيال', animaux: 'حيوانات', prince: 'أمير / أميرة',
    scifi: 'خيال علمي', comedie: 'كوميديا'
  },
  tr: {
    aventure: 'macera', fantastique: 'fantezi', animaux: 'hayvanlar', prince: 'prens / prenses',
    scifi: 'bilim kurgu', comedie: 'komedi'
  },
  pl: {
    aventure: 'przygoda', fantastique: 'fantasy', animaux: 'zwierzęta', prince: 'książę / księżniczka',
    scifi: 'science fiction', comedie: 'komedia'
  },
};

const MOMENT_MAP: Record<string, { day: string; night: string }> = {
  fr: { day: 'histoire de jour', night: 'histoire de nuit' },
  en: { day: 'daytime story', night: 'nighttime story' },
  it: { day: 'storia di giorno', night: 'storia di notte' },
  es: { day: 'historia de día', night: 'historia de noche' },
  pt: { day: 'história de dia', night: 'história de noite' },
  nl: { day: 'dagverhaal', night: 'nachtverhaal' },
  de: { day: 'Tagesgeschichte', night: 'Nachtgeschichte' },
  ar: { day: 'قصة نهارية', night: 'قصة ليلية' },
  tr: { day: 'gündüz hikayesi', night: 'gece hikayesi' },
  pl: { day: 'historia na dzień', night: 'historia na noc' },
};

/**
 * Détecte si c'est un garçon à partir de toutes les traductions possibles.
 */
function isBoy(sexe: string): boolean {
  const s = sexe.toLowerCase().trim();
  return ['garçon', 'boy', 'ragazzo', 'niño', 'menino', 'jongen', 'junge', 'erkek', 'chłopiec', 'ولد'].includes(s);
}

/**
 * Détecte le genre (aventure, fantastique, etc.) à partir de toutes les traductions possibles.
 */
function normalizeGenre(genre: string): string {
  const g = genre.toLowerCase().trim();
  if (['aventure', 'adventure', 'avventura', 'aventura', 'avontuur', 'abenteuer', 'macera', 'przygoda', 'مغامرة'].some(v => g.includes(v))) return 'aventure';
  if (['fantastique', 'fantasy', 'fantasía', 'fantasia', 'fantasie', 'fantezi'].some(v => g.includes(v))) return 'fantastique';
  if (['animaux', 'animals', 'animali', 'animales', 'animais', 'dieren', 'tiere', 'hayvanlar', 'zwierzęta', 'حيوانات'].some(v => g.includes(v))) return 'animaux';
  if (['prince', 'príncipe', 'prins', 'prinz', 'prens', 'książę', 'أمير'].some(v => g.includes(v))) return 'prince';
  if (['science fiction', 'scifi', 'sci-fi', 'fantascienza', 'ciencia ficción', 'ficção científica', 'sciencefiction', 'science-fiction', 'bilim kurgu', 'خيال علمي'].some(v => g.includes(v))) return 'scifi';
  if (['comédie', 'comedy', 'commedia', 'comedia', 'komedie', 'komödie', 'komedi', 'komedia', 'كوميديا'].some(v => g.includes(v))) return 'comedie';
  return 'aventure';
}

/**
 * Détecte si c'est un moment de nuit à partir de toutes les traductions possibles.
 */
function isNight(moment: string): boolean {
  const m = moment.toLowerCase().trim();
  return ['nuit', 'night', 'notte', 'noche', 'noite', 'nacht', 'gece', 'noc', 'ليلية'].some(v => m.includes(v));
}

/**
 * Traduit le sexe dans la langue cible.
 */
function translateSexe(sexe: string, langueId: string): string {
  const lang = langueId.substring(0, 2);
  const map = SEXE_MAP[lang] || SEXE_MAP.en;
  return isBoy(sexe) ? map.boy : map.girl;
}

/**
 * Traduit le genre dans la langue cible.
 */
function translateGenre(genre: string, langueId: string): string {
  const lang = langueId.substring(0, 2);
  const map = GENRE_MAP[lang] || GENRE_MAP.en;
  const key = normalizeGenre(genre);
  return map[key] || genre;
}

/**
 * Traduit le moment dans la langue cible.
 */
function translateMoment(moment: string, langueId: string): string {
  const lang = langueId.substring(0, 2);
  const map = MOMENT_MAP[lang] || MOMENT_MAP.en;
  return isNight(moment) ? map.night : map.day;
}

/**
 * Prompt simple — identique au style de la calibration.
 * Court et efficace pour que l'IA respecte le nombre de mots.
 * Utilisé aussi bien en calibration qu'en génération réelle.
 */
export function construirePromptSimple(
  langueId: string,
  age: number,
  nombreMots: number,
  params?: {
    sexe?: string;
    genre?: string;
    moment?: string;
    description?: string;
  },
): string {
  const langueName = getLangueName(langueId);

  // Construire les détails optionnels de l'histoire (traduits dans la langue cible)
  let details = '';
  if (params) {
    const parts: string[] = [];
    if (params.genre) {
      const translatedGenre = translateGenre(params.genre, langueId);
      parts.push(langueId.startsWith('fr') ? `Genre : ${translatedGenre}` : `Genre: ${translatedGenre}`);
    }
    if (params.sexe) {
      const translatedSexe = translateSexe(params.sexe, langueId);
      if (langueId.startsWith('fr')) {
        parts.push(`Personnage principal : ${translatedSexe}`);
      } else if (langueId.startsWith('it')) {
        parts.push(`Personaggio principale: ${translatedSexe}`);
      } else if (langueId.startsWith('es')) {
        parts.push(`Personaje principal: ${translatedSexe}`);
      } else if (langueId.startsWith('pt')) {
        parts.push(`Personagem principal: ${translatedSexe}`);
      } else if (langueId.startsWith('nl')) {
        parts.push(`Hoofdpersoon: ${translatedSexe}`);
      } else if (langueId.startsWith('de')) {
        parts.push(`Hauptfigur: ${translatedSexe}`);
      } else if (langueId.startsWith('ar')) {
        parts.push(`الشخصية الرئيسية: ${translatedSexe}`);
      } else if (langueId.startsWith('tr')) {
        parts.push(`Ana karakter: ${translatedSexe}`);
      } else if (langueId.startsWith('pl')) {
        parts.push(`Główna postać: ${translatedSexe}`);
      } else {
        parts.push(`Main character: ${translatedSexe}`);
      }
    }
    if (params.moment) {
      const translatedMoment = translateMoment(params.moment, langueId);
      if (langueId.startsWith('fr')) {
        parts.push(`Moment : ${translatedMoment}`);
      } else if (langueId.startsWith('it')) {
        parts.push(`Momento: ${translatedMoment}`);
      } else if (langueId.startsWith('es')) {
        parts.push(`Momento: ${translatedMoment}`);
      } else if (langueId.startsWith('pt')) {
        parts.push(`Momento: ${translatedMoment}`);
      } else if (langueId.startsWith('nl')) {
        parts.push(`Moment: ${translatedMoment}`);
      } else if (langueId.startsWith('de')) {
        parts.push(`Zeitpunkt: ${translatedMoment}`);
      } else if (langueId.startsWith('ar')) {
        parts.push(`الوقت: ${translatedMoment}`);
      } else if (langueId.startsWith('tr')) {
        parts.push(`Zaman: ${translatedMoment}`);
      } else if (langueId.startsWith('pl')) {
        parts.push(`Pora: ${translatedMoment}`);
      } else {
        parts.push(`Setting: ${translatedMoment}`);
      }
    }
    if (params.description) {
      if (langueId.startsWith('fr')) {
        parts.push(`Éléments : ${params.description}`);
      } else if (langueId.startsWith('it')) {
        parts.push(`Elementi: ${params.description}`);
      } else if (langueId.startsWith('es')) {
        parts.push(`Elementos: ${params.description}`);
      } else if (langueId.startsWith('pt')) {
        parts.push(`Elementos: ${params.description}`);
      } else if (langueId.startsWith('nl')) {
        parts.push(`Elementen: ${params.description}`);
      } else if (langueId.startsWith('de')) {
        parts.push(`Elemente: ${params.description}`);
      } else if (langueId.startsWith('ar')) {
        parts.push(`العناصر: ${params.description}`);
      } else if (langueId.startsWith('tr')) {
        parts.push(`Unsurlar: ${params.description}`);
      } else if (langueId.startsWith('pl')) {
        parts.push(`Elementy: ${params.description}`);
      } else {
        parts.push(`Elements: ${params.description}`);
      }
    }
    if (parts.length > 0) {
      details = '\n' + parts.join('. ') + '.';
    }
  }

  if (langueId.startsWith('fr')) {
    return `Écris une histoire complète en français pour un enfant de ${age} ans avec environ ${nombreMots} mots. Commence directement sans titre, sans introduction et sans commentaire. Sépare chaque paragraphe par une ligne vide. Règles narratives : (1) Orthographe irréprochable, vocabulaire précis, varié, sans répétitions lexicales. (2) Cohésion : début, développement et fin liés par un même fil thématique. (3) Principe de Tchekhov : chaque élément introduit (objet, lieu, personnage) doit jouer un rôle dans la résolution. (4) Interdiction de réutiliser les mêmes axes narratifs ou formulations. (5) Dialogues vivants qui révèlent les personnages et font avancer l'intrigue. (6) Conclusion logique qui découle des événements de l'histoire, pas uniquement du moment de la journée.${details}`;
  }
  if (langueId.startsWith('pt')) {
    return `Escreva uma história completa em português brasileiro para uma criança de ${age} anos com aproximadamente ${nombreMots} palavras. Comece diretamente sem título, sem introdução e sem comentário. Separe cada parágrafo com uma linha em branco. Regras narrativas: (1) Ortografia impecável, vocabulário preciso, variado, sem repetições lexicais. (2) Coesão: início, desenvolvimento e fim ligados por um mesmo fio temático. (3) Princípio de Tchekhov: cada elemento introduzido (objeto, lugar, personagem) deve ter um papel na resolução. (4) Proibido reutilizar os mesmos eixos narrativos ou formulações. (5) Diálogos vivos que revelam os personagens e fazem avançar a intriga. (6) Conclusão lógica que decorre dos eventos da história.${details}`;
  }
  if (langueId.startsWith('it')) {
    return `Scrivi una storia completa in italiano per un bambino di ${age} anni con circa ${nombreMots} parole. Inizia direttamente senza titolo, senza introduzione e senza commento. Separa ogni paragrafo con una riga vuota. Regole narrative: (1) Ortografia impeccabile, vocabolario preciso, vario, senza ripetizioni lessicali. (2) Coesione: inizio, sviluppo e fine legati da un unico filo tematico. (3) Principio di Cechov: ogni elemento introdotto (oggetto, luogo, personaggio) deve avere un ruolo nella risoluzione. (4) Vietato riutilizzare gli stessi assi narrativi o formulazioni. (5) Dialoghi vivaci che rivelano i personaggi e fanno avanzare la trama. (6) Conclusione logica che scaturisce dagli eventi della storia.${details}`;
  }
  if (langueId.startsWith('es')) {
    return `Escribe una historia completa en español para un niño de ${age} años con aproximadamente ${nombreMots} palabras. Comienza directamente sin título, sin introducción y sin comentario. Separa cada párrafo con una línea en blanco. Reglas narrativas: (1) Ortografía impecable, vocabulario preciso, variado, sin repeticiones léxicas. (2) Cohesión: inicio, desarrollo y final unidos por un mismo hilo temático. (3) Principio de Chéjov: cada elemento introducido (objeto, lugar, personaje) debe tener un papel en la resolución. (4) Prohibido reutilizar los mismos ejes narrativos o formulaciones. (5) Diálogos vivos que revelan a los personajes y hacen avanzar la trama. (6) Conclusión lógica que surge de los eventos de la historia.${details}`;
  }
  if (langueId.startsWith('nl')) {
    return `Schrijf een compleet verhaal in het Nederlands voor een kind van ${age} jaar met ongeveer ${nombreMots} woorden. Begin direct zonder titel, zonder inleiding en zonder commentaar. Scheid elk alinea met een lege regel. Vertelregels: (1) Onberispelijke spelling, precies en gevarieerd vocabulaire zonder lexicale herhalingen. (2) Samenhang: begin, ontwikkeling en einde verbonden door één thematische draad. (3) Tsjechov-principe: elk geïntroduceerd element (voorwerp, plaats, personage) moet een rol spelen in de oplossing. (4) Verboden dezelfde vertelassen of formuleringen te hergebruiken. (5) Levendige dialogen die de personages onthullen en de intrige vooruithelpen. (6) Logische conclusie die voortvloeit uit de gebeurtenissen van het verhaal.${details}`;
  }
  if (langueId.startsWith('de')) {
    return `Schreibe eine vollständige Geschichte auf Deutsch für ein ${age}-jähriges Kind mit ungefähr ${nombreMots} Wörtern. Beginne direkt ohne Titel, ohne Einleitung und ohne Kommentar. Trenne jeden Absatz durch eine Leerzeile. Erzählregeln: (1) Tadellose Rechtschreibung, präzises und abwechslungsreiches Vokabular ohne lexikalische Wiederholungen. (2) Kohäsion: Anfang, Entwicklung und Ende durch einen einzigen thematischen Faden verbunden. (3) Tschechows Prinzip: jedes eingeführte Element (Gegenstand, Ort, Figur) muss eine Rolle in der Auflösung spielen. (4) Verboten, dieselben Erzählachsen oder Formulierungen wiederzuverwenden. (5) Lebendige Dialoge, die die Figuren enthüllen und die Handlung vorantreiben. (6) Logische Schlussfolgerung, die sich aus den Ereignissen der Geschichte ergibt.${details}`;
  }
  if (langueId.startsWith('ar')) {
    return `اكتب قصة كاملة باللغة العربية لطفل عمره ${age} سنوات بحوالي ${nombreMots} كلمة. ابدأ مباشرة دون عنوان ودون مقدمة ودون تعليق. افصل كل فقرة بسطر فارغ. قواعد السرد: (1) إملاء لا تشوبه شائبة، مفردات دقيقة ومتنوعة دون تكرار معجمي. (2) التماسك: بداية وتطور ونهاية مرتبطة بخيط موضوعي واحد. (3) مبدأ تشيخوف: كل عنصر مُدخَل (شيء، مكان، شخصية) يجب أن يؤدي دوراً في الحل. (4) ممنوع إعادة استخدام نفس المحاور السردية أو الصياغات. (5) حوارات حية تكشف الشخصيات وتدفع الحبكة إلى الأمام. (6) خاتمة منطقية تنبع من أحداث القصة.${details}`;
  }
  if (langueId.startsWith('tr')) {
    return `${age} yaşındaki bir çocuk için yaklaşık ${nombreMots} kelimelik Türkçe tam bir hikaye yaz. Başlık, giriş ve yorum olmadan doğrudan başla. Her paragrafı boş bir satırla ayır. Anlatı kuralları: (1) Kusursuz yazım, sözcük tekrarı olmadan kesin ve çeşitli kelime dağarcığı. (2) Bütünlük: tek bir tematik iplikle bağlı başlangıç, gelişme ve son. (3) Çehov ilkesi: tanıtılan her unsur (nesne, yer, karakter) çözümde bir rol oynamalı. (4) Aynı anlatı eksenlerini veya ifadeleri yeniden kullanmak yasak. (5) Karakterleri ortaya çıkaran ve olay örgüsünü ileriye taşıyan canlı diyaloglar. (6) Hikayenin olaylarından kaynaklanan mantıklı bir sonuç.${details}`;
  }
  if (langueId.startsWith('pl')) {
    return `Napisz pełną historię po polsku dla ${age}-letniego dziecka z około ${nombreMots} słowami. Zacznij bezpośrednio bez tytułu, bez wprowadzenia i bez komentarza. Oddziel każdy akapit pustą linią. Zasady narracyjne: (1) Nienaganна pisownia, precyzyjne i zróżnicowane słownictwo bez powtórzeń leksykalnych. (2) Spójność: początek, rozwój i zakończenie połączone jednym wątkiem tematycznym. (3) Zasada Czechowa: każdy wprowadzony element (przedmiot, miejsce, postać) musi odegrać rolę w rozwiązaniu. (4) Zakazane jest ponowne używanie tych samych osi narracyjnych lub sformułowań. (5) Żywe dialogi, które ujawniają postacie i posuwają intrygę do przodu. (6) Logiczne zakończenie wynikające z wydarzeń historii.${details}`;
  }
  return `Write a complete story in ${langueName} for a ${age}-year-old child with approximately ${nombreMots} words. Start directly without any title, introduction or comment. Separate each paragraph with a blank line. Narrative rules: (1) Impeccable spelling, precise and varied vocabulary with no lexical repetitions. (2) Cohesion: beginning, development and ending connected by a single thematic thread. (3) Chekhov's gun: every element introduced (object, place, character) must play a role in the resolution. (4) Never reuse the same narrative axes or phrasing. (5) Vivid dialogues that reveal characters and advance the plot. (6) Logical conclusion that flows from the story's events.${details}`;
}

/**
 * Construit le prompt pour la génération avec retry.
 * Utilise le prompt simple (calibration) + correction si nécessaire.
 */
export function construirePrompt(
  params: PromptParams,
  motsCibleOverride?: number,
  correction?: string,
): string {
  const { age, duree, sexe, genre, moment, description, langueId } = params;
  const nombreMots = motsCibleOverride ?? obtenirNombreMotsCible(duree, age, langueId);

  let prompt = construirePromptSimple(langueId, age, nombreMots, {
    sexe,
    genre,
    moment,
    description,
  });

  if (correction) {
    prompt += '\n\nIMPORTANT (Correction): ' + correction;
  }

  return prompt;
}
