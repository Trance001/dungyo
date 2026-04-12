import { create } from 'zustand';

import { storage } from '@/services/storage';
import { STORAGE_KEYS } from '@/config/constants';

import type { PartyCard, RotationTemplateId } from '@/domain/planner';

interface PlannerState {
  templateId: RotationTemplateId;
  cards: PartyCard[];
}

interface PlannerActions {
  setTemplate: (templateId: RotationTemplateId) => void;
  addCard: (card: Omit<PartyCard, 'id'>) => void;
  removeCard: (id: string) => void;
  moveCard: (fromIndex: number, toIndex: number) => void;
  clearCards: () => void;
  loadFromStorage: () => void;
}

function loadInitialState(): PlannerState {
  const saved = storage.get<PlannerState>(STORAGE_KEYS.PLANNER_SESSION);
  if (saved && saved.templateId && Array.isArray(saved.cards)) {
    return saved;
  }
  return { templateId: 'party4_normal', cards: [] };
}

function persist(state: PlannerState): void {
  storage.set(STORAGE_KEYS.PLANNER_SESSION, state);
}

export const usePlannerStore = create<PlannerState & PlannerActions>((set, get) => ({
  ...loadInitialState(),

  setTemplate: (templateId) => {
    // 템플릿 변경 시 기존 카드는 유지하지 않음 (역할 구성이 다르므로)
    set({ templateId, cards: [] });
    persist(get());
  },

  addCard: (card) => {
    const newCard: PartyCard = { ...card, id: crypto.randomUUID() };
    set((state) => ({ cards: [...state.cards, newCard] }));
    persist(get());
  },

  removeCard: (id) => {
    set((state) => ({ cards: state.cards.filter((c) => c.id !== id) }));
    persist(get());
  },

  moveCard: (fromIndex, toIndex) => {
    set((state) => {
      if (fromIndex < 0 || fromIndex >= state.cards.length) return state;
      if (toIndex < 0 || toIndex >= state.cards.length) return state;
      const next = [...state.cards];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { cards: next };
    });
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
