import { create } from 'zustand';

import { storage } from '@/services/storage';
import { STORAGE_KEYS } from '@/config/constants';

import type { PartyCard, RotationTemplate, RotationTemplateId } from '@/domain/planner';
import { ROTATION_TEMPLATES } from '@/domain/planner';

/** 카드 이력 항목 */
export interface CardHistoryEntry {
  card: Omit<PartyCard, 'id'>;
  registeredAt: string;
}

/** 템플릿별 카드 이력 */
type CardHistoryMap = Record<string, CardHistoryEntry[]>;

interface PlannerState {
  templateId: RotationTemplateId;
  customTemplate: RotationTemplate | null;
  cards: PartyCard[];
}

interface PlannerActions {
  setTemplate: (template: RotationTemplate) => void;
  getActiveTemplate: () => RotationTemplate;
  addCard: (card: Omit<PartyCard, 'id'>) => void;
  updateCard: (id: string, card: Omit<PartyCard, 'id'>) => void;
  removeCard: (id: string) => void;
  moveCard: (fromIndex: number, toIndex: number) => void;
  clearCards: () => void;
  loadFromStorage: () => void;
  getCardHistory: () => CardHistoryEntry[];
  clearCardHistory: () => void;
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

const MAX_HISTORY_PER_TEMPLATE = 50;

function loadCardHistory(): CardHistoryMap {
  return storage.get<CardHistoryMap>(STORAGE_KEYS.CARD_HISTORY) ?? {};
}

function saveCardToHistory(templateId: string, card: Omit<PartyCard, 'id'>): void {
  const history = loadCardHistory();
  const entries = history[templateId] ?? [];

  // 같은 ownerName이 이미 있으면 최신으로 교체
  const filtered = entries.filter((e) => e.card.ownerName !== card.ownerName);
  filtered.unshift({ card, registeredAt: new Date().toISOString() });

  history[templateId] = filtered.slice(0, MAX_HISTORY_PER_TEMPLATE);
  storage.set(STORAGE_KEYS.CARD_HISTORY, history);
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
    const exists = get().cards.some((c) => c.ownerName === card.ownerName);
    if (exists) return;
    const newCard: PartyCard = { ...card, id: crypto.randomUUID() };
    set((state) => ({ cards: [...state.cards, newCard] }));
    persist(get());
    saveCardToHistory(get().templateId, card);
  },

  updateCard: (id, card) => {
    set((state) => ({
      cards: state.cards.map((c) => (c.id === id ? { ...card, id } : c)),
    }));
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

  getCardHistory: () => {
    const history = loadCardHistory();
    return history[get().templateId] ?? [];
  },

  clearCardHistory: () => {
    const history = loadCardHistory();
    delete history[get().templateId];
    storage.set(STORAGE_KEYS.CARD_HISTORY, history);
  },
}));
