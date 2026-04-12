import { jobNameToCode, jobCodeToName } from '@/config/job-codes';

import type { PartyCard, PartyCardCharacter, RotationTemplateId } from '@/domain/planner';

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

/**
 * v3 파이프 구분 압축 포맷
 * 형식: 3|소유자|역할:이름,직업코드,수치|역할:이름,직업코드,수치|...
 * 역할: b=버퍼, d=딜러, s=업둥버퍼
 * 직업코드: 숫자(매핑 있음) 또는 원본 직업명(매핑 없음)
 */
function encodeCharV3(role: string, c: PartyCardCharacter): string {
  const jCode = jobNameToCode(c.jobGrowName);
  const job = jCode !== null ? String(jCode) : c.jobGrowName;
  return `${role}:${c.characterName},${job},${c.stat}`;
}

function decodeCharV3(segment: string): { role: string; char: PartyCardCharacter } | null {
  const colonIdx = segment.indexOf(':');
  if (colonIdx < 1) return null;
  const role = segment.slice(0, colonIdx);
  const parts = segment.slice(colonIdx + 1).split(',');
  if (parts.length < 3) return null;

  const name = parts[0];
  const jobRaw = parts[1];
  const stat = Number(parts[2]) || 0;

  // 직업: 숫자면 코드에서 복원, 아니면 원본
  const jobCode = Number(jobRaw);
  let jobGrowName: string;
  if (!isNaN(jobCode) && jobCodeToName(jobCode)) {
    jobGrowName = jobCodeToName(jobCode)!;
  } else {
    jobGrowName = jobRaw;
  }

  return { role, char: { characterName: name, jobGrowName, stat } };
}

/** 파티 카드를 압축 코드로 인코딩 (v3) */
export function encodePartyCard(card: Omit<PartyCard, 'id'>, _templateId: RotationTemplateId): string {
  const parts = ['3', card.ownerName];
  for (const c of card.buffers) parts.push(encodeCharV3('b', c));
  for (const c of card.dealers) parts.push(encodeCharV3('d', c));
  for (const c of card.secondaryBuffers) parts.push(encodeCharV3('s', c));
  return utf8ToBase64Url(parts.join('|'));
}

export interface DecodedPartyCard {
  templateId: RotationTemplateId;
  card: Omit<PartyCard, 'id'>;
}

/** 코드 디코딩 (v1/v2/v3 호환). 실패 시 null */
export function decodePartyCard(code: string): DecodedPartyCard | null {
  try {
    const trimmed = code.trim();
    if (!trimmed) return null;
    const raw = base64UrlToUtf8(trimmed);

    // v3: 파이프 구분 포맷 ("3|..." 으로 시작)
    if (raw.startsWith('3|')) {
      return decodeV3(raw);
    }

    // v1/v2: JSON 포맷
    const parsed = JSON.parse(raw);
    if (parsed.v === 2) return decodeV2(parsed);
    if (parsed.v === 1) return decodeV1(parsed);
    return null;
  } catch {
    return null;
  }
}

function decodeV3(raw: string): DecodedPartyCard | null {
  const segments = raw.split('|');
  if (segments.length < 2) return null;

  const ownerName = segments[1];
  const buffers: PartyCardCharacter[] = [];
  const dealers: PartyCardCharacter[] = [];
  const secondaryBuffers: PartyCardCharacter[] = [];

  for (let i = 2; i < segments.length; i++) {
    const decoded = decodeCharV3(segments[i]);
    if (!decoded) continue;
    if (decoded.role === 'b') buffers.push(decoded.char);
    else if (decoded.role === 'd') dealers.push(decoded.char);
    else if (decoded.role === 's') secondaryBuffers.push(decoded.char);
  }

  return {
    templateId: 'party4_normal',
    card: { ownerName, buffers, dealers, secondaryBuffers, carries: [] },
  };
}

// --- v1/v2 하위 호환 ---

function expandChar(c: { n: string; j: string; s: number }): PartyCardCharacter {
  return { characterName: c.n, jobGrowName: c.j, stat: c.s };
}

function decodeV2(parsed: { o: string; b?: Array<{ n: string; j: string; s: number }>; dl?: Array<{ n: string; j: string; s: number }>; sb?: Array<{ n: string; j: string; s: number }> }): DecodedPartyCard | null {
  if (typeof parsed.o !== 'string') return null;
  return {
    templateId: 'party4_normal',
    card: {
      ownerName: parsed.o,
      buffers: (parsed.b ?? []).map(expandChar),
      dealers: (parsed.dl ?? []).map(expandChar),
      secondaryBuffers: (parsed.sb ?? []).map(expandChar),
      carries: [],
    },
  };
}

function decodeV1(parsed: { t: RotationTemplateId; d: Omit<PartyCard, 'id'> }): DecodedPartyCard | null {
  if (!parsed.d || typeof parsed.d !== 'object') return null;
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
