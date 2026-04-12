import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ROTATION_TEMPLATES } from '@/domain/planner';

import type { PartyCard, PartyCardCharacter, RotationTemplateId } from '@/domain/planner';

interface PartyCardFormDialogProps {
  open: boolean;
  templateId: RotationTemplateId;
  onClose: () => void;
  onSubmit: (card: Omit<PartyCard, 'id'>) => void;
}

type CharForm = { characterName: string; jobGrowName: string; stat: string };

function makeEmpty(count: number): CharForm[] {
  return Array.from({ length: count }, () => ({ characterName: '', jobGrowName: '', stat: '' }));
}

function toCharacter(c: CharForm): PartyCardCharacter {
  return {
    characterName: c.characterName.trim(),
    jobGrowName: c.jobGrowName.trim(),
    stat: Number(c.stat) || 0,
  };
}

export function PartyCardFormDialog({ open, templateId, onClose, onSubmit }: PartyCardFormDialogProps) {
  const template = ROTATION_TEMPLATES[templateId];
  const [ownerName, setOwnerName] = useState('');
  const [buffers, setBuffers] = useState<CharForm[]>(() => makeEmpty(template.slotsPerPerson.buffer));
  const [dealers, setDealers] = useState<CharForm[]>(() => makeEmpty(template.slotsPerPerson.dealer));
  const [secondaryBuffers, setSecondaryBuffers] = useState<CharForm[]>(() => makeEmpty(template.slotsPerPerson.secondaryBuffer));
  const [carries, setCarries] = useState<CharForm[]>(() => makeEmpty(template.slotsPerPerson.carry));

  // 템플릿 변경 또는 다이얼로그 재오픈 시 폼 리셋
  useEffect(() => {
    if (open) {
      setOwnerName('');
      setBuffers(makeEmpty(template.slotsPerPerson.buffer));
      setDealers(makeEmpty(template.slotsPerPerson.dealer));
      setSecondaryBuffers(makeEmpty(template.slotsPerPerson.secondaryBuffer));
      setCarries(makeEmpty(template.slotsPerPerson.carry));
    }
  }, [open, template]);

  function updateCharForm(
    list: CharForm[],
    setter: (v: CharForm[]) => void,
    idx: number,
    field: keyof CharForm,
    value: string,
  ) {
    const next = list.map((item, i) => (i === idx ? { ...item, [field]: value } : item));
    setter(next);
  }

  function handleSubmit() {
    if (!ownerName.trim()) return;
    onSubmit({
      ownerName: ownerName.trim(),
      buffers: buffers.map(toCharacter),
      dealers: dealers.map(toCharacter),
      secondaryBuffers: secondaryBuffers.map(toCharacter),
      carries: carries.map(toCharacter),
    });
    onClose();
  }

  const sections: Array<{
    label: string;
    statLabel: string;
    list: CharForm[];
    setter: (v: CharForm[]) => void;
  }> = [];
  if (template.slotsPerPerson.buffer > 0) {
    sections.push({ label: '버퍼', statLabel: '버프력 (만)', list: buffers, setter: setBuffers });
  }
  if (template.slotsPerPerson.dealer > 0) {
    sections.push({ label: '딜러', statLabel: '딜 (억)', list: dealers, setter: setDealers });
  }
  if (template.slotsPerPerson.secondaryBuffer > 0) {
    sections.push({ label: '업둥버퍼', statLabel: '버프력 (만)', list: secondaryBuffers, setter: setSecondaryBuffers });
  }
  if (template.slotsPerPerson.carry > 0) {
    sections.push({ label: '업둥', statLabel: '-', list: carries, setter: setCarries });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>파티 카드 추가</DialogTitle>
          <DialogDescription>
            {template.label} · {template.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="owner">닉네임 (카드 소유자)</Label>
            <Input
              id="owner"
              placeholder="예: 트랜스코어"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
            />
          </div>

          {sections.map((section) => (
            <div key={section.label} className="space-y-2">
              <Label>{section.label} ({section.list.length}명)</Label>
              <div className="space-y-2">
                {section.list.map((c, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_100px] gap-2">
                    <Input
                      placeholder="캐릭터명"
                      value={c.characterName}
                      onChange={(e) => updateCharForm(section.list, section.setter, idx, 'characterName', e.target.value)}
                    />
                    <Input
                      placeholder="직업명 (선택)"
                      value={c.jobGrowName}
                      onChange={(e) => updateCharForm(section.list, section.setter, idx, 'jobGrowName', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder={section.statLabel}
                      value={c.stat}
                      onChange={(e) => updateCharForm(section.list, section.setter, idx, 'stat', e.target.value)}
                      disabled={section.label === '업둥'}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Button className="w-full" onClick={handleSubmit} disabled={!ownerName.trim()}>
            카드 추가
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
