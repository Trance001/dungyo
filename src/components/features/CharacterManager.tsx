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
import { getCharacterImageUrl, getDundamAdventureUrl, getDundamCharacterUrl, isBufferJob } from '@/domain/character';
import { characterKey } from '@/domain/party-builder';
import { isAlreadyCleared } from '@/domain/weekly-clear';
import { useAdventureSetup } from '@/hooks/useAdventureSetup';

export function CharacterManager() {
  const [dundamText, setDundamText] = useState('');
  const { isLoading, progress, error: dundamError, setupFromDundam } = useAdventureSetup();

  const {
    characters,
    adventureName,
    damageMap,
    buffPowerMap,
    weeklyClearRecords,
    removeCharacter,
    setDamage,
    setBuffPower,
    markCleared,
    unmarkCleared,
    clearAdventure,
    clearAllWeeklyRecords,
  } = useCharacterStore();

  const dealers = characters.filter((c) => !isBufferJob(c.jobGrowName));
  const buffers = characters.filter((c) => isBufferJob(c.jobGrowName));

  async function handleDundamUpdate() {
    if (!dundamText.trim()) return;
    await setupFromDundam(dundamText);
    setDundamText('');
  }

  function renderCharacterRow(c: typeof characters[number], isBuffer: boolean) {
    const key = characterKey(c);
    const statValue = isBuffer ? buffPowerMap.get(key) : damageMap.get(key);
    const cleared = isAlreadyCleared(weeklyClearRecords, c.characterId, c.serverId);

    return (
      <TableRow key={key}>
        <TableCell>
          <div className="flex items-center gap-2">
            <img
              src={getCharacterImageUrl(c.serverId, c.characterId)}
              alt={c.characterName}
              className="w-8 h-8 rounded"
              loading="lazy"
            />
            <div>
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium">{c.characterName}</p>
                <a
                  href={getDundamCharacterUrl(c.serverId, c.characterId)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="sm" className="h-5 px-1 text-xs text-muted-foreground hover:text-primary">
                    던담
                  </Button>
                </a>
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
          <Button variant="ghost" size="sm" onClick={() => removeCharacter(c.serverId, c.characterId)} className="text-destructive hover:text-destructive">
            삭제
          </Button>
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
                <span className="text-red-500">딜러</span> ({dealers.length})
              </CardTitle>
            </CardHeader>
            {dealers.length > 0 && (
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>캐릭터</TableHead>
                      <TableHead>직업</TableHead>
                      <TableHead>딜 (억)</TableHead>
                      <TableHead>클리어</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dealers.map((c) => renderCharacterRow(c, false))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>

          {/* 버퍼 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <span className="text-blue-500">버퍼</span> ({buffers.length})
              </CardTitle>
            </CardHeader>
            {buffers.length > 0 && (
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>캐릭터</TableHead>
                      <TableHead>직업</TableHead>
                      <TableHead>버프력 (만)</TableHead>
                      <TableHead>클리어</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buffers.map((c) => renderCharacterRow(c, true))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
