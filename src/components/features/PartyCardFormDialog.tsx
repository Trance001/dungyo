import { useEffect, useState } from 'react';

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { validateCardForTemplate } from '@/domain/planner';
import { DEALER_JOB_OPTIONS, BUFFER_JOB_OPTIONS } from '@/config/job-codes';

import type { PartyCard, PartyCardCharacter, RotationTemplate } from '@/domain/planner';

interface PartyCardFormDialogProps {
  open: boolean;
  template: RotationTemplate;
  /** 수정 모드일 때 기존 카드 데이터 */
  editCard?: PartyCard | null;
  onClose: () => void;
  onSubmit: (card: Omit<PartyCard, 'id'>) => void;
}

type CharForm = { jobGrowName: string; stat: string };

function makeEmpty(count: number): CharForm[] {
  return Array.from({ length: count }, () => ({ jobGrowName: '', stat: '' }));
}

function fromCharacters(chars: PartyCardCharacter[], expectedCount: number): CharForm[] {
  const forms = chars.map((c) => ({
    jobGrowName: c.jobGrowName.replace(/^眞\s*/, ''),
    stat: c.stat > 0 ? String(c.stat) : '',
  }));
  while (forms.length < expectedCount) {
    forms.push({ jobGrowName: '', stat: '' });
  }
  return forms.slice(0, expectedCount);
}

function toCharacter(c: CharForm): PartyCardCharacter {
  return {
    jobGrowName: c.jobGrowName.trim(),
    stat: Number(c.stat) || 0,
  };
}

export function PartyCardFormDialog({ open, template, editCard, onClose, onSubmit }: PartyCardFormDialogProps) {
  const [ownerName, setOwnerName] = useState('');
  const [buffers, setBuffers] = useState<CharForm[]>(() => makeEmpty(template.slotsPerPerson.buffer));
  const [dealers, setDealers] = useState<CharForm[]>(() => makeEmpty(template.slotsPerPerson.dealer));
  const [secondaryBuffers, setSecondaryBuffers] = useState<CharForm[]>(() => makeEmpty(template.slotsPerPerson.secondaryBuffer));

  const isEditMode = editCard !== null && editCard !== undefined;

  useEffect(() => {
    if (open) {
      if (editCard) {
        setOwnerName(editCard.ownerName);
        setBuffers(fromCharacters(editCard.buffers, template.slotsPerPerson.buffer));
        setDealers(fromCharacters(editCard.dealers, template.slotsPerPerson.dealer));
        setSecondaryBuffers(fromCharacters(editCard.secondaryBuffers, template.slotsPerPerson.secondaryBuffer));
      } else {
        setOwnerName('');
        setBuffers(makeEmpty(template.slotsPerPerson.buffer));
        setDealers(makeEmpty(template.slotsPerPerson.dealer));
        setSecondaryBuffers(makeEmpty(template.slotsPerPerson.secondaryBuffer));
      }
    }
  }, [open, template, editCard]);

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

  const cardData: Omit<PartyCard, 'id'> = {
    ownerName: ownerName.trim(),
    buffers: buffers.map(toCharacter),
    dealers: dealers.map(toCharacter),
    secondaryBuffers: secondaryBuffers.map(toCharacter),
    carries: [],
  };

  const validationError = ownerName.trim() ? validateCardForTemplate(cardData, template) : null;
  const canSubmit = ownerName.trim() !== '' && validationError === null;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit(cardData);
    onClose();
  }

  const sections: Array<{
    label: string;
    statLabel: string;
    jobOptions: string[];
    list: CharForm[];
    setter: (v: CharForm[]) => void;
  }> = [];
  if (template.slotsPerPerson.buffer > 0) {
    sections.push({ label: '버퍼', statLabel: '버프력 (만)', jobOptions: BUFFER_JOB_OPTIONS, list: buffers, setter: setBuffers });
  }
  if (template.slotsPerPerson.dealer > 0) {
    sections.push({ label: '딜러', statLabel: '딜 (억)', jobOptions: DEALER_JOB_OPTIONS, list: dealers, setter: setDealers });
  }
  if (template.slotsPerPerson.secondaryBuffer > 0) {
    sections.push({ label: '업둥버퍼', statLabel: '버프력 (만)', jobOptions: BUFFER_JOB_OPTIONS, list: secondaryBuffers, setter: setSecondaryBuffers });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-2xl max-h-[85vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEditMode ? '파티 카드 수정' : '파티 카드 추가'}</DialogTitle>
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
                  <div key={idx} className="grid grid-cols-[1fr_100px] gap-2">
                    <Select
                      value={c.jobGrowName}
                      onValueChange={(v) => v && updateCharForm(section.list, section.setter, idx, 'jobGrowName', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="직업 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {section.jobOptions.map((job) => (
                          <SelectItem key={job} value={job}>
                            {job}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder={section.statLabel}
                      value={c.stat}
                      onChange={(e) => updateCharForm(section.list, section.setter, idx, 'stat', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}

          <Button className="w-full" onClick={handleSubmit} disabled={!canSubmit}>
            {isEditMode ? '카드 수정' : '카드 추가'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
