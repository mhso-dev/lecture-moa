---
id: SPEC-UI-001
title: "Frontend Design System & Complete Screen Design via Pencil MCP"
type: plan
version: 1.0.0
status: draft
created: 2026-02-17
updated: 2026-02-17
author: MoAI
priority: high
tags: [ui, design-system, pencil-mcp, frontend, responsive]
---

# SPEC-UI-001: 구현 계획 (Implementation Plan)

## 1. 개요

lecture-moa의 전체 Frontend Design System을 정의하고, 31+5개 화면을 Pencil MCP .pen 파일로 설계한다. shadcn/ui 기반의 Modern Minimal 스타일로 Mobile(375px), Tablet(768px), Desktop(1280px+) 반응형을 지원한다.

---

## 2. Milestone 구성 (우선순위 기반)

### Milestone 1: Design System Foundation (Priority: Critical)

Design System의 핵심 토큰 및 기본 컴포넌트 정의.

**산출물:**
- `design/design-system/colors.pen` - Color palette (Light + Dark 토큰)
- `design/design-system/typography.pen` - Typography scale (한글/영문)
- `design/design-system/spacing.pen` - Spacing, grid, layout system
- `design/design-system/components.pen` - Core component tokens
- `design/design-system/icons.pen` - Icon system (Lucide subset)

**핵심 작업:**

1. **Color Palette 설계**
   - Primary: Blue 계열 (교육/신뢰감)
   - Secondary: Indigo 또는 Violet
   - Accent: Emerald (CTA, 성공)
   - Semantic: Green(Success), Amber(Warning), Red(Error), Blue(Info)
   - Neutral: Slate scale (50~950)
   - Dark Mode: HSL 기반 토큰으로 Light/Dark 자동 전환

2. **Typography Scale 설계**
   - Font Family: `Inter` (영문) + `Pretendard` (한글) fallback stack
   - Scale: Display(36/48px), H1(30px), H2(24px), H3(20px), H4(18px), Body-L(18px), Body(16px), Body-S(14px), Caption(12px), Code(Fira Code/JetBrains Mono)
   - Line Height: 1.2(헤딩), 1.5(본문), 1.6(코드)
   - Font Weight: Regular(400), Medium(500), Semibold(600), Bold(700)

3. **Spacing & Grid System**
   - Tailwind 기본 스페이싱 (4px 단위)
   - Container: max-w-7xl (1280px)
   - Grid: 12/8/4 column (Desktop/Tablet/Mobile)
   - Gap: 16px(default), 24px(section), 32px(major section)

4. **Component Token 정의**
   - Radius: sm(6px), md(8px), lg(12px), xl(16px), full
   - Shadow: sm, md, lg, xl (elevation system)
   - Border: 1px solid border color
   - Button variants: Primary, Secondary, Ghost, Destructive, Outline
   - Input states: Default, Focus, Error, Disabled
   - Card, Dialog, Badge, Avatar, Toast 토큰

5. **Icon System**
   - Lucide React 아이콘 팔레트 정의
   - 크기: 16px(xs), 20px(sm), 24px(md), 32px(lg)
   - 주요 사용 아이콘 매핑 (Navigation, Action, Status)

---

### Milestone 2: Navigation & Layout Patterns (Priority: Critical)

전체 앱의 레이아웃 프레임 및 네비게이션 패턴 설계.

**산출물:**
- `design/navigation/desktop-sidebar.pen` - Desktop Sidebar
- `design/navigation/mobile-bottom-tab.pen` - Mobile Bottom Tab
- `design/navigation/tablet-sidebar.pen` - Tablet Sidebar

**핵심 작업:**

1. **Desktop Sidebar Navigation**
   - 256px 확장 / 64px 축소
   - 로고, 네비게이션 메뉴, 사용자 프로필 영역
   - 활성 항목 하이라이트
   - 섹션 구분: 학습(강좌, 자료), 활동(Q&A, 퀴즈), 협업(팀, 메모), 관리(대시보드, 설정)
   - 역할별 메뉴 분기 (Instructor/Student)

2. **Mobile Bottom Tab Navigation**
   - 5개 탭: 홈/대시보드, 강좌, Q&A, 알림, 더보기(Hamburger)
   - Hamburger 메뉴: 팀, 메모, 퀴즈, 설정 등 보조 항목
   - Safe area 고려 (iOS notch)

