# 포유테일 (kkosunnae)

반려동물·유기동물 정보를 공유하고 보호소·유기동물 공고를 탐색할 수 있는 Next.js 웹 애플리케이션입니다.

## 기술 스택

- **프레임워크**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4
- **인증/DB**: Firebase (Auth, Firestore)
- **에디터**: 기본 텍스트 입력
- **미디어**: Cloudinary, next-cloudinary
- **지도**: 네이버 지도 API
- **공공 API**: 동물보호관리시스템(유기동물·보호소), V-World(지오코딩), YouTube Data API

## 프로젝트 구조

```
kkosunnae/
├── app/                    # Next.js App Router
│   ├── page.tsx            # 홈 (트렌딩/최신 글, 유기동물 탭)
│   ├── read/[id]/          # 글 읽기
│   ├── write/              # 글쓰기
│   ├── edit/[id]/          # 글 수정
│   ├── shelter/            # 유기동물 목록·상세
│   ├── animalShelter/      # 보호소 목록·상세
│   ├── search/             # 검색
│   ├── posts/[id]/         # 사용자 글 목록
│   ├── register/           # 회원가입
│   └── api/                # API Routes (shelter-data, upload, geocode 등)
├── packages/
│   ├── components/        # 공용 UI 컴포넌트
│   ├── type/               # 타입 정의
│   └── utils/              # 유틸 (metadata, locationUtils 등)
├── lib/                    # Firebase, Cloudinary, API 클라이언트
├── static/                 # 정적 에셋 (아이콘, 데이터)
└── public/                 # public 정적 파일
```

## 주요 기능

- **홈**: 트렌딩/최신 게시글, 유기동물 공고 탭, YouTube 추천 영상
- **글쓰기/수정**: 텍스트 입력, 이미지 업로드(Cloudinary), 태그·카테고리
- **유기동물**: 시도·성별·축종·접수일·검색 필터, 무한 스크롤, 상세 공고
- **보호소**: 위치 기반 보호소 목록, 네이버 지도 연동, 시도별 필터
- **검색**: 게시글·유기동물 검색
- **프로필**: 사용자 글·좋아요 목록, 프로필 수정
- **메타/SEO**: 동적 메타 태그, Open Graph 이미지, sitemap

## 시작하기

### 요구 사항

- Node.js 20+
- npm / yarn / pnpm / bun

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (기본 포트: 3001)
npm run dev
```

브라우저에서 [http://localhost:3001](http://localhost:3001) 로 접속합니다.

### 빌드 및 프로덕션

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

### 기타 스크립트

| 스크립트 | 설명 |
|---------|------|
| `npm run dev` | 개발 서버 (포트 3001) |
| `npm run build` | 프로덕션 빌드 (빌드 후 next-sitemap 자동 실행) |
| `npm run start` | 프로덕션 서버 |
| `npm run lint` | ESLint 실행 |
| `ANALYZE=true npm run build` | 번들 분석 포함 빌드 (@next/bundle-analyzer) |

## 환경 변수

`.env.local`에 다음 변수를 설정합니다.

### 필수 (서비스 동작)

| 변수명 | 설명 |
|--------|------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth 도메인 |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage 버킷 |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |

### 선택 (기능별)

| 변수명 | 설명 |
|--------|------|
| `NEXT_PUBLIC_BASE_URL` | 사이트 절대 URL (메타·OG·API 호출용, 배포 시 권장) |
| `NEXT_PUBLIC_ANIMALS_OPENAPI` | 동물보호관리시스템 유기동물 API 서비스 키 |
| `NEXT_PUBLIC_SHELTERS_OPENAPI` | 동물보호관리시스템 보호소 API 서비스 키 |
| `NEXT_PUBLIC_NAVER_MAP` | 네이버 지도 API 클라이언트 ID |
| `NEXT_PUBLIC_VWORLD_API_KEY` | V-World API 키 (지오코딩) |
| `NEXT_GOOGLE_YOUTUBE_API` | YouTube Data API 키 |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary 클라우드 이름 |
| `CLOUDINARY_API_KEY` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret |
| `SHELTER_ID_SECRET` | 보호소 상세 URL 토큰 암호화용 비밀 키 (미설정 시 기본값 사용) |
| `ANALYZE` | `true` 시 빌드 시 번들 분석 결과 생성 |

## 배포

- **Vercel**: Next.js 권장 배포 플랫폼. 저장소 연동 후 위 환경 변수를 프로젝트 설정에 추가하면 됩니다.
- 배포 시 `NEXT_PUBLIC_BASE_URL`을 실제 도메인(예: `https://www.kkosunnae.com`)으로 설정하는 것을 권장합니다.

## 참고 링크

- [Next.js 문서](https://nextjs.org/docs)
- [Vercel 배포 가이드](https://nextjs.org/docs/app/building-your-application/deploying)
