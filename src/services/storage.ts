/**
 * Storage 추상화 레이어
 * 현재: localStorage 구현
 * 추후: Firebase Firestore 등으로 교체 가능
 */

export interface StorageProvider {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

class LocalStorageProvider implements StorageProvider {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('localStorage 저장 실패:', e);
    }
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}

/** 현재 활성 스토리지 프로바이더 (추후 DI로 교체 가능) */
export const storage: StorageProvider = new LocalStorageProvider();
