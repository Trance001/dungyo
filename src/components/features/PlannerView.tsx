import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { usePlannerStore } from '@/stores/planner-store';
import { presetToTemplate, validateCardForTemplate } from '@/domain/planner';
import { buildPlannerAssignment } from '@/domain/planner-optimizer';
import { RaidRecruitView } from '@/components/features/RaidRecruitView';
import { decodePartyCard } from '@/lib/party-card-codec';
import { encodePreset } from '@/lib/preset-codec';
import { buildPresetShareUrl } from '@/hooks/usePresetUrlHash';
import { usePresets } from '@/hooks/usePresets';
import { PartyCardFormDialog } from '@/components/features/PartyCardFormDialog';
import { PartyCardShareDialog } from '@/components/features/PartyCardShareDialog';

import type { PartyCard, RotationRole, RotationTemplate } from '@/domain/planner';
import type { Preset } from '@/domain/preset';

const ROLE_LABEL: Record<RotationRole, string> = {
  buffer: '벞',
  dealer: '딜',
  secondaryBuffer: '벞둥',
  carry: '업',
};

const ROLE_STYLE: Record<RotationRole, string> = {
  buffer: 'text-blue-400',
  dealer: 'text-red-400',
  secondaryBuffer: 'text-cyan-400',
  carry: 'text-muted-foreground',
};

