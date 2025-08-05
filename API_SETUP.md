# API 설정 가이드

## 🔧 환경 설정

### 1. 실제 백엔드 서버 사용 시 (팀원 컴퓨터)

`.env.local` 파일을 프로젝트 루트에 생성:

```bash
# 실제 백엔드 서버 URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api

# 인증 토큰 (선택사항)
NEXT_PUBLIC_ADMIN_TOKEN=your_admin_token_here
```

### 2. 개발용 - Next.js API Routes 사용 시

```bash
# Next.js 내부 API 사용
NEXT_PUBLIC_API_BASE_URL=/api
```

## 📁 파일 구조

```
src/
├── lib/
│   ├── api.ts          # API 호출 유틸리티 (실제 서버용)
│   ├── db.ts           # 목업 데이터 (개발용 - 주석 처리됨)
│   └── types.ts        # 타입 정의
├── pages/api/          # Next.js API Routes (개발용)
└── components/         # 실제 서버 API 호출로 변경됨
```

## 🔄 동작 방식

### 현재 상태:
- ✅ 환경변수로 API URL 전환 가능
- ✅ 인증 헤더 자동 추가
- ✅ 에러 핸들링 구현
- ✅ CORS 대응 준비

### API 엔드포인트:
- `GET /admin/concerts` - 콘서트 목록
- `GET /admin/concerts/{id}` - 콘서트 상세
- `POST /admin/concerts` - 콘서트 생성
- `PUT /admin/concerts/{id}` - 콘서트 수정
- `DELETE /admin/concerts/{id}` - 콘서트 삭제
- `POST /admin/login` - 관리자 로그인

## 🚀 사용법

1. **백엔드 서버 실행** (팀원 컴퓨터에서)
2. **환경변수 설정** (`.env.local` 생성)
3. **프론트엔드 실행**:
   ```bash
   npm run dev
   ```

## ⚠️ 주의사항

- **CORS 설정**: 백엔드에서 `http://localhost:3000` 허용 필요
- **인증**: JWT 토큰 방식 사용 (로그인 후 localStorage에 저장)
- **데이터 구조**: 실제 백엔드 응답 구조에 맞게 수정 필요할 수 있음

## 🔧 트러블슈팅

### CORS 에러 발생 시:
백엔드에서 CORS 설정 추가:
```javascript
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));
```

### 인증 실패 시:
1. 로그인 API로 토큰 획득
2. localStorage에 저장 또는 환경변수 설정