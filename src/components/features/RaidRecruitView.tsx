import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRaidRecruitStore } from '@/stores/raid-recruit-store';
import { buildRaidRecruitAssignment } from '@/domain/raid-recruit';

export function RaidRecruitView() {
  const {
    matchCount,
    slotsPerMatch,
    cards,
    setMatchCount,
    setSlotsPerMatch,
    addCard,
    removeCard,
    clearCards,
  } = useRaidRecruitStore();

  const [ownerName, setOwnerName] = useState('');
  const [dealerCount, setDealerCount] = useState('');
  const [bufferCount, setBufferCount] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const assignment = useMemo(
    () => buildRaidRecruitAssignment(cards, { matchCount, slotsPerMatch }),
    [cards, matchCount, slotsPerMatch],
  );

  function handleAddCard() {
    const name = ownerName.trim();
    if (!name) return;

    const d = Number(dealerCount) || 0;
    const b = Number(bufferCount) || 0;
    if (d + b === 0) {
      setAddError('딜러 또는 버퍼를 1개 이상 입력하세요.');
      return;
    }
    if (d + b > matchCount) {
      setAddError(`딜러+버퍼(${d + b})가 기수(${matchCount})보다 많습니다.`);
      return;
    }
    if (cards.some((c) => c.ownerName === name)) {
      setAddError(`'${name}' 모험단은 이미 등록되어 있습니다.`);
      return;
    }

    addCard({ ownerName: name, dealerCount: d, bufferCount: b });
    setOwnerName('');
    setDealerCount('');
    setBufferCount('');
    setAddError(null);
  }

  return (
    <div className="space-y-6">
      {/* 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>레이드 편성 설정</CardTitle>
          <CardDescription>기수 수와 기수당 인원을 설정하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-1">
              <Label htmlFor="matchCount">기수 수</Label>
              <Input
                id="matchCount"
                type="number"
                className="w-24"
                value={matchCount}
                onChange={(e) => setMatchCount(Number(e.target.value) || 1)}
                min={1}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slotsPerMatch">기수당 인원</Label>
              <Input
                id="slotsPerMatch"
                type="number"
                className="w-24"
                value={slotsPerMatch}
                onChange={(e) => setSlotsPerMatch(Number(e.target.value) || 1)}
                min={1}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 카드 등록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>참가자 등록 ({cards.length})</CardTitle>
              <CardDescription>모험단명과 딜러/버퍼 수를 입력하세요</CardDescription>
            </div>
            {cards.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCards} className="text-destructive hover:text-destructive">
                전체 삭제
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Label htmlFor="ownerName">모험단명</Label>
              <Input
                id="ownerName"
                placeholder="모험단명"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCard()}
              />
            </div>
            <div className="w-20 space-y-1">
              <Label htmlFor="dealerCnt">딜러</Label>
              <Input
                id="dealerCnt"
                type="number"
                placeholder="0"
                value={dealerCount}
                onChange={(e) => setDealerCount(e.target.value)}
                min={0}
              />
            </div>
            <div className="w-20 space-y-1">
              <Label htmlFor="bufferCnt">버퍼</Label>
              <Input
                id="bufferCnt"
                type="number"
                placeholder="0"
                value={bufferCount}
                onChange={(e) => setBufferCount(e.target.value)}
                min={0}
              />
            </div>
            <Button onClick={handleAddCard} className="shrink-0">
              추가
            </Button>
          </div>

          {addError && (
            <p className="text-xs text-destructive">{addError}</p>
          )}

          {cards.length > 0 && (
            <div className="space-y-1">
              {cards.map((card) => (
                <div key={card.id} className="flex items-center justify-between rounded border border-border px-3 py-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{card.ownerName}</span>
                    <Badge variant="secondary" className="bg-red-500/15 text-red-400 text-xs">딜 {card.dealerCount}</Badge>
                    <Badge variant="secondary" className="bg-blue-500/15 text-blue-400 text-xs">벞 {card.bufferCount}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeCard(card.id)} className="text-destructive hover:text-destructive h-6">
                    삭제
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 배정 결과 */}
      {cards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>편성 결과</CardTitle>
            <CardDescription>
              {assignment.vacancies > 0
                ? `구인 ${assignment.vacancies}명`
                : '모든 슬롯이 채워졌습니다'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border border-border px-2 py-1.5 text-left font-semibold">기수</th>
                    {Array.from({ length: slotsPerMatch }, (_, i) => (
                      <th key={i} className="border border-border px-2 py-1.5 text-center font-semibold min-w-[80px]">
                        {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assignment.matches.map((match, matchIdx) => (
                    <tr key={matchIdx}>
                      <td className="border border-border px-2 py-1.5 font-medium">{matchIdx + 1}기</td>
                      {match.map((slot, slotIdx) => (
                        <td
                          key={slotIdx}
                          className={`border border-border px-2 py-1.5 text-center ${
                            slot === null
                              ? 'bg-muted/30 text-muted-foreground'
                              : slot.role === 'buffer'
                                ? 'bg-blue-500/10'
                                : 'bg-red-500/10'
                          }`}
                        >
                          {slot === null ? (
                            <span className="text-muted-foreground">(구인)</span>
                          ) : (
                            <div>
                              <div className="font-medium truncate">{slot.ownerName}</div>
                              <div className={slot.role === 'buffer' ? 'text-blue-400' : 'text-red-400'}>
                                [{slot.role === 'buffer' ? '벞' : '딜'}]
                              </div>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
