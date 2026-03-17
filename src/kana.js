export const kanaGroups = [
  {
    id: 'vowels', label: 'Vowels',
    grid: [
      { h: 'あ', k: 'ア', r: ['a'] },
      { h: 'い', k: 'イ', r: ['i'] },
      { h: 'う', k: 'ウ', r: ['u'] },
      { h: 'え', k: 'エ', r: ['e'] },
      { h: 'お', k: 'オ', r: ['o'] },
    ],
  },
  {
    id: 'k-row', label: 'K-row',
    grid: [
      { h: 'か', k: 'カ', r: ['ka'] },
      { h: 'き', k: 'キ', r: ['ki'] },
      { h: 'く', k: 'ク', r: ['ku'] },
      { h: 'け', k: 'ケ', r: ['ke'] },
      { h: 'こ', k: 'コ', r: ['ko'] },
    ],
  },
  {
    id: 's-row', label: 'S-row',
    grid: [
      { h: 'さ', k: 'サ', r: ['sa'] },
      { h: 'し', k: 'シ', r: ['shi', 'si'] },
      { h: 'す', k: 'ス', r: ['su'] },
      { h: 'せ', k: 'セ', r: ['se'] },
      { h: 'そ', k: 'ソ', r: ['so'] },
    ],
  },
  {
    id: 't-row', label: 'T-row',
    grid: [
      { h: 'た', k: 'タ', r: ['ta'] },
      { h: 'ち', k: 'チ', r: ['chi', 'ti'] },
      { h: 'つ', k: 'ツ', r: ['tsu', 'tu'] },
      { h: 'て', k: 'テ', r: ['te'] },
      { h: 'と', k: 'ト', r: ['to'] },
    ],
  },
  {
    id: 'n-row', label: 'N-row',
    grid: [
      { h: 'な', k: 'ナ', r: ['na'] },
      { h: 'に', k: 'ニ', r: ['ni'] },
      { h: 'ぬ', k: 'ヌ', r: ['nu'] },
      { h: 'ね', k: 'ネ', r: ['ne'] },
      { h: 'の', k: 'ノ', r: ['no'] },
    ],
  },
  {
    id: 'h-row', label: 'H-row',
    grid: [
      { h: 'は', k: 'ハ', r: ['ha'] },
      { h: 'ひ', k: 'ヒ', r: ['hi'] },
      { h: 'ふ', k: 'フ', r: ['fu', 'hu'] },
      { h: 'へ', k: 'ヘ', r: ['he'] },
      { h: 'ほ', k: 'ホ', r: ['ho'] },
    ],
  },
  {
    id: 'm-row', label: 'M-row',
    grid: [
      { h: 'ま', k: 'マ', r: ['ma'] },
      { h: 'み', k: 'ミ', r: ['mi'] },
      { h: 'む', k: 'ム', r: ['mu'] },
      { h: 'め', k: 'メ', r: ['me'] },
      { h: 'も', k: 'モ', r: ['mo'] },
    ],
  },
  {
    id: 'y-row', label: 'Y-row',
    grid: [
      { h: 'や', k: 'ヤ', r: ['ya'] },
      null,
      { h: 'ゆ', k: 'ユ', r: ['yu'] },
      null,
      { h: 'よ', k: 'ヨ', r: ['yo'] },
    ],
  },
  {
    id: 'r-row', label: 'R-row',
    grid: [
      { h: 'ら', k: 'ラ', r: ['ra'] },
      { h: 'り', k: 'リ', r: ['ri'] },
      { h: 'る', k: 'ル', r: ['ru'] },
      { h: 'れ', k: 'レ', r: ['re'] },
      { h: 'ろ', k: 'ロ', r: ['ro'] },
    ],
  },
  {
    id: 'w-row', label: 'W-row',
    grid: [
      { h: 'わ', k: 'ワ', r: ['wa'] },
      null,
      null,
      null,
      { h: 'を', k: 'ヲ', r: ['wo'] },
    ],
  },
  {
    id: 'n', label: 'N',
    grid: [
      null,
      null,
      { h: 'ん', k: 'ン', r: ['n', 'nn'] },
      null,
      null,
    ],
  },
  {
    id: 'g-row', label: 'G-row', voiced: true,
    grid: [
      { h: 'が', k: 'ガ', r: ['ga'] },
      { h: 'ぎ', k: 'ギ', r: ['gi'] },
      { h: 'ぐ', k: 'グ', r: ['gu'] },
      { h: 'げ', k: 'ゲ', r: ['ge'] },
      { h: 'ご', k: 'ゴ', r: ['go'] },
    ],
  },
  {
    id: 'z-row', label: 'Z-row', voiced: true,
    grid: [
      { h: 'ざ', k: 'ザ', r: ['za'] },
      { h: 'じ', k: 'ジ', r: ['ji', 'zi'] },
      { h: 'ず', k: 'ズ', r: ['zu'] },
      { h: 'ぜ', k: 'ゼ', r: ['ze'] },
      { h: 'ぞ', k: 'ゾ', r: ['zo'] },
    ],
  },
  {
    id: 'd-row', label: 'D-row', voiced: true,
    grid: [
      { h: 'だ', k: 'ダ', r: ['da'] },
      { h: 'ぢ', k: 'ヂ', r: ['di', 'ji'] },
      { h: 'づ', k: 'ヅ', r: ['du', 'zu'] },
      { h: 'で', k: 'デ', r: ['de'] },
      { h: 'ど', k: 'ド', r: ['do'] },
    ],
  },
  {
    id: 'b-row', label: 'B-row', voiced: true,
    grid: [
      { h: 'ば', k: 'バ', r: ['ba'] },
      { h: 'び', k: 'ビ', r: ['bi'] },
      { h: 'ぶ', k: 'ブ', r: ['bu'] },
      { h: 'べ', k: 'ベ', r: ['be'] },
      { h: 'ぼ', k: 'ボ', r: ['bo'] },
    ],
  },
  {
    id: 'p-row', label: 'P-row', voiced: true,
    grid: [
      { h: 'ぱ', k: 'パ', r: ['pa'] },
      { h: 'ぴ', k: 'ピ', r: ['pi'] },
      { h: 'ぷ', k: 'プ', r: ['pu'] },
      { h: 'ぺ', k: 'ペ', r: ['pe'] },
      { h: 'ぽ', k: 'ポ', r: ['po'] },
    ],
  },
];

export const BASIC_GROUP_IDS = [
  'vowels', 'k-row', 's-row', 't-row', 'n-row',
  'h-row', 'm-row', 'y-row', 'r-row', 'w-row', 'n',
];
export const VOICED_GROUP_IDS = ['g-row', 'z-row', 'd-row', 'b-row', 'p-row'];
