---
id: SPEC-BE-001
version: "1.0.0"
status: completed
created: "2026-02-20"
updated: "2026-02-20"
completed: "2026-02-20"
author: mhso-dev
priority: critical
---

# SPEC-BE-001: Supabase 초기 설정

## HISTORY

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0.0 | 2026-02-20 | mhso-dev | 초기 작성 |

## 1. Environment

### 1.1 기술 스택

| 카테고리 | 기술 | 버전 |
|----------|------|------|
| 백엔드 플랫폼 | Supabase | latest |
| 데이터베이스 | PostgreSQL | 16 |
| 클라이언트 라이브러리 | @supabase/supabase-js | ^2.49.x |
| SSR 헬퍼 | @supabase/ssr | ^0.6.x |
| 환경 변수 검증 | @t3-oss/env-nextjs | ^0.12.0 |
| 프레임워크 | Next.js (App Router) | 15.x |
| 언어 | TypeScript | 5.x |
| 로컬 개발 | Supabase CLI | latest |
| 컨테이너 | Docker | 24.x+ |

### 1.2 프로젝트 컨텍스트

lecture-moa는 강사가 Markdown 강의 자료를 업로드하고 학생이 인라인 Q&A와 함께 학습하는 교육 플랫폼이다. 프론트엔드(Next.js 15) 8개 SPEC이 완료된 상태이며, 기존 계획된 Fastify+Prisma 백엔드에서 Supabase 기반으로 전환한다.

### 1.3 의존성

- **선행 SPEC**: 없음 (기초 SPEC)
- **후속 SPEC**: BE-002(인증), BE-003(CRUD/Storage), BE-004(Realtime), BE-005(Edge Functions), BE-006(대시보드), BE-007(배포), AI-001(AI 서비스 연동)

## 2. Assumptions

- Docker Desktop이 로컬 개발 환경에 설치되어 있다
- pnpm 9.x 기반 모노레포 구조가 이미 설정되어 있다 (apps/web, packages/shared)
- Supabase CLI가 전역 또는 로컬로 설치 가능하다
- packages/shared/src/types/ 에 정의된 타입이 데이터베이스 스키마의 기준이 된다
- 로컬 개발은 `supabase start`로 Docker 기반 Supabase 스택을 사용한다
- 프로덕션 환경은 Supabase Hosted Platform을 사용한다

## 3. Scope

### 3.1 범위 내 (In Scope)

- supabase/ 디렉토리 구조 생성 (Supabase CLI init)
- 15개 테이블 전체 DB 스키마 설계 (SQL 마이그레이션)
- 모든 15개 테이블에 대한 RLS 헬퍼 함수 및 정책
- 로컬 개발용 시드 데이터 (seed.sql)
- Supabase 클라이언트 설정 파일 (lib/supabase/client.ts, server.ts, middleware.ts)
- @supabase/supabase-js 및 @supabase/ssr 패키지 설치
- env 스키마 업데이트 (src/env.ts에 Supabase 환경 변수 추가)
- TypeScript 타입 자동 생성 설정
- package.json 스크립트 (db:start, db:stop, db:reset, db:types 등)

### 3.2 범위 외 (Out of Scope)

- Edge Functions 구현 (BE-005, AI-001)
- 프론트엔드 컴포넌트 수정 (BE-002+)
- NextAuth 교체 (BE-002)
- CRUD hooks/API 연동 (BE-003+)
- Storage 버킷 설정 (BE-003)

## 4. Requirements

### 4.1 Supabase 프로젝트 초기화

**REQ-BE-001**: 시스템은 **항상** supabase/ 디렉토리 구조를 표준 Supabase CLI 형식으로 생성해야 한다.

```
supabase/
  config.toml          # Supabase 로컬 개발 설정
  migrations/          # SQL 마이그레이션 파일들
  functions/           # Edge Functions (이 SPEC에서는 빈 디렉토리)
  seed.sql             # 개발용 시드 데이터
```

### 4.2 데이터베이스 스키마 (15개 테이블)

**REQ-BE-002**: 시스템은 **항상** 의존성 순서에 따라 15개 테이블을 SQL 마이그레이션으로 생성해야 한다.