3. **Tablet Collapsible Sidebar**
   - Desktop Sidebar 기반 접기/펼치기
   - 768px에서 기본 접힌 상태
   - 터치 제스처로 펼치기

4. **공통 레이아웃 프레임**
   - Header bar (Mobile: 상단 앱바, Desktop: Sidebar 내장)
   - Content area with scrollable region
   - Footer (Landing only)

---

### Milestone 3: Core Experience Screens (Priority: Critical)

lecture-moa의 핵심 UX인 Material Viewer와 Q&A Highlight Popup 설계.

**산출물:**
- `design/screens/material/material-viewer.pen` - Material Viewer (3 breakpoints)
- `design/screens/qa/qa-popup.pen` - Q&A Highlight Popup (3 breakpoints)
- `design/screens/common/loading-states.pen` - Loading & Empty States

**핵심 작업:**

1. **Material Viewer (SCR-MAT-002)**
   - Markdown 렌더링 영역: GFM, 코드 하이라이트, KaTeX 수식, 이미지
   - 사이드바: ToC(Table of Contents), Q&A 마커 목록
   - 텍스트 선택 시 하이라이트 팝업 트리거 UI
   - 읽기 진행률 바 (상단 또는 스크롤 표시)
   - 북마크 버튼
   - Mobile: 전체 화면 리더, ToC는 Drawer
   - Tablet: 좁은 사이드바 또는 토글
   - Desktop: 고정 사이드바 + 넓은 콘텐츠 영역

2. **Q&A Highlight Popup (SCR-QA-002)**
   - 텍스트 선택 후 나타나는 인라인 팝업
   - 위치: 선택된 텍스트 위 또는 아래 (공간에 따라)
   - 팝업 내용: 질문 입력(Markdown), 제출 버튼
   - 기존 Q&A 마커: 하이라이트된 텍스트 배경색
   - Mobile: Bottom Sheet 형태로 전환
   - 팝업 외부 클릭 시 닫기

3. **Loading & Empty States (SCR-COMMON-005)**
   - 스켈레톤 UI: 카드, 리스트, 텍스트, 이미지 placeholder
   - Empty State: 일러스트 + 안내 메시지 + CTA 버튼
   - Error State: 에러 메시지 + 재시도 버튼
   - 리스트 로딩: Infinite scroll spinner

---

### Milestone 4: Authentication & Landing Screens (Priority: High)

사용자 인증 플로우 및 Landing Page 설계.

**산출물:**
- `design/screens/auth/landing.pen`
- `design/screens/auth/login.pen`
- `design/screens/auth/register.pen`
- `design/screens/auth/password-reset.pen`
- `design/screens/auth/profile-settings.pen`

**핵심 작업:**
- Landing Page: Hero, Features, CTA, Footer (3 breakpoints)
- Login: 중앙 정렬 폼 카드, 소셜 로그인 버튼
- Register: 역할 선택 카드 + 폼, 단계별 또는 단일 페이지
- Password Reset: 3단계 플로우 (이메일 > 인증 > 새 비밀번호)
- Profile Settings: 탭 형태 (프로필, 보안, 알림)

---

### Milestone 5: Course Management Screens (Priority: High)

강좌 관련 전체 화면 설계.

**산출물:**
- `design/screens/course/course-list.pen`
- `design/screens/course/course-detail.pen`
- `design/screens/course/course-create.pen`
- `design/screens/course/course-settings.pen`

**핵심 작업:**
- Course List: Grid/List 토글, 필터 사이드바, 검색, 페이지네이션
- Course Detail: 헤더 배너, 커리큘럼 트리, 수강 신청 CTA
- Course Create: Multi-step 또는 단일 폼, Markdown 설명 에디터
- Course Settings: Tab 구조 (정보, 수강생, 통계)

---

### Milestone 6: Material & Q&A Extended Screens (Priority: High)

학습 자료 관리 및 Q&A 확장 화면 설계.

**산출물:**
- `design/screens/material/material-list.pen`
- `design/screens/material/material-editor.pen`
- `design/screens/material/material-upload.pen`
- `design/screens/qa/qa-list.pen`
- `design/screens/qa/qa-detail.pen`

**핵심 작업:**
- Material List: 모듈별 아코디언, 진행률 표시, 드래그 앤 드롭(Instructor)
- Material Editor: Split-pane (소스 + 프리뷰), 툴바, 자동 저장
- Material Upload: 드래그 앤 드롭 영역, 메타데이터 폼, 순서 지정
- Q&A List: 스레드 카드, 필터, AI 배지
- Q&A Detail: 원문 컨텍스트, 응답 타임라인, Markdown 답변 입력