export function PlannerView() {
  const cards = usePlannerStore((s) => s.cards);
  const setTemplate = usePlannerStore((s) => s.setTemplate);
  const getActiveTemplate = usePlannerStore((s) => s.getActiveTemplate);
  const addCard = usePlannerStore((s) => s.addCard);
  const updateCard = usePlannerStore((s) => s.updateCard);
  const removeCard = usePlannerStore((s) => s.removeCard);
  const moveCard = usePlannerStore((s) => s.moveCard);
  const clearCards = usePlannerStore((s) => s.clearCards);
  const getCardHistory = usePlannerStore((s) => s.getCardHistory);
  const clearCardHistory = usePlannerStore((s) => s.clearCardHistory);

  const { presets } = usePresets();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<PartyCard | null>(null);
  const [shareCard, setShareCard] = useState<PartyCard | null>(null);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copiedTarget, setCopiedTarget] = useState<'code' | 'url' | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const template = getActiveTemplate();
  const templateId = template.id;
  const isFull = cards.length === template.peopleCount;
  const isOver = cards.length > template.peopleCount;

  const assignment = useMemo(() => {
    if (cards.length === 0) return null;
    return buildPlannerAssignment(template, cards);
  }, [template, cards]);

  function handleTemplateApply(newTemplate: RotationTemplate) {
    if (cards.length > 0) {
      const ok = window.confirm('템플릿을 변경하면 등록된 카드가 모두 삭제됩니다. 계속하시겠습니까?');
      if (!ok) return;
    }
    setTemplate(newTemplate);
  }

  function handleImportCode() {
    if (!importCode.trim()) return;
    const result = decodePartyCard(importCode);
    if (!result) {
      setImportError('유효하지 않은 코드입니다.');
      return;
    }
    const err = validateCardForTemplate(result.card, template);
    if (err) {
      setImportError(err);
      return;
    }
    if (cards.some((c) => c.ownerName === result.card.ownerName)) {
      setImportError(`'${result.card.ownerName}' 모험단은 이미 등록되어 있습니다.`);
      return;
    }
    addCard(result.card);
    setImportCode('');
    setImportError(null);
  }

  function handlePresetSelect(preset: Preset) {
    const matched = presetToTemplate(preset);
    if (!matched) return;
    handleTemplateApply(matched);
  }

  const [plannerMode, setPlannerMode] = useState<'exchange' | 'recruit'>('exchange');

  if (plannerMode === 'recruit') {
    return (
      <div className="space-y-6">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPlannerMode('exchange')}>
            버퍼교환
          </Button>
          <Button variant="default" size="sm">
            일반모집
          </Button>
        </div>
        <RaidRecruitView />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button variant="default" size="sm">
          버퍼교환
        </Button>
        <Button variant="outline" size="sm" onClick={() => setPlannerMode('recruit')}>
          일반모집
        </Button>
      </div>

      {/* 템플릿 선택 */}
      <Card>
        <CardHeader>
          <CardTitle>버퍼교환 조건 프리셋</CardTitle>
          <CardDescription>
            저장된 프리셋을 선택하거나, 템플릿을 직접 선택하세요. 카드 추가 전에 설정해야 합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 저장된 프리셋 */}
          {presets.length > 0 && (
            <div className="space-y-2">
              <Label>저장된 프리셋</Label>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {presets.map((p) => {
                  const hasTemplate = presetToTemplate(p) !== null;
                  return (
                  <div
                    key={p.id}
                    className={`rounded-lg border p-2 transition-colors ${hasTemplate ? 'border-border bg-card cursor-pointer hover:border-primary/50 hover:bg-accent/50' : 'border-border/50 bg-muted/20 opacity-50 cursor-not-allowed'}`}
                    onClick={() => hasTemplate && handlePresetSelect(p)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{p.name}</p>
                      {hasTemplate ? (
                        <span className="rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 text-xs">사용 가능</span>
                      ) : (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">미지원</span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs">인원 {p.totalMembers}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs">딜러 {p.dealerSlots}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs">버퍼 {p.bufferSlots}</span>
                      {p.secondaryBufferSlots > 0 && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs">업둥버퍼 {p.secondaryBufferSlots}</span>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-sm font-medium">{template.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
            <p className="text-xs text-muted-foreground mt-1">
              한 사람당 필요: 버퍼 {template.slotsPerPerson.buffer} · 딜러 {template.slotsPerPerson.dealer}
              {template.slotsPerPerson.secondaryBuffer > 0 && ` · 업둥버퍼 ${template.slotsPerPerson.secondaryBuffer}`}
              {template.slotsPerPerson.carry > 0 && ` · 업둥 ${template.slotsPerPerson.carry}`}
            </p>
          </div>

          {(() => {
            const matchedPreset = presets.find((p) =>
              p.bufferSlots === template.slotsPerPerson.buffer &&
              p.dealerSlots === template.slotsPerPerson.dealer &&
              p.secondaryBufferSlots === template.slotsPerPerson.secondaryBuffer,
            );
            if (!matchedPreset) return null;

            const code = encodePreset({
              name: matchedPreset.name,
              totalMembers: matchedPreset.totalMembers,
              dealerSlots: matchedPreset.dealerSlots,
              bufferSlots: matchedPreset.bufferSlots,
              secondaryBufferSlots: matchedPreset.secondaryBufferSlots,
              minDealerDamage: matchedPreset.minDealerDamage,
              minPrimaryBuffPower: matchedPreset.minPrimaryBuffPower,
              minSecondaryBuffPower: matchedPreset.minSecondaryBuffPower,
              useTotalDamage: matchedPreset.useTotalDamage,
              minTotalDamage: matchedPreset.minTotalDamage,
              truncateOnesDigit: matchedPreset.truncateOnesDigit,
            });
            const url = buildPresetShareUrl(code);

            async function handleCopy(target: 'code' | 'url') {
              try {
                await navigator.clipboard.writeText(target === 'code' ? code : url);
                setCopiedTarget(target);
                setTimeout(() => setCopiedTarget(null), 2000);
              } catch { /* 무시 */ }
            }

            return (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleCopy('code')}>
                  {copiedTarget === 'code' ? '복사됨' : '프리셋 코드 복사'}
                </Button>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleCopy('url')}>
                  {copiedTarget === 'url' ? '복사됨' : '프리셋 링크 복사'}
                </Button>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* 파티 카드 리스트 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>등록된 파티 카드 ({cards.length}/{template.peopleCount})</CardTitle>
              <CardDescription>
                파티장이 직접 카드를 추가하거나, 다른 유저의 공유 코드를 가져올 수 있습니다.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setEditingCard(null); setFormOpen(true); }} disabled={isFull}>
                카드 추가
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
                {showHistory ? '이력 닫기' : '등록 이력'}
              </Button>
              {cards.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCards} className="text-destructive hover:text-destructive">
                  전체 삭제
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isFull && (
            <div className="space-y-1">
              <div className="flex gap-2">
                <Input
                  placeholder="파티 카드 코드 입력"
                  value={importCode}
                  onChange={(e) => { setImportCode(e.target.value); setImportError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleImportCode()}
                  className="flex-1 text-xs font-mono"
                />
                <Button variant="outline" size="sm" onClick={handleImportCode} disabled={!importCode.trim()} className="shrink-0">
                  입력하기
                </Button>
              </div>
              {importError && (
                <p className="text-xs text-destructive">{importError}</p>
              )}
            </div>
          )}

          {/* 등록 이력 */}
          {showHistory && (() => {
            const history = getCardHistory();
            const registeredNames = new Set(cards.map((c) => c.ownerName));
            return (
              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">등록 이력 ({history.length}건)</p>
                  {history.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearCardHistory} className="text-xs text-destructive hover:text-destructive h-6">
                      이력 삭제
                    </Button>
                  )}
                </div>
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">이 프리셋에 등록된 이력이 없습니다.</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {history.map((entry, idx) => {
                      const alreadyAdded = registeredNames.has(entry.card.ownerName);
                      const date = new Date(entry.registeredAt);
                      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                      return (
                        <div key={idx} className="flex items-center justify-between rounded border border-border px-3 py-1.5 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{entry.card.ownerName}</span>
                            <span className="text-xs text-muted-foreground">{dateStr}</span>
                            <span className="text-xs text-muted-foreground">
                              딜{entry.card.dealers.length} 벞{entry.card.buffers.length}
                              {entry.card.secondaryBuffers.length > 0 && ` 벞둥${entry.card.secondaryBuffers.length}`}
                              {entry.card.carries.length > 0 && ` 업${entry.card.carries.length}`}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            disabled={alreadyAdded || isFull}
                            onClick={() => addCard(entry.card)}
                          >
                            {alreadyAdded ? '등록됨' : '추가'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {cards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              등록된 카드가 없습니다. 카드 코드를 입력하거나 &quot;카드 추가&quot;로 시작하세요.
            </p>
          ) : (
            <div className="space-y-2">
              {cards.map((card, idx) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {idx + 1}. {card.ownerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      버퍼 {card.buffers.length} · 딜러 {card.dealers.length}
                      {card.secondaryBuffers.length > 0 && ` · 업둥버퍼 ${card.secondaryBuffers.length}`}
                      {card.carries.length > 0 && ` · 업둥 ${card.carries.length}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1 text-xs"
                        disabled={idx === 0}
                        onClick={() => moveCard(idx, idx - 1)}
                      >
                        ▲
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1 text-xs"
                        disabled={idx === cards.length - 1}
                        onClick={() => moveCard(idx, idx + 1)}
                      >
                        ▼
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setEditingCard(card); setFormOpen(true); }}>
                      수정
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShareCard(card)}>
                      공유
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeCard(card.id)}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {isOver && (
            <p className="mt-2 text-xs text-destructive">
              등록된 카드가 필요 인원보다 많습니다. 일부 카드를 삭제하세요.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 로테이션 매트릭스 (테이블) */}
      {assignment && (
        <Card>
          <CardHeader>
            <CardTitle>파티 로테이션</CardTitle>
            <CardDescription>
              딜합 편차: {assignment.dealerStdDev.toFixed(1)} · 버프력 편차: {assignment.bufferStdDev.toFixed(1)} · 높은 딜합에 낮은 버프력 자동 매칭
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  {template.partyGroups && (
                    <tr>
                      <th className="sticky left-0 z-10 bg-background border border-border px-2 py-1"></th>
                      {template.partyGroups.map((groupName, groupIdx) => {
                        const groupSize = template.peopleCount / template.partyGroups!.length;
                        const colors = ['bg-red-500/15 text-red-400', 'bg-yellow-500/15 text-yellow-400', 'bg-green-500/15 text-green-400'];
                        return (
                          <th
                            key={groupIdx}
                            colSpan={groupSize}
                            className={`border border-border px-2 py-1 text-center font-semibold ${colors[groupIdx] ?? ''}`}
                          >
                            {groupName}
                          </th>
                        );
                      })}
                    </tr>
                  )}
                  <tr>
                    <th className="sticky left-0 z-10 bg-background border border-border px-2 py-1.5 text-left font-semibold">
                      기수
                    </th>
                    {Array.from({ length: template.peopleCount }, (_, personIdx) => {
                      const ownerName = assignment.matches[0]?.[personIdx]?.ownerName ?? `(미등록 ${personIdx + 1})`;
                      const groupSize = template.partyGroups ? template.peopleCount / template.partyGroups.length : 0;
                      const isGroupBorder = template.partyGroups && groupSize > 0 && personIdx > 0 && personIdx % groupSize === 0;
                      return (
                        <th key={personIdx} className={`border border-border px-2 py-1.5 text-center font-semibold min-w-[100px] ${isGroupBorder ? 'border-l-2 border-l-border' : ''}`}>
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              onClick={() => personIdx > 0 && moveCard(personIdx, personIdx - 1)}
                              disabled={personIdx === 0}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-20 px-0.5"
                            >
                              ←
                            </button>
                            <span className="truncate">{ownerName}</span>
                            <button
                              onClick={() => personIdx < template.peopleCount - 1 && moveCard(personIdx, personIdx + 1)}
                              disabled={personIdx >= template.peopleCount - 1}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-20 px-0.5"
                            >
                              →
                            </button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: template.matchesCount }, (_, matchIdx) => (
                    <tr key={matchIdx}>
                      <td className="sticky left-0 z-10 bg-background border border-border px-2 py-1.5 font-medium whitespace-nowrap">
                        <div>{matchIdx + 1}기</div>
                        <div className="text-xs font-normal text-muted-foreground">
                          딜합 {assignment.dealerSumPerMatch[matchIdx].toLocaleString()}
                        </div>
                        {assignment.bufferStatPerMatch[matchIdx] > 0 && (
                          <div className="text-xs font-normal text-blue-400">
                            벞 {assignment.bufferStatPerMatch[matchIdx].toLocaleString()}
                          </div>
                        )}
                      </td>
                      {Array.from({ length: template.peopleCount }, (_, personIdx) => {
                        const slot = assignment.matches[matchIdx][personIdx];
                        const isCarry = slot.role === 'carry';
                        const groupSize = template.partyGroups ? template.peopleCount / template.partyGroups.length : 0;
                        const isGroupBorder = template.partyGroups && groupSize > 0 && personIdx > 0 && personIdx % groupSize === 0;
                        return (
                          <td
                            key={personIdx}
                            className={`border border-border px-2 py-1.5 text-center ${isCarry ? 'bg-muted/30' : ''} ${isGroupBorder ? 'border-l-2 border-l-border' : ''}`}
                          >
                            {isCarry ? (
                              <span className="text-muted-foreground">[업둥]</span>
                            ) : slot.character ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold">
                                  {slot.character.stat > 0 ? slot.character.stat.toLocaleString() : '—'}
                                </div>
                                <div className="text-muted-foreground truncate">
                                  {slot.character.jobGrowName.replace(/^眞\s*/, '')}
                                </div>
                                <div className={ROLE_STYLE[slot.role]}>
                                  [{ROLE_LABEL[slot.role]}]
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <PartyCardFormDialog
        open={formOpen}
        template={template}
        editCard={editingCard}
        onClose={() => { setFormOpen(false); setEditingCard(null); }}
        onSubmit={(card) => {
          if (editingCard) {
            updateCard(editingCard.id, card);
          } else {
            addCard(card);
          }
        }}
      />

      <PartyCardShareDialog
        card={shareCard}
        templateId={templateId}
        onClose={() => setShareCard(null)}
      />
    </div>
  );
}
