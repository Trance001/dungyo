import { useEffect, useState } from 'react';

/**
 * URL 해시에서 프리셋 코드를 감지하고, 감지 후에는 해시를 제거한다.
 * 형식: #preset=XXXX
 */
export function usePresetUrlHash(): {
  pendingCode: string | null;
  clearPendingCode: () => void;
} {
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  useEffect(() => {
    function readHash() {
      const hash = window.location.hash;
      if (!hash) return;
      const match = hash.match(/^#preset=(.+)$/);
      if (match) {
        setPendingCode(match[1]);
        // 해시 제거 (페이지 새로고침 없이)
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }

    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, []);

  function clearPendingCode() {
    setPendingCode(null);
  }

  return { pendingCode, clearPendingCode };
}

/** 프리셋 코드로 공유 URL 생성 */
export function buildPresetShareUrl(code: string): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}#preset=${code}`;
}
