# Cloudflare 배포

## 배포 방식

이 프로젝트는 Cloudflare Pages의 `next-on-pages`가 아니라 `@opennextjs/cloudflare` 기반 Cloudflare Workers 배포를 사용합니다.

로컬 배포:

```bash
npm install
npm run deploy
```

## 필수 파일

- `wrangler.jsonc`
- `open-next.config.ts`
- `public/_headers`

## GitHub Actions 자동 배포

워크플로 파일:

- `.github/workflows/deploy-cloudflare.yml`

트리거:

- `main` 브랜치 push
- GitHub Actions 수동 실행 (`workflow_dispatch`)

실행 순서:

```bash
npm ci
npx wrangler secret bulk .cloudflare-secrets.json
npm run lint
npm run deploy
```

## GitHub Secrets

GitHub 저장소 `Settings -> Secrets and variables -> Actions`에 아래 시크릿을 추가해야 합니다.

### Cloudflare 인증

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### 앱 빌드/런타임 환경변수

- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_ANIMALS_OPENAPI`
- `NEXT_PUBLIC_VWORLD_API_KEY`
- `NEXT_PUBLIC_NAVER_MAP`

설명:

- GitHub Actions의 `env`는 빌드 프로세스에서는 읽히지만 Worker 런타임 변수로 자동 저장되지 않습니다.
- 따라서 워크플로에서 `wrangler secret bulk`로 Cloudflare Worker secrets에 먼저 동기화한 뒤 배포합니다.
- 배포 명령에는 `--keep-vars`를 붙여 Cloudflare 대시보드에 이미 저장된 변수들이 삭제되지 않게 했습니다.

## Cloudflare 쪽 설정

Cloudflare Pages의 기존 `Build command`에 아래가 남아 있으면 제거해야 합니다.

```bash
npx @cloudflare/next-on-pages@1
```

이 프로젝트는 Pages 빌드가 아니라 Workers 배포 흐름을 사용합니다.

## 배포 전 확인

로컬에서 아래가 통과해야 합니다.

```bash
npm run build
npx opennextjs-cloudflare build
npx wrangler deploy --dry-run
```

현재 기준 dry-run 결과:

```txt
Total Upload: 6712.74 KiB / gzip: 1439.97 KiB
```

Cloudflare Free 플랜의 Worker 크기 제한은 gzip 기준 `3 MiB`입니다.

공식 문서:

- [OpenNext Cloudflare Get Started](https://opennext.js.org/cloudflare/get-started)
- [OpenNext Troubleshooting](https://opennext.js.org/cloudflare/troubleshooting)
- [Cloudflare Workers GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)
