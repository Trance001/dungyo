import { useState, useEffect, useCallback } from 'react';

import { storage } from '@/services/storage';
import { STORAGE_KEYS, DUNDAM_REFRESH_THRESHOLD_DAYS } from '@/config/constants';

interface UseDundamSyncReturn {
  /** 마지막 갱신 시각 (ISO 문자열) */
  lastSyncAt: string | null;
  /** 마지막 갱신 이후 경과 일수 */
  daysSinceSync: number | null;
  /** 갱신이 필요한지 여부 */
  needsRefresh: boolean;
  /** 던담 데이터 갱신 시 호출 */
  recordSync: () => void;
}

export function useDundamSync(): UseDundamSyncReturn {
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(() =>
    storage.get<string>(STORAGE_KEYS.LAST_DUNDAM_SYNC),
  );

  // 스토리지 변경 감지 (같은 탭 내 recordSync 호출 후 재계산용)
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEYS.LAST_DUNDAM_SYNC) {
        setLastSyncAt(e.newValue);
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const recordSync = useCallback(() => {
    const now = new Date().toISOString();
    storage.set(STORAGE_KEYS.LAST_DUNDAM_SYNC, now);
    setLastSyncAt(now);
  }, []);

  const daysSinceSync = lastSyncAt
    ? Math.floor((Date.now() - new Date(lastSyncAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const needsRefresh = daysSinceSync !== null && daysSinceSync >= DUNDAM_REFRESH_THRESHOLD_DAYS;

  return { lastSyncAt, daysSinceSync, needsRefresh, recordSync };
}
