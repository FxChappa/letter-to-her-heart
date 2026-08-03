export type LetterProgress = {
  entered: boolean;
  unlockedSecond: boolean;
  visitedNewChapter: boolean;
};

const key = 'our-little-forever-letter-progress';
const legacyKeys = [
  'our-little-space-letter-progress',
  'letter-to-her-heart-letter-progress',
];

export const defaultLetterProgress: LetterProgress = {
  entered: false,
  unlockedSecond: false,
  visitedNewChapter: false,
};

export const readLetterProgress = (): LetterProgress => {
  try {
    const current = localStorage.getItem(key);
    const legacy = legacyKeys.map(legacyKey => localStorage.getItem(legacyKey)).find(Boolean);
    const raw = current ?? legacy;
    if (!raw) return defaultLetterProgress;
    const progress = { ...defaultLetterProgress, ...(JSON.parse(raw) as Partial<LetterProgress>) };
    if (!current && legacy) localStorage.setItem(key, JSON.stringify(progress));
    return progress;
  } catch {
    return defaultLetterProgress;
  }
};

export const saveLetterProgress = (progress: LetterProgress): void => {
  localStorage.setItem(key, JSON.stringify(progress));
};

export const normalizeUnlockAnswer = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9\s']/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const isAcceptedUnlockAnswer = (value: string): boolean => {
  const accepted = [
    'i want a lifetime of nights with you',
    'a lifetime of nights with you',
    'lifetime of nights with you',
  ];
  return accepted.includes(normalizeUnlockAnswer(value));
};
