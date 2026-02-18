---
id: SPEC-UI-001
title: "Frontend Design System & Complete Screen Design via Pencil MCP"
version: 1.0.0
status: draft
created: 2026-02-17
updated: 2026-02-17
author: MoAI
priority: high
tags: [ui, design-system, pencil-mcp, frontend, responsive]
related_specs: []
---

# SPEC-UI-001: Frontend Design System & Pencil MCP 전체 화면 설계

## 1. Environment (환경)

### 1.1 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js (App Router) | 15.x |
| UI Library | React | 19.x |
| CSS Framework | Tailwind CSS | 4.x |
| Component Library | shadcn/ui (Radix UI 기반) | latest |
| State Management | Zustand | latest |
| Data Fetching | TanStack Query | v5 |
| Form | React Hook Form + Zod | latest |
| Icons | Lucide React | latest |
| Design Tool | Pencil MCP (.pen 파일) | latest |
| Markdown Rendering | react-markdown + remark/rehype | latest |

### 1.2 디자인 제약사항

- **디자인 스타일**: Modern Minimal (깔끔한 여백, 명확한 타이포그래피, shadcn/ui 기반)
- **디자인 도구**: Pencil MCP를 통한 .pen 파일 생성 및 관리
- **반응형 Breakpoints**:
  - Mobile: 375px (기준 디바이스)
  - Tablet: 768px
  - Desktop: 1280px+
- **접근성**: WCAG 2.1 AA 기준 준수
- **다크 모드**: 디자인 단계에서 고려 (Light 우선, Dark 토큰 정의)

### 1.3 프로젝트 구조 (Frontend)

```
apps/web/
  app/
    (auth)/          # 인증 라우트 그룹
    (dashboard)/     # 대시보드 라우트 그룹
    courses/         # 강좌 관련
    api/             # Next.js API 라우트
  components/
    auth/            # 인증 컴포넌트
    course/          # 강좌 컴포넌트
    dashboard/       # 대시보드 위젯
    editor/          # 마크다운 에디터
    material/        # 강의 자료 뷰어
    memo/            # 메모 컴포넌트
    qa/              # Q&A 컴포넌트
    quiz/            # 퀴즈 컴포넌트
    team/            # 팀 관리 UI
    ui/              # 공유 UI 프리미티브 (shadcn/ui)
```

---

## 2. Assumptions (가정)

### 2.1 사용자 역할

- **Instructor (강사)**: 강의 자료 업로드, 퀴즈 생성/관리, Q&A 답변, 수강생 관리
- **Student (학생)**: 강의 자료 학습, 텍스트 하이라이트 Q&A, 메모 작성, 퀴즈 응시, 팀 활동

### 2.2 디자인 가정

- shadcn/ui 기본 테마를 확장하여 교육 플랫폼에 적합한 디자인 시스템 구축
- Pencil MCP를 통해 모든 화면을 .pen 파일로 관리하며, 이를 기반으로 구현 진행
- Mobile-first 반응형 접근법을 채택하되, Desktop 환경이 주요 사용 환경
- Lucide 아이콘을 일관되게 사용하며 커스텀 아이콘은 최소화
- Markdown 렌더링 영역은 코드 블록, 수학 수식, 이미지 등 풍부한 콘텐츠를 지원

### 2.3 기술 가정

- Next.js App Router의 서버 컴포넌트와 클라이언트 컴포넌트를 적절히 분리
- TanStack Query로 서버 상태를 관리하고, Zustand로 클라이언트 UI 상태 관리
- WebSocket을 통한 실시간 업데이트 (Q&A 알림, 팀 협업)

---

## 3. Requirements (요구사항)

### 3.1 Design System 요구사항

#### REQ-UI-001: Color Palette 정의

시스템은 **항상** 다음 색상 체계를 유지해야 한다:

- Primary: 교육/학습을 상징하는 메인 컬러 (Blue 계열)
- Secondary: 보조 액센트 컬러
- Accent: 강조 및 CTA 버튼 컬러
- Semantic Colors: Success (Green), Warning (Amber), Error (Red), Info (Blue)
- Neutral: Gray 스케일 (Background, Surface, Border, Text)
- Dark Mode: 각 색상의 Dark variant 토큰 정의

#### REQ-UI-002: Typography Scale 정의

