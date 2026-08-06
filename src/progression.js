// Builders that turn kana data into an ordered list of "progression groups".
// Each group has the shape: { id, label, cards: [{ character, romaji, type }] }
// The progression engine walks these groups in order, gating each behind mastery.

import { hiraganaLookalikes, katakanaLookalikes, lookalikeLabel } from './lookalikes';

// Row-by-row ladder: one group per selected kana row, in canonical order.
export function buildLadderGroups(activeGroups, mode) {
  return activeGroups.map(group => {
    const cards = [];
    for (const char of group.grid) {
      if (!char) continue;
      if (mode === 'hiragana' || mode === 'both') {
        cards.push({ character: char.h, romaji: char.r, type: 'hiragana' });
      }
      if (mode === 'katakana' || mode === 'both') {
        cards.push({ character: char.k, romaji: char.r, type: 'katakana' });
      }
    }
    return { id: group.id, label: group.label, cards };
  }).filter(g => g.cards.length > 0);
}

// Look-alike groups: curated confusable sets for the chosen script(s).
export function buildLookalikeGroups(mode) {
  const groups = [];
  const add = (sets, type) => {
    for (const set of sets) {
      groups.push({
        id: set.id,
        label: lookalikeLabel(set),
        cards: set.chars.map(c => ({ character: c.c, romaji: c.r, type })),
      });
    }
  };
  if (mode === 'hiragana' || mode === 'both') add(hiraganaLookalikes, 'hiragana');
  if (mode === 'katakana' || mode === 'both') add(katakanaLookalikes, 'katakana');
  return groups;
}

export function buildProgressionGroups(quizType, mode, activeGroups) {
  return quizType === 'lookalikes'
    ? buildLookalikeGroups(mode)
    : buildLadderGroups(activeGroups ?? [], mode);
}
