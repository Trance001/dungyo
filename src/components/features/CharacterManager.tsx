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
import { useCharacterSearch } from '@/hooks/useCharacterSearch';
import { getCharacterImageUrl, getDundamAdventureUrl, getDundamCharacterUrl, isBufferJob } from '@/domain/character';
import { characterKey } from '@/domain/party-builder';
import { isAlreadyCleared } from '@/domain/weekly-clear';

export function CharacterManager() {
  const {
    searchInput,
    setSearchInput,
    isSearching,
    progress,
    searchError,
    handleSearch,
  } = useCharacterSearch();

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
  } = useCharacterStore();

  return (
    <div className="space-y-6">
      {/* 캐릭터 검색 */}
      <Card>
        <CardHeader>
          <CardTitle>캐릭터 검색</CardTitle>
          <CardDescription>
            캐릭터명을 입력하여 등록합니다 (띄어쓰기 또는 줄바꿈으로 여러 캐릭터 동시 등록)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <textarea
              placeholder="캐릭터명 입력 (여러 개는 띄어쓰기로 구분)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              rows={2}
              className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
            <Button onClick={handleSearch} disabled={isSearching} className="self-end">
              {isSearching ? '검색 중...' : '검색'}
            </Button>
          </div>

          {searchError && (
            <p className="text-sm text-destructive">{searchError}</p>
          )}

          {progress && (
            <p className="text-sm text-muted-foreground">{progress}</p>
          )}
        </CardContent>
      </Card>

      {/* 등록된 캐릭터 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>등록된 캐릭터 ({characters.length})</CardTitle>
              <CardDescription>
                각 캐릭터의 딜/버프력 수치를 입력하고 주간 클리어 여부를 관리합니다
              </CardDescription>
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
        </CardHeader>
        <CardContent>
          {characters.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              등록된 캐릭터가 없습니다. 위에서 검색하여 추가하세요.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>캐릭터</TableHead>
                  <TableHead>직업</TableHead>
                  <TableHead>딜(억)/버프(만)</TableHead>
                  <TableHead>클리어</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {characters.map((c) => {
                  const key = characterKey(c);
                  const damage = damageMap.get(key);
                  const buffPower = buffPowerMap.get(key);
                  const cleared = isAlreadyCleared(
                    weeklyClearRecords,
                    c.characterId,
                    c.serverId,
                  );

                  return (
                    <TableRow key={key}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <img
                            src={getCharacterImageUrl(
                              c.serverId,
                              c.characterId,
                            )}
                            alt={c.characterName}
                            className="w-8 h-8 rounded"
                            loading="lazy"
                          />
                          <div>
                            <div className="flex items-center gap-1">
                              <p className="text-sm font-medium">
                                {c.characterName}
                              </p>
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
                            <p className="text-xs text-muted-foreground">
                              Lv.{c.level}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{c.jobGrowName}</span>
                          <Badge
                            variant={isBufferJob(c.jobGrowName) ? 'default' : 'secondary'}
                            className={isBufferJob(c.jobGrowName) ? 'bg-blue-500 hover:bg-blue-600 text-xs' : 'bg-red-500 hover:bg-red-600 text-white text-xs'}
                          >
                            {isBufferJob(c.jobGrowName) ? '버퍼' : '딜러'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isBufferJob(c.jobGrowName) ? (
                          <Input
                            type="number"
                            className="w-32 h-8 text-sm"
                            placeholder="버프력 (만)"
                            value={buffPower ?? ''}
                            onChange={(e) =>
                              setBuffPower(
                                c.serverId,
                                c.characterId,
                                Number(e.target.value),
                              )
                            }
                          />
                        ) : (
                          <Input
                            type="number"
                            className="w-32 h-8 text-sm"
                            placeholder="딜 (억)"
                            value={damage ?? ''}
                            onChange={(e) =>
                              setDamage(
                                c.serverId,
                                c.characterId,
                                Number(e.target.value),
                              )
                            }
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {cleared ? (
                          <Badge
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() =>
                              unmarkCleared(c.serverId, c.characterId)
                            }
                          >
                            완료
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => markCleared(c)}
                          >
                            미완료
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeCharacter(c.serverId, c.characterId)
                          }
                          className="text-destructive hover:text-destructive"
                        >
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
