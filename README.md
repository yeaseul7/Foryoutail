# 포유테일 (kkosunnae)

반려동물·유기동물 정보를 공유하고 보호소·유기동물 공고를 탐색할 수 있는 Next.js 웹 애플리케이션입니다.

## 기술 스택

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Supabase Auth / DB
- Cloudinary
- Naver Maps API
- Cloudflare Workers + OpenNext

## 개발

요구 사항:

- Node.js 20+
- npm

실행:

```bash
npm install
npm run dev
```

기본 포트:

```txt
http://localhost:3001
```

## 주요 스크립트

| 스크립트 | 설명 |
|---------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | Next.js 프로덕션 빌드 + sitemap 생성 |
| `npm run lint` | ESLint 실행 |
| `npm run preview` | OpenNext 로컬 Worker 미리보기 |
| `npm run deploy` | OpenNext 빌드 후 Cloudflare Workers 배포 |
| `npm run upload` | OpenNext 빌드 후 Worker 버전 업로드 |
| `npm run cf-typegen` | Cloudflare env 타입 생성 |

## 환경 변수

주요 변수:

- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_ANIMALS_OPENAPI`
- `NEXT_PUBLIC_VWORLD_API_KEY`
- `NEXT_PUBLIC_NAVER_MAP`

## 배포

이 프로젝트는 `@cloudflare/next-on-pages`가 아니라 `@opennextjs/cloudflare` 기반 Cloudflare Workers 배포를 사용합니다.

배포:

```bash
npm run deploy
```

자동 배포:

- `main` 브랜치 push 시 GitHub Actions가 Cloudflare Workers로 자동 배포
- 워크플로 파일: `.github/workflows/deploy-cloudflare.yml`
- 배포 전 GitHub Secrets 값을 Cloudflare Worker secrets로 동기화한 뒤 배포

상세 절차:

- [DEPLOY.md](./DEPLOY.md)