#### 4.2.1 profiles

**REQ-BE-002-01**: **WHEN** auth.users에 새 사용자가 생성되면 **THEN** profiles 테이블에 대응하는 레코드가 존재해야 한다.

| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| id | UUID | PK, FK -> auth.users(id) ON DELETE CASCADE | 사용자 ID |
| role | TEXT | NOT NULL, CHECK ('instructor', 'student') | 역할 (UserRole 매핑) |
| display_name | TEXT | NOT NULL | 표시 이름 |
| avatar_url | TEXT | nullable | 아바타 URL |
| bio | TEXT | nullable | 자기소개 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 생성일 |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 수정일 |

**타입 매핑**: `UserRole` ("student" | "instructor" | "admin") -> profiles.role
- 참고: DB 스키마에서는 'admin' 역할은 Supabase Dashboard 또는 service_role로 관리하므로 CHECK에 포함하지 않음

#### 4.2.2 courses

**REQ-BE-002-02**: 시스템은 **항상** 강좌 정보를 courses 테이블에 저장해야 한다.

| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 강좌 ID |
| instructor_id | UUID | NOT NULL, FK -> profiles(id) | 강사 ID |
| title | TEXT | NOT NULL | 강좌명 |
| description | TEXT | nullable | 설명 |
| cover_image_url | TEXT | nullable | 커버 이미지 URL |
| category | TEXT | CHECK ('programming', 'design', 'business', 'science', 'language', 'other') | 카테고리 (CourseCategory 매핑) |
| status | TEXT | NOT NULL DEFAULT 'draft', CHECK ('draft', 'published', 'archived') | 상태 (CourseStatus 매핑) |
| visibility | TEXT | NOT NULL DEFAULT 'public', CHECK ('public', 'invite_only') | 공개 범위 (CourseVisibility 매핑) |
| invite_code | TEXT | UNIQUE, nullable | 초대 코드 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 생성일 |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 수정일 |

#### 4.2.3 course_enrollments

**REQ-BE-002-03**: 시스템은 **항상** 학생의 강좌 수강 상태를 course_enrollments 테이블에 기록해야 한다.

| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 수강 ID |
| course_id | UUID | NOT NULL, FK -> courses(id) ON DELETE CASCADE | 강좌 ID |
| student_id | UUID | NOT NULL, FK -> profiles(id) ON DELETE CASCADE | 학생 ID |
| enrolled_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 수강 등록일 |
| status | TEXT | NOT NULL DEFAULT 'active', CHECK ('active', 'dropped', 'completed') | 수강 상태 |
| progress_percent | INTEGER | NOT NULL DEFAULT 0, CHECK (0-100) | 진행률 |
| UNIQUE | | (course_id, student_id) | 중복 수강 방지 |

#### 4.2.4 materials

**REQ-BE-002-04**: 시스템은 **항상** Markdown 강의 자료를 materials 테이블에 저장해야 한다.

| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 자료 ID |
| course_id | UUID | NOT NULL, FK -> courses(id) ON DELETE CASCADE | 강좌 ID |
| title | TEXT | NOT NULL | 제목 |
| content | TEXT | NOT NULL DEFAULT '' | Markdown 내용 |
| excerpt | TEXT | nullable | 요약 |
| status | TEXT | NOT NULL DEFAULT 'draft', CHECK ('draft', 'published') | 상태 (MaterialStatus 매핑) |
| position | INTEGER | NOT NULL DEFAULT 0 | 정렬 순서 |
| tags | TEXT[] | DEFAULT '{}' | 태그 배열 |
| read_time_minutes | INTEGER | DEFAULT 0 | 읽기 예상 시간(분) |
| version | INTEGER | DEFAULT 1 | 버전 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 생성일 |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 수정일 |

#### 4.2.5 questions

**REQ-BE-002-05**: 시스템은 **항상** 텍스트 하이라이트 기반 Q&A 질문을 questions 테이블에 저장해야 한다.

| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 질문 ID |
| material_id | UUID | NOT NULL, FK -> materials(id) ON DELETE CASCADE | 자료 ID |
| course_id | UUID | NOT NULL, FK -> courses(id) ON DELETE CASCADE | 강좌 ID |
| author_id | UUID | NOT NULL, FK -> profiles(id) ON DELETE CASCADE | 작성자 ID |
| title | TEXT | NOT NULL | 질문 제목 |
| content | TEXT | NOT NULL | 질문 내용 (Markdown) |
| heading_id | TEXT | nullable | 앵커 heading ID |
| selected_text | TEXT | nullable, CHECK (char_length <= 500) | 선택된 텍스트 (최대 500자) |
| status | TEXT | NOT NULL DEFAULT 'OPEN', CHECK ('OPEN', 'RESOLVED', 'CLOSED') | 상태 (QAStatus 매핑) |
| upvote_count | INTEGER | NOT NULL DEFAULT 0 | 추천 수 |
| answer_count | INTEGER | NOT NULL DEFAULT 0 | 답변 수 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 생성일 |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 수정일 |

#### 4.2.6 answers

**REQ-BE-002-06**: **WHEN** 질문에 답변이 작성되면 **THEN** answers 테이블에 저장되어야 한다.

| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 답변 ID |
| question_id | UUID | NOT NULL, FK -> questions(id) ON DELETE CASCADE | 질문 ID |
| author_id | UUID | NOT NULL, FK -> profiles(id) ON DELETE CASCADE | 작성자 ID |
| content | TEXT | NOT NULL | 답변 내용 (Markdown) |
| is_accepted | BOOLEAN | NOT NULL DEFAULT false | 채택 여부 |
| is_ai_generated | BOOLEAN | NOT NULL DEFAULT false | AI 생성 여부 |
| upvote_count | INTEGER | NOT NULL DEFAULT 0 | 추천 수 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 생성일 |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 수정일 |

#### 4.2.7 votes

**REQ-BE-002-07**: 시스템은 **항상** 질문/답변의 추천을 votes 테이블에 다형적(polymorphic)으로 저장해야 한다.

| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 투표 ID |
| user_id | UUID | NOT NULL, FK -> profiles(id) ON DELETE CASCADE | 투표자 ID |
| target_type | TEXT | NOT NULL, CHECK ('question', 'answer') | 대상 타입 |
| target_id | UUID | NOT NULL | 대상 ID |
| value | SMALLINT | NOT NULL, CHECK (value IN (1, -1)) | 추천(1) / 비추천(-1) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 생성일 |
| UNIQUE | | (user_id, target_type, target_id) | 중복 투표 방지 |

#### 4.2.8 teams

**REQ-BE-002-08**: 시스템은 **항상** 스터디 팀 정보를 teams 테이블에 저장해야 한다.

| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 팀 ID |
| course_id | UUID | NOT NULL, FK -> courses(id) ON DELETE CASCADE | 강좌 ID |
| name | TEXT | NOT NULL | 팀 이름 |
| description | TEXT | nullable | 팀 설명 |
| created_by | UUID | FK -> profiles(id) | 생성자 ID |
| max_members | INTEGER | NOT NULL DEFAULT 10 | 최대 인원 |
| invite_code | TEXT | UNIQUE, nullable | 초대 코드 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 생성일 |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 수정일 |

#### 4.2.9 team_members

**REQ-BE-002-09**: 시스템은 **항상** 팀 멤버십을 team_members 테이블에 기록해야 한다.

| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 멤버십 ID |
| team_id | UUID | NOT NULL, FK -> teams(id) ON DELETE CASCADE | 팀 ID |
| user_id | UUID | NOT NULL, FK -> profiles(id) ON DELETE CASCADE | 사용자 ID |
| role | TEXT | NOT NULL DEFAULT 'member', CHECK ('leader', 'member') | 역할 (TeamMemberRole 매핑) |
| joined_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 가입일 |
| UNIQUE | | (team_id, user_id) | 중복 가입 방지 |

#### 4.2.10 memos

**REQ-BE-002-10**: 시스템은 **항상** 개인 및 팀 메모를 memos 테이블에 저장해야 한다.

| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 메모 ID |
| author_id | UUID | NOT NULL, FK -> profiles(id) ON DELETE CASCADE | 작성자 ID |
| material_id | UUID | FK -> materials(id) ON DELETE SET NULL, nullable | 자료 ID |
| team_id | UUID | FK -> teams(id) ON DELETE SET NULL, nullable | 팀 ID |
| title | TEXT | NOT NULL | 제목 |
| content | TEXT | NOT NULL DEFAULT '' | 내용 |
| anchor_id | TEXT | nullable | 텍스트 앵커 위치 |
| tags | TEXT[] | DEFAULT '{}' | 태그 배열 |
| visibility | TEXT | NOT NULL DEFAULT 'personal', CHECK ('personal', 'team') | 공개 범위 (MemoVisibility 매핑) |
| is_draft | BOOLEAN | NOT NULL DEFAULT false | 임시저장 여부 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 생성일 |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 수정일 |

#### 4.2.11 quizzes

**REQ-BE-002-11**: 시스템은 **항상** 퀴즈 정의를 quizzes 테이블에 저장해야 한다.

| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 퀴즈 ID |
| course_id | UUID | NOT NULL, FK -> courses(id) ON DELETE CASCADE | 강좌 ID |
| created_by | UUID | FK -> profiles(id) | 생성자 ID |
| title | TEXT | NOT NULL | 퀴즈 제목 |
| description | TEXT | nullable | 설명 |
| time_limit_minutes | INTEGER | nullable | 제한 시간(분) |
| passing_score | INTEGER | NOT NULL DEFAULT 70 | 합격 점수 |
| allow_reattempt | BOOLEAN | NOT NULL DEFAULT true | 재시도 허용 |
| shuffle_questions | BOOLEAN | NOT NULL DEFAULT false | 문제 셔플 |
| show_answers_after_submit | BOOLEAN | NOT NULL DEFAULT true | 제출 후 답 표시 |
| focus_loss_warning | BOOLEAN | NOT NULL DEFAULT false | 포커스 이탈 경고 |
| due_date | TIMESTAMPTZ | nullable | 마감일 |
| status | TEXT | NOT NULL DEFAULT 'draft', CHECK ('draft', 'published', 'closed') | 상태 (QuizStatus 매핑) |
| is_ai_generated | BOOLEAN | NOT NULL DEFAULT false | AI 생성 여부 |
| source_material_id | UUID | FK -> materials(id) ON DELETE SET NULL, nullable | 원본 자료 ID |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 생성일 |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 수정일 |

#### 4.2.12 quiz_questions

**REQ-BE-002-12**: 시스템은 **항상** 퀴즈 문제 항목을 quiz_questions 테이블에 저장해야 한다.

| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 문제 ID |
| quiz_id | UUID | NOT NULL, FK -> quizzes(id) ON DELETE CASCADE | 퀴즈 ID |
| question_type | TEXT | NOT NULL, CHECK ('multiple_choice', 'true_false', 'short_answer', 'fill_in_the_blank') | 문제 유형 (QuestionType 매핑) |
| content | TEXT | NOT NULL | 문제 내용 |
| options | JSONB | nullable | 선택지 ([{text, isCorrect}]) |
| correct_answer | TEXT | nullable | 정답 |
| explanation | TEXT | nullable | 해설 |
| points | INTEGER | NOT NULL DEFAULT 1 | 배점 |
| order_index | INTEGER | NOT NULL DEFAULT 0 | 정렬 순서 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 생성일 |

#### 4.2.13 quiz_attempts

**REQ-BE-002-13**: **WHEN** 학생이 퀴즈를 시작하면 **THEN** quiz_attempts 테이블에 시도 레코드가 생성되어야 한다.

| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 시도 ID |
| quiz_id | UUID | NOT NULL, FK -> quizzes(id) ON DELETE CASCADE | 퀴즈 ID |
| student_id | UUID | NOT NULL, FK -> profiles(id) ON DELETE CASCADE | 학생 ID |
| status | TEXT | NOT NULL DEFAULT 'in_progress', CHECK ('in_progress', 'submitted', 'graded') | 상태 (AttemptStatus 매핑 + 'graded') |
| score | INTEGER | nullable | 점수 |
| total_points | INTEGER | NOT NULL DEFAULT 0 | 총점 |
| started_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 시작 시간 |
| submitted_at | TIMESTAMPTZ | nullable | 제출 시간 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 생성일 |

