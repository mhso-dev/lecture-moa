---
id: SPEC-UI-001
title: "Frontend Design System & Complete Screen Design via Pencil MCP"
type: acceptance
version: 1.0.0
status: draft
created: 2026-02-17
updated: 2026-02-17
author: MoAI
priority: high
tags: [ui, design-system, pencil-mcp, frontend, responsive]
---

# SPEC-UI-001: Acceptance Criteria (수락 기준)

## 1. Design System Foundation

### AC-DS-001: Color Palette 정의 완료

```gherkin
Given Design System 파일이 Pencil MCP에 생성되어 있을 때
When colors.pen 파일을 검토하면
Then Primary, Secondary, Accent, Semantic, Neutral 색상이 모두 정의되어 있다
And 각 색상에 Light Mode와 Dark Mode 토큰이 존재한다
And Semantic Colors(Success, Warning, Error, Info)가 명확히 구분된다
And HSL 기반 CSS Variable 명세가 포함되어 있다
```

### AC-DS-002: Typography Scale 정의 완료

```gherkin
Given Design System 파일이 Pencil MCP에 생성되어 있을 때
When typography.pen 파일을 검토하면
Then Display, H1~H6, Body(L/M/S), Code, Caption 스케일이 정의되어 있다
And 한글(Pretendard)과 영문(Inter) 폰트 패밀리가 정의되어 있다
And 각 스케일에 font-size, line-height, font-weight가 명시되어 있다
And Code 전용 폰트(Fira Code 또는 JetBrains Mono)가 정의되어 있다
```

### AC-DS-003: Spacing & Grid System 정의 완료

```gherkin
Given Design System 파일이 Pencil MCP에 생성되어 있을 때
When spacing.pen 파일을 검토하면
Then 4px 단위 스페이싱 스케일이 정의되어 있다
And Mobile(4-column), Tablet(8-column), Desktop(12-column) 그리드가 정의되어 있다
And 최대 콘텐츠 너비(1280px)가 명시되어 있다
And Sidebar 너비(256px/64px)가 명시되어 있다
```

### AC-DS-004: Component Token 정의 완료

```gherkin
Given Design System 파일이 Pencil MCP에 생성되어 있을 때
When components.pen 파일을 검토하면
Then Button(5 variants), Card, Input(4 states), Dialog, Badge, Avatar, Toast 토큰이 정의되어 있다
And 각 컴포넌트에 radius, shadow, padding, color 토큰이 명시되어 있다
And shadcn/ui 기반 디자인 패턴과 일관성이 있다
```

### AC-DS-005: Icon System 정의 완료

```gherkin
Given Design System 파일이 Pencil MCP에 생성되어 있을 때
When icons.pen 파일을 검토하면
Then Lucide React 아이콘 팔레트가 정의되어 있다
And 크기 변형(16px, 20px, 24px, 32px)이 명시되어 있다
And Navigation, Action, Status 카테고리별 아이콘이 매핑되어 있다
```

---

## 2. Navigation Pattern

### AC-NAV-001: Desktop Sidebar Navigation

```gherkin
Given Desktop(1280px+) 환경에서
When 사용자가 앱에 접속하면
Then 좌측에 256px 너비의 Sidebar가 표시된다
And Sidebar를 접으면 64px 아이콘 전용 모드로 전환된다
And Instructor/Student 역할에 따라 메뉴 항목이 다르게 표시된다
And 현재 활성 페이지가 시각적으로 강조된다
```

### AC-NAV-002: Mobile Bottom Tab Navigation

```gherkin
Given Mobile(375px) 환경에서
When 사용자가 앱에 접속하면
Then 하단에 5개 탭 네비게이션이 표시된다
And 보조 메뉴는 Hamburger 아이콘으로 접근 가능하다
And iOS Safe Area가 고려되어 있다
And 현재 활성 탭이 시각적으로 강조된다
```

### AC-NAV-003: Tablet Collapsible Sidebar

```gherkin
Given Tablet(768px) 환경에서
When 사용자가 앱에 접속하면
Then 접을 수 있는 Sidebar가 제공된다
And 기본 상태는 접힌(64px) 상태이다
And 펼치면 Desktop과 동일한 메뉴가 표시된다
```

