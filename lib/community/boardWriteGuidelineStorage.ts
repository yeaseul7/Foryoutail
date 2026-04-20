export const BOARD_WRITE_GUIDELINE_DISMISSED_KEY =
  'kkosunnae:board-write-guideline-dismissed';

const CHANGE_EVENT = 'kkosunnae:board-write-guideline-change';

export function subscribeBoardWriteGuidelineDismissed(
  onStoreChange: () => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === BOARD_WRITE_GUIDELINE_DISMISSED_KEY || e.key === null) {
      onStoreChange();
    }
  };
  const onLocal = () => onStoreChange();
  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGE_EVENT, onLocal);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CHANGE_EVENT, onLocal);
  };
}

export function getBoardWriteGuidelineDismissedSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(BOARD_WRITE_GUIDELINE_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function getBoardWriteGuidelineDismissedServerSnapshot(): boolean {
  return false;
}

export function dismissBoardWriteGuideline(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BOARD_WRITE_GUIDELINE_DISMISSED_KEY, '1');
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    /* private mode 등 */
  }
}
