import { useEffect, useMemo, useState } from 'react';

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
import { AddCarryDialog } from '@/components/features/AddCarryDialog';
import { ChangelogView } from '@/components/features/ChangelogView';
import { PlannerView } from '@/components/features/PlannerView';
import { PresetShareDialog } from '@/components/features/PresetShareDialog';
import { PresetImportDialog } from '@/components/features/PresetImportDialog';
import { usePresetUrlHash } from '@/hooks/usePresetUrlHash';
import { characterKey } from '@/domain/party-builder';
import { usePlannerStore } from '@/stores/planner-store';
import { compositionToPartyCard, presetToTemplate } from '@/domain/planner';
import { encodePartyCard } from '@/lib/party-card-codec';

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

  const [activeTab, setActiveTab] = useState('compose');
  const [addCarryTargetIndex, setAddCarryTargetIndex] = useState<number | null>(null);
  const [sharePreset, setSharePreset] = useState<Preset | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importInitialCode, setImportInitialCode] = useState<string | undefined>(undefined);

  const [plannerMessage, setPlannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { pendingCode, clearPendingCode } = usePresetUrlHash();
  const plannerSetTemplate = usePlannerStore((s) => s.setTemplate);
  const plannerAddCard = usePlannerStore((s) => s.addCard);

  // URL 해시로 전달된 프리셋 코드가 있으면 가져오기 다이얼로그 자동 오픈
  useEffect(() => {
    if (pendingCode) {
      setImportInitialCode(pendingCode);
      setImportDialogOpen(true);
      clearPendingCode();
    }
  }, [pendingCode, clearPendingCode]);

  const characters = useCharacterStore((state) => state.characters);
  const adventureName = useCharacterStore((state) => state.adventureName);
  const { partyResults, buildParty, addCarry, removeCarry } = usePartyComposition();
  const { presets, savePreset, updatePreset, deletePreset } = usePresets();

  const availableCarryCharacters = useMemo(() => {
    const usedKeys = new Set<string>();
    for (const party of partyResults) {
      for (const d of party.dealers) usedKeys.add(characterKey(d));
      for (const b of party.primaryBuffers) usedKeys.add(characterKey(b));
      for (const b of party.secondaryBuffers) usedKeys.add(characterKey(b));
      for (const d of party.carryDealers) usedKeys.add(characterKey(d));
      for (const b of party.carryBuffers) usedKeys.add(characterKey(b));
    }
    return characters.filter((c) => !usedKeys.has(characterKey(c)));
  }, [partyResults, characters]);

  const addCarryTarget = addCarryTargetIndex !== null ? partyResults[addCarryTargetIndex] : null;
  const remainingCarrySlots = addCarryTarget
    ? addCarryTarget.carryCount - addCarryTarget.carryDealers.length - addCarryTarget.carryBuffers.length
    : 0;

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

  function showPlannerMessage(type: 'success' | 'error', text: string) {
    setPlannerMessage({ type, text });
    setTimeout(() => setPlannerMessage(null), 3000);
  }

  function handleAddToPlanner(partyIndex: number) {
    const composition = partyResults[partyIndex];
    if (!composition || !composition.isComplete) return;

    // 파티 구성의 슬롯에 맞는 템플릿 자동 탐색
    const sc = composition.slotConfig;
    const totalMembersVal = sc.dealerSlots + sc.bufferSlots + sc.secondaryBufferSlots + sc.carrySlots;
    const matchedTemplate = presetToTemplate({
      dealerSlots: sc.dealerSlots,
      bufferSlots: sc.bufferSlots,
      secondaryBufferSlots: sc.secondaryBufferSlots,
      totalMembers: totalMembersVal,
    });

    if (!matchedTemplate) {
      showPlannerMessage('error', '이 파티 구성에 맞는 로테이션 템플릿을 찾을 수 없습니다.');
      return;
    }

    // 현재 조건과 일치하는 프리셋이 없으면 자동 저장
    const hasMatchingPreset = presets.some((p) =>
      p.dealerSlots === sc.dealerSlots &&
      p.bufferSlots === sc.bufferSlots &&
      p.secondaryBufferSlots === sc.secondaryBufferSlots &&
      p.totalMembers === totalMembersVal,
    );
    if (!hasMatchingPreset) {
      savePreset({
        name: matchedTemplate.label,
        totalMembers: totalMembersVal,
        dealerSlots: sc.dealerSlots,
        bufferSlots: sc.bufferSlots,
        secondaryBufferSlots: sc.secondaryBufferSlots,
        minDealerDamage: Number(minDamage) || 0,
        minPrimaryBuffPower: Number(minPrimaryBuff) || 0,
        minSecondaryBuffPower: Number(minSecondaryBuff) || 0,
        useTotalDamage,
        minTotalDamage: Number(minTotalDamage) || 0,
        truncateOnesDigit,
      });
    }

    const card = compositionToPartyCard(composition, adventureName ?? '');

    plannerSetTemplate(matchedTemplate);
    plannerAddCard(card);
    setActiveTab('planner');
    showPlannerMessage('success', `"${card.ownerName}" 카드가 플래너에 등록되었습니다.`);
  }

  async function handleCopyPlannerCode(partyIndex: number) {
    const composition = partyResults[partyIndex];
    if (!composition || !composition.isComplete) return;

    const card = compositionToPartyCard(composition, adventureName ?? '');
    const code = encodePartyCard(card, 'dynamic');
    try {
      await navigator.clipboard.writeText(code);
      showPlannerMessage('success', '플래너 카드 코드가 복사되었습니다.');
    } catch {
      // 무시
    }
  }

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

    // 캐릭터가 등록되어 있고 슬롯 합이 인원 수를 넘지 않으면 자동 파티 구성
    const presetSlotSum = preset.dealerSlots + preset.bufferSlots + preset.secondaryBufferSlots;
    if (characters.length === 0 || presetSlotSum > preset.totalMembers) return;

    const presetTruncateOnesDigit = preset.truncateOnesDigit ?? false;
    const input: BufferExchangeInput = {
      dealerSlots: preset.dealerSlots,
      bufferSlots: preset.bufferSlots,
      secondaryBufferSlots: preset.secondaryBufferSlots,
      carrySlots: preset.totalMembers - presetSlotSum,
      minDealerDamage: preset.minDealerDamage,
      minPrimaryBuffPower: preset.minPrimaryBuffPower,
      minSecondaryBuffPower: preset.minSecondaryBuffPower,
      useTotalDamage: preset.useTotalDamage,
      minTotalDamage: preset.minTotalDamage,
      truncateOnesDigit: presetTruncateOnesDigit,
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="compose">파티 구성</TabsTrigger>
            <TabsTrigger value="characters">캐릭터 관리</TabsTrigger>
            <TabsTrigger value="planner">파티 플래너</TabsTrigger>
            <TabsTrigger value="changelog">변경사항</TabsTrigger>
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

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setImportDialogOpen(true)}
                    className="w-full text-xs"
                  >
                    코드로 가져오기
                  </Button>

                  {/* 프리셋 목록 */}
                  {presets.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">저장된 프리셋</p>
                      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                        {presets.map((p) => (
                          <div
                            key={p.id}
                            className="rounded-lg border border-border bg-card p-3 cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
                            onClick={() => handleLoadPreset(p)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium truncate">{p.name}</p>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  className="text-xs text-muted-foreground hover:text-primary"
                                  onClick={(e) => { e.stopPropagation(); setSharePreset(p); }}
                                >
                                  공유
                                </button>
                                <button
                                  type="button"
                                  className="text-xs text-muted-foreground hover:text-destructive"
                                  onClick={(e) => { e.stopPropagation(); deletePreset(p.id); }}
                                >
                                  삭제
                                </button>
                              </div>
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
                        onOpenAddCarry={() => setAddCarryTargetIndex(index)}
                        onRemoveCarry={(serverId, characterId) => removeCarry(index, serverId, characterId)}
                        onAddToPlanner={() => handleAddToPlanner(index)}
                        onCopyPlannerCode={() => handleCopyPlannerCode(index)}
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

          <TabsContent value="planner">
            <PlannerView />
          </TabsContent>

          <TabsContent value="changelog">
            <ChangelogView />
          </TabsContent>

        </Tabs>
      </main>

      <AddCarryDialog
        open={addCarryTargetIndex !== null}
        onClose={() => setAddCarryTargetIndex(null)}
        availableCharacters={availableCarryCharacters}
        onAdd={(character) => {
          if (addCarryTargetIndex !== null) {
            addCarry(addCarryTargetIndex, character);
          }
        }}
        remainingSlots={remainingCarrySlots}
      />

      <PresetShareDialog
        preset={sharePreset}
        onClose={() => setSharePreset(null)}
      />

      {/* 플래너 메시지 */}
      {plannerMessage && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-lg px-4 py-2 text-sm shadow-lg ${
          plannerMessage.type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-destructive text-destructive-foreground'
        }`}>
          {plannerMessage.text}
        </div>
      )}

      <PresetImportDialog
        open={importDialogOpen}
        onClose={() => {
          setImportDialogOpen(false);
          setImportInitialCode(undefined);
        }}
        onImport={(preset) => savePreset(preset)}
        initialCode={importInitialCode}
      />
    </div>
  );
}
