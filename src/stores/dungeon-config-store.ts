import { create } from 'zustand';

import { storage } from '@/services/storage';
import { STORAGE_KEYS } from '@/config/constants';
import { DEFAULT_DUNGEONS } from '@/config/dungeons';

import type { DungeonDef, DungeonId } from '@/config/dungeons';

interface DungeonConfigState {
  dungeons: Record<DungeonId, DungeonDef>;
}

interface DungeonConfigActions {
  setMinFame: (id: DungeonId, value: number) => void;
  setCut: (
    id: DungeonId,
    kind: 'dealerCut' | 'bufferCut',
    mode: 'full' | 'direct',
    value: number,
  ) => void;
  resetToDefaults: () => void;
}

function loadInitial(): Record<DungeonId, DungeonDef> {
  const saved = storage.get<Record<DungeonId, DungeonDef>>(STORAGE_KEYS.DUNGEON_CONFIG);
  if (!saved) return cloneDefaults();
  // 누락된 던전은 기본값으로 보충 (스키마 진화 대응)
  const merged = cloneDefaults();
  for (const id of Object.keys(merged) as DungeonId[]) {
    const stored = saved[id];
    if (stored && typeof stored.minFame === 'number' && stored.dealerCut && stored.bufferCut) {
      merged[id] = stored;
    }
  }
  return merged;
}

function cloneDefaults(): Record<DungeonId, DungeonDef> {
  return JSON.parse(JSON.stringify(DEFAULT_DUNGEONS));
}

function persist(dungeons: Record<DungeonId, DungeonDef>): void {
  storage.set(STORAGE_KEYS.DUNGEON_CONFIG, dungeons);
}

export const useDungeonConfigStore = create<DungeonConfigState & DungeonConfigActions>((set, get) => ({
  dungeons: loadInitial(),

  setMinFame: (id, value) => {
    set((state) => ({
      dungeons: {
        ...state.dungeons,
        [id]: { ...state.dungeons[id], minFame: value },
      },
    }));
    persist(get().dungeons);
  },

  setCut: (id, kind, mode, value) => {
    set((state) => {
      const target = state.dungeons[id];
      const updatedCut = { ...target[kind], [mode]: value };
      return {
        dungeons: {
          ...state.dungeons,
          [id]: { ...target, [kind]: updatedCut },
        },
      };
    });
    persist(get().dungeons);
  },

  resetToDefaults: () => {
    const fresh = cloneDefaults();
    set({ dungeons: fresh });
    persist(fresh);
  },
}));
