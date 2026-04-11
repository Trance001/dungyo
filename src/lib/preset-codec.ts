import type { Preset } from '@/domain/preset';

/** 코드화 형식 (버전 관리용) */
interface EncodedPreset {
  v: 1;
  d: Omit<Preset, 'id'>;
}

/** UTF-8 문자열을 base64로 인코딩 */
function utf8ToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** base64 문자열을 UTF-8로 디코딩 */
function base64UrlToUtf8(base64: string): string {
  const padded = base64.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (padded.length % 4)) % 4);
  const binary = atob(padded + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/** 프리셋을 공유 가능한 코드로 인코딩 */
export function encodePreset(preset: Omit<Preset, 'id'>): string {
  const encoded: EncodedPreset = { v: 1, d: preset };
  return utf8ToBase64Url(JSON.stringify(encoded));
}

/** 공유 코드를 프리셋으로 디코딩. 실패 시 null 반환 */
export function decodePreset(code: string): Omit<Preset, 'id'> | null {
  try {
    const trimmed = code.trim();
    if (!trimmed) return null;
    const json = base64UrlToUtf8(trimmed);
    const parsed = JSON.parse(json) as EncodedPreset;
    if (parsed.v !== 1 || !parsed.d || typeof parsed.d !== 'object') return null;
    const d = parsed.d;
    if (typeof d.name !== 'string') return null;
    if (typeof d.totalMembers !== 'number') return null;
    if (typeof d.dealerSlots !== 'number') return null;
    if (typeof d.bufferSlots !== 'number') return null;
    if (typeof d.secondaryBufferSlots !== 'number') return null;
    if (typeof d.useTotalDamage !== 'boolean') return null;
    return {
      name: d.name,
      totalMembers: d.totalMembers,
      dealerSlots: d.dealerSlots,
      bufferSlots: d.bufferSlots,
      secondaryBufferSlots: d.secondaryBufferSlots,
      minDealerDamage: typeof d.minDealerDamage === 'number' ? d.minDealerDamage : 0,
      minPrimaryBuffPower: typeof d.minPrimaryBuffPower === 'number' ? d.minPrimaryBuffPower : 0,
      minSecondaryBuffPower: typeof d.minSecondaryBuffPower === 'number' ? d.minSecondaryBuffPower : 0,
      useTotalDamage: d.useTotalDamage,
      minTotalDamage: typeof d.minTotalDamage === 'number' ? d.minTotalDamage : 0,
      truncateOnesDigit: typeof d.truncateOnesDigit === 'boolean' ? d.truncateOnesDigit : false,
    };
  } catch {
    return null;
  }
}
