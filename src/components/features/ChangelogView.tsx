import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CHANGELOG } from '@/config/changelog';

import type { ChangelogEntry } from '@/config/changelog';

const TYPE_LABEL: Record<ChangelogEntry['type'], string> = {
  feat: '추가',
  fix: '수정',
};

const TYPE_COLOR: Record<ChangelogEntry['type'], string> = {
  feat: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  fix: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export function ChangelogView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>변경사항</CardTitle>
        <CardDescription>최신 업데이트 내역을 확인하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {CHANGELOG.map((entry, idx) => (
            <li key={idx} className="border-l-2 border-border pl-4 py-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[entry.type]}`}>
                  {TYPE_LABEL[entry.type]}
                </span>
                <time className="text-xs text-muted-foreground">{entry.date}</time>
              </div>
              <p className="text-sm">{entry.description}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
