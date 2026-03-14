/**
 * Rohingya Latin-script → English-friendly pronunciation converter.
 *
 * Rules:
 *   a/á  → AH      e/é → EH     i/í → EE
 *   o/ó  → AW      u/ú → OO     ou  → OH
 *   c    → SH      ch  → CH     ng  → NG
 *   ny   → NY      kh  → KH     ñ   → NY
 *   r    → R (light rolled)
 *   Accented vowels (á é í ó ú) indicate stress → displayed in uppercase result
 */

// Substitutions applied LEFT-TO-RIGHT in order (longest patterns first)
const RULES: [string, string][] = [
  // Digraphs / special combos — must come before their components
  ['kh', 'KH'],
  ['ch', 'CH'],
  ['ng', 'NG'],
  ['ny', 'NY'],
  ['ou', 'OH'],
  // Accented (stressed) vowels
  ['á', 'AH'],
  ['é', 'EH'],
  ['í', 'EE'],
  ['ó', 'AW'],
  ['ú', 'OO'],
  ['ñ', 'NY'],
  // Regular vowels
  ['a', 'AH'],
  ['e', 'EH'],
  ['i', 'EE'],
  ['o', 'AW'],
  ['u', 'OO'],
  // Special consonant
  ['c', 'SH'],
];

export function rohingyaPronounce(word: string): string {
  if (!word.trim()) return '';

  const lower = word.toLowerCase();
  let result = '';
  let i = 0;

  while (i < lower.length) {
    let matched = false;
    for (const [pattern, replacement] of RULES) {
      if (lower.startsWith(pattern, i)) {
        result += replacement;
        i += pattern.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Pass through unknown characters (punctuation, hyphens, etc.) as uppercase
      result += lower[i].toUpperCase();
      i++;
    }
  }

  // Insert hyphens after each vowel group when followed by more letters
  // e.g. DAHWAH → DAH-WAH, FAHNEE → FAH-NEE
  return result.replace(/(AH|EH|EE|AW|OO|OH)(?=[A-Z])/g, '$1-');
}

// ─── Hardcoded demo word map: English → { rohingya, pronunciation } ───────────
// These are the words used in the demo themes. Team should verify Rohingya spelling.
export const ROHINGYA_WORDS: Record<string, { rohingya: string; pronunciation: string }> = {
  // Caregiver theme
  medicine:   { rohingya: 'dawa',     pronunciation: rohingyaPronounce('dawa')     },
  water:      { rohingya: 'fani',     pronunciation: rohingyaPronounce('fani')     },
  food:       { rohingya: 'khana',    pronunciation: rohingyaPronounce('khana')    },
  help:       { rohingya: 'doya',     pronunciation: rohingyaPronounce('doya')     },
  pain:       { rohingya: 'jontona',  pronunciation: rohingyaPronounce('jontona')  },
  fever:      { rohingya: 'jor',      pronunciation: rohingyaPronounce('jor')      },
  sleep:      { rohingya: 'gom',      pronunciation: rohingyaPronounce('gom')      },
  tired:      { rohingya: 'taka',     pronunciation: rohingyaPronounce('taka')     },
  sick:       { rohingya: 'bimar',    pronunciation: rohingyaPronounce('bimar')    },
  doctor:     { rohingya: 'daktar',   pronunciation: rohingyaPronounce('daktar')   },
  hospital:   { rohingya: 'aspatal',  pronunciation: rohingyaPronounce('aspatal')  },
  blanket:    { rohingya: 'kabol',    pronunciation: rohingyaPronounce('kabol')    },
  pillow:     { rohingya: 'baalish',  pronunciation: rohingyaPronounce('baalish')  },
  bathroom:   { rohingya: 'toilet',   pronunciation: rohingyaPronounce('toilet')   },
  fall:       { rohingya: 'pora',     pronunciation: rohingyaPronounce('pora')     },
  emergency:  { rohingya: 'bipodd',   pronunciation: rohingyaPronounce('bipodd')   },
  ambulance:  { rohingya: 'ambulans', pronunciation: rohingyaPronounce('ambulans') },
  // Grocery theme
  bread:      { rohingya: 'ruti',     pronunciation: rohingyaPronounce('ruti')     },
  milk:       { rohingya: 'dudh',     pronunciation: rohingyaPronounce('dudh')     },
  rice:       { rohingya: 'sal',      pronunciation: rohingyaPronounce('sal')      },
  egg:        { rohingya: 'deem',     pronunciation: rohingyaPronounce('deem')     },
  pay:        { rohingya: 'poisa',    pronunciation: rohingyaPronounce('poisa')    },
  // Transport theme
  bus:        { rohingya: 'bas',      pronunciation: rohingyaPronounce('bas')      },
  // Work theme
  job:        { rohingya: 'kaj',      pronunciation: rohingyaPronounce('kaj')      },
  time:       { rohingya: 'waqt',     pronunciation: rohingyaPronounce('waqt')     },
};

export function getRohingyaWord(englishWord: string) {
  return ROHINGYA_WORDS[englishWord.toLowerCase()] ?? null;
}

/**
 * Scans a sentence or conversation line for any word that has a Rohingya
 * translation, returns the first match. Used in sentence/conversation mode.
 *
 * e.g. "I give medicine" → "medicine"
 *      "Here is your water." → "water"
 *      "How did you sleep?" → "sleep"
 */
export function findKeyWordInLine(line: string): string | null {
  const tokens = line.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  for (const token of tokens) {
    if (ROHINGYA_WORDS[token]) return token;
  }
  return null;
}
