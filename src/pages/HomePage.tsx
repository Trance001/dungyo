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
import { usePresets } from '@/hooks/usePresets';
import { PartyResult } from '@/components/features/PartyResult';
import { CharacterManager } from '@/components/features/CharacterManager';
import { AdventureSetupDialog } from '@/components/features/AdventureSetupDialog';

import type { BufferExchangeInput } from '@/domain/party';
import type { Preset } from '@/domain/preset';

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
  const [truncateOnesDigit, setTruncateOnesDigit] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const characters = useCharacterStore((state) => state.characters);
  const adventureName = useCharacterStore((state) => state.adventureName);
  const { partyResults, buildParty } = usePartyComposition();
  const { presets, savePreset, updatePreset, deletePreset } = usePresets();

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
      truncateOnesDigit,
    };
    buildParty(input);
  }

  function currentPresetData(): Omit<Preset, 'id'> {
    return {
      name: presetName.trim() || selectedPreset?.name || '',
      totalMembers: Number(totalMembers) || 4,
      dealerSlots: Number(dealerSlots) || 0,
      bufferSlots: Number(bufferSlots) || 0,
      secondaryBufferSlots: Number(secondaryBufferSlots) || 0,
      minDealerDamage: Number(minDamage) || 0,
      minPrimaryBuffPower: Number(minPrimaryBuff) || 0,
      minSecondaryBuffPower: Number(minSecondaryBuff) || 0,
      useTotalDamage,
      minTotalDamage: Number(minTotalDamage) || 0,
      truncateOnesDigit,
    };
  }

  function handleSavePreset() {
    if (!presetName.trim()) return;
    savePreset({ ...currentPresetData(), name: presetName.trim() });
    setPresetName('');
    setSelectedPresetId(null);
  }

  function handleOverwritePreset() {
    if (!selectedPresetId || !selectedPreset) return;
    updatePreset(selectedPresetId, { ...currentPresetData(), name: selectedPreset.name });
  }

  function handleSaveAsPreset() {
    setSelectedPresetId(null);
  }

  const selectedPreset = presets.find((p) => p.id === selectedPresetId) ?? null;

  function handleLoadPreset(preset: Preset) {
    setSelectedPresetId(preset.id);
    setTotalMembers(String(preset.totalMembers));
    setDealerSlots(String(preset.dealerSlots));
    setBufferSlots(String(preset.bufferSlots));
    setSecondaryBufferSlots(String(preset.secondaryBufferSlots));
    setMinDamage(preset.minDealerDamage ? String(preset.minDealerDamage) : '');
    setMinPrimaryBuff(preset.minPrimaryBuffPower ? String(preset.minPrimaryBuffPower) : '');
    setMinSecondaryBuff(preset.minSecondaryBuffPower ? String(preset.minSecondaryBuffPower) : '');
    setUseTotalDamage(preset.useTotalDamage);
    setMinTotalDamage(preset.minTotalDamage ? String(preset.minTotalDamage) : '');
    setTruncateOnesDigit(preset.truncateOnesDigit ?? false);
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
                    <>
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
                      <div className="flex items-center gap-2">
                        <input
                          id="truncateOnesDigit"
                          type="checkbox"
                          checked={truncateOnesDigit}
                          onChange={(e) => setTruncateOnesDigit(e.target.checked)}
                          className="h-4 w-4 rounded border-input"
                        />
                        <Label htmlFor="truncateOnesDigit" className="cursor-pointer">
                          1의 자리 버림
                        </Label>
                      </div>
                    </>
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
                  {/* 프리셋 저장 */}
                  {selectedPreset ? (
                    <div className="flex gap-2">
                      <p className="flex-1 text-sm text-muted-foreground self-center truncate">
                        프리셋: {selectedPreset.name}
                      </p>
                      <Button variant="outline" size="sm" onClick={handleOverwritePreset} className="shrink-0">
                        덮어쓰기
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleSaveAsPreset} className="shrink-0">
                        다른이름으로 저장
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="프리셋 이름을 입력하여 저장"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                      />
                      <Button variant="outline" size="sm" onClick={handleSavePreset} disabled={!presetName.trim()} className="shrink-0">
                        저장
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 프리셋 목록 */}
              {presets.length > 0 && (
                <div className="lg:col-span-1 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">저장된 프리셋</p>
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {presets.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-lg border border-border bg-card p-3 cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
                        onClick={() => handleLoadPreset(p)}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{p.name}</p>
                          <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); deletePreset(p.id); }}
                          >
                            삭제
                          </button>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs">인원 {p.totalMembers}</span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs">딜러 {p.dealerSlots}</span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs">버퍼 {p.bufferSlots}</span>
                          {p.secondaryBufferSlots > 0 && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-xs">업둥버퍼 {p.secondaryBufferSlots}</span>
                          )}
                          {p.useTotalDamage && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-xs">딜합</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
