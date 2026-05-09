import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCharacterStore } from '@/stores/character-store';
import { useDungeonConfigStore } from '@/stores/dungeon-config-store';
import { recommendTicketCandidates } from '@/domain/dungeon-recommendation';
import { DUNGEON_ORDER, SUBJUGATION_TICKETS } from '@/config/dungeons';
import { getCharacterImageUrl, hasValidCharacterId } from '@/domain/character';
import { formatBuffPower } from '@/lib/buff-power-format';

import type { DungeonStatus, TicketCandidate } from '@/domain/dungeon-recommendation';
import type { DungeonDef, DungeonId } from '@/config/dungeons';

const STATUS_LABEL: Record<DungeonStatus, string> = {
  full_and_direct: '풀+직 가능',
  full_only: '풀만 가능',
  subjugation: '토벌권 추천',
  no_stat: '수치 미입력',
  cant_enter: '명성 미달',
};

const STATUS_BADGE_CLASS: Record<DungeonStatus, string> = {
  full_and_direct: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  full_only: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  subjugation: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  no_stat: 'bg-muted text-muted-foreground border-border',
  cant_enter: 'bg-muted text-muted-foreground border-border',
};

function formatStat(role: 'dealer' | 'buffer', stat: number | undefined): string {
  if (stat === undefined) return '-';
  return role === 'buffer' ? `${formatBuffPower(stat)}만` : `${stat.toLocaleString()}억`;
}

export function SubjugationRecommendation() {
  const characters = useCharacterStore((s) => s.characters);
  const damageMap = useCharacterStore((s) => s.damageMap);
  const buffPowerMap = useCharacterStore((s) => s.buffPowerMap);
  const roleOverrideMap = useCharacterStore((s) => s.roleOverrideMap);

  const dungeons = useDungeonConfigStore((s) => s.dungeons);
  const setMinFame = useDungeonConfigStore((s) => s.setMinFame);
  const setCut = useDungeonConfigStore((s) => s.setCut);
  const resetToDefaults = useDungeonConfigStore((s) => s.resetToDefaults);

  return (
    <div className="space-y-6">
      <CutSettingsCard
        dungeons={dungeons}
        onMinFameChange={setMinFame}
        onCutChange={setCut}
        onReset={resetToDefaults}
      />

      {characters.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground text-center">
            등록된 캐릭터가 없습니다. &quot;캐릭터 관리&quot; 탭에서 캐릭터를 등록하세요.
          </CardContent>
        </Card>
      ) : (
        SUBJUGATION_TICKETS.map((ticket) => (
          <TicketRecommendationCard
            key={ticket.id}
            ticketLabel={ticket.label}
            candidates={recommendTicketCandidates(
              characters,
              damageMap,
              buffPowerMap,
              roleOverrideMap,
              dungeons,
              ticket,
            )}
            dungeonsById={dungeons}
          />
        ))
      )}
    </div>
  );
}

interface CutSettingsCardProps {
  dungeons: Record<DungeonId, DungeonDef>;
  onMinFameChange: (id: DungeonId, value: number) => void;
  onCutChange: (
    id: DungeonId,
    kind: 'dealerCut' | 'bufferCut',
    mode: 'full' | 'direct',
    value: number,
  ) => void;
  onReset: () => void;
}

function CutSettingsCard({ dungeons, onMinFameChange, onCutChange, onReset }: CutSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>던전 컷 설정</CardTitle>
            <CardDescription>
              명성·딜컷·벞컷은 시간이 지나며 변동될 수 있습니다. 직접 수정해 사용하세요.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onReset}>
            기본값으로 초기화
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DUNGEON_ORDER.map((id) => {
          const d = dungeons[id];
          return (
            <div key={id} className="rounded-lg border border-border p-3 space-y-3">
              <p className="text-sm font-medium">{d.name}</p>

              <div className="space-y-1">
                <Label htmlFor={`fame-${id}`} className="text-xs">입장 명성</Label>
                <Input
                  id={`fame-${id}`}
                  type="number"
                  className="h-8 text-sm"
                  value={d.minFame}
                  onChange={(e) => onMinFameChange(id, Number(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">딜컷 (억)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">풀</p>
                    <Input
                      type="number"
                      className="h-8 text-sm"
                      value={d.dealerCut.full}
                      onChange={(e) => onCutChange(id, 'dealerCut', 'full', Number(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">직</p>
                    <Input
                      type="number"
                      className="h-8 text-sm"
                      value={d.dealerCut.direct}
                      onChange={(e) => onCutChange(id, 'dealerCut', 'direct', Number(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">벞컷 (만)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">풀</p>
                    <Input
                      type="number"
                      step="0.1"
                      className="h-8 text-sm"
                      value={d.bufferCut.full}
                      onChange={(e) => onCutChange(id, 'bufferCut', 'full', Number(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">직</p>
                    <Input
                      type="number"
                      step="0.1"
                      className="h-8 text-sm"
                      value={d.bufferCut.direct}
                      onChange={(e) => onCutChange(id, 'bufferCut', 'direct', Number(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface TicketRecommendationCardProps {
  ticketLabel: string;
  candidates: TicketCandidate[];
  dungeonsById: Record<DungeonId, DungeonDef>;
}

function TicketRecommendationCard({ ticketLabel, candidates, dungeonsById }: TicketRecommendationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{ticketLabel}</CardTitle>
        <CardDescription>
          묶인 모든 던전에 입장 가능하고, 최소 한 던전이 cut 미달인 캐릭터 ({candidates.length}명)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            추천 대상이 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {candidates.map((cand) => {
              const c = cand.character;
              const hasKey = hasValidCharacterId(c);
              return (
                <div
                  key={`${c.serverId}:${c.characterId}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-2"
                >
                  {hasKey ? (
                    <img
                      src={getCharacterImageUrl(c.serverId, c.characterId)}
                      alt={c.characterName}
                      className="w-8 h-8 rounded"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      {c.characterName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.characterName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.jobGrowName} · {formatStat(cand.role, cand.stat)} · 명성 {c.fame.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 shrink-0 justify-end max-w-[60%]">
                    {cand.dungeonStatuses.map((ds) => (
                      <Badge
                        key={ds.dungeonId}
                        variant="outline"
                        className={`text-[10px] ${STATUS_BADGE_CLASS[ds.status]}`}
                      >
                        {dungeonsById[ds.dungeonId].name}: {STATUS_LABEL[ds.status]}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
