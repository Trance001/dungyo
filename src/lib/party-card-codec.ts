import type { PartyCard, PartyCardCharacter, RotationTemplateId } from '@/domain/planner';

/**
 * v2 압축 포맷 (키 축약 + 빈 배열 제거)
 * o: ownerName, b: buffers, dl: dealers, sb: secondaryBuffers
 * 각 캐릭터: n: name, j: job, s: stat
 * carries는 don't care이므로 생략
 */
interface EncodedV2 {
  v: 2;
  o: string;
  b?: Array<{ n: string; j: string; s: number }>;
  dl?: Array<{ n: string; j: string; s: number }>;
  sb?: Array<{ n: string; j: string; s: number }>;
}

/** v1 호환용 (기존 코드 디코딩) */
interface EncodedV1 {
  v: 1;
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

function compactChar(c: PartyCardCharacter): { n: string; j: string; s: number } {
  return { n: c.characterName, j: c.jobGrowName, s: c.stat };
}

function expandChar(c: { n: string; j: string; s: number }): PartyCardCharacter {
  return { characterName: c.n, jobGrowName: c.j, stat: c.s };
}

/** 파티 카드를 압축 코드로 인코딩 (v2) */
export function encodePartyCard(card: Omit<PartyCard, 'id'>, _templateId: RotationTemplateId): string {
  const payload: EncodedV2 = { v: 2, o: card.ownerName };
  if (card.buffers.length > 0) payload.b = card.buffers.map(compactChar);
  if (card.dealers.length > 0) payload.dl = card.dealers.map(compactChar);
  if (card.secondaryBuffers.length > 0) payload.sb = card.secondaryBuffers.map(compactChar);
  return utf8ToBase64Url(JSON.stringify(payload));
}

export interface DecodedPartyCard {
  templateId: RotationTemplateId;
  card: Omit<PartyCard, 'id'>;
}

/** 코드 디코딩 (v1/v2 호환). 실패 시 null */
export function decodePartyCard(code: string): DecodedPartyCard | null {
  try {
    const trimmed = code.trim();
    if (!trimmed) return null;
    const json = base64UrlToUtf8(trimmed);
    const raw = JSON.parse(json);

    if (raw.v === 2) {
      return decodeV2(raw as EncodedV2);
    }
    if (raw.v === 1) {
      return decodeV1(raw as EncodedV1);
    }
    return null;
  } catch {
    return null;
  }
}

function decodeV2(parsed: EncodedV2): DecodedPartyCard | null {
  if (typeof parsed.o !== 'string') return null;
  return {
    templateId: 'party4_normal', // v2에서는 실제 슬롯 수로 검증하므로 기본값
    card: {
      ownerName: parsed.o,
      buffers: (parsed.b ?? []).map(expandChar),
      dealers: (parsed.dl ?? []).map(expandChar),
      secondaryBuffers: (parsed.sb ?? []).map(expandChar),
      carries: [],
    },
  };
}

function decodeV1(parsed: EncodedV1): DecodedPartyCard | null {
  if (!parsed.d || typeof parsed.d !== 'object') return null;
  if (typeof parsed.t !== 'string') return null;
  const d = parsed.d;
  if (typeof d.ownerName !== 'string') return null;
  return {
    templateId: parsed.t,
    card: {
      ownerName: d.ownerName,
      buffers: Array.isArray(d.buffers) ? d.buffers : [],
      dealers: Array.isArray(d.dealers) ? d.dealers : [],
      secondaryBuffers: Array.isArray(d.secondaryBuffers) ? d.secondaryBuffers : [],
      carries: Array.isArray(d.carries) ? d.carries : [],
    },
  };
}
