import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCharacterStore } from '@/stores/character-store';
import { getCharacterImageUrl, getDundamAdventureUrl, getDundamCharacterUrl, getEffectiveRole, hasValidCharacterId, isBufferJob } from '@/domain/character';
import { characterKey } from '@/domain/party-builder';
import { isAlreadyCleared } from '@/domain/weekly-clear';
import { useAdventureSetup } from '@/hooks/useAdventureSetup';

type SortOrder = 'none' | 'asc' | 'desc';

export function CharacterManager() {
  const [dundamText, setDundamText] = useState('');
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [dealerSort, setDealerSort] = useState<SortOrder>('none');
  const [bufferSort, setBufferSort] = useState<SortOrder>('none');
  const { isLoading, progress, error: dundamError, setupFromDundam } = useAdventureSetup();

  const {
    characters,
    adventureName,
    damageMap,
    buffPowerMap,
    roleOverrideMap,
    weeklyClearRecords,
    removeCharacter,
    setDamage,
    setBuffPower,
    setRoleOverride,
    clearRoleOverride,
    markCleared,
    unmarkCleared,
    clearAdventure,
    clearAllWeeklyRecords,
  } = useCharacterStore();

  const dealersRaw = characters.filter((c) => getEffectiveRole(c, roleOverrideMap) === 'dealer');
  const buffersRaw = characters.filter((c) => getEffectiveRole(c, roleOverrideMap) === 'buffer');

  const dealers = dealerSort === 'none'
    ? dealersRaw
    : [...dealersRaw].sort((a, b) => {
        const da = damageMap.get(characterKey(a)) ?? 0;
        const db = damageMap.get(characterKey(b)) ?? 0;
        return dealerSort === 'asc' ? da - db : db - da;
      });

  const buffers = bufferSort === 'none'
    ? buffersRaw
    : [...buffersRaw].sort((a, b) => {
        const ba = buffPowerMap.get(characterKey(a)) ?? 0;
        const bb = buffPowerMap.get(characterKey(b)) ?? 0;
        return bufferSort === 'asc' ? ba - bb : bb - ba;
      });

  const isClearedChar = (c: typeof characters[number]) =>
    isAlreadyCleared(weeklyClearRecords, c.characterId, c.serverId);

  const activeDealers = dealers.filter((c) => !isClearedChar(c));
  const clearedDealers = dealers.filter((c) => isClearedChar(c));
  const activeBuffers = buffers.filter((c) => !isClearedChar(c));
  const clearedBuffers = buffers.filter((c) => isClearedChar(c));

  async function handleDundamUpdate() {
    if (!dundamText.trim()) return;
    await setupFromDundam(dundamText);
    setDundamText('');
  }

  function renderCharacterRow(c: typeof characters[number], isBuffer: boolean) {
    const key = characterKey(c);
    const statValue = isBuffer ? buffPowerMap.get(key) : damageMap.get(key);
    const cleared = isAlreadyCleared(weeklyClearRecords, c.characterId, c.serverId);

    const hasKey = hasValidCharacterId(c);

    function handleDundamClick() {
      if (!hasKey) {
        setSnackbar('API 호출 한도 초과로 던담 페이지에 접근할 수 없습니다.');
        setTimeout(() => setSnackbar(null), 3000);
        return;
      }
      window.open(getDundamCharacterUrl(c.serverId, c.characterId), '_blank');
    }

    return (
      <TableRow key={key}>
        <TableCell>
          <div className="flex items-center gap-2">
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
            <div>
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium">{c.characterName}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1 text-xs text-muted-foreground hover:text-primary"
                  onClick={handleDundamClick}
                >
                  던담
                </Button>
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-sm">{c.jobGrowName}</TableCell>
        <TableCell>
          <Input
            type="number"
            className="w-32 h-8 text-sm"
            placeholder={isBuffer ? '버프력' : '딜'}
            value={statValue ?? ''}
            onChange={(e) =>
              isBuffer
                ? setBuffPower(c.serverId, c.characterId, Number(e.target.value))
                : setDamage(c.serverId, c.characterId, Number(e.target.value))
            }
          />
        </TableCell>
        <TableCell>
          {cleared ? (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => unmarkCleared(c.serverId, c.characterId)}>
              완료
            </Badge>
          ) : (
            <Badge variant="outline" className="cursor-pointer" onClick={() => markCleared(c)}>
              미완료
            </Badge>
          )}
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1 items-end">
            {isBufferJob(c.jobGrowName) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isBuffer) {
                    setRoleOverride(c.serverId, c.characterId, 'dealer');
                  } else {
                    clearRoleOverride(c.serverId, c.characterId);
                  }
                }}
                className="text-xs h-6"
              >
                {isBuffer ? '딜러로' : '버퍼로'}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => removeCharacter(c.serverId, c.characterId)} className="text-destructive hover:text-destructive">
              삭제
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div className="space-y-6">
      {/* 던담 데이터 갱신 */}
      <Card>
        <CardHeader>
          <CardTitle>던담 데이터 갱신</CardTitle>
          <CardDescription>
            던담 모험단 페이지에서 Ctrl+A → Ctrl+C 후 붙여넣으면 캐릭터와 수치가 갱신됩니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <textarea
              placeholder="던담 모험단 페이지 내용을 붙여넣으세요"
              value={dundamText}
              onChange={(e) => setDundamText(e.target.value)}
              rows={3}
              className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
            <Button onClick={handleDundamUpdate} disabled={isLoading || !dundamText.trim()} className="self-end">
              {isLoading ? '조회 중...' : '갱신'}
            </Button>
          </div>

          {dundamError && (
            <p className="text-sm text-destructive">{dundamError}</p>
          )}

          {progress && (
            <p className="text-sm text-muted-foreground">{progress}</p>
          )}
        </CardContent>
      </Card>

      {/* 던담 바로가기 + 일괄 작업 */}
      {characters.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearAllWeeklyRecords}>
              클리어 일괄 해제
            </Button>
            <Button variant="destructive" size="sm" onClick={clearAdventure}>
              전체 초기화
            </Button>
          </div>
          {adventureName && (
            <a
              href={getDundamAdventureUrl(adventureName)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                던담에서 스펙 확인
              </Button>
            </a>
          )}
        </div>
      )}

      {characters.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
            등록된 캐릭터가 없습니다. 던담 데이터를 붙여넣어 등록하세요.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 딜러 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <span className="text-red-500">딜러</span> ({activeDealers.length}/{dealers.length})
              </CardTitle>
            </CardHeader>
            {activeDealers.length > 0 && (
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>캐릭터</TableHead>
                      <TableHead>직업</TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:text-foreground"
                        onClick={() => setDealerSort((prev) => prev === 'none' ? 'desc' : prev === 'desc' ? 'asc' : 'none')}
                      >
                        딜 (억) {dealerSort === 'desc' ? '↓' : dealerSort === 'asc' ? '↑' : ''}
                      </TableHead>
                      <TableHead>클리어</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeDealers.map((c) => renderCharacterRow(c, false))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>

          {/* 완료된 딜러 섹션 */}
          {clearedDealers.length > 0 && (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base text-muted-foreground">
                  완료된 딜러 ({clearedDealers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>캐릭터</TableHead>
                      <TableHead>직업</TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:text-foreground"
                        onClick={() => setDealerSort((prev) => prev === 'none' ? 'desc' : prev === 'desc' ? 'asc' : 'none')}
                      >
                        딜 (억) {dealerSort === 'desc' ? '↓' : dealerSort === 'asc' ? '↑' : ''}
                      </TableHead>
                      <TableHead>클리어</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clearedDealers.map((c) => renderCharacterRow(c, false))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* 버퍼 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <span className="text-blue-500">버퍼</span> ({activeBuffers.length}/{buffers.length})
              </CardTitle>
            </CardHeader>
            {activeBuffers.length > 0 && (
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>캐릭터</TableHead>
                      <TableHead>직업</TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:text-foreground"
                        onClick={() => setBufferSort((prev) => prev === 'none' ? 'desc' : prev === 'desc' ? 'asc' : 'none')}
                      >
                        버프력 (만) {bufferSort === 'desc' ? '↓' : bufferSort === 'asc' ? '↑' : ''}
                      </TableHead>
                      <TableHead>클리어</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeBuffers.map((c) => renderCharacterRow(c, true))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>

          {/* 완료된 버퍼 섹션 */}
          {clearedBuffers.length > 0 && (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base text-muted-foreground">
                  완료된 버퍼 ({clearedBuffers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>캐릭터</TableHead>
                      <TableHead>직업</TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:text-foreground"
                        onClick={() => setBufferSort((prev) => prev === 'none' ? 'desc' : prev === 'desc' ? 'asc' : 'none')}
                      >
                        버프력 (만) {bufferSort === 'desc' ? '↓' : bufferSort === 'asc' ? '↑' : ''}
                      </TableHead>
                      <TableHead>클리어</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clearedBuffers.map((c) => renderCharacterRow(c, true))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* 스낵바 */}
      {snackbar && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground shadow-lg">
          {snackbar}
        </div>
      )}
    </div>
  );
}
