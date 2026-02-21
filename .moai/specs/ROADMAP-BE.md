# Backend SPEC Roadmap

Supabase 기반 백엔드 구현 로드맵. 의존성 분석 및 병렬 처리 가능 여부 포함.

## Architecture Decision

- Backend: Supabase (Auth, Database, Realtime, Storage, Edge Functions)
- AI Service: FastAPI + LangChain (별도 유지, Edge Functions가 프록시)
- Frontend: Next.js 15 (기존 구현 유지, API 클라이언트만 전환)
- Removed: Fastify, Prisma, Redis (apps/api 디렉토리 불필요)

---

## Progress Checklist

### Phase 1 - 기반 (순차)

- [x] **SPEC-BE-001** Supabase 초기 설정
  - [x] plan: `/moai plan "Supabase 초기 설정: 프로젝트 구조 생성, 전체 DB 스키마 설계, RLS 정책 수립, Supabase CLI 연동"`
  - [x] run: `/moai run SPEC-BE-001`
  - [x] sync: `/moai sync SPEC-BE-001`
  - [x] main 머지 완료
- [x] **SPEC-BE-002** 인증 전환 (SPEC-AUTH-001로 구현 완료)
  - [x] plan: SPEC-AUTH-001 spec.md/plan.md/acceptance.md 작성 완료
  - [x] run: `/moai run SPEC-AUTH-001` (8cabd18, 700b5d4)
  - [x] sync: `/moai sync SPEC-AUTH-001` (6d691b8)
  - [x] main 커밋 완료 (main_direct)
- [x] **SPEC-BE-003** 강좌 + 학습자료
  - [x] plan
  - [x] run (cb79d4d)
  - [x] sync
  - [x] main 머지 완료

### Phase 2 - 도메인 기능 (병렬 가능 - Worktree)

- [ ] 워크트리 생성: `moai worktree new SPEC-BE-004 && moai worktree new SPEC-BE-005 && moai worktree new SPEC-BE-006`
- [ ] **SPEC-BE-004** Q&A 시스템 (Worktree 병렬)
  - [ ] plan: `/moai plan "Q&A 시스템 백엔드 연동: 질문/답변 CRUD, Supabase Realtime으로 실시간 알림, 추천/채택 기능"`
  - [ ] run: `/moai run SPEC-BE-004`
  - [ ] sync: `/moai sync SPEC-BE-004`
  - [ ] `moai worktree done SPEC-BE-004`