---

## 3. Authentication & Onboarding Screens

### AC-AUTH-001: Landing Page

```gherkin
Given 비인증 사용자가 서비스에 접속할 때
When Landing Page가 로드되면
Then Hero 섹션에 서비스 핵심 가치와 CTA 버튼이 표시된다
And Feature Highlights 카드 그리드가 표시된다(강의 자료, Q&A, 퀴즈, 팀 학습)
And 3개 breakpoint(Mobile, Tablet, Desktop)에서 레이아웃이 정상 동작한다
And CTA 버튼 클릭 시 회원가입 페이지로 이동한다
```

### AC-AUTH-002: Login Page

```gherkin
Given 사용자가 로그인 페이지에 접근할 때
When 페이지가 로드되면
Then Email/Password 입력 폼이 중앙에 카드 형태로 표시된다
And 소셜 로그인 버튼(Google, GitHub)이 제공된다
And 잘못된 자격 증명 입력 시 에러 메시지가 표시된다
And "비밀번호 찾기"와 "회원가입" 링크가 존재한다
And 3개 breakpoint에서 레이아웃이 정상 동작한다
```

### AC-AUTH-003: Register Page

```gherkin
Given 사용자가 회원가입 페이지에 접근할 때
When 페이지가 로드되면
Then Instructor/Student 역할 선택 UI가 표시된다
And 역할 선택 후 이름, 이메일, 비밀번호 입력 폼이 표시된다
And 실시간 유효성 검증 피드백이 제공된다
And 3개 breakpoint에서 레이아웃이 정상 동작한다
```

### AC-AUTH-004: Password Reset Page

```gherkin
Given 사용자가 비밀번호 재설정을 요청할 때
When 비밀번호 재설정 플로우에 진입하면
Then 3단계(이메일 입력 > 인증 코드 > 새 비밀번호) 플로우가 제공된다
And 각 단계에 진행 표시가 있다
And 성공/실패 상태가 명확히 표시된다
```

### AC-AUTH-005: Profile Settings Page

```gherkin
Given 인증된 사용자가 프로필 설정에 접근할 때
When 페이지가 로드되면
Then 아바타, 이름, 이메일 등 개인 정보 편집 UI가 표시된다
And 알림 설정(이메일, 푸시, 인앱) 토글이 제공된다
And 비밀번호 변경 섹션이 존재한다
And 3개 breakpoint에서 레이아웃이 정상 동작한다
```

---

## 4. Course Management Screens

### AC-COURSE-001: Course Browse/List Page

```gherkin
Given 사용자가 강좌 목록 페이지에 접근할 때
When 페이지가 로드되면
Then Grid View와 List View 간 전환이 가능하다
And 검색, 필터(카테고리, 난이도), 정렬 기능이 제공된다
And 강좌 카드에 썸네일, 제목, 강사명, 수강생 수가 표시된다
And Desktop에서 3-4 column grid, Mobile에서 1 column stack이다
```

### AC-COURSE-002: Course Detail Page

```gherkin
Given 사용자가 강좌를 선택할 때
When Course Detail 페이지가 로드되면
Then 강좌 헤더(제목, 설명, 강사), 커리큘럼(트리 구조), 수강 신청 버튼이 표시된다
And 커리큘럼 항목이 모듈/토픽 계층으로 구성되어 있다
And 3개 breakpoint에서 레이아웃이 정상 동작한다
```

### AC-COURSE-003: Course Creation Page (Instructor)

```gherkin
Given Instructor 역할의 사용자가 강좌 생성을 선택할 때
When 페이지가 로드되면
Then 강좌 제목, 설명(Markdown 에디터), 카테고리, 썸네일 업로드 폼이 제공된다
And 공개/비공개 설정이 가능하다
And 3개 breakpoint에서 폼이 정상 동작한다
```

### AC-COURSE-004: Course Settings Page (Instructor)