시스템은 **항상** 일관된 타이포그래피 체계를 유지해야 한다:

- Display: 대형 타이틀 (Landing page hero)
- H1-H6: 계층적 헤딩 시스템
- Body: 본문 텍스트 (Large, Default, Small)
- Code: 코드 블록 및 인라인 코드 전용 폰트
- Caption: 보조 텍스트, 메타 정보
- 한글/영문 혼용을 위한 font-family 정의 (Inter + Pretendard 또는 동등 폰트)

#### REQ-UI-003: Spacing & Layout System 정의

시스템은 **항상** Tailwind CSS 기본 스페이싱 시스템과 정렬되어야 한다:

- 4px 단위 기반 스페이싱 (0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24)
- 그리드 시스템: 12-column grid (Desktop), 8-column (Tablet), 4-column (Mobile)
- 최대 콘텐츠 너비: 1280px (max-w-7xl)
- 사이드바 너비: 256px (확장), 64px (축소)

#### REQ-UI-004: Component Token 정의

시스템은 **항상** 다음 컴포넌트 토큰을 제공해야 한다:

- Card: elevation(shadow), radius, padding variants
- Button: Primary, Secondary, Ghost, Destructive, Outline 변형
- Input: Default, Error, Disabled, Focused 상태
- Dialog/Modal: Overlay, content, animation 토큰
- Badge: Status(info, success, warning, error), Role(instructor, student)
- Avatar: 크기 변형 (xs, sm, md, lg, xl)
- Toast/Notification: 타입별 스타일 (success, error, warning, info)

#### REQ-UI-005: Navigation Pattern 정의

**IF** 디바이스가 Desktop(1280px+) **THEN** Sidebar 네비게이션(접기 가능)을 제공한다.

**IF** 디바이스가 Tablet(768px) **THEN** 접을 수 있는 Sidebar를 제공한다.

**IF** 디바이스가 Mobile(375px) **THEN** Bottom Tab 네비게이션 + 보조 메뉴용 Hamburger를 제공한다.

---

### 3.2 Authentication & Onboarding 화면 (5 screens)

#### REQ-UI-010: Landing Page

시스템은 **항상** 서비스 소개, Hero 섹션, 주요 기능 하이라이트, CTA 버튼을 포함하는 Landing Page를 제공해야 한다.

- Hero 섹션: 서비스 핵심 가치 전달, 메인 CTA (시작하기/회원가입)
- Feature Highlights: 아이콘 + 설명 카드 그리드 (강의 자료, Q&A, 퀴즈, 팀 학습)
- Social Proof: 사용 통계 또는 추천사
- Footer: 링크 모음, 저작권 정보

#### REQ-UI-011: Login Page

**WHEN** 사용자가 로그인 페이지에 접근 **THEN** Email/Password 입력 폼과 소셜 로그인 옵션을 표시한다.

- 이메일/비밀번호 폼 (React Hook Form + Zod 검증)
- 소셜 로그인 버튼 (Google, GitHub 등)
- "비밀번호 찾기" 링크
- "회원가입" 링크
- 에러 상태 표시 (잘못된 자격 증명)

#### REQ-UI-012: Register Page

**WHEN** 사용자가 회원가입 페이지에 접근 **THEN** 역할 선택(Instructor/Student)과 등록 폼을 표시한다.

- 역할 선택 UI (Instructor / Student 카드)
- 이름, 이메일, 비밀번호, 비밀번호 확인 입력
- 약관 동의 체크박스
- 소셜 계정으로 가입 옵션
- 폼 유효성 검증 (실시간 피드백)

#### REQ-UI-013: Password Reset Page

**WHEN** 사용자가 비밀번호 재설정을 요청 **THEN** 이메일 인증 플로우를 제공한다.

- Step 1: 이메일 입력 및 인증 코드 발송
- Step 2: 인증 코드 입력
- Step 3: 새 비밀번호 설정
- 성공/실패 피드백

#### REQ-UI-014: Profile Settings Page

**WHEN** 사용자가 프로필 설정에 접근 **THEN** 사용자 정보, 아바타, 알림 설정을 편집할 수 있는 UI를 제공한다.

- 아바타 업로드/변경
- 이름, 이메일, 소속 정보 수정
- 비밀번호 변경
- 알림 설정 (이메일, 푸시, 인앱)
- 계정 삭제 옵션