---

### Milestone 7: Dashboard Screens (Priority: High)

역할별 대시보드 설계.

**산출물:**
- `design/screens/dashboard/student-dash.pen`
- `design/screens/dashboard/instructor-dash.pen`
- `design/screens/dashboard/team-dash.pen`

**핵심 작업:**
- Student Dashboard: 진행률 차트, 최근 활동, 퀴즈 점수, 알림
- Instructor Dashboard: 참여도 차트, Q&A 큐, 퀴즈 결과, 빠른 작업
- Team Dashboard: 활동 타임라인, 기여도, 공유 메모 현황
- 차트/그래프 위젯 공통 패턴 정의 (Bar, Line, Donut, Progress)

---

### Milestone 8: Quiz System Screens (Priority: Medium-High)

퀴즈 관련 전체 화면 설계.

**산출물:**
- `design/screens/quiz/quiz-list.pen`
- `design/screens/quiz/quiz-taking.pen`
- `design/screens/quiz/quiz-results.pen`
- `design/screens/quiz/quiz-create.pen`
- `design/screens/quiz/quiz-generate.pen`
- `design/screens/quiz/quiz-manage.pen`

**핵심 작업:**
- Quiz List: 상태별 카드, 점수 미리보기
- Quiz Taking: 타이머, 진행바, 문항 네비게이터, 답안 UI
- Quiz Results: 점수 요약, 문항별 분석, 해설
- Quiz Create: 문제 빌더, 유형별 입력 폼, 미리보기
- Quiz Generate: 소스 선택, 옵션, 생성 로딩, 결과 편집
- Quiz Manage: 목록 관리, 통계 뷰

---

### Milestone 9: Memo & Team Screens (Priority: Medium)

메모 및 팀 관련 화면 설계.

**산출물:**
- `design/screens/memo/memo-list.pen`
- `design/screens/memo/memo-editor.pen`
- `design/screens/memo/team-memo.pen`
- `design/screens/team/team-list.pen`
- `design/screens/team/team-detail.pen`
- `design/screens/team/team-create.pen`

**핵심 작업:**
- Memo List: 그룹핑, 검색, 태그 필터
- Memo Editor: Markdown 에디터, 태그, 자동 저장
- Team Memo: 공유 메모, 실시간 편집 표시, 댓글
- Team List: 팀 카드, 가입/생성 버튼
- Team Detail: 멤버, 활동 피드, 공유 리소스
- Team Create: 생성 폼, 초대, 가입 방식

---

### Milestone 10: Common & Error Screens (Priority: Low)

공통 화면 및 에러 페이지 설계.

**산출물:**
- `design/screens/common/404.pen`
- `design/screens/common/500.pen`
- `design/screens/common/notification.pen`
- `design/screens/common/search-results.pen`

**핵심 작업:**
- 404/500 페이지: 일러스트, 메시지, 네비게이션
- Notification Panel: Dropdown/Drawer, 알림 카드, 필터
- Search Results: 통합 검색, 카테고리 탭, 하이라이트

---

## 3. 기술 접근법 (Technical Approach)

### 3.1 Pencil MCP 작업 방법

1. **Design System 우선 구축**: 색상, 타이포, 스페이싱 토큰을 먼저 정의하여 모든 화면에서 재사용
2. **컴포넌트 기반 설계**: shadcn/ui 컴포넌트를 기반으로 확장, .pen 파일에서 컴포넌트 재사용
3. **Breakpoint별 설계**: 각 화면을 Mobile > Tablet > Desktop 순서로 설계 (Mobile-first)
4. **Atomic Design 원칙**: Atoms(Button, Input) > Molecules(Card, Form Field) > Organisms(Navigation, Dashboard Widget) > Templates(Layout) > Pages(Screen)

### 3.2 shadcn/ui 통합 전략

- shadcn/ui 기본 테마를 CSS Variables로 커스터마이징
- Tailwind CSS 4의 @theme directive 활용
- 디자인 토큰 -> Tailwind config -> shadcn/ui theme 연결
- 커스텀 컴포넌트: HighlightPopup, MarkdownRenderer, QuizPlayer 등

### 3.3 반응형 전략

