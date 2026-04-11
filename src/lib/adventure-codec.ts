import type { Character } from '@/domain/character';
import type { WeeklyClearRecord } from '@/domain/weekly-clear';

/** 내보내기/가져오기 대상 모험단 데이터 스냅샷 */
export interface AdventureSnapshot {
  adventureName: string | null;
  serverId: string | null;
  characters: Character[];
  damageMap: Record<string, number>;
  buffPowerMap: Record<string, number>;
  roleOverrideMap: Record<string, 'dealer' | 'buffer'>;
  weeklyClearRecords: WeeklyClearRecord[];
}

interface EncodedAdventure {
  v: 1;
  d: AdventureSnapshot;
}

function utf8ToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToUtf8(base64: string): string {
  const padded = base64.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (padded.length % 4)) % 4);
  const binary = atob(padded + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/** 모험단 스냅샷을 코드로 인코딩 */
export function encodeAdventure(snapshot: AdventureSnapshot): string {
  const encoded: EncodedAdventure = { v: 1, d: snapshot };
  return utf8ToBase64Url(JSON.stringify(encoded));
}

/** 코드를 모험단 스냅샷으로 디코딩. 실패 시 null */
export function decodeAdventure(code: string): AdventureSnapshot | null {
  try {
    const trimmed = code.trim();
    if (!trimmed) return null;
    const json = base64UrlToUtf8(trimmed);
    const parsed = JSON.parse(json) as EncodedAdventure;
    if (parsed.v !== 1 || !parsed.d || typeof parsed.d !== 'object') return null;
    const d = parsed.d;
    if (!Array.isArray(d.characters)) return null;
    return {
      adventureName: typeof d.adventureName === 'string' ? d.adventureName : null,
      serverId: typeof d.serverId === 'string' ? d.serverId : null,
      characters: d.characters,
      damageMap: d.damageMap ?? {},
      buffPowerMap: d.buffPowerMap ?? {},
      roleOverrideMap: d.roleOverrideMap ?? {},
      weeklyClearRecords: Array.isArray(d.weeklyClearRecords) ? d.weeklyClearRecords : [],
    };
  } catch {
    return null;
  }
}
