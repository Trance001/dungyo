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
    cards,
    setMatchCount,
    addCard,
    removeCard,
    fillCardFromDundam,
    clearCards,
  } = useRaidRecruitStore();

  const [ownerName, setOwnerName] = useState('');
  const [dealerCount, setDealerCount] = useState('');
  const [bufferCount, setBufferCount] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [raidType, setRaidType] = useState<'8' | '12'>('12');
  const [dundamCardId, setDundamCardId] = useState<string | null>(null);
  const [dundamText, setDundamText] = useState('');
  const [dundamError, setDundamError] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<{ m: number; p: number; s: number } | null>(null);
  const [editName, setEditName] = useState('');
  const [editStat, setEditStat] = useState('');

  const partyCount = raidType === '8' ? 2 : 3;
  const dealersPerParty = 3;
  const buffersPerParty = 1;

  const assignment = useMemo(
    () => buildRaidRecruitAssignment(cards, { matchCount, partyCount, dealersPerParty, buffersPerParty }),
    [cards, matchCount, partyCount],
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

    addCard({ ownerName: name, dealerCount: d, bufferCount: b, dealers: [], buffers: [] });
    setOwnerName('');
    setDealerCount('');
    setBufferCount('');
    setAddError(null);
  }

  function handleDundamFill() {
    if (!dundamCardId || !dundamText.trim()) return;
    const err = fillCardFromDundam(dundamCardId, dundamText);
    if (err) {
      setDundamError(err);
    } else {
      setDundamCardId(null);
      setDundamText('');
      setDundamError(null);
    }
  }

  function handleSlotClick(m: number, p: number, s: number) {
    const slot = assignment.matches[m][p][s];
    if (!slot) return;
    setEditingSlot({ m, p, s });
    setEditName(slot.character?.name ?? '');
    setEditStat(slot.character?.stat?.toString() ?? '');
  }

  function handleSlotSave() {
    if (!editingSlot) return;
    const { m, p, s } = editingSlot;
    const slot = assignment.matches[m][p][s];
    if (!slot) return;

    // 해당 카드를 찾아 캐릭터 상세 업데이트
    const card = cards.find((c) => c.ownerName === slot.ownerName);
    if (!card) return;

    // 이 슬롯이 해당 카드의 몇 번째 딜러/버퍼인지 계산
    let count = 0;
    for (let mi = 0; mi < assignment.matches.length; mi++) {
      for (let pi = 0; pi < assignment.matches[mi].length; pi++) {
        for (let si = 0; si < assignment.matches[mi][pi].length; si++) {
          const s2 = assignment.matches[mi][pi][si];
          if (s2 && s2.ownerName === slot.ownerName && s2.role === slot.role) {
            if (mi === m && pi === p && si === s) {
              // 이 슬롯의 인덱스 확인됨
              const arr = slot.role === 'dealer' ? [...card.dealers] : [...card.buffers];
              while (arr.length <= count) arr.push({ name: '', stat: 0 });
              arr[count] = { name: editName.trim(), stat: Number(editStat) || 0 };

              if (slot.role === 'dealer') {
                useRaidRecruitStore.getState().updateCardCharacters(card.id, arr, card.buffers ?? []);
              } else {
                useRaidRecruitStore.getState().updateCardCharacters(card.id, card.dealers ?? [], arr);
              }

              setEditingSlot(null);
              return;
            }
            count++;
          }
        }
      }
    }
    setEditingSlot(null);
  }

  return (
    <div className="space-y-6">
      {/* 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>레이드 편성 설정</CardTitle>
          <CardDescription>레이드 유형과 기수 수를 설정하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-1">
              <Label>레이드 유형</Label>
              <div className="flex gap-2">
                <Button variant={raidType === '8' ? 'default' : 'outline'} size="sm" onClick={() => setRaidType('8')}>
                  8인 레이드
                </Button>
                <Button variant={raidType === '12' ? 'default' : 'outline'} size="sm" onClick={() => setRaidType('12')}>
                  12인 레이드
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {raidType === '8' ? '레드/옐로 2파티 × 딜러3+버퍼1' : '레드/옐로/그린 3파티 × 딜러3+버퍼1'}
              </p>
            </div>
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
              <Input id="dealerCnt" type="number" placeholder="0" value={dealerCount} onChange={(e) => setDealerCount(e.target.value)} min={0} />
            </div>
            <div className="w-20 space-y-1">
              <Label htmlFor="bufferCnt">버퍼</Label>
              <Input id="bufferCnt" type="number" placeholder="0" value={bufferCount} onChange={(e) => setBufferCount(e.target.value)} min={0} />
            </div>
            <Button onClick={handleAddCard} className="shrink-0">추가</Button>
          </div>

          {addError && <p className="text-xs text-destructive">{addError}</p>}

          {cards.length > 0 && (
            <div className="space-y-1">
              {cards.map((card) => (
                <div key={card.id} className="flex items-center justify-between rounded border border-border px-3 py-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{card.ownerName}</span>
                    <Badge variant="secondary" className="bg-red-500/15 text-red-400 text-xs">딜 {card.dealerCount}</Badge>
                    <Badge variant="secondary" className="bg-blue-500/15 text-blue-400 text-xs">벞 {card.bufferCount}</Badge>
                    {((card.dealers?.length ?? 0) > 0 || (card.buffers?.length ?? 0) > 0) && (
                      <span className="text-xs text-green-400">캐릭터 등록됨</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => { setDundamCardId(card.id); setDundamText(''); setDundamError(null); }}
                    >
                      던담
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeCard(card.id)} className="text-destructive hover:text-destructive h-6">
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 던담 붙여넣기 영역 */}
          {dundamCardId && (
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              <p className="text-sm font-medium">
                {cards.find((c) => c.id === dundamCardId)?.ownerName} - 던담 데이터 붙여넣기
              </p>
              <textarea
                placeholder="던담 모험단 페이지 내용을 붙여넣으세요"
                value={dundamText}
                onChange={(e) => setDundamText(e.target.value)}
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
              {dundamError && <p className="text-xs text-destructive">{dundamError}</p>}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleDundamFill} disabled={!dundamText.trim()}>적용</Button>
                <Button variant="ghost" size="sm" onClick={() => setDundamCardId(null)}>취소</Button>
              </div>
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
                ? `구인 ${assignment.vacancies}명 · 셀을 클릭하여 캐릭터 정보를 입력할 수 있습니다`
                : '모든 슬롯이 채워졌습니다 · 셀을 클릭하여 캐릭터 정보를 입력할 수 있습니다'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {assignment.matches.map((match, matchIdx) => (
              <div key={matchIdx} className="space-y-2">
                <h3 className="text-sm font-semibold">{matchIdx + 1}기</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {match.map((party, partyIdx) => (
                    <div key={partyIdx} className="rounded-lg border border-border p-3">
                      <p className={`text-xs font-semibold mb-2 ${['text-red-400', 'text-yellow-400', 'text-green-400'][partyIdx] ?? ''}`}>
                        {assignment.partyNames[partyIdx]}
                      </p>
                      <div className="space-y-1">
                        {party.map((slot, slotIdx) => {
                          const isEditing = editingSlot?.m === matchIdx && editingSlot?.p === partyIdx && editingSlot?.s === slotIdx;

                          if (isEditing && slot) {
                            return (
                              <div key={slotIdx} className="rounded border border-primary px-2 py-1.5 text-xs space-y-1">
                                <p className="text-muted-foreground">캐릭터명 엔터 → 던담 이동 · 수치 엔터 → 저장</p>
                                <div className="flex gap-1">
                                  <Input
                                    className="h-6 text-xs"
                                    placeholder="캐릭터명"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && editName.trim()) {
                                        // 수치 입력칸으로 포커스 이동
                                        const statInput = (e.currentTarget.parentElement?.querySelector('input[type="number"]') as HTMLInputElement | null);
                                        statInput?.focus();
                                        // 던담 새 탭 열기
                                        window.open(
                                          `https://dundam.xyz/search?server=all&name=${encodeURIComponent(editName.trim())}`,
                                          '_blank',
                                        );
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <Input
                                    className="h-6 text-xs w-20"
                                    type="number"
                                    placeholder={slot.role === 'buffer' ? '만' : '억'}
                                    value={editStat}
                                    onChange={(e) => setEditStat(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSlotSave()}
                                  />
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" className="h-5 text-xs px-2" onClick={handleSlotSave}>저장</Button>
                                  <Button variant="ghost" size="sm" className="h-5 text-xs px-2" onClick={() => setEditingSlot(null)}>취소</Button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={slotIdx}
                              onClick={() => slot && handleSlotClick(matchIdx, partyIdx, slotIdx)}
                              className={`rounded px-2 py-1.5 text-xs border ${
                                slot === null
                                  ? 'border-dashed border-muted-foreground/30 text-muted-foreground'
                                  : slot.role === 'buffer'
                                    ? 'border-blue-500/30 bg-blue-500/10 cursor-pointer hover:bg-blue-500/20'
                                    : 'border-red-500/30 bg-red-500/10 cursor-pointer hover:bg-red-500/20'
                              }`}
                            >
                              {slot === null ? (
                                `(구인 ${slotIdx < buffersPerParty ? '버퍼' : '딜러'})`
                              ) : (
                                <div className="flex items-center justify-between">
                                  <span>
                                    <span className="font-medium text-foreground">{slot.ownerName}</span>
                                    <span className={`ml-1 ${slot.role === 'buffer' ? 'text-blue-400' : 'text-red-400'}`}>
                                      [{slot.role === 'buffer' ? '벞' : '딜'}]
                                    </span>
                                  </span>
                                  {slot.character && slot.character.name && (
                                    <span className="text-muted-foreground">
                                      {slot.character.name} {slot.character.stat > 0 && `${slot.character.stat.toLocaleString()}${slot.role === 'buffer' ? '만' : '억'}`}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
