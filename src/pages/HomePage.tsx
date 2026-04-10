import { useState } from 'react';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCharacterStore } from '@/stores/character-store';
import { usePartyComposition } from '@/hooks/usePartyComposition';
import { PartyResult } from '@/components/features/PartyResult';
import { CharacterManager } from '@/components/features/CharacterManager';
import { AdventureSetupDialog } from '@/components/features/AdventureSetupDialog';

import type { BufferExchangeInput } from '@/domain/party';

export function HomePage() {
  const [totalMembers, setTotalMembers] = useState('4');
  const [dealerSlots, setDealerSlots] = useState('3');
  const [bufferSlots, setBufferSlots] = useState('1');
  const [secondaryBufferSlots, setSecondaryBufferSlots] = useState('0');
  const [minDamage, setMinDamage] = useState('');
  const [minPrimaryBuff, setMinPrimaryBuff] = useState('');
  const [minSecondaryBuff, setMinSecondaryBuff] = useState('');
  const [useTotalDamage, setUseTotalDamage] = useState(false);
  const [minTotalDamage, setMinTotalDamage] = useState('');

  const characters = useCharacterStore((state) => state.characters);
  const adventureName = useCharacterStore((state) => state.adventureName);
  const { partyResults, buildParty } = usePartyComposition();

  const needSecondaryBuffer = Number(secondaryBufferSlots) > 0;
  const totalSlotSum = (Number(dealerSlots) || 0) + (Number(bufferSlots) || 0) + (Number(secondaryBufferSlots) || 0);
  const totalMembersNum = Number(totalMembers) || 0;
  const slotOverflow = totalSlotSum > totalMembersNum;
  const computedCarrySlots = Math.max(0, totalMembersNum - totalSlotSum);

  function handleBuildParty() {
    const input: BufferExchangeInput = {
      dealerSlots: Number(dealerSlots) || 0,
      bufferSlots: Number(bufferSlots) || 0,
      secondaryBufferSlots: Number(secondaryBufferSlots) || 0,
      carrySlots: computedCarrySlots,
      minDealerDamage: Number(minDamage) || 0,
      minPrimaryBuffPower: Number(minPrimaryBuff) || 0,
      minSecondaryBuffPower: Number(minSecondaryBuff) || 0,
      useTotalDamage,
      minTotalDamage: Number(minTotalDamage) || 0,
    };
    buildParty(input);
  }

  return (
    <div className="min-h-screen bg-background">
      <AdventureSetupDialog open={!adventureName} />

      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">
            DNF GYO - 버퍼교환 도우미
          </h1>
          <p className="text-sm text-muted-foreground">
            {adventureName
              ? `모험단: ${adventureName}`
              : '던전앤파이터 버퍼교환 최적 파티 구성'}
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="compose">
          <TabsList className="mb-6">
            <TabsTrigger value="compose">파티 구성</TabsTrigger>
            <TabsTrigger value="characters">캐릭터 관리</TabsTrigger>
          </TabsList>

          <TabsContent value="compose">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 입력 영역 */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>버퍼교환 조건</CardTitle>
                  <CardDescription>
                    구성 인원과 최소 요구 수치를 입력하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalMembers">파티 참가 인원</Label>
                    <Input
                      id="totalMembers"
                      type="number"
                      min="1"
                      value={totalMembers}
                      onChange={(e) => setTotalMembers(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="dealerSlots">딜러 수</Label>
                      <Input
                        id="dealerSlots"
                        type="number"
                        min="0"
                        value={dealerSlots}
                        onChange={(e) => setDealerSlots(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bufferSlots">버퍼 수</Label>
                      <Input
                        id="bufferSlots"
                        type="number"
                        min="0"
                        value={bufferSlots}
                        onChange={(e) => setBufferSlots(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryBufferSlots">업둥버퍼 수</Label>
                      <Input
                        id="secondaryBufferSlots"
                        type="number"
                        min="0"
                        value={secondaryBufferSlots}
                        onChange={(e) => setSecondaryBufferSlots(e.target.value)}
                      />
                    </div>
                  </div>

                  {computedCarrySlots > 0 && (
                    <p className="text-xs text-muted-foreground">
                      업둥 {computedCarrySlots}명 자동 배정
                    </p>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="minDamage">
                      최소 딜 수치 (억)
                    </Label>
                    <Input
                      id="minDamage"
                      type="number"
                      placeholder="예: 100"
                      value={minDamage}
                      onChange={(e) => setMinDamage(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="useTotalDamage"
                      type="checkbox"
                      checked={useTotalDamage}
                      onChange={(e) => setUseTotalDamage(e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="useTotalDamage" className="cursor-pointer">
                      딜합벞교
                    </Label>
                  </div>

                  {useTotalDamage && (
                    <div className="space-y-2">
                      <Label htmlFor="minTotalDamage">
                        딜합 기준 (억)
                      </Label>
                      <Input
                        id="minTotalDamage"
                        type="number"
                        placeholder="예: 400"
                        value={minTotalDamage}
                        onChange={(e) => setMinTotalDamage(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="minPrimaryBuff">
                      최소 버프력 (만)
                    </Label>
                    <Input
                      id="minPrimaryBuff"
                      type="number"
                      placeholder="예: 5"
                      value={minPrimaryBuff}
                      onChange={(e) => setMinPrimaryBuff(e.target.value)}
                    />
                  </div>

                  {needSecondaryBuffer && (
                    <div className="space-y-2">
                      <Label htmlFor="minSecondaryBuff">
                        업둥버퍼 최소 버프력 (만)
                      </Label>
                      <Input
                        id="minSecondaryBuff"
                        type="number"
                        placeholder="예: 3"
                        value={minSecondaryBuff}
                        onChange={(e) => setMinSecondaryBuff(e.target.value)}
                      />
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleBuildParty}
                    disabled={characters.length === 0 || slotOverflow}
                  >
                    최적 파티 구성
                  </Button>

                  {slotOverflow && (
                    <p className="text-xs text-destructive text-center">
                      딜러 + 버퍼 + 업둥버퍼 수({totalSlotSum}명)가 파티 참가 인원({totalMembersNum}명)을 초과합니다
                    </p>
                  )}

                  {!slotOverflow && characters.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      먼저 &quot;캐릭터 관리&quot; 탭에서 캐릭터를 등록하세요
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* 결과 영역 */}
              <div className="lg:col-span-2 space-y-6">
                {partyResults.length > 0 ? (
                  <>
                    <p className="text-sm font-medium text-muted-foreground">
                      {partyResults.filter((r) => r.isComplete).length}개 파티 구성 완료
                      {partyResults.some((r) => !r.isComplete) &&
                        ` / ${partyResults.filter((r) => !r.isComplete).length}개 인원 부족`}
                    </p>
                    {partyResults.map((result, index) => (
                      <PartyResult
                        key={index}
                        composition={result}
                        partyIndex={partyResults.length > 1 ? index : undefined}
                      />
                    ))}
                  </>
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                      조건을 입력하고 &quot;최적 파티 구성&quot; 버튼을
                      눌러주세요
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="characters">
            <CharacterManager />
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