---

### 3.3 Course Management 화면 (4 screens)

#### REQ-UI-020: Course Browse/List Page

시스템은 **항상** 강좌 목록을 Grid/List 뷰로 전환 가능하게 제공하며, 검색, 필터, 카테고리 기능을 포함해야 한다.

- 뷰 전환: Grid View / List View 토글
- 검색바: 강좌명, 강사명 검색
- 필터: 카테고리, 난이도, 정렬 (최신순, 인기순, 이름순)
- 강좌 카드: 썸네일, 제목, 강사명, 수강생 수, 진행률(학생용)
- 페이지네이션 또는 무한 스크롤

#### REQ-UI-021: Course Detail Page

**WHEN** 사용자가 강좌를 선택 **THEN** 강좌 개요, 커리큘럼, 강사 정보, 수강 신청 버튼을 포함하는 상세 페이지를 표시한다.

- 강좌 헤더: 제목, 설명, 강사 정보, 수강생 수
- 커리큘럼/시러버스: 모듈/토픽 트리 구조
- 학습 자료 미리보기 (일부)
- 수강 신청/등록 CTA 버튼
- 리뷰/평점 섹션 (옵션)

#### REQ-UI-022: Course Creation Page (Instructor)

**IF** 사용자 역할이 Instructor **AND WHEN** 강좌 생성을 선택 **THEN** 제목, 설명, 설정 폼을 제공한다.

- 강좌 제목, 부제목 입력
- 설명 (Markdown 에디터)
- 카테고리 선택
- 썸네일 업로드
- 공개/비공개 설정
- 수강 인원 제한 설정

#### REQ-UI-023: Course Settings Page (Instructor)

**IF** 사용자 역할이 Instructor **AND WHEN** 강좌 설정에 접근 **THEN** 강좌 편집, 수강생 관리, 분석 기능을 제공한다.

- 강좌 정보 수정 탭
- 수강생 목록 및 관리 탭
- 학습 분석/통계 탭
- 강좌 삭제/보관 옵션

---

### 3.4 Lecture Material 화면 (4 screens)

#### REQ-UI-030: Material List Page

시스템은 **항상** 강좌 내 학습 자료를 모듈/토픽별로 정리하여 표시해야 한다.

- 모듈별 아코디언/트리 뷰
- 자료별: 제목, 유형, 상태(완료/진행중/미시작)
- 드래그 앤 드롭 정렬 (Instructor)
- 진행률 표시바 (Student)

#### REQ-UI-031: Material Viewer (핵심 UX)

**WHEN** 사용자가 학습 자료를 열람 **THEN** 전체 Markdown 렌더링과 텍스트 하이라이트 Q&A 팝업 기능을 제공한다.

이 화면은 lecture-moa의 **핵심 사용자 경험**이다:

- Markdown 렌더링 엔진: GFM, 코드 하이라이팅, 수학 수식(KaTeX), 이미지
- 텍스트 선택 시 하이라이트 팝업 UI 트리거
- Q&A 팝업: 선택된 텍스트에 앵커된 Inline popup
- 사이드바: 목차(ToC), 기존 Q&A 마커 목록
- 읽기 진행률 트래커
- 북마크/메모 연결 기능

#### REQ-UI-032: Material Editor (Instructor)

**IF** 사용자 역할이 Instructor **AND WHEN** 자료 편집을 선택 **THEN** Split-pane Markdown 에디터와 프리뷰를 제공한다.

- 좌측: Markdown 소스 에디터 (구문 강조)
- 우측: 실시간 프리뷰
- 툴바: 서식, 이미지 삽입, 코드 블록, 수식 입력
- 자동 저장 표시
- 버전 이력 관리

#### REQ-UI-033: Material Upload Page (Instructor)

**IF** 사용자 역할이 Instructor **AND WHEN** 자료 업로드를 선택 **THEN** 파일 업로드, 메타데이터 입력, 순서 지정 UI를 제공한다.

- 파일 드래그 앤 드롭 업로드 영역
- Markdown 파일 (.md) 지원
- 메타데이터: 제목, 설명, 모듈 배치
- 순서 지정 (드래그 앤 드롭)
- 업로드 진행률 표시

---

### 3.5 Q&A System 화면 (3 screens)

#### REQ-UI-040: Q&A Thread List Page

