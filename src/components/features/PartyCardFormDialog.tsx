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
import { validateCardForTemplate } from '@/domain/planner';
import { DEALER_JOB_CATEGORIES, BUFFER_JOB_CATEGORIES } from '@/config/job-codes';

import type { PartyCard, PartyCardCharacter, RotationTemplate } from '@/domain/planner';
import type { JobCategory } from '@/config/job-codes';

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
    statStep: string;
    jobCategories: JobCategory[];
    list: CharForm[];
    setter: (v: CharForm[]) => void;
  }> = [];
  if (template.slotsPerPerson.buffer > 0) {
    sections.push({ label: '버퍼', statLabel: '버프력 (만)', statStep: '0.1', jobCategories: BUFFER_JOB_CATEGORIES, list: buffers, setter: setBuffers });
  }
  if (template.slotsPerPerson.dealer > 0) {
    sections.push({ label: '딜러', statLabel: '딜 (억)', statStep: '1', jobCategories: DEALER_JOB_CATEGORIES, list: dealers, setter: setDealers });
  }
  if (template.slotsPerPerson.secondaryBuffer > 0) {
    sections.push({ label: '업둥버퍼', statLabel: '버프력 (만)', statStep: '0.1', jobCategories: BUFFER_JOB_CATEGORIES, list: secondaryBuffers, setter: setSecondaryBuffers });
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
              placeholder="모험단 명"
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
                    <select
                      value={c.jobGrowName}
                      onChange={(e) => updateCharForm(section.list, section.setter, idx, 'jobGrowName', e.target.value)}
                      className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    >
                      <option value="">직업 선택</option>
                      {section.jobCategories.map((cat) => (
                        <optgroup key={cat.category} label={cat.category}>
                          {cat.jobs.map((job) => (
                            <option key={`${cat.category}-${job.name}`} value={job.name}>{job.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <Input
                      type="number"
                      step={section.statStep}
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
