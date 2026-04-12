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
 * v4 초경량 포맷 (101자 이하, 치지직 채팅 호환)
 * 형식: 4|소유자|역할+직업코드.수치|역할+직업코드.수치|...
 * 캐릭터 이름은 포함하지 않음 (직업명으로 대체 표시)
 */
export function encodePartyCard(card: Omit<PartyCard, 'id'>, _templateId: RotationTemplateId): string {
  const parts = ['4', card.ownerName];
  for (const c of card.buffers) {
    const j = jobNameToCode(c.jobGrowName) ?? c.jobGrowName;
    parts.push(`b${j}.${c.stat}`);
  }
  for (const c of card.dealers) {
    const j = jobNameToCode(c.jobGrowName) ?? c.jobGrowName;
    parts.push(`d${j}.${c.stat}`);
  }
  for (const c of card.secondaryBuffers) {
    const j = jobNameToCode(c.jobGrowName) ?? c.jobGrowName;
    parts.push(`s${j}.${c.stat}`);
  }
  return utf8ToBase64Url(parts.join('|'));
}

export interface DecodedPartyCard {
  templateId: RotationTemplateId;
  card: Omit<PartyCard, 'id'>;
}

/** 코드 디코딩 (v1~v4 호환). 실패 시 null */
export function decodePartyCard(code: string): DecodedPartyCard | null {
  try {
    const trimmed = code.trim();
    if (!trimmed) return null;
    const raw = base64UrlToUtf8(trimmed);

    if (raw.startsWith('4|')) return decodeV4(raw);
    if (raw.startsWith('3|')) return decodeV3(raw);

    const parsed = JSON.parse(raw);
    if (parsed.v === 2) return decodeV2(parsed);
    if (parsed.v === 1) return decodeV1(parsed);
    return null;
  } catch {
    return null;
  }
}

/** v4 디코딩: 캐릭터 이름 없음, 직업명으로 대체 */
function decodeV4(raw: string): DecodedPartyCard | null {
  const segments = raw.split('|');
  if (segments.length < 2) return null;

  const ownerName = segments[1];
  const buffers: PartyCardCharacter[] = [];
  const dealers: PartyCardCharacter[] = [];
  const secondaryBuffers: PartyCardCharacter[] = [];

  for (let i = 2; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.length < 2) continue;

    const role = seg[0];
    const dotIdx = seg.indexOf('.');
    if (dotIdx < 2) continue;

    const jobRaw = seg.slice(1, dotIdx);
    const stat = Number(seg.slice(dotIdx + 1)) || 0;

    const jobCode = Number(jobRaw);
    const jobGrowName = (!isNaN(jobCode) && jobCodeToName(jobCode)) ? jobCodeToName(jobCode)! : jobRaw;
    // 캐릭터 이름 없으므로 직업명에서 眞 제거한 이름 사용
    const characterName = jobGrowName.replace(/^眞\s*/, '');

    const char: PartyCardCharacter = { characterName, jobGrowName, stat };
    if (role === 'b') buffers.push(char);
    else if (role === 'd') dealers.push(char);
    else if (role === 's') secondaryBuffers.push(char);
  }

  return {
    templateId: 'party4_normal',
    card: { ownerName, buffers, dealers, secondaryBuffers, carries: [] },
  };
}

// --- v3 하위 호환 ---

function decodeV3(raw: string): DecodedPartyCard | null {
  const segments = raw.split('|');
  if (segments.length < 2) return null;

  const ownerName = segments[1];
  const buffers: PartyCardCharacter[] = [];
  const dealers: PartyCardCharacter[] = [];
  const secondaryBuffers: PartyCardCharacter[] = [];

  for (let i = 2; i < segments.length; i++) {
    const colonIdx = segments[i].indexOf(':');
    if (colonIdx < 1) continue;
    const role = segments[i].slice(0, colonIdx);
    const parts = segments[i].slice(colonIdx + 1).split(',');
    if (parts.length < 3) continue;

    const jobRaw = parts[1];
    const jobCode = Number(jobRaw);
    const jobGrowName = (!isNaN(jobCode) && jobCodeToName(jobCode)) ? jobCodeToName(jobCode)! : jobRaw;

    const char: PartyCardCharacter = {
      characterName: parts[0],
      jobGrowName,
      stat: Number(parts[2]) || 0,
    };
    if (role === 'b') buffers.push(char);
    else if (role === 'd') dealers.push(char);
    else if (role === 's') secondaryBuffers.push(char);
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
