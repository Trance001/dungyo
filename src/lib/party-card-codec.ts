import type { PartyCard, RotationTemplateId } from '@/domain/planner';

interface EncodedPartyCard {
  v: 1;
  /** 이 카드가 호환되는 템플릿 ID */
  t: RotationTemplateId;
  d: Omit<PartyCard, 'id'>;
}

function utf8ToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUtf8(base64: string): string {
  const padded = base64.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (padded.length % 4)) % 4);
  const binary = atob(padded + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/** 파티 카드 + 템플릿 ID를 공유 코드로 인코딩 */
export function encodePartyCard(card: Omit<PartyCard, 'id'>, templateId: RotationTemplateId): string {
  const payload: EncodedPartyCard = { v: 1, t: templateId, d: card };
  return utf8ToBase64Url(JSON.stringify(payload));
}

export interface DecodedPartyCard {
  templateId: RotationTemplateId;
  card: Omit<PartyCard, 'id'>;
}

/** 코드 디코딩. 실패 시 null */
export function decodePartyCard(code: string): DecodedPartyCard | null {
  try {
    const trimmed = code.trim();
    if (!trimmed) return null;
    const json = base64UrlToUtf8(trimmed);
    const parsed = JSON.parse(json) as EncodedPartyCard;
    if (parsed.v !== 1 || !parsed.d || typeof parsed.d !== 'object') return null;
    if (typeof parsed.t !== 'string') return null;
    const d = parsed.d;
    if (typeof d.ownerName !== 'string') return null;
    if (!Array.isArray(d.buffers) || !Array.isArray(d.dealers) || !Array.isArray(d.secondaryBuffers) || !Array.isArray(d.carries)) {
      return null;
    }
    return {
      templateId: parsed.t,
      card: {
        ownerName: d.ownerName,
        buffers: d.buffers,
        dealers: d.dealers,
        secondaryBuffers: d.secondaryBuffers,
        carries: d.carries,
      },
    };
  } catch {
    return null;
  }
}