#### 4.2.14 quiz_answers

**REQ-BE-002-14**: **WHEN** 학생이 퀴즈 문제에 답변하면 **THEN** quiz_answers 테이블에 저장되어야 한다.

| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 답변 ID |
| attempt_id | UUID | NOT NULL, FK -> quiz_attempts(id) ON DELETE CASCADE | 시도 ID |
| question_id | UUID | NOT NULL, FK -> quiz_questions(id) ON DELETE CASCADE | 문제 ID |
| answer | TEXT | nullable | 학생 답변 |
| is_correct | BOOLEAN | nullable | 정답 여부 |
| points_earned | INTEGER | NOT NULL DEFAULT 0 | 획득 점수 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 생성일 |

#### 4.2.15 notifications

**REQ-BE-002-15**: 시스템은 **항상** 사용자 알림을 notifications 테이블에 저장해야 한다.

| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 알림 ID |
| user_id | UUID | NOT NULL, FK -> profiles(id) ON DELETE CASCADE | 사용자 ID |
| type | TEXT | NOT NULL, CHECK ('new_question', 'new_answer', 'answer_accepted', 'quiz_graded', 'team_invite', 'team_join', 'mention') | 알림 유형 |
| title | TEXT | NOT NULL | 알림 제목 |
| message | TEXT | nullable | 알림 내용 |
| data | JSONB | nullable | 컨텍스트 데이터 |
| is_read | BOOLEAN | NOT NULL DEFAULT false | 읽음 여부 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 생성일 |

### 4.3 RLS (Row Level Security) 정책

**REQ-BE-003**: 시스템은 **항상** 모든 15개 테이블에 RLS 정책을 적용하여 인증되지 않은 데이터 접근을 차단해야 한다.

#### 4.3.1 헬퍼 함수

**REQ-BE-003-01**: 시스템은 **항상** 다음 RLS 헬퍼 함수를 제공해야 한다.

- `get_user_role()`: 현재 인증된 사용자의 role을 반환
- `is_course_instructor(p_course_id UUID)`: 현재 사용자가 해당 강좌의 강사인지 확인
- `is_course_enrolled(p_course_id UUID)`: 현재 사용자가 해당 강좌에 수강 등록되었는지 확인
- `is_team_member(p_team_id UUID)`: 현재 사용자가 해당 팀의 멤버인지 확인

#### 4.3.2 정책 원칙

**REQ-BE-003-02**: **IF** 인증되지 않은 사용자가 RLS 보호 테이블에 접근하면 **THEN** 시스템은 모든 행을 차단해야 한다.

- **profiles**: 인증된 사용자는 모든 프로필을 조회 가능. 본인 프로필만 수정 가능.
- **courses**: 모든 인증된 사용자가 published 강좌를 조회 가능. 강사는 본인 강좌만 생성/수정/삭제 가능.
- **course_enrollments**: 강사는 본인 강좌의 수강 목록 조회 가능. 학생은 본인 수강 기록만 조회 가능.
- **materials**: 수강 등록된 학생 또는 해당 강좌 강사만 조회 가능. 강사만 생성/수정/삭제 가능.
- **questions**: 수강 등록 학생 또는 강사가 조회 가능. 인증된 수강 학생이 생성 가능. 작성자 또는 강사가 수정 가능.
- **answers**: 해당 질문이 속한 강좌의 수강자/강사가 조회 가능. 인증된 사용자가 생성 가능. 작성자만 수정 가능.
- **votes**: 인증된 사용자가 본인 투표를 관리 가능.
- **teams**: 해당 강좌 수강자만 조회 가능. 수강 학생이 생성 가능. 팀 리더만 수정/삭제 가능.
- **team_members**: 팀 멤버만 조회 가능. 수강 학생이 가입 가능. 본인 또는 팀 리더가 삭제 가능.
- **memos**: 개인 메모는 작성자만 접근 가능. 팀 메모는 팀 멤버만 접근 가능.
- **quizzes**: 수강 학생 및 강사가 published 퀴즈 조회 가능. 강사만 생성/수정/삭제 가능.
- **quiz_questions**: 퀴즈 조회 권한이 있는 사용자가 조회 가능. 강사만 관리 가능.
- **quiz_attempts**: 학생은 본인 시도만 접근 가능. 강사는 본인 강좌의 시도를 조회 가능.
- **quiz_answers**: 해당 시도의 소유자 또는 강사만 조회 가능.
- **notifications**: 본인 알림만 접근 가능.