시스템은 **항상** 학습 자료별 Q&A 스레드 목록을 필터링 가능하게 표시해야 한다.

- 스레드 카드: 질문 요약, 작성자, 답변 수, AI 지원 여부 배지
- 필터: 미답변, 답변 완료, AI 답변, 내 질문
- 정렬: 최신순, 인기순, 미답변 우선
- 검색 기능

#### REQ-UI-041: Q&A Highlight Popup (Overlay Component)

**WHEN** 사용자가 학습 자료에서 텍스트를 선택(하이라이트) **THEN** 선택된 텍스트에 앵커된 인라인 팝업을 표시한다.

- 텍스트 선택 감지 및 팝업 위치 계산
- 팝업 내용: Markdown 질문 입력 영역
- "질문하기" 제출 버튼
- 기존 Q&A가 있는 텍스트 영역 하이라이트 마커 표시
- 팝업 외부 클릭 시 닫기
- 모바일 대응: Bottom Sheet 형태

#### REQ-UI-042: Q&A Detail Thread Page

**WHEN** 사용자가 Q&A 스레드를 선택 **THEN** 전체 스레드 뷰와 응답, AI 제안 배지를 표시한다.

- 원본 질문 (하이라이트된 텍스트 컨텍스트 포함)
- 응답 목록 (시간순)
- AI 답변 제안 배지 (AI-generated 표시)
- 답변 입력 영역 (Markdown)
- 좋아요/도움이 됨 반응
- 원문으로 이동 링크

---

### 3.6 Memo Management 화면 (3 screens)

#### REQ-UI-050: Personal Memo List Page

시스템은 **항상** 학생의 개인 메모를 강좌/자료별로 정리하여 표시해야 한다.

- 강좌/자료별 그룹핑
- 메모 카드: 제목, 미리보기, 수정일
- 검색 및 태그 필터
- 새 메모 만들기 버튼

#### REQ-UI-051: Memo Editor Page

**WHEN** 사용자가 메모를 작성/편집 **THEN** Markdown 메모 에디터를 제공한다.

- Markdown 에디터 (툴바 포함)
- 실시간 프리뷰 (선택적 Split view)
- 태그 추가/편집
- 강좌/자료 연결 메타데이터
- 자동 저장

#### REQ-UI-052: Team Memo Board Page

**IF** 사용자가 팀에 속해 있고 **WHEN** 팀 메모 보드에 접근 **THEN** 공유 메모 목록과 협업 기능을 제공한다.

- 팀 공유 메모 목록
- 실시간 편집 표시 (누가 편집 중인지)
- 댓글/토론 기능
- 메모 고정(Pin) 기능

---

### 3.7 Team Management 화면 (3 screens)

#### REQ-UI-060: Team List Page

시스템은 **항상** 강좌 내 팀 목록과 생성/가입 옵션을 제공해야 한다.

- 팀 카드: 팀명, 멤버 수, 간단한 활동 정보
- "팀 만들기" 버튼
- "팀 가입" 기능 (가입 코드 또는 승인 방식)
- 내 팀 강조 표시

#### REQ-UI-061: Team Detail Page

**WHEN** 사용자가 팀을 선택 **THEN** 멤버 목록, 활동 피드, 공유 리소스를 표시한다.

- 멤버 목록 (아바타, 이름, 역할)
- 최근 활동 피드 (타임라인)
- 공유 리소스 목록 (메모, 하이라이트)
- 팀 설정 (팀장 전용)

#### REQ-UI-062: Team Creation Page

**WHEN** 사용자가 팀 생성을 선택 **THEN** 팀 이름, 설명, 멤버 초대 폼을 제공한다.

- 팀 이름, 설명 입력
- 최대 멤버 수 설정
- 멤버 초대 (이메일 또는 사용자 검색)
- 가입 방식 선택 (공개/초대 코드/승인)

---

### 3.8 Quiz System 화면 (6 screens)

#### REQ-UI-070: Quiz List Page

시스템은 **항상** 강좌별 퀴즈 목록을 제공해야 한다.

- 퀴즈 카드: 제목, 문항 수, 제한 시간, 상태(미응시/완료/진행중)
- 필터: 상태별, 유형별
- 점수/결과 미리보기 (완료된 퀴즈)

#### REQ-UI-071: Quiz Taking Page

