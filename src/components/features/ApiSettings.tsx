import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useApiSettings } from '@/hooks/useApiSettings';

export function ApiSettings() {
  const { proxyUrl, setProxyUrl, saved, saveSettings } = useApiSettings();

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API 설정</CardTitle>
          <CardDescription>
            Cloudflare Workers 프록시 URL을 설정합니다.
            네오플 API 키는 프록시 서버에서 관리됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proxyUrl">프록시 서버 URL</Label>
            <Input
              id="proxyUrl"
              placeholder="https://your-worker.your-subdomain.workers.dev"
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Cloudflare Workers로 배포한 API 프록시 URL을 입력하세요.
              미입력 시 환경변수(VITE_API_PROXY_URL) 또는 기본값(localhost:8787)을
              사용합니다.
            </p>
          </div>

          <Button onClick={saveSettings}>
            {saved ? '저장 완료!' : '저장'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cloudflare Workers 프록시 배포 안내</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            네오플 API 키 보안을 위해 Cloudflare Workers 프록시를 사용합니다.
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>
              <a
                href="https://developers.neople.co.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                네오플 개발자 포털
              </a>
              에서 API 키를 발급받으세요
            </li>
            <li>프로젝트의 <code className="px-1 py-0.5 bg-muted rounded text-xs">worker/</code> 디렉토리에서 Cloudflare Workers를 배포하세요</li>
            <li>Workers 환경변수에 <code className="px-1 py-0.5 bg-muted rounded text-xs">NEOPLE_API_KEY</code>를 설정하세요</li>
            <li>배포된 Workers URL을 위 설정에 입력하세요</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
