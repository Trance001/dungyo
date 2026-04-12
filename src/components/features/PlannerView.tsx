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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePlannerStore } from '@/stores/planner-store';
import { ROTATION_TEMPLATES } from '@/domain/planner';
import { buildPlannerAssignment } from '@/domain/planner-optimizer';
import { PartyCardFormDialog } from '@/components/features/PartyCardFormDialog';
import { PartyCardShareDialog } from '@/components/features/PartyCardShareDialog';
import { PartyCardImportDialog } from '@/components/features/PartyCardImportDialog';

import type { PartyCard, RotationRole, RotationTemplateId } from '@/domain/planner';

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
  const clearCards = usePlannerStore((s) => s.clearCards);

  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [shareCard, setShareCard] = useState<PartyCard | null>(null);

  const template = ROTATION_TEMPLATES[templateId];
  const isFull = cards.length === template.peopleCount;
  const isOver = cards.length > template.peopleCount;

  const assignment = useMemo(() => {
    if (!isFull) return null;
    return buildPlannerAssignment(template, cards);
  }, [template, cards, isFull]);

  function handleTemplateChange(newId: RotationTemplateId) {
    if (cards.length > 0) {
      const ok = window.confirm('템플릿을 변경하면 등록된 카드가 모두 삭제됩니다. 계속하시겠습니까?');
      if (!ok) return;
    }
    setTemplate(newId);
  }

  return (
    <div className="space-y-6">
      {/* 템플릿 선택 */}
      <Card>
        <CardHeader>
          <CardTitle>버퍼교환 조건 프리셋</CardTitle>
          <CardDescription>
            파티장이 진행할 버퍼교환 종류를 선택하세요. 카드 추가 전에 설정해야 합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template">템플릿</Label>
            <Select value={templateId} onValueChange={(v) => handleTemplateChange(v as RotationTemplateId)}>
              <SelectTrigger id="template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ROTATION_TEMPLATES).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{template.description}</p>
            <p className="text-xs text-muted-foreground">
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
                  <div className="flex gap-2 shrink-0">
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

      {/* 로테이션 매트릭스 */}
      {assignment && (
        <Card>
          <CardHeader>
            <CardTitle>파티 로테이션</CardTitle>
            <CardDescription>
              각 열이 한 판(파티) 입니다. 딜러 합계 편차: {assignment.dealerStdDev.toFixed(1)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${template.matchesCount}, minmax(180px, 1fr))` }}
              >
                {assignment.matches.map((match, matchIdx) => (
                  <div key={matchIdx} className="rounded-lg border border-border bg-card p-3">
                    <div className="mb-2 text-center">
                      <p className="text-xs font-semibold">판 {matchIdx + 1}</p>
                      <p className="text-xs text-muted-foreground">
                        딜합 {assignment.dealerSumPerMatch[matchIdx].toLocaleString()}
                      </p>
                    </div>
                    <ul className="space-y-1">
                      {match.map((slot, slotIdx) => (
                        <li key={slotIdx} className="text-xs">
                          <span className={`font-semibold ${ROLE_STYLE[slot.role]}`}>
                            [{ROLE_LABEL[slot.role]}]
                          </span>{' '}
                          <span className="text-muted-foreground">{slot.ownerName}:</span>{' '}
                          {slot.character ? (
                            <span className={slot.role === 'carry' ? 'text-muted-foreground' : ''}>
                              {slot.character.characterName}
                              {slot.role !== 'carry' && slot.character.stat > 0 && (
                                <span className="text-muted-foreground">
                                  {' '}
                                  ({slot.character.stat.toLocaleString()})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
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