**WHEN** 학생이 퀴즈에 응시 **THEN** 타이머, 진행바, 문제 표시 인터페이스를 제공한다.

- 상단: 타이머, 진행률 바, 문항 번호 네비게이터
- 문제 영역: 문제 텍스트 (Markdown), 보기 (객관식/주관식/O-X)
- 이전/다음 네비게이션
- 답안 제출 확인 다이얼로그
- 중간 저장 기능

#### REQ-UI-072: Quiz Results Page

**WHEN** 학생이 퀴즈를 완료 **THEN** 점수, 정답/오답 분석, 해설을 표시한다.

- 총점 및 등급 표시
- 문항별 정답/오답 표시
- 해설 (Markdown)
- 오답 노트 생성 옵션
- 재응시 가능 여부 표시

#### REQ-UI-073: Quiz Creation Page (Instructor)

**IF** 사용자 역할이 Instructor **AND WHEN** 퀴즈 생성을 선택 **THEN** 문제 유형별 빌더 UI를 제공한다.

- 퀴즈 제목, 설명, 제한 시간 설정
- 문제 추가: 객관식, 주관식, O-X, 빈칸 채우기
- 문제별: 문제 텍스트(Markdown), 보기, 정답, 해설, 배점
- 문제 순서 드래그 앤 드롭
- 미리보기 기능

#### REQ-UI-074: Quiz Generation Page (Instructor - LLM)

**IF** 사용자 역할이 Instructor **AND WHEN** LLM 퀴즈 생성을 선택 **THEN** 강의 자료 기반 자동 생성 UI를 제공한다.

- 소스 자료 선택 (강의 자료 목록에서)
- 생성 옵션: 문항 수, 난이도, 문제 유형 비율
- "생성하기" 버튼 및 로딩 상태
- 생성 결과 미리보기 및 편집
- 확정/저장 버튼

#### REQ-UI-075: Quiz Management Page (Instructor)

**IF** 사용자 역할이 Instructor **AND WHEN** 퀴즈 관리에 접근 **THEN** 퀴즈 편집, 게시, 제출 결과 확인 기능을 제공한다.

- 퀴즈 목록 (상태: Draft/Published/Closed)
- 편집/삭제 기능
- 게시/비공개 전환
- 학생 제출 결과 목록
- 통계: 평균 점수, 문항별 정답률

---

### 3.9 Dashboard 화면 (3 screens)

#### REQ-UI-080: Student Dashboard

시스템은 **항상** 학생에게 학습 진행률, 최근 활동, 퀴즈 점수를 포함하는 대시보드를 제공해야 한다.

- 학습 진행률 위젯 (강좌별)
- 최근 활동 타임라인
- 퀴즈 점수 차트
- 미답변 Q&A 알림
- 팀 활동 요약
- 추천 학습 자료 (옵션)

#### REQ-UI-081: Instructor Dashboard

시스템은 **항상** 강사에게 강좌 분석, Q&A 큐, 참여도 통계를 포함하는 대시보드를 제공해야 한다.

- 강좌별 수강생 참여도 차트
- 미답변 Q&A 큐 (우선순위 정렬)
- 최근 퀴즈 결과 요약
- 수강생 활동 분석
- 인기 강의 자료 순위
- 빠른 작업 버튼 (자료 업로드, 퀴즈 생성)

#### REQ-UI-082: Team Dashboard

**IF** 사용자가 팀에 속해 있을 때 **THEN** 팀 활동, 협업 지표를 포함하는 팀 대시보드를 제공한다.

- 팀 활동 타임라인
- 멤버별 기여도 차트
- 공유 메모 현황
- 최근 Q&A 활동
- 팀 학습 진행률

---

### 3.10 추가 필수 화면 (신규 식별)

#### REQ-UI-090: 404 Not Found Page

시스템은 **항상** 존재하지 않는 경로 접근 시 친절한 404 페이지를 제공해야 한다.

- 일러스트레이션 또는 아이콘
- "페이지를 찾을 수 없습니다" 메시지
- 홈으로 돌아가기 / 이전 페이지 버튼
- 검색 제안

#### REQ-UI-091: 500 Error Page

시스템은 **항상** 서버 오류 발생 시 사용자 친화적 에러 페이지를 제공해야 한다.

- 에러 일러스트레이션
- 오류 메시지 및 재시도 안내
- "새로고침" / "홈으로" 버튼
- 오류 보고 옵션