- [x] **SPEC-BE-005** 퀴즈 시스템 (Worktree 병렬)
  - [x] plan
  - [x] run (b08a313)
  - [x] sync (PR #1)
  - [ ] `moai worktree done SPEC-BE-005`
- [ ] **SPEC-BE-006** 팀 + 메모 (Worktree 병렬)
  - [ ] plan: `/moai plan "팀 및 메모 백엔드 연동: Team/Memo CRUD, 팀 초대/관리, Supabase Realtime으로 팀 메모 실시간 동기화"`
  - [ ] run: `/moai run SPEC-BE-006`
  - [ ] sync: `/moai sync SPEC-BE-006`
  - [ ] `moai worktree done SPEC-BE-006`

### Phase 3 - 집계 + AI (순차)

- [ ] **SPEC-BE-007** 대시보드
  - [ ] plan: `/moai plan "대시보드 백엔드 연동: DB Views/Functions로 학생/강사/팀 대시보드 통계 집계, 성능 최적화"`
  - [ ] run: `/moai run SPEC-BE-007`
  - [ ] sync: `/moai sync SPEC-BE-007`
  - [ ] main 머지 완료
- [ ] **SPEC-AI-001** AI 서비스
  - [ ] plan: `/moai plan "AI 서비스 구축: FastAPI + LangChain으로 퀴즈 생성/Q&A 추천, Supabase Edge Functions 프록시 게이트웨이"`
  - [ ] run: `/moai run SPEC-AI-001`
  - [ ] sync: `/moai sync SPEC-AI-001`
  - [ ] main 머지 완료

---

## SPEC 목록

| SPEC ID | 제목 | 핵심 범위 |
|---------|------|----------|
| SPEC-BE-001 | Supabase 초기 설정 | 프로젝트 구조, DB 스키마 전체 설계, RLS 정책, CLI 연동 |
| SPEC-BE-002 | 인증 전환 | NextAuth -> Supabase Auth, @supabase/ssr, 미들웨어, 프론트엔드 인증 레이어 |
| SPEC-BE-003 | 강좌 + 학습자료 | Course/Material CRUD, Supabase Storage, API 클라이언트 전환 |
| SPEC-BE-004 | Q&A 시스템 | Q&A CRUD, Realtime 알림, 추천/채택 |
| SPEC-BE-005 | 퀴즈 시스템 | Quiz CRUD, 응시/채점, Edge Functions |
| SPEC-BE-006 | 팀 + 메모 | Team/Memo CRUD, Realtime 협업, 팀 초대 |
| SPEC-BE-007 | 대시보드 | DB Views/Functions, 통계 집계, 성능 최적화 |
| SPEC-AI-001 | AI 서비스 | FastAPI + LangChain, Edge Functions 프록시, 퀴즈 생성/Q&A 추천 |

---

## 의존성 그래프

```
BE-001  Supabase 초기 설정
  |
BE-002  인증 전환
  |
BE-003  강좌 + 학습자료
  |
  +----------+----------+
  |          |          |
BE-004    BE-005    BE-006
 Q&A       퀴즈     팀+메모
  |          |          |
  +----------+----------+
             |
          BE-007  대시보드
             |
          AI-001  AI 서비스
```

---

## 실행 Phase 및 병렬 처리

### Phase 1 - 기반 (순차, 단일 브랜치)

| SPEC | 병렬 | Worktree | 사유 |
|------|------|----------|------|
| BE-001 | 불가 | 불필요 | DB 스키마가 모든 SPEC의 기반. 반드시 먼저 완료 후 main 머지. |
| BE-002 | 불가 | 불필요 | 인증이 모든 CRUD 작업의 전제조건. BE-001 완료 후 순차 진행. |
| BE-003 | 불가 | 불필요 | API 클라이언트 전환 패턴을 수립. 이후 SPEC들의 연동 기준이 됨. |

```bash
/moai plan "Supabase 초기 설정..."
/moai run SPEC-BE-001 && /moai sync SPEC-BE-001
# main 머지 후

/moai plan "인증 시스템 전환..."
/moai run SPEC-BE-002 && /moai sync SPEC-BE-002
# main 머지 후

/moai plan "강좌 및 학습자료..."
/moai run SPEC-BE-003 && /moai sync SPEC-BE-003
# main 머지 후
```

### Phase 2 - 도메인 기능 (병렬 가능, Worktree 활용)

BE-003 완료 후, BE-004/005/006은 **서로 독립적인 도메인**이므로 병렬 처리 가능.

| SPEC | 병렬 | Worktree | 사유 |
|------|------|----------|------|
| BE-004 | **가능** | `moai worktree new SPEC-BE-004` | Q&A 테이블/훅은 퀴즈/팀과 겹치지 않음 |
| BE-005 | **가능** | `moai worktree new SPEC-BE-005` | 퀴즈 테이블/Edge Functions는 독립적 |
| BE-006 | **가능** | `moai worktree new SPEC-BE-006` | 팀/메모 테이블/Realtime은 독립적 |

파일 충돌 위험 분석:

| 영역 | BE-004 | BE-005 | BE-006 | 충돌 위험 |
|------|--------|--------|--------|----------|
| DB 마이그레이션 | qa 테이블 | quiz 테이블 | team/memo 테이블 | 낮음 (별도 파일) |
| RLS 정책 | qa 정책 | quiz 정책 | team/memo 정책 | 낮음 (별도 파일) |
| hooks/ | qa/ 디렉토리 | quiz/ 디렉토리 | team/, memo/ 디렉토리 | 없음 (별도 디렉토리) |
| components/ | qa/ 디렉토리 | quiz/ 디렉토리 | team/, memo/ 디렉토리 | 없음 (별도 디렉토리) |
| lib/supabase/ | client.ts 수정 가능 | client.ts 수정 가능 | client.ts 수정 가능 | **중간** (공유 파일) |
| Edge Functions | - | quiz-generate/ | - | 없음 |

주의사항:
- `lib/supabase/client.ts` 등 공유 파일은 BE-003에서 패턴을 확립하고, Phase 2에서는 수정하지 않도록 설계
- DB 마이그레이션은 타임스탬프 기반이므로 파일 충돌 낮음
- 머지 순서: 어느 것이든 먼저 완료된 순서대로 main 머지 가능

```bash
# BE-003 완료 후, 3개 워크트리 동시 생성
moai worktree new SPEC-BE-004
moai worktree new SPEC-BE-005
moai worktree new SPEC-BE-006

# 각 워크트리에서 독립 실행 (3개 세션 병렬)
# Session 1: cd $(moai worktree go SPEC-BE-004)
/moai plan "Q&A 시스템 백엔드 연동..."
/moai run SPEC-BE-004

# Session 2: cd $(moai worktree go SPEC-BE-005)
/moai plan "퀴즈 시스템 백엔드 연동..."
/moai run SPEC-BE-005

# Session 3: cd $(moai worktree go SPEC-BE-006)
/moai plan "팀 및 메모 백엔드 연동..."
/moai run SPEC-BE-006

# 완료 순서대로 main 머지
moai worktree done SPEC-BE-004
moai worktree done SPEC-BE-005
moai worktree done SPEC-BE-006
```

### Phase 3 - 집계 + AI (순차)

| SPEC | 병렬 | Worktree | 사유 |
|------|------|----------|------|
| BE-007 | 불가 | 선택 | Phase 2 전체 완료 후 진행. 모든 도메인 테이블에 대한 집계 필요. |
| AI-001 | 불가 | 선택 | BE-005(퀴즈) + BE-007 완료 후. FastAPI 서비스 + Edge Functions 프록시. |

BE-007과 AI-001도 서로 독립적이나, AI-001이 퀴즈 생성 Edge Function을 포함하므로
BE-005 완료가 전제. 실질적으로 Phase 2 전체 완료 후 순차 또는 병렬 진행.

```bash
# Phase 2 전체 머지 완료 후
/moai plan "대시보드 백엔드 연동..."
/moai run SPEC-BE-007 && /moai sync SPEC-BE-007

/moai plan "AI 서비스 구축..."
/moai run SPEC-AI-001 && /moai sync SPEC-AI-001
```

---

## 실행 타임라인 요약

```
Phase 1 (순차)          Phase 2 (병렬)              Phase 3 (순차)
================       ====================        ================
BE-001 -> BE-002       BE-004 (Q&A)      ----+
            |          BE-005 (퀴즈)     ----+--> BE-007 (대시보드)
            +-> BE-003 BE-006 (팀+메모)  ----+        |
                                                  AI-001 (AI)
```

---

## 명령어 전체 요약

```bash
# === Phase 1: 기반 (순차) ===
/moai plan "Supabase 초기 설정: 프로젝트 구조 생성, 전체 DB 스키마 설계, RLS 정책 수립, Supabase CLI 연동"
/moai run SPEC-BE-001
/moai sync SPEC-BE-001

/moai plan "인증 시스템 전환: NextAuth를 Supabase Auth로 교체, @supabase/ssr 미들웨어, 프론트엔드 인증 레이어 수정"
/moai run SPEC-BE-002
/moai sync SPEC-BE-002

/moai plan "강좌 및 학습자료 백엔드 연동: Course/Material CRUD를 Supabase DB로 연결, Storage로 이미지 업로드, API 클라이언트 전환"
/moai run SPEC-BE-003
/moai sync SPEC-BE-003

# === Phase 2: 도메인 기능 (병렬 - Worktree) ===
moai worktree new SPEC-BE-004
moai worktree new SPEC-BE-005
moai worktree new SPEC-BE-006

# 각 워크트리에서 병렬 실행
/moai plan "Q&A 시스템 백엔드 연동: 질문/답변 CRUD, Supabase Realtime으로 실시간 알림, 추천/채택 기능"
/moai run SPEC-BE-004

/moai plan "퀴즈 시스템 백엔드 연동: Quiz CRUD, 응시/채점 로직, Edge Functions로 복잡한 비즈니스 로직 처리"
/moai run SPEC-BE-005

/moai plan "팀 및 메모 백엔드 연동: Team/Memo CRUD, 팀 초대/관리, Supabase Realtime으로 팀 메모 실시간 동기화"
/moai run SPEC-BE-006

# 완료 후 머지
moai worktree done SPEC-BE-004
moai worktree done SPEC-BE-005
moai worktree done SPEC-BE-006

# === Phase 3: 집계 + AI (순차) ===
/moai plan "대시보드 백엔드 연동: DB Views/Functions로 학생/강사/팀 대시보드 통계 집계, 성능 최적화"
/moai run SPEC-BE-007
/moai sync SPEC-BE-007

/moai plan "AI 서비스 구축: FastAPI + LangChain으로 퀴즈 생성/Q&A 추천, Supabase Edge Functions 프록시 게이트웨이"
/moai run SPEC-AI-001
/moai sync SPEC-AI-001
```

---

## 참고

- 프론트엔드 SPEC 완료 현황: SPEC-FE-001 ~ FE-008 (8/8 완료)
- 디자인 시스템: SPEC-UI-001 (완료)
- 프로젝트 문서: .moai/project/ (tech.md, structure.md Supabase 기반으로 업데이트 완료)
- 개발 방법론: Hybrid (quality.yaml - 신규 코드 TDD, 기존 코드 DDD)