```gherkin
Given Instructor 역할의 사용자가 강좌 설정에 접근할 때
When 페이지가 로드되면
Then 강좌 정보 수정, 수강생 관리, 통계 탭이 제공된다
And 각 탭의 콘텐츠가 적절히 구성되어 있다
```

---

## 5. Lecture Material Screens

### AC-MAT-001: Material List Page

```gherkin
Given 사용자가 강좌 내 학습 자료 목록에 접근할 때
When 페이지가 로드되면
Then 모듈별 아코디언/트리 뷰로 자료가 정리되어 있다
And 각 자료에 제목, 상태(완료/진행중/미시작)가 표시된다
And Student 역할에서 진행률 표시바가 보인다
And Instructor 역할에서 드래그 앤 드롭 정렬이 가능하다
```

### AC-MAT-002: Material Viewer (핵심 UX)

```gherkin
Given 사용자가 학습 자료를 열람할 때
When Material Viewer가 로드되면
Then Markdown 콘텐츠가 GFM, 코드 하이라이트, KaTeX 수식으로 정상 렌더링된다
And 사이드바에 Table of Contents와 Q&A 마커 목록이 표시된다
And 텍스트를 선택하면 하이라이트 팝업이 트리거된다
And 읽기 진행률이 시각적으로 표시된다
And Desktop에서 사이드바 + 콘텐츠 레이아웃이 적용된다
And Mobile에서 전체 화면 리더 모드이며 ToC는 Drawer로 접근한다
And Tablet에서 사이드바가 토글 가능하다
```

### AC-MAT-003: Material Editor (Instructor)

```gherkin
Given Instructor가 자료 편집을 선택할 때
When Material Editor가 로드되면
Then Split-pane 레이아웃(좌: 소스, 우: 프리뷰)이 제공된다
And 상단 툴바에 서식, 이미지 삽입, 코드 블록, 수식 입력 버튼이 있다
And 자동 저장 상태 표시가 존재한다
And Mobile에서 Stacked(소스 > 프리뷰 전환) 레이아웃이 적용된다
```

### AC-MAT-004: Material Upload Page (Instructor)

```gherkin
Given Instructor가 자료 업로드를 선택할 때
When 페이지가 로드되면
Then 파일 드래그 앤 드롭 업로드 영역이 제공된다
And Markdown 파일(.md) 선택이 가능하다
And 메타데이터(제목, 설명, 모듈 배치) 입력 폼이 존재한다
And 업로드 진행률이 표시된다
```

---

## 6. Q&A System Screens

### AC-QA-001: Q&A Thread List Page

```gherkin
Given 사용자가 Q&A 목록에 접근할 때
When 페이지가 로드되면
Then Q&A 스레드 카드(질문 요약, 작성자, 답변 수, AI 배지)가 표시된다
And 필터(미답변, 답변 완료, AI 답변, 내 질문)가 제공된다
And 정렬(최신순, 인기순, 미답변 우선)이 가능하다
```

### AC-QA-002: Q&A Highlight Popup (핵심 UX)

```gherkin
Given 사용자가 Material Viewer에서 텍스트를 선택(하이라이트)할 때
When 텍스트 선택이 감지되면
Then 선택된 텍스트 근처에 인라인 팝업이 나타난다
And 팝업에 Markdown 질문 입력 영역과 "질문하기" 버튼이 있다
And 기존 Q&A가 있는 텍스트 영역에 하이라이트 마커가 표시된다
And 팝업 외부 클릭 시 팝업이 닫힌다
And Mobile에서 Bottom Sheet 형태로 전환된다
And Tablet/Desktop에서 Floating popup으로 표시된다
```

### AC-QA-003: Q&A Detail Thread Page

```gherkin
Given 사용자가 Q&A 스레드를 선택할 때
When Q&A Detail 페이지가 로드되면
Then 원본 질문과 하이라이트된 텍스트 컨텍스트가 표시된다
And 응답 목록이 시간순으로 표시된다
And AI 답변에 "AI-generated" 배지가 표시된다
And Markdown 답변 입력 영역이 제공된다
And 원문으로 이동 링크가 존재한다
```

---

## 7. Memo Management Screens

### AC-MEMO-001: Personal Memo List Page