#### REQ-UI-092: Notification Panel

**WHEN** 사용자가 알림 아이콘을 클릭 **THEN** 알림 패널(Dropdown/Drawer)을 표시한다.

- 알림 카드: 유형 아이콘, 제목, 시간, 읽음 상태
- 필터: 전체, 미읽음, Q&A, 퀴즈, 팀
- "모두 읽음 처리" 기능
- 알림 클릭 시 해당 페이지로 이동

#### REQ-UI-093: Global Search Results Page

**WHEN** 사용자가 글로벌 검색을 수행 **THEN** 강좌, 자료, Q&A, 메모를 통합 검색한 결과를 표시한다.

- 통합 검색 결과 (탭 또는 섹션별)
- 결과 카테고리: 강좌, 자료, Q&A, 메모
- 검색 하이라이트
- 필터 및 정렬 옵션

#### REQ-UI-094: Loading & Empty States

시스템은 **항상** 모든 데이터 로딩 상태와 빈 상태에 대해 적절한 UI를 제공해야 한다.

- 스켈레톤 로딩 (Shimmer effect)
- 빈 상태 일러스트레이션과 안내 메시지
- 에러 상태와 재시도 옵션
- 리스트 무한 스크롤 로딩 표시

---

### 3.11 Unwanted Behavior (금지 요구사항)

#### REQ-UI-N01: 접근성 위반 금지

시스템은 WCAG 2.1 AA 기준을 위반**하지 않아야 한다**.

- 모든 인터랙티브 요소에 키보드 접근 보장
- 적절한 색상 대비(4.5:1 이상)
- 스크린 리더 호환 (aria-label, role)
- 포커스 표시 제거 금지

#### REQ-UI-N02: 반응형 깨짐 금지

시스템은 375px~1920px 범위에서 레이아웃이 깨지거나 콘텐츠가 잘리**지 않아야 한다**.

#### REQ-UI-N03: 일관성 위반 금지

시스템은 정의된 Design System 토큰 외의 임의 스타일 값을 사용**하지 않아야 한다**.

---

## 4. Specifications (사양)

### 4.1 Pencil MCP 파일 구조

```
.pen files 구성:
design/
  design-system/
    colors.pen            # Color palette 정의
    typography.pen        # Typography scale
    spacing.pen           # Spacing & layout system
    components.pen        # Component token 정의
    icons.pen             # Icon system (Lucide)
  screens/
    auth/
      landing.pen         # Landing Page
      login.pen           # Login Page
      register.pen        # Register Page
      password-reset.pen  # Password Reset
      profile-settings.pen
    course/
      course-list.pen     # Course Browse/List
      course-detail.pen   # Course Detail
      course-create.pen   # Course Creation
      course-settings.pen # Course Settings
    material/
      material-list.pen   # Material List
      material-viewer.pen # Material Viewer (CORE)
      material-editor.pen # Material Editor
      material-upload.pen # Material Upload
    qa/
      qa-list.pen         # Q&A Thread List
      qa-popup.pen        # Highlight Popup
      qa-detail.pen       # Q&A Detail Thread
    memo/
      memo-list.pen       # Personal Memo List
      memo-editor.pen     # Memo Editor
      team-memo.pen       # Team Memo Board
    team/
      team-list.pen       # Team List
      team-detail.pen     # Team Detail
      team-create.pen     # Team Creation
    quiz/
      quiz-list.pen       # Quiz List
      quiz-taking.pen     # Quiz Taking
      quiz-results.pen    # Quiz Results
      quiz-create.pen     # Quiz Creation
      quiz-generate.pen   # Quiz Generation (LLM)
      quiz-manage.pen     # Quiz Management
    dashboard/
      student-dash.pen    # Student Dashboard
      instructor-dash.pen # Instructor Dashboard
      team-dash.pen       # Team Dashboard
    common/
      404.pen             # Not Found
      500.pen             # Server Error
      notification.pen    # Notification Panel
      search-results.pen  # Global Search
      loading-states.pen  # Loading & Empty States
  navigation/
    desktop-sidebar.pen   # Desktop Sidebar Navigation
    mobile-bottom-tab.pen # Mobile Bottom Tab
    tablet-sidebar.pen    # Tablet Collapsible Sidebar
```

