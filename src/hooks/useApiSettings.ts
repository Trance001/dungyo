import { useCallback, useEffect, useRef, useState } from 'react';

import { storage } from '@/services/storage';
import { STORAGE_KEYS } from '@/config/constants';

interface ApiSettingsData {
  proxyUrl: string;
}

interface UseApiSettingsReturn {
  proxyUrl: string;
  setProxyUrl: (url: string) => void;
  saved: boolean;
  saveSettings: () => void;
}

export function useApiSettings(): UseApiSettingsReturn {
  const [proxyUrl, setProxyUrl] = useState(() => {
    const settings = storage.get<ApiSettingsData>(STORAGE_KEYS.API_SETTINGS);
    return settings?.proxyUrl ?? '';
  });
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const saveSettings = useCallback(() => {
    storage.set<ApiSettingsData>(STORAGE_KEYS.API_SETTINGS, {
      proxyUrl: proxyUrl.trim(),
    });
    setSaved(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSaved(false), 2000);
  }, [proxyUrl]);

  return { proxyUrl, setProxyUrl, saved, saveSettings };
}
