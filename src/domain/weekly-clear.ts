import { WEEKLY_RESET } from '@/config/constants';

/** 주간 클리어 기록 */
export interface WeeklyClearRecord {
  characterId: string;
  serverId: string;
  characterName: string;
  clearedAt: string; // ISO date string
  weekKey: string; // "2026-W15" 형태
}

/** 현재 주차 키 계산 (KST 기준, 목요일 06시 리셋) */
export function getCurrentWeekKey(): string {
  const now = new Date();
  // KST = UTC + 9
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);

  // 목요일 06시 이전이면 이전 주로 간주
  const day = kstNow.getUTCDay();
  const hour = kstNow.getUTCHours();

  const msPerDay = 24 * 60 * 60 * 1000;
  let adjustedDate = new Date(kstNow);

  if (day < WEEKLY_RESET.DAY_OF_WEEK || (day === WEEKLY_RESET.DAY_OF_WEEK && hour < WEEKLY_RESET.HOUR_KST)) {
    // 아직 이번 주 리셋 전 → 이전 주
    adjustedDate = new Date(kstNow.getTime() - 7 * msPerDay);
  }

  // ISO 주차 계산
  const yearStart = new Date(Date.UTC(adjustedDate.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((adjustedDate.getTime() - yearStart.getTime()) / msPerDay) + 1;
  const weekNumber = Math.ceil(dayOfYear / 7);

  return `${adjustedDate.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

/** 특정 캐릭터가 이번 주에 클리어했는지 확인 */
export function isAlreadyCleared(
  records: WeeklyClearRecord[],
  characterId: string,
  serverId: string,
): boolean {
  const currentWeek = getCurrentWeekKey();
  return records.some(
    (r) =>
      r.characterId === characterId &&
      r.serverId === serverId &&
      r.weekKey === currentWeek,
  );
}
