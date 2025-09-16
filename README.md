# 🎫 Concert Ticketing

**Concert Ticketing**은 **온라인 콘서트 티켓 예매 플랫폼**으로,  
사용자가 쉽고 빠르게 공연을 예매하고, 관리자가 좌석과 공연을 효율적으로 관리할 수 있도록 설계되었습니다.  

![concert](https://user-images.githubusercontent.com/yourusername/concert-image.png) <!-- 예시 이미지 URL -->

---

## ✨ Features

### 👤 사용자(User)
- 회원가입 & 로그인 (소셜 로그인 포함)
- 공연 예매 및 취소
- 좌석 선택 (SVG 기반 구역/좌석 시각화)
- 예매 내역 확인
- 1:1 문의 작성

### 🎤 공연 관리자(Concert Manager)
- 콘서트 등록 및 회차 관리
- SVG 기반 구역/좌석/가격 설정
- 잔여석 관리 및 좌석 상태 업데이트

### 🛠 관리자(Admin)
- 사용자 및 관리자 관리
- 배너 관리
- 1:1 문의 답변, 공지사항 & FAQ 관리

---

## 💡 Contribution Highlights

### 🎨 좌석 선택 UI/UX
- SVG 기반 공연장 좌석 선택 인터페이스 구현
- 구역별 색상 표시 & 좌석 상태(선택/비활성화) 로직 구현
- 예매/취소 시 좌석 상태 실시간 업데이트

### 💳 예매 & 결제 플로우
- KakaoPay 결제 연동
- 예매 과정 중 예외 처리 & 상태 관리 구현
- 최근 예매 내역, 페이징, 취소/환불 기능 개발

### 🧑‍💻 관리자 기능 개선
- 콘서트 & 좌석 관리 UI 구현
- 배너/공지사항 CRUD 기능 개발
- 1:1 문의 답변 관리 & 사용자 권한 제어

### ⚡ 상태 관리 & API 연동
- Zustand 및 React Query 기반 상태 관리
- 프론트엔드와 Spring Boot + MySQL API 연동
- 사용자 친화적 오류 처리 & 메시지 구현

> 주로 **프론트엔드** 담당, **백엔드 API 연동 & DB 구조 이해**에도 참여하여 프로젝트 전반의 기술 이해도 확장

---

## 🛠 Tech Stack

| Frontend | Backend | Payment | Design |
|----------|---------|---------|--------|
| React, Next.js, CSS, Zustand | Spring Boot, MySQL | KakaoPay | Figma (UI/UX 시안 제작) |

---

## 🚀 Getting Started

```bash
# 설치
yarn

# 개발 서버 실행
yarn dev
