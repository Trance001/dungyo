/**
 * Cloudflare Workers - 네오플 API 프록시
 *
 * 역할:
 * - 네오플 API 키를 서버 사이드에서 관리 (클라이언트 노출 방지)
 * - CORS 헤더 추가
 * - 요청을 네오플 API로 프록시
 *
 * 환경변수:
 * - NEOPLE_API_KEY: 네오플 개발자 포털에서 발급받은 API 키
 * - ALLOWED_ORIGIN: 허용할 프론트엔드 도메인 (예: https://username.github.io)
 */

interface Env {
  NEOPLE_API_KEY: string;
  ALLOWED_ORIGIN?: string;
}

const NEOPLE_BASE_URL = 'https://api.neople.co.kr';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return corsResponse(env, new Response(null, { status: 204 }));
    }

    // GET만 허용
    if (request.method !== 'GET') {
      return corsResponse(
        env,
        new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }

    // API 키 확인
    if (!env.NEOPLE_API_KEY) {
      return corsResponse(
        env,
        new Response(
          JSON.stringify({ error: 'API key not configured' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );
    }

    // 요청 URL에서 경로 추출
    const url = new URL(request.url);
    const path = url.pathname;
    const searchParams = new URLSearchParams(url.search);

    // API 키를 쿼리 파라미터에 추가
    searchParams.set('apikey', env.NEOPLE_API_KEY);

    // 네오플 API로 프록시
    const targetUrl = `${NEOPLE_BASE_URL}${path}?${searchParams.toString()}`;

    try {
      const apiResponse = await fetch(targetUrl, {
        headers: {
          'Accept': 'application/json',
        },
      });

      const body = await apiResponse.text();

      return corsResponse(
        env,
        new Response(body, {
          status: apiResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60',
          },
        }),
      );
    } catch {
      return corsResponse(
        env,
        new Response(
          JSON.stringify({ error: 'Failed to fetch from Neople API' }),
          {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );
    }
  },
};

function corsResponse(env: Env, response: Response): Response {
  const origin = env.ALLOWED_ORIGIN ?? '*';
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Max-Age', '86400');

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
