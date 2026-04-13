import { create } from 'zustand';

import { storage } from '@/services/storage';
import { STORAGE_KEYS } from '@/config/constants';

import type { RaidRecruitCard } from '@/domain/raid-recruit';

interface RaidRecruitState {
  matchCount: number;
  cards: RaidRecruitCard[];
}

interface RaidRecruitActions {
  setMatchCount: (count: number) => void;
  addCard: (card: Omit<RaidRecruitCard, 'id'>) => void;
  removeCard: (id: string) => void;
  clearCards: () => void;
  loadFromStorage: () => void;
}

function loadInitialState(): RaidRecruitState {
  const saved = storage.get<RaidRecruitState>(STORAGE_KEYS.RAID_RECRUIT);
  if (saved && Array.isArray(saved.cards)) {
    return { matchCount: saved.matchCount ?? 3, cards: saved.cards };
  }
  return { matchCount: 3, cards: [] };
}

function persist(state: RaidRecruitState): void {
  storage.set(STORAGE_KEYS.RAID_RECRUIT, state);
}

export const useRaidRecruitStore = create<RaidRecruitState & RaidRecruitActions>((set, get) => ({
  ...loadInitialState(),

  setMatchCount: (count) => {
    set({ matchCount: count });
    persist(get());
  },

  addCard: (card) => {
    const exists = get().cards.some((c) => c.ownerName === card.ownerName);
    if (exists) return;
    const newCard: RaidRecruitCard = { ...card, id: crypto.randomUUID() };
    set((state) => ({ cards: [...state.cards, newCard] }));
    persist(get());
  },

  removeCard: (id) => {
    set((state) => ({ cards: state.cards.filter((c) => c.id !== id) }));
    persist(get());
  },

  clearCards: () => {
    set({ cards: [] });
    persist(get());
  },

  loadFromStorage: () => {
    set(loadInitialState());
  },
}));
