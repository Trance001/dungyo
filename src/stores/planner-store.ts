import { create } from 'zustand';

import { storage } from '@/services/storage';
import { STORAGE_KEYS } from '@/config/constants';

import type { PartyCard, RotationTemplate, RotationTemplateId } from '@/domain/planner';
import { ROTATION_TEMPLATES } from '@/domain/planner';

interface PlannerState {
  templateId: RotationTemplateId;
  customTemplate: RotationTemplate | null;
  cards: PartyCard[];
}

interface PlannerActions {
  setTemplate: (template: RotationTemplate) => void;
  getActiveTemplate: () => RotationTemplate;
  addCard: (card: Omit<PartyCard, 'id'>) => void;
  removeCard: (id: string) => void;
  moveCard: (fromIndex: number, toIndex: number) => void;
  clearCards: () => void;
  loadFromStorage: () => void;
}

function loadInitialState(): PlannerState {
  const saved = storage.get<PlannerState>(STORAGE_KEYS.PLANNER_SESSION);
  if (saved && saved.templateId && Array.isArray(saved.cards)) {
    return { templateId: saved.templateId, customTemplate: saved.customTemplate ?? null, cards: saved.cards };
  }
  return { templateId: 'party4_normal', customTemplate: null, cards: [] };
}

function persist(state: PlannerState): void {
  storage.set(STORAGE_KEYS.PLANNER_SESSION, state);
}

export const usePlannerStore = create<PlannerState & PlannerActions>((set, get) => ({
  ...loadInitialState(),

  setTemplate: (template) => {
    const isStatic = template.id !== 'dynamic';
    set({
      templateId: template.id,
      customTemplate: isStatic ? null : template,
      cards: [],
    });
    persist(get());
  },

  getActiveTemplate: () => {
    const state = get();
    if (state.customTemplate) return state.customTemplate;
    return ROTATION_TEMPLATES[state.templateId] ?? ROTATION_TEMPLATES.party4_normal!;
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
