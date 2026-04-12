import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { usePlannerStore } from '@/stores/planner-store';
import { ROTATION_TEMPLATES, presetToTemplateId } from '@/domain/planner';
import { buildPlannerAssignment } from '@/domain/planner-optimizer';
import { usePresets } from '@/hooks/usePresets';
import { PartyCardFormDialog } from '@/components/features/PartyCardFormDialog';
import { PartyCardShareDialog } from '@/components/features/PartyCardShareDialog';
import { PartyCardImportDialog } from '@/components/features/PartyCardImportDialog';

import type { PartyCard, RotationRole, RotationTemplateId } from '@/domain/planner';
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
  const templateId = usePlannerStore((s) => s.templateId);
  const cards = usePlannerStore((s) => s.cards);
  const setTemplate = usePlannerStore((s) => s.setTemplate);
  const addCard = usePlannerStore((s) => s.addCard);
  const removeCard = usePlannerStore((s) => s.removeCard);
  const moveCard = usePlannerStore((s) => s.moveCard);
  const clearCards = usePlannerStore((s) => s.clearCards);

  const { presets } = usePresets();

  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [shareCard, setShareCard] = useState<PartyCard | null>(null);
  const [presetError, setPresetError] = useState<string | null>(null);

  const template = ROTATION_TEMPLATES[templateId];
  const isFull = cards.length === template.peopleCount;
  const isOver = cards.length > template.peopleCount;

  const assignment = useMemo(() => {
    if (cards.length === 0) return null;
    return buildPlannerAssignment(template, cards);
  }, [template, cards]);

  function handleTemplateChange(newId: RotationTemplateId) {
    if (cards.length > 0) {
      const ok = window.confirm('템플릿을 변경하면 등록된 카드가 모두 삭제됩니다. 계속하시겠습니까?');
      if (!ok) return;
    }
    setPresetError(null);
    setTemplate(newId);
  }

  function handlePresetSelect(preset: Preset) {
    const matched = presetToTemplateId(preset);
    if (!matched) {
      setPresetError(`프리셋 "${preset.name}"에 맞는 로테이션 템플릿이 없습니다. (딜러 ${preset.dealerSlots}, 버퍼 ${preset.bufferSlots}, 업둥버퍼 ${preset.secondaryBufferSlots}, 인원 ${preset.totalMembers})`);
      return;
    }
    setPresetError(null);
    handleTemplateChange(matched);
  }

  return (
    <div className="space-y-6">
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
                {presets.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg border border-border bg-card p-2 cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
                    onClick={() => handlePresetSelect(p)}
                  >
                    <p className="text-sm font-medium">{p.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs">인원 {p.totalMembers}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs">딜러 {p.dealerSlots}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs">버퍼 {p.bufferSlots}</span>
                      {p.secondaryBufferSlots > 0 && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs">업둥버퍼 {p.secondaryBufferSlots}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {presetError && (
            <p className="text-sm text-destructive">{presetError}</p>
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
              <Button variant="outline" size="sm" onClick={() => setFormOpen(true)} disabled={isFull}>
                카드 추가
              </Button>
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} disabled={isFull}>
                코드로 가져오기
              </Button>
              {cards.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCards} className="text-destructive hover:text-destructive">
                  전체 삭제
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              등록된 카드가 없습니다. &quot;카드 추가&quot; 또는 &quot;코드로 가져오기&quot;로 시작하세요.
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
                  <tr>
                    <th className="sticky left-0 z-10 bg-background border border-border px-2 py-1.5 text-left font-semibold">
                      기수
                    </th>
                    {Array.from({ length: template.peopleCount }, (_, personIdx) => {
                      const ownerName = assignment.matches[0]?.[personIdx]?.ownerName ?? `(미등록 ${personIdx + 1})`;
                      return (
                        <th key={personIdx} className="border border-border px-2 py-1.5 text-center font-semibold min-w-[100px]">
                          {ownerName}
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
                        return (
                          <td
                            key={personIdx}
                            className={`border border-border px-2 py-1.5 text-center ${isCarry ? 'bg-muted/30' : ''}`}
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
        templateId={templateId}
        onClose={() => setFormOpen(false)}
        onSubmit={addCard}
      />

      <PartyCardImportDialog
        open={importOpen}
        currentTemplateId={templateId}
        onClose={() => setImportOpen(false)}
        onImport={addCard}
      />

      <PartyCardShareDialog
        card={shareCard}
        templateId={templateId}
        onClose={() => setShareCard(null)}
      />
    </div>
  );
}