```gherkin
Given 학생이 개인 메모 목록에 접근할 때
When 페이지가 로드되면
Then 강좌/자료별로 그룹핑된 메모 카드가 표시된다
And 검색 및 태그 필터가 제공된다
And "새 메모 만들기" 버튼이 존재한다
```

### AC-MEMO-002: Memo Editor Page

```gherkin
Given 사용자가 메모 편집을 시작할 때
When Memo Editor가 로드되면
Then Markdown 에디터(툴바 포함)가 제공된다
And 태그 추가/편집이 가능하다
And 자동 저장이 동작한다
```

### AC-MEMO-003: Team Memo Board Page

```gherkin
Given 팀 멤버가 팀 메모 보드에 접근할 때
When 페이지가 로드되면
Then 팀 공유 메모 목록이 표시된다
And 현재 편집 중인 멤버 정보가 표시된다
And 댓글/토론 기능이 제공된다
And 메모 고정(Pin) 기능이 존재한다
```

---

## 8. Team Management Screens

### AC-TEAM-001: Team List Page

```gherkin
Given 사용자가 강좌 내 팀 목록에 접근할 때
When 페이지가 로드되면
Then 팀 카드(팀명, 멤버 수, 활동 정보)가 표시된다
And "팀 만들기"와 "팀 가입" 기능이 제공된다
And 사용자의 현재 팀이 강조 표시된다
```

### AC-TEAM-002: Team Detail Page

```gherkin
Given 사용자가 팀을 선택할 때
When Team Detail 페이지가 로드되면
Then 멤버 목록(아바타, 이름, 역할)이 표시된다
And 최근 활동 피드가 타임라인으로 제공된다
And 공유 리소스 목록이 존재한다
```

### AC-TEAM-003: Team Creation Page

```gherkin
Given 사용자가 팀 생성을 선택할 때
When 페이지가 로드되면
Then 팀 이름, 설명, 최대 멤버 수 입력 폼이 제공된다
And 멤버 초대(이메일/사용자 검색) 기능이 존재한다
And 가입 방식(공개/초대 코드/승인) 선택이 가능하다
```

---

## 9. Quiz System Screens

### AC-QUIZ-001: Quiz List Page

```gherkin
Given 사용자가 강좌 내 퀴즈 목록에 접근할 때
When 페이지가 로드되면
Then 퀴즈 카드(제목, 문항 수, 제한 시간, 상태)가 표시된다
And 상태별(미응시/완료/진행중) 필터가 제공된다
And 완료된 퀴즈의 점수 미리보기가 표시된다
```

### AC-QUIZ-002: Quiz Taking Page

```gherkin
Given 학생이 퀴즈에 응시할 때
When Quiz Taking 인터페이스가 로드되면
Then 상단에 타이머와 진행률 바가 표시된다
And 문항 번호 네비게이터가 제공된다
And 문제(Markdown)와 답안 입력(객관식/주관식/O-X)이 표시된다
And 이전/다음 네비게이션이 동작한다
And 답안 제출 시 확인 다이얼로그가 표시된다
And 3개 breakpoint에서 레이아웃이 정상 동작한다
```

### AC-QUIZ-003: Quiz Results Page

```gherkin
Given 학생이 퀴즈를 완료할 때
When Quiz Results 페이지가 로드되면
Then 총점과 등급이 표시된다
And 문항별 정답/오답이 시각적으로 구분된다
And 각 문항에 해설(Markdown)이 제공된다
And 오답 노트 생성 옵션이 존재한다
```

### AC-QUIZ-004: Quiz Creation Page (Instructor)

```gherkin
Given Instructor가 퀴즈 생성을 선택할 때
When Quiz Creation 페이지가 로드되면
Then 퀴즈 제목, 설명, 제한 시간 설정이 제공된다
And 문제 추가(객관식, 주관식, O-X, 빈칸 채우기) 기능이 존재한다
And 각 문제에 문제 텍스트, 보기, 정답, 해설, 배점 입력이 가능하다
And 문제 순서 드래그 앤 드롭이 동작한다
And 미리보기 기능이 제공된다
```