### 4.4 시드 데이터

**REQ-BE-004**: 시스템은 **항상** 로컬 개발을 위한 시드 데이터를 seed.sql로 제공해야 한다.

- 테스트 강사 1명, 테스트 학생 2명 (auth.users + profiles)
- 강좌 2개 (published 1개, draft 1개)
- 수강 등록 2건 (학생 2명이 published 강좌에 등록)
- 강의 자료 3개 (published 2개, draft 1개)
- Q&A 질문 2개 + 답변 3개
- 팀 1개 + 멤버 2명
- 메모 2개 (개인 1개, 팀 1개)
- 퀴즈 1개 + 문제 3개 + 시도 1개

### 4.5 Supabase 클라이언트 설정

**REQ-BE-005**: 시스템은 **항상** 다음 3개의 Supabase 클라이언트 파일을 제공해야 한다.

- `apps/web/lib/supabase/client.ts`: createBrowserClient (브라우저 싱글톤)
- `apps/web/lib/supabase/server.ts`: createServerClient (RSC, Route Handler, Server Action용)
- `apps/web/lib/supabase/middleware.ts`: updateSession 헬퍼 (Next.js 미들웨어용)

### 4.6 환경 변수

**REQ-BE-006**: 시스템은 **항상** src/env.ts에 Supabase 관련 환경 변수 스키마를 추가해야 한다.

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL (client)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon/public key (client)
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (server only)

### 4.7 TypeScript 타입 자동 생성

**REQ-BE-007**: **WHEN** `db:types` 스크립트가 실행되면 **THEN** Supabase CLI가 로컬 DB 스키마에서 TypeScript 타입을 자동 생성해야 한다.

- 출력 경로: `apps/web/types/supabase.ts`
- 15개 테이블 모두의 타입이 포함되어야 한다

### 4.8 패키지 및 스크립트

**REQ-BE-008**: 시스템은 **항상** 다음 패키지를 apps/web에 설치해야 한다.

- `@supabase/supabase-js` (dependencies)
- `@supabase/ssr` (dependencies)

**REQ-BE-009**: 시스템은 **항상** root package.json에 다음 스크립트를 추가해야 한다.

- `db:start`: `supabase start`
- `db:stop`: `supabase stop`
- `db:reset`: `supabase db reset`
- `db:types`: `supabase gen types typescript --local > apps/web/types/supabase.ts`
- `db:migration:new`: `supabase migration new`
- `db:push`: `supabase db push`

### 4.9 updated_at 자동 갱신

**REQ-BE-010**: 시스템은 **항상** updated_at 컬럼이 있는 테이블에 트리거를 설정하여 행 수정 시 자동으로 현재 시간으로 갱신해야 한다.

## 5. Specifications

### 5.1 마이그레이션 파일 구조

마이그레이션은 의존성 순서를 고려하여 다음과 같이 분리한다:

1. `00001_create_profiles.sql` - profiles + updated_at 트리거 함수
2. `00002_create_courses.sql` - courses
3. `00003_create_enrollments.sql` - course_enrollments
4. `00004_create_materials.sql` - materials
5. `00005_create_qa.sql` - questions, answers, votes
6. `00006_create_teams.sql` - teams, team_members
7. `00007_create_memos.sql` - memos
8. `00008_create_quizzes.sql` - quizzes, quiz_questions, quiz_attempts, quiz_answers
9. `00009_create_notifications.sql` - notifications
10. `00010_create_rls_helpers.sql` - RLS 헬퍼 함수
11. `00011_create_rls_policies.sql` - 모든 테이블 RLS 정책
12. `00012_create_indexes.sql` - 성능 인덱스

### 5.2 인덱스 전략

자주 사용되는 쿼리 패턴에 대한 인덱스:

- `courses`: instructor_id, status, category
- `course_enrollments`: course_id, student_id
- `materials`: course_id, status, position
- `questions`: material_id, course_id, author_id, status
- `answers`: question_id, author_id
- `votes`: target_type + target_id
- `teams`: course_id
- `team_members`: team_id, user_id
- `memos`: author_id, material_id, team_id, visibility
- `quizzes`: course_id, status
- `quiz_attempts`: quiz_id, student_id
- `quiz_answers`: attempt_id, question_id
- `notifications`: user_id, is_read, created_at

### 5.3 타입 매핑 테이블

| packages/shared 타입 | DB 테이블.컬럼 | DB 값 |
|---------------------|---------------|-------|
| UserRole | profiles.role | 'instructor', 'student' |
| CourseStatus | courses.status | 'draft', 'published', 'archived' |
| CourseCategory | courses.category | 'programming', 'design', 'business', 'science', 'language', 'other' |
| CourseVisibility | courses.visibility | 'public', 'invite_only' |
| MaterialStatus | materials.status | 'draft', 'published' |
| QAStatus | questions.status | 'OPEN', 'RESOLVED', 'CLOSED' |
| MemoVisibility | memos.visibility | 'personal', 'team' |
| QuestionType | quiz_questions.question_type | 'multiple_choice', 'true_false', 'short_answer', 'fill_in_the_blank' |
| QuizStatus | quizzes.status | 'draft', 'published', 'closed' |
| AttemptStatus | quiz_attempts.status | 'in_progress', 'submitted', 'graded' |
| TeamMemberRole | team_members.role | 'leader', 'member' |

## 6. Traceability

| 요구사항 ID | 설명 | plan.md 매핑 | acceptance.md 매핑 |
|------------|------|-------------|-------------------|
| REQ-BE-001 | Supabase 디렉토리 구조 | Phase A | AC-001 |
| REQ-BE-002 | 15개 테이블 스키마 | Phase B | AC-002 |
| REQ-BE-003 | RLS 정책 | Phase C | AC-003, AC-004 |
| REQ-BE-004 | 시드 데이터 | Phase D | AC-005 |
| REQ-BE-005 | 클라이언트 설정 | Phase E | AC-006 |
| REQ-BE-006 | 환경 변수 | Phase E | AC-006 |
| REQ-BE-007 | 타입 자동 생성 | Phase F | AC-007 |
| REQ-BE-008 | 패키지 설치 | Phase E | AC-006 |
| REQ-BE-009 | 스크립트 추가 | Phase F | AC-007 |
| REQ-BE-010 | updated_at 트리거 | Phase B | AC-002 |

## 7. Implementation Notes

### 7.1 Implementation Summary

- **Commit**: `bbcfffa feat(backend): implement SPEC-BE-001 Supabase Initial Setup`
- **Branch**: `feature/SPEC-BE-001`
- **Completed**: 2026-02-20
- **Files Created**: 19 new files
- **Files Modified**: 6 existing files
- **Total Changes**: +3,747 lines

### 7.2 Deliverables

All planned requirements (REQ-BE-001 through REQ-BE-010) were implemented as specified:

1. Supabase CLI initialization with standard directory structure
2. 12 SQL migration files (00001-00012) creating 15 tables
3. RLS helper functions (4) and policies for all 15 tables
4. Seed data with test users, courses, materials, Q&A, teams, memos, quizzes
5. Supabase client files (browser, server, middleware)
6. Environment variable schema with validation
7. TypeScript type auto-generation setup
8. Package scripts (db:start, db:stop, db:reset, db:types, db:migration:new, db:push)

### 7.3 Scope Additions (Unplanned)

- `ROADMAP-BE.md`: Backend SPEC roadmap document (BE-001 through BE-007, AI-001)
- `.moai/project/structure.md`: Updated with supabase/ directory structure
- `.moai/project/tech.md`: Updated with Supabase technology stack

### 7.4 Quality Results

- Tests: 1,577/1,577 passing (117 test files)
- ESLint: Pass (1 pre-existing warning, unrelated)
- TypeScript: Pre-existing RouteImpl errors from frontend SPECs, no new errors introduced