| 패턴 | Mobile (375px) | Tablet (768px) | Desktop (1280px+) |
|------|----------------|----------------|-------------------|
| Navigation | Bottom Tab | Collapsible Sidebar | Fixed Sidebar |
| Content | Full width | 2-column optional | Sidebar + Content |
| Cards | 1-column stack | 2-column grid | 3-4 column grid |
| Dialog | Full screen | Centered modal | Centered modal |
| Popup | Bottom Sheet | Floating | Floating |
| Editor | Stacked preview | Split pane | Split pane |

### 3.4 Dark Mode 전략

- CSS Variables 기반 토큰 (HSL format)
- `class="dark"` 토글 방식 (next-themes 라이브러리)
- 디자인 단계에서 Light/Dark 양쪽 토큰 정의
- 구현 단계에서 Dark Mode 적용

---

## 4. Architecture Design Direction (설계 방향)

### 4.1 Component Architecture

```
components/
  ui/                    # shadcn/ui 기본 + 커스텀 프리미티브
    button.tsx
    card.tsx
    input.tsx
    dialog.tsx
    ...
  layout/                # 레이아웃 컴포넌트
    Sidebar.tsx
    BottomTab.tsx
    AppLayout.tsx
    ContentLayout.tsx
  material/              # Material Viewer 전용
    MarkdownRenderer.tsx
    HighlightPopup.tsx
    TableOfContents.tsx
    ReadingProgress.tsx
  quiz/                  # Quiz 전용
    QuizPlayer.tsx
    QuizTimer.tsx
    QuestionNavigator.tsx
    AnswerInput.tsx
  dashboard/             # Dashboard 위젯
    ProgressWidget.tsx
    ActivityFeed.tsx
    ChartWidget.tsx
    QuickActions.tsx
```

### 4.2 Design Token Architecture

```
styles/
  tokens/
    colors.css          # CSS Variables (Light/Dark)
    typography.css      # Font, size, weight, line-height
    spacing.css         # Spacing scale
    shadows.css         # Elevation system
    radius.css          # Border radius
  globals.css           # Global styles
  tailwind.css          # Tailwind imports
```

---

## 5. 리스크 및 대응 계획

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Pencil MCP 제약으로 복잡한 인터랙션 표현 어려움 | Design fidelity 저하 | Annotation으로 인터랙션 설명 보완, 별도 인터랙션 문서 작성 |
| 36개 화면 x 3 breakpoints = 108개 뷰 설계 부담 | 진행 지연 | 우선순위별 단계적 설계, 공통 패턴 재사용 극대화 |
| Design System 토큰과 구현 불일치 | 디자인-개발 갭 | Tailwind config로 직접 매핑, 토큰 명세서 유지 |
| Material Viewer의 텍스트 하이라이트 UX 복잡도 | 구현 난이도 높음 | 프로토타입 우선 제작, 인터랙션 사양 상세화 |
| Dark Mode 토큰 불완전 정의 | Light/Dark 전환 시 시각적 문제 | HSL 기반 체계적 토큰 설계, 양쪽 검증 |
| 한글/영문 혼용 타이포그래피 | 글꼴 불일치, 자간/줄간격 문제 | 혼용 테스트 케이스 포함, font-feature-settings 조정 |

---

## 6. Expert Consultation 권장사항

### 6.1 Frontend Expert 상담 권장

이 SPEC는 31+5개 화면 설계, Design System 구축, 반응형 레이아웃, Markdown 렌더링 등 프론트엔드 전문 지식이 필요합니다.

**상담 범위:**
- shadcn/ui 커스터마이징 전략 검증
- Material Viewer의 텍스트 하이라이트 구현 방안
- 반응형 Navigation 패턴 최적화
- 성능 최적화 (Markdown 렌더링, 이미지 최적화)

### 6.2 UI/UX Design Expert 상담 권장

접근성(WCAG 2.1 AA), Design System 일관성, 사용자 플로우 최적화를 위해 디자인 전문가 상담을 권장합니다.

**상담 범위:**
- Color palette 접근성 검증 (색상 대비)
- Material Viewer + Q&A Popup UX 플로우 검증
- Mobile-first 반응형 전환 UX 품질
- Dashboard 정보 구조 및 데이터 시각화

---

## 7. 다음 단계

1. SPEC 승인 후 `/moai:2-run SPEC-UI-001` 실행
2. Milestone 1(Design System)부터 순차적으로 Pencil MCP 디자인 작업 시작
3. 각 Milestone 완료 시 리뷰 및 피드백 반영
4. 전체 디자인 완료 후 Frontend 구현 SPEC 생성 (SPEC-UI-002~)