### AC-QUIZ-005: Quiz Generation Page (LLM)

```gherkin
Given Instructor가 LLM 퀴즈 생성을 선택할 때
When Quiz Generation 페이지가 로드되면
Then 소스 자료 선택(강의 자료 목록)이 가능하다
And 생성 옵션(문항 수, 난이도, 문제 유형 비율) 설정이 제공된다
And "생성하기" 버튼 클릭 시 로딩 상태가 표시된다
And 생성 결과 미리보기 및 편집이 가능하다
And 확정/저장 기능이 존재한다
```

### AC-QUIZ-006: Quiz Management Page (Instructor)

```gherkin
Given Instructor가 퀴즈 관리에 접근할 때
When 페이지가 로드되면
Then 퀴즈 목록(상태: Draft/Published/Closed)이 표시된다
And 편집/삭제, 게시/비공개 전환이 가능하다
And 학생 제출 결과 목록이 제공된다
And 통계(평균 점수, 문항별 정답률)가 표시된다
```

---

## 10. Dashboard Screens

### AC-DASH-001: Student Dashboard

```gherkin
Given 학생이 대시보드에 접근할 때
When Student Dashboard가 로드되면
Then 학습 진행률 위젯(강좌별)이 표시된다
And 최근 활동 타임라인이 제공된다
And 퀴즈 점수 차트가 표시된다
And 미답변 Q&A 알림이 존재한다
And 팀 활동 요약이 표시된다
And 3개 breakpoint에서 위젯 배치가 반응형으로 조정된다
```

### AC-DASH-002: Instructor Dashboard

```gherkin
Given 강사가 대시보드에 접근할 때
When Instructor Dashboard가 로드되면
Then 강좌별 수강생 참여도 차트가 표시된다
And 미답변 Q&A 큐(우선순위 정렬)가 제공된다
And 최근 퀴즈 결과 요약이 표시된다
And 빠른 작업 버튼(자료 업로드, 퀴즈 생성)이 존재한다
And 3개 breakpoint에서 위젯 배치가 반응형으로 조정된다
```

### AC-DASH-003: Team Dashboard

```gherkin
Given 팀 멤버가 팀 대시보드에 접근할 때
When Team Dashboard가 로드되면
Then 팀 활동 타임라인이 표시된다
And 멤버별 기여도 차트가 제공된다
And 공유 메모 현황이 표시된다
And 최근 Q&A 활동이 존재한다
```

---

## 11. Common Screens

### AC-COMMON-001: 404 Not Found Page

```gherkin
Given 사용자가 존재하지 않는 경로에 접근할 때
When 404 페이지가 표시되면
Then 친절한 에러 메시지와 일러스트레이션이 표시된다
And "홈으로 돌아가기"와 "이전 페이지" 버튼이 제공된다
And 3개 breakpoint에서 레이아웃이 정상 동작한다
```

### AC-COMMON-002: 500 Error Page

```gherkin
Given 서버 오류가 발생할 때
When 500 에러 페이지가 표시되면
Then 사용자 친화적 에러 메시지와 일러스트레이션이 표시된다
And "새로고침"과 "홈으로" 버튼이 제공된다
And 오류 보고 옵션이 존재한다
```

### AC-COMMON-003: Notification Panel

```gherkin
Given 인증된 사용자가 알림 아이콘을 클릭할 때
When Notification Panel이 열리면
Then 알림 카드(유형 아이콘, 제목, 시간, 읽음 상태)가 표시된다
And 필터(전체, 미읽음, Q&A, 퀴즈, 팀)가 제공된다
And "모두 읽음 처리" 기능이 존재한다
And 알림 클릭 시 해당 페이지로 이동한다
And Mobile에서 Full-screen Drawer, Desktop에서 Dropdown 형태이다
```

### AC-COMMON-004: Global Search Results Page

```gherkin
Given 사용자가 글로벌 검색을 수행할 때
When 검색 결과 페이지가 로드되면
Then 강좌, 자료, Q&A, 메모 카테고리별 결과가 표시된다
And 검색 키워드가 결과 내에서 하이라이트된다
And 필터 및 정렬 옵션이 제공된다
```

