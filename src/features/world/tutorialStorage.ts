const tutorialKey = 'our-little-forever-controls-tutorial-v1';
const legacyTutorialKeys = [
  'our-little-space-controls-tutorial',
  'letter-to-her-heart-controls-tutorial',
];

export const hasCompletedControlsTutorial = (): boolean => {
  try {
    if (localStorage.getItem(tutorialKey) === 'complete') return true;
    const legacyComplete = legacyTutorialKeys.some(key => localStorage.getItem(key) === 'complete');
    if (legacyComplete) localStorage.setItem(tutorialKey, 'complete');
    return legacyComplete;
  } catch {
    return false;
  }
};

export const markControlsTutorialComplete = (): void => {
  try {
    localStorage.setItem(tutorialKey, 'complete');
  } catch {
    // A private browsing policy may block local storage; the tutorial can still close for this visit.
  }
};

export const isTouchFirstDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
};
