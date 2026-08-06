// Curated sets of confusingly-similar kana.
// Each set lists characters by their kana form (c) and accepted romaji (r).
// Hiragana and katakana have different look-alikes, so they're defined separately.

export const hiraganaLookalikes = [
  { id: 'h-a-o',     chars: [ { c: 'あ', r: ['a'] }, { c: 'お', r: ['o'] } ] },
  { id: 'h-nu-me',   chars: [ { c: 'ぬ', r: ['nu'] }, { c: 'め', r: ['me'] } ] },
  { id: 'h-re-wa-ne', chars: [ { c: 'れ', r: ['re'] }, { c: 'わ', r: ['wa'] }, { c: 'ね', r: ['ne'] } ] },
  { id: 'h-ru-ro',   chars: [ { c: 'る', r: ['ru'] }, { c: 'ろ', r: ['ro'] } ] },
  { id: 'h-ha-ho-ma', chars: [ { c: 'は', r: ['ha'] }, { c: 'ほ', r: ['ho'] }, { c: 'ま', r: ['ma'] } ] },
  { id: 'h-sa-ki-chi', chars: [ { c: 'さ', r: ['sa'] }, { c: 'き', r: ['ki'] }, { c: 'ち', r: ['chi', 'ti'] } ] },
  { id: 'h-su-mu',   chars: [ { c: 'す', r: ['su'] }, { c: 'む', r: ['mu'] } ] },
  { id: 'h-shi-tsu', chars: [ { c: 'し', r: ['shi', 'si'] }, { c: 'つ', r: ['tsu', 'tu'] } ] },
];

export const katakanaLookalikes = [
  { id: 'k-shi-tsu-so-n', chars: [ { c: 'シ', r: ['shi', 'si'] }, { c: 'ツ', r: ['tsu', 'tu'] }, { c: 'ソ', r: ['so'] }, { c: 'ン', r: ['n', 'nn'] } ] },
  { id: 'k-ku-ke-ta', chars: [ { c: 'ク', r: ['ku'] }, { c: 'ケ', r: ['ke'] }, { c: 'タ', r: ['ta'] } ] },
  { id: 'k-u-wa-fu-ra', chars: [ { c: 'ウ', r: ['u'] }, { c: 'ワ', r: ['wa'] }, { c: 'フ', r: ['fu', 'hu'] }, { c: 'ラ', r: ['ra'] } ] },
  { id: 'k-a-ma-ya', chars: [ { c: 'ア', r: ['a'] }, { c: 'マ', r: ['ma'] }, { c: 'ヤ', r: ['ya'] } ] },
  { id: 'k-na-me-nu', chars: [ { c: 'ナ', r: ['na'] }, { c: 'メ', r: ['me'] }, { c: 'ヌ', r: ['nu'] } ] },
  { id: 'k-ru-re', chars: [ { c: 'ル', r: ['ru'] }, { c: 'レ', r: ['re'] } ] },
  { id: 'k-ko-yu', chars: [ { c: 'コ', r: ['ko'] }, { c: 'ユ', r: ['yu'] } ] },
  { id: 'k-chi-te', chars: [ { c: 'チ', r: ['chi', 'ti'] }, { c: 'テ', r: ['te'] } ] },
  { id: 'k-su-nu', chars: [ { c: 'ス', r: ['su'] }, { c: 'ヌ', r: ['nu'] } ] },
];

// Build a human label like "シ ツ ソ ン" from a set's characters.
export function lookalikeLabel(set) {
  return set.chars.map(c => c.c).join(' ');
}
