/**
 * 버프력 값(만 단위)을 소숫점 한 자리까지 내림(floor) 표시한다.
 * .toFixed(1)는 반올림이므로 직접 floor 후 toFixed로 단위 자릿수를 고정한다.
 * 예: 472.78 → "472.7" (반올림 시 "472.8")
 */
export function formatBuffPower(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0.0';
  return (Math.floor(value * 10) / 10).toFixed(1);
}
