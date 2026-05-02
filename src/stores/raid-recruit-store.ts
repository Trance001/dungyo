import { create } from 'zustand';

import { storage } from '@/services/storage';
import { STORAGE_KEYS } from '@/config/constants';
import { parseDundamText } from '@/domain/dundam-parser';
import { isBufferJob } from '@/domain/character';

import type { RaidRecruitCard, RaidRecruitCharacter, SlotPosition } from '@/domain/raid-recruit';

interface RaidRecruitState {
  matchCount: number;
  cards: RaidRecruitCard[];
  swaps: Array<{ from: SlotPosition; to: SlotPosition }>;
}

interface RaidRecruitActions {
  setMatchCount: (count: number) => void;
  addCard: (card: Omit<RaidRecruitCard, 'id'>) => void;
  removeCard: (id: string) => void;
  updateCardCharacters: (id: string, dealers: RaidRecruitCharacter[], buffers: RaidRecruitCharacter[]) => void;
  fillCardFromDundam: (id: string, dundamText: string) => string | null;
  addSwap: (from: SlotPosition, to: SlotPosition) => void;
  clearSwaps: () => void;
  clearCards: () => void;
  loadFromStorage: () => void;
}

function loadInitialState(): RaidRecruitState {
  const saved = storage.get<RaidRecruitState>(STORAGE_KEYS.RAID_RECRUIT);
  if (saved && Array.isArray(saved.cards)) {
    return { matchCount: saved.matchCount ?? 3, cards: saved.cards, swaps: saved.swaps ?? [] };
  }
  return { matchCount: 3, cards: [], swaps: [] };
}

function persist(state: RaidRecruitState): void {
  storage.set(STORAGE_KEYS.RAID_RECRUIT, state);
}

export const useRaidRecruitStore = create<RaidRecruitState & RaidRecruitActions>((set, get) => ({
  ...loadInitialState(),

  setMatchCount: (count) => {
    set({ matchCount: count, swaps: [] });
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

  updateCardCharacters: (id, dealers, buffers) => {
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === id ? { ...c, dealers, buffers } : c,
      ),
    }));
    persist(get());
  },

  fillCardFromDundam: (id, dundamText) => {
    const parsed = parseDundamText(dundamText);
    if (!parsed.adventureName || parsed.characters.length === 0) {
      return '던담 데이터를 인식할 수 없습니다.';
    }

    const dealers: RaidRecruitCharacter[] = [];
    const buffers: RaidRecruitCharacter[] = [];

    for (const c of parsed.characters) {
      if (isBufferJob(c.jobGrowName) && c.buffPower !== null) {
        buffers.push({ name: c.characterName, stat: Math.round(c.buffPower / 1000) / 10 });
      } else if (c.damage !== null) {
        dealers.push({ name: c.characterName, stat: c.damage });
      }
    }

    const card = get().cards.find((c) => c.id === id);
    if (!card) return '카드를 찾을 수 없습니다.';

    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === id
          ? { ...c, dealers: dealers.slice(0, c.dealerCount), buffers: buffers.slice(0, c.bufferCount) }
          : c,
      ),
    }));
    persist(get());
    return null;
  },

  addSwap: (from, to) => {
    set((state) => ({ swaps: [...state.swaps, { from, to }] }));
    persist(get());
  },

  clearSwaps: () => {
    set({ swaps: [] });
    persist(get());
  },

  clearCards: () => {
    set({ cards: [], swaps: [] });
    persist(get());
  },

  loadFromStorage: () => {
    set(loadInitialState());
  },
}));