### AC-COMMON-005: Loading & Empty States

```gherkin
Given 데이터 로딩 또는 빈 상태가 발생할 때
When 해당 영역이 표시되면
Then 로딩 상태에서 스켈레톤(Shimmer) UI가 표시된다
And 빈 상태에서 일러스트레이션과 안내 메시지가 표시된다
And 에러 상태에서 에러 메시지와 재시도 버튼이 표시된다
And 무한 스크롤에서 로딩 스피너가 표시된다
```

---

## 12. Cross-Cutting Quality Criteria

### AC-QUALITY-001: 반응형 일관성

```gherkin
Given 모든 화면(36개)에 대해
When 375px, 768px, 1280px 너비로 확인하면
Then 레이아웃이 깨지거나 콘텐츠가 잘리지 않는다
And Navigation 패턴이 breakpoint에 맞게 전환된다
And 터치 타겟이 최소 44x44px이다(Mobile/Tablet)
```

### AC-QUALITY-002: Design System 일관성

```gherkin
Given 모든 화면(36개)에 대해
When Design System 토큰 사용을 검토하면
Then 정의된 Color palette 외의 임의 색상을 사용하지 않는다
And 정의된 Typography scale 외의 임의 폰트 크기를 사용하지 않는다
And 정의된 Spacing scale 외의 임의 간격을 사용하지 않는다
And 정의된 Component token과 일관된 스타일을 적용한다
```

### AC-QUALITY-003: 접근성 준수

```gherkin
Given 모든 인터랙티브 요소에 대해
When 접근성을 검토하면
Then 키보드 네비게이션이 가능하다
And 포커스 표시가 명확하다
And 색상 대비가 WCAG 2.1 AA 기준(4.5:1 이상)을 충족한다
And 스크린 리더 호환(aria-label, role)이 적용되어 있다
```

### AC-QUALITY-004: .pen 파일 완성도

```gherkin
Given 모든 Pencil MCP 파일에 대해
When 파일 완성도를 검토하면
Then 각 화면에 3개 breakpoint(Mobile, Tablet, Desktop) 변형이 포함되어 있다
And 인터랙션 상태(Default, Hover, Active, Disabled, Focus)가 표현되어 있다
And Annotation으로 동적 동작(애니메이션, 전환)이 설명되어 있다
And Design System 토큰과의 매핑이 명시되어 있다
```

---

## 13. Verification Methods (검증 방법)

| 검증 항목 | 방법 | 도구 |
|-----------|------|------|
| Color 접근성 | 색상 대비 검사 | WebAIM Contrast Checker |
| 반응형 레이아웃 | 3 breakpoint 별 검증 | Pencil MCP 프리뷰 |
| Design System 일관성 | 토큰 사용 리뷰 | 수동 검토 |
| Typography 혼합 검증 | 한글/영문 렌더링 확인 | 브라우저 검증 |
| 컴포넌트 상태 | 상태별 디자인 확인 | Pencil MCP 프리뷰 |
| Navigation 전환 | breakpoint별 전환 검증 | 반응형 리사이즈 |
| .pen 파일 구조 | 파일 존재 및 구조 확인 | 파일 시스템 검사 |

---

## 14. Definition of Done

- [ ] Design System 5개 파일 완성 (colors, typography, spacing, components, icons)
- [ ] Navigation 3개 파일 완성 (desktop-sidebar, mobile-bottom-tab, tablet-sidebar)
- [ ] 전체 36개 화면 .pen 파일 생성 완료
- [ ] 각 화면 3개 breakpoint (Mobile, Tablet, Desktop) 변형 포함
- [ ] Critical 화면 (Material Viewer, Q&A Popup) 인터랙션 상태 상세화
- [ ] Color palette Light/Dark 토큰 완전 정의
- [ ] WCAG 2.1 AA 색상 대비 검증 통과
- [ ] 모든 .pen 파일이 Design System 토큰과 일관성 유지
- [ ] Instructor/Student 역할별 화면 분기 명확화
- [ ] 인터랙션 Annotation 첨부 (애니메이션, 전환, 동적 동작)
