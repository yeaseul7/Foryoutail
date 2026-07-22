# 꼬순내

전국 유기동물 입양 공고를 탐색하고 사진 기반 AI 검색을 이용할 수 있는 입양 정보 서비스입니다.

서비스 URL: [https://www.kkosunnae.com](https://www.kkosunnae.com)

## 주요 기능

- 유기동물 공고 조회, 지역·축종·상태별 필터링, 상세 정보 확인
- 사진 기반 유사 동물 AI 검색
- 동물 찜과 인기 동물 집계
- 이메일 매직 링크와 Google·GitHub·Kakao OAuth 로그인
- 동적 메타데이터, sitemap, robots.txt 제공

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| 프런트엔드 | Next.js 16 App Router, React 19, TypeScript |
| 스타일 | Tailwind CSS 4, Sass |
| 인증·데이터베이스 | Supabase Auth, Supabase PostgreSQL |
| 지역 데이터 | 국가동물보호정보 시도 코드 |
| 이미지·AI | Cloud Run 백엔드, Cloudinary, 이미지 유사도 검색 API |
| 배포 | Cloudflare Workers, OpenNext, Wrangler |
| 품질·SEO | ESLint, next-sitemap, Next.js Metadata API |

## 화면 구성

| 경로 | 설명 |
| --- | --- |
| `/` | 사진 기반 유사 동물 AI 검색 |
| `/shelter` | 유기동물 입양 공고 목록 |
| `/shelter/[id]` | 유기동물 상세 정보 |
| `/register` | 로그인 후 프로필 및 가입 정보 설정 |
| `/about`, `/terms`, `/privacy` | 서비스 소개, 이용약관, 개인정보처리방침 |

## 프로젝트 구조

```text
app/                         Next.js App Router 페이지와 Route Handler
├── api/                     유기동물, 보호소 기본 정보, 위치 API
└── shelter/                 유기동물 공고 목록·상세
hooks/                       인증 사용자 기반 클라이언트 훅
lib/
├── client/                  브라우저 데이터 접근 및 이미지 업로드
├── domain/                  유기동물 도메인 로직
├── server/                  Supabase service role 서버 클라이언트
└── supabase/                Supabase 인증 및 브라우저 클라이언트
packages/
├── components/              화면 단위 React 컴포넌트
├── type/                    공용 타입
└── utils/                   메타데이터, 지도, 날짜 등 공용 유틸리티
public/                      이미지, 폰트, sitemap, robots.txt
static/                      지역 코드 등 정적 데이터
```

## 로컬 개발

### 요구 사항

- Node.js 22 권장
- npm
- Supabase 프로젝트
- AI 검색과 이미지 업로드를 사용할 경우 별도 백엔드 서버

### 설치 및 실행

```bash
npm install
npm run dev
```

개발 서버는 [http://localhost:3001](http://localhost:3001)에서 실행됩니다.

AI 검색과 이미지 업로드는 개발 환경에서 아래 백엔드를 호출합니다.

```text
http://localhost:8081/api/search/animals
http://localhost:8081/api/images/upload
```

백엔드를 실행하지 않아도 일반 페이지 개발은 가능하지만 AI 검색은 동작하지 않습니다.

## 환경 변수

루트의 `.env.local`에 값을 설정합니다.

```dotenv
NEXT_PUBLIC_BASE_URL=http://localhost:3001

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_ANIMALS_OPENAPI=

# 선택: 번들 분석
ANALYZE=false
```

| 변수 | 용도 | 비고 |
| --- | --- | --- |
| `NEXT_PUBLIC_BASE_URL` | canonical URL과 sitemap 기준 URL | 로컬은 `http://localhost:3001` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | 필수 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 브라우저용 Supabase publishable key | 필수, secret key 사용 금지 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable key가 없을 때 사용하는 기존 anon key | 선택 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 Route Handler의 관리자 DB 접근 | 필수, 브라우저 노출 금지 |
| `NEXT_PUBLIC_ANIMALS_OPENAPI` | 국가동물보호정보 API의 시도 코드 조회 | 필수 |
| `ANALYZE` | `true`일 때 Next.js 번들 분석 활성화 | 선택 |

Supabase Auth를 사용하려면 프로젝트 대시보드에서 이메일 OTP와 필요한 OAuth 공급자(Google, GitHub, Kakao)를 별도로 활성화하고 redirect URL을 등록해야 합니다.

## Supabase 데이터

애플리케이션은 다음 테이블을 사용합니다.

| 테이블 | 용도 |
| --- | --- |
| `users` | 사용자 프로필 |
| `animals` | 유기동물 공고 |
| `shelters` | 동물보호소 정보 |
| `animal_likes` | 사용자별 동물 찜 |
| `ai_search_usage` | 사용자별 AI 검색 잔여 횟수 |

브라우저에서 직접 접근하는 테이블은 Supabase RLS 정책이 필요합니다. `SUPABASE_SERVICE_ROLE_KEY`는 `lib/server`와 서버 Route Handler에서만 사용해야 합니다.

## 주요 API

| 메서드·경로 | 설명 |
| --- | --- |
| `GET /api/shelter-data` | 유기동물 공고 조회·필터링 |
| `GET /api/shelter-info` | 입양 공고 상세용 보호소 기본 정보 |
| `GET`, `POST /api/supabase/users/sync` | Supabase Auth 사용자와 공개 프로필 동기화 |

## npm 스크립트

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 포트 3001에서 개발 서버 실행 |
| `npm run build` | Next.js 프로덕션 빌드 후 sitemap 생성 |
| `npm run start` | 프로덕션 Next.js 서버 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run preview` | OpenNext 빌드 후 로컬 Worker 미리보기 |
| `npm run deploy` | OpenNext 빌드 후 Cloudflare Workers 배포 |
| `npm run upload` | 배포하지 않고 Worker 버전 업로드 |
| `npm run cf-typegen` | Cloudflare 환경 타입 생성 |

## 검증

```bash
npm run lint
npm run build
```

Cloudflare 배포 산출물까지 확인하려면 다음 명령을 실행합니다.

```bash
npx opennextjs-cloudflare build
npx wrangler deploy --dry-run
```

## 배포

이 프로젝트는 `@opennextjs/cloudflare`를 통해 Cloudflare Workers에 배포됩니다.

```bash
npm run deploy
```

`main` 브랜치에 push하면 `.github/workflows/deploy-cloudflare.yml`이 다음 순서로 자동 배포합니다.

1. Node.js 22 설정 및 `npm ci`
2. GitHub Secrets를 Cloudflare Worker secrets로 동기화
3. ESLint 실행
4. OpenNext 빌드 및 Cloudflare Workers 배포

배포에 필요한 GitHub Secrets와 Cloudflare 설정은 [DEPLOY.md](./DEPLOY.md)를 참고합니다.
