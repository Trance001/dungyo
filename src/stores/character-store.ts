import { create } from 'zustand';
import type { Character } from '@/domain/character';
import type { WeeklyClearRecord } from '@/domain/weekly-clear';
import { getCurrentWeekKey } from '@/domain/weekly-clear';
import { storage } from '@/services/storage';
import { STORAGE_KEYS } from '@/config/constants';
import { characterKey } from '@/domain/party-builder';

interface CharacterState {
  /** 모험단명 */
  adventureName: string | null;
  /** 서버 ID */
  serverId: string | null;
  /** 모험단 내 캐릭터 목록 */
  characters: Character[];
  /** 캐릭터별 딜(데미지) 수치 (사용자 수동 입력) */
  damageMap: Map<string, number>;
  /** 캐릭터별 버프력 수치 (사용자 수동 입력) */
  buffPowerMap: Map<string, number>;
  /** 주간 클리어 기록 */
  weeklyClearRecords: WeeklyClearRecord[];
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
}

interface CharacterActions {
  setAdventure: (serverId: string, adventureName: string) => void;
  clearAdventure: () => void;
  setCharacters: (characters: Character[]) => void;
  addCharacter: (character: Character) => void;
  removeCharacter: (serverId: string, characterId: string) => void;
  setDamage: (serverId: string, characterId: string, damage: number) => void;
  setBuffPower: (serverId: string, characterId: string, buffPower: number) => void;
  markCleared: (character: Character) => void;
  unmarkCleared: (serverId: string, characterId: string) => void;
  clearAllWeeklyRecords: () => void;
  cleanExpiredClears: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

export const useCharacterStore = create<CharacterState & CharacterActions>(
  (set, get) => ({
    adventureName: null,
    serverId: null,
    characters: [],
    damageMap: new Map(),
    buffPowerMap: new Map(),
    weeklyClearRecords: [],
    isLoading: false,
    error: null,

    setAdventure: (serverId, adventureName) => {
      set({ serverId, adventureName });
      get().saveToStorage();
    },

    clearAdventure: () => {
      set({ serverId: null, adventureName: null, characters: [], damageMap: new Map(), buffPowerMap: new Map() });
      get().saveToStorage();
    },

    setCharacters: (characters) => {
      set({ characters });
      get().saveToStorage();
    },

    addCharacter: (character) => {
      set((state) => {
        const key = characterKey(character);
        const exists = state.characters.some(
          (c) => characterKey(c) === key,
        );
        if (exists) return state;
        return { characters: [...state.characters, character] };
      });
      get().saveToStorage();
    },

    removeCharacter: (serverId, characterId) => {
      const key = `${serverId}:${characterId}`;
      set((state) => ({
        characters: state.characters.filter(
          (c) => characterKey(c) !== key,
        ),
      }));
      get().saveToStorage();
    },

    setDamage: (serverId, characterId, damage) => {
      set((state) => {
        const newMap = new Map(state.damageMap);
        newMap.set(`${serverId}:${characterId}`, damage);
        return { damageMap: newMap };
      });
      get().saveToStorage();
    },

    setBuffPower: (serverId, characterId, buffPower) => {
      set((state) => {
        const newMap = new Map(state.buffPowerMap);
        newMap.set(`${serverId}:${characterId}`, buffPower);
        return { buffPowerMap: newMap };
      });
      get().saveToStorage();
    },

    markCleared: (character) => {
      const record: WeeklyClearRecord = {
        characterId: character.characterId,
        serverId: character.serverId,
        characterName: character.characterName,
        clearedAt: new Date().toISOString(),
        weekKey: getCurrentWeekKey(),
      };
      set((state) => ({
        weeklyClearRecords: [...state.weeklyClearRecords, record],
      }));
      get().saveToStorage();
    },

    unmarkCleared: (serverId, characterId) => {
      const currentWeek = getCurrentWeekKey();
      set((state) => ({
        weeklyClearRecords: state.weeklyClearRecords.filter(
          (r) =>
            !(
              r.characterId === characterId &&
              r.serverId === serverId &&
              r.weekKey === currentWeek
            ),
        ),
      }));
      get().saveToStorage();
    },

    clearAllWeeklyRecords: () => {
      set({ weeklyClearRecords: [] });
      get().saveToStorage();
    },

    cleanExpiredClears: () => {
      const currentWeek = getCurrentWeekKey();
      set((state) => ({
        weeklyClearRecords: state.weeklyClearRecords.filter(
          (r) => r.weekKey === currentWeek,
        ),
      }));
      get().saveToStorage();
    },

    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    loadFromStorage: () => {
      const saved = storage.get<StoredCharacterData>(STORAGE_KEYS.ADVENTURE_CACHE);
      if (!saved) return;

      set({
        adventureName: saved.adventureName ?? null,
        serverId: saved.serverId ?? null,
        characters: saved.characters ?? [],
        damageMap: new Map(Object.entries(saved.damageMap ?? {})),
        buffPowerMap: new Map(Object.entries(saved.buffPowerMap ?? {})),
        weeklyClearRecords: saved.weeklyClearRecords ?? [],
      });

      // 만료된 클리어 기록 정리
      get().cleanExpiredClears();
    },

    saveToStorage: () => {
      const state = get();
      const data: StoredCharacterData = {
        adventureName: state.adventureName,
        serverId: state.serverId,
        characters: state.characters,
        damageMap: Object.fromEntries(state.damageMap),
        buffPowerMap: Object.fromEntries(state.buffPowerMap),
        weeklyClearRecords: state.weeklyClearRecords,
      };
      storage.set(STORAGE_KEYS.ADVENTURE_CACHE, data);
    },
  }),
);

/** localStorage에 직렬화하기 위한 구조 */
interface StoredCharacterData {
  adventureName: string | null;
  serverId: string | null;
  characters: Character[];
  damageMap: Record<string, number>;
  buffPowerMap: Record<string, number>;
  weeklyClearRecords: WeeklyClearRecord[];
}
