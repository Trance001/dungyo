import { useState, useCallback } from 'react';

import { storage } from '@/services/storage';
import { STORAGE_KEYS } from '@/config/constants';

import type { Preset } from '@/domain/preset';

interface UsePresetsReturn {
  presets: Preset[];
  savePreset: (preset: Omit<Preset, 'id'>) => void;
  deletePreset: (id: string) => void;
}

function loadPresets(): Preset[] {
  return storage.get<Preset[]>(STORAGE_KEYS.PRESETS) ?? [];
}

function persistPresets(presets: Preset[]): void {
  storage.set(STORAGE_KEYS.PRESETS, presets);
}

export function usePresets(): UsePresetsReturn {
  const [presets, setPresets] = useState<Preset[]>(loadPresets);

  const savePreset = useCallback((preset: Omit<Preset, 'id'>) => {
    const newPreset: Preset = { ...preset, id: crypto.randomUUID() };
    const updated = [...loadPresets(), newPreset];
    persistPresets(updated);
    setPresets(updated);
  }, []);

  const deletePreset = useCallback((id: string) => {
    const updated = loadPresets().filter((p) => p.id !== id);
    persistPresets(updated);
    setPresets(updated);
  }, []);

  return { presets, savePreset, deletePreset };
}