### 4.2 반응형 Breakpoint 사양

| Breakpoint | 너비 | Grid Columns | Navigation | Content Width |
|------------|------|-------------|------------|---------------|
| Mobile | 375px | 4 | Bottom Tab | 100% - 32px padding |
| Tablet | 768px | 8 | Collapsible Sidebar | 100% - 48px padding |
| Desktop | 1280px+ | 12 | Fixed Sidebar (256px) | max-w-7xl (1280px) |

### 4.3 화면 총 목록 (36 screens)

| # | 화면 | ID | 우선순위 |
|---|------|----|---------|
| 1 | Landing Page | SCR-AUTH-001 | High |
| 2 | Login Page | SCR-AUTH-002 | High |
| 3 | Register Page | SCR-AUTH-003 | High |
| 4 | Password Reset | SCR-AUTH-004 | Medium |
| 5 | Profile Settings | SCR-AUTH-005 | Medium |
| 6 | Course Browse/List | SCR-COURSE-001 | High |
| 7 | Course Detail | SCR-COURSE-002 | High |
| 8 | Course Creation | SCR-COURSE-003 | High |
| 9 | Course Settings | SCR-COURSE-004 | Medium |
| 10 | Material List | SCR-MAT-001 | High |
| 11 | Material Viewer | SCR-MAT-002 | **Critical** |
| 12 | Material Editor | SCR-MAT-003 | High |
| 13 | Material Upload | SCR-MAT-004 | High |
| 14 | Q&A Thread List | SCR-QA-001 | High |
| 15 | Q&A Highlight Popup | SCR-QA-002 | **Critical** |
| 16 | Q&A Detail Thread | SCR-QA-003 | High |
| 17 | Personal Memo List | SCR-MEMO-001 | Medium |
| 18 | Memo Editor | SCR-MEMO-002 | Medium |
| 19 | Team Memo Board | SCR-MEMO-003 | Medium |
| 20 | Team List | SCR-TEAM-001 | Medium |
| 21 | Team Detail | SCR-TEAM-002 | Medium |
| 22 | Team Creation | SCR-TEAM-003 | Low |
| 23 | Quiz List | SCR-QUIZ-001 | High |
| 24 | Quiz Taking | SCR-QUIZ-002 | High |
| 25 | Quiz Results | SCR-QUIZ-003 | High |
| 26 | Quiz Creation | SCR-QUIZ-004 | Medium |
| 27 | Quiz Generation (LLM) | SCR-QUIZ-005 | Medium |
| 28 | Quiz Management | SCR-QUIZ-006 | Medium |
| 29 | Student Dashboard | SCR-DASH-001 | High |
| 30 | Instructor Dashboard | SCR-DASH-002 | High |
| 31 | Team Dashboard | SCR-DASH-003 | Medium |
| 32 | 404 Not Found | SCR-COMMON-001 | Low |
| 33 | 500 Error | SCR-COMMON-002 | Low |
| 34 | Notification Panel | SCR-COMMON-003 | Medium |
| 35 | Global Search Results | SCR-COMMON-004 | Medium |
| 36 | Loading & Empty States | SCR-COMMON-005 | High |

### 4.4 Traceability (추적성)

| Requirement | Screen | Component | Route |
|-------------|--------|-----------|-------|
| REQ-UI-001~005 | Design System | ui/* | N/A |
| REQ-UI-010 | Landing | - | / |
| REQ-UI-011 | Login | auth/LoginForm | /(auth)/login |
| REQ-UI-012 | Register | auth/RegisterForm | /(auth)/register |
| REQ-UI-020 | Course List | course/CourseCard | /courses |
| REQ-UI-021 | Course Detail | course/CourseDetail | /courses/[courseId] |
| REQ-UI-031 | Material Viewer | material/MarkdownRenderer, material/HighlightPopup | /courses/[courseId]/materials/[materialId] |
| REQ-UI-041 | Q&A Popup | qa/HighlightPopup | Overlay on Material Viewer |
| REQ-UI-071 | Quiz Taking | quiz/QuizPlayer | /courses/[courseId]/quizzes/[quizId]/take |
| REQ-UI-080 | Student Dashboard | dashboard/* | /(dashboard)/student |
| REQ-UI-081 | Instructor Dashboard | dashboard/* | /(dashboard)/instructor |
