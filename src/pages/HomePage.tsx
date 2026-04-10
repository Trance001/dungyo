import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RAID_TYPE_META, RAID_TYPES } from '@/config/constants';
import { useCharacterStore } from '@/stores/character-store';
import { usePartyComposition } from '@/hooks/usePartyComposition';
import { PartyResult } from '@/components/features/PartyResult';
import { CharacterManager } from '@/components/features/CharacterManager';
import { AdventureSetupDialog } from '@/components/features/AdventureSetupDialog';
import { ApiSettings } from '@/components/features/ApiSettings';

import type { RaidType } from '@/config/constants';
import type { BufferExchangeInput } from '@/domain/party';

export function HomePage() {
  const [raidType, setRaidType] = useState<RaidType>(RAID_TYPES.PARTY_4_NORMAL);
  const [minDamage, setMinDamage] = useState('');
  const [minPrimaryBuff, setMinPrimaryBuff] = useState('');
  const [minSecondaryBuff, setMinSecondaryBuff] = useState('');

  const characters = useCharacterStore((state) => state.characters);
  const adventureName = useCharacterStore((state) => state.adventureName);
  const { partyResult, buildParty } = usePartyComposition();

  const meta = RAID_TYPE_META[raidType];
  const needSecondaryBuffer = meta.secondaryBufferSlots > 0;

  function handleBuildParty() {
    const input: BufferExchangeInput = {
      raidType,
      minDealerDamage: Number(minDamage) || 0,
      minPrimaryBuffPower: Number(minPrimaryBuff) || 0,
      minSecondaryBuffPower: Number(minSecondaryBuff) || 0,
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
            <TabsTrigger value="settings">설정</TabsTrigger>
          </TabsList>

          <TabsContent value="compose">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 입력 영역 */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>버퍼교환 조건</CardTitle>
                  <CardDescription>
                    레이드 유형과 최소 요구 수치를 입력하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="raidType">레이드 유형</Label>
                    <Select
                      value={raidType}
                      onValueChange={(v) => v && setRaidType(v as RaidType)}
                    >
                      <SelectTrigger id="raidType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(RAID_TYPE_META).map(([key, m]) => (
                          <SelectItem key={key} value={key}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {meta.description}
                    </p>
                  </div>

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
                        부버퍼 최소 버프력 (만)
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
                    disabled={characters.length === 0}
                  >
                    최적 파티 구성
                  </Button>

                  {characters.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      먼저 &quot;캐릭터 관리&quot; 탭에서 캐릭터를 등록하세요
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* 결과 영역 */}
              <div className="lg:col-span-2">
                {partyResult ? (
                  <PartyResult composition={partyResult} />
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

          <TabsContent value="settings">
            <ApiSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
