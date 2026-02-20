---
id: SPEC-BE-003
version: "1.1.0"
status: completed
created: "2026-02-20"
updated: "2026-02-21"
author: mhso-dev
priority: high
depends_on: [SPEC-BE-001, SPEC-AUTH-001]
---

# SPEC-BE-003: Course + Material Supabase Backend Integration

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
| 프레임워크 | Next.js (App Router) | 15.x |
| 언어 | TypeScript | 5.x |
| 상태 관리 | TanStack Query | v5 |
| 타입 공유 | packages/shared | workspace |

### 1.2 프로젝트 컨텍스트

lecture-moa는 강사가 Markdown 강의 자료를 업로드하고 학생이 인라인 Q&A와 함께 학습하는 교육 플랫폼이다.

**현재 상태:**
- SPEC-BE-001(Supabase 초기 설정) COMPLETE: DB 스키마 15개 테이블, RLS 정책, 마이그레이션 완료
- SPEC-AUTH-001(인증 전환) COMPLETE: Supabase Auth 기반 인증 레이어 완성
- 프론트엔드 SPEC-FE-001 ~ FE-008 COMPLETE: UI 컴포넌트 및 hooks 완성
- 문제: 모든 Course/Material hooks가 존재하지 않는 REST API 엔드포인트(apps/api Fastify 서버) 호출 중

**핵심 전환 과제:**
기존 `api.get('/api/v1/courses/...')` 패턴을 `createClient().from('courses')` Supabase 직접 쿼리로 전환

### 1.3 의존성

- **선행 SPEC**: SPEC-BE-001 (DB 스키마, RLS 정책), SPEC-AUTH-001 (Supabase Auth)
- **후속 SPEC**: SPEC-BE-004 (Q&A), SPEC-BE-005 (퀴즈), SPEC-BE-006 (팀+메모) - 이 SPEC이 수립한 패턴을 따름

## 2. Assumptions

- SPEC-BE-001에서 생성된 DB 스키마 (courses, materials, course_enrollments 테이블)가 정확히 존재한다
- SPEC-AUTH-001에서 구현된 Supabase Auth가 정상 작동 중이다
- `lib/supabase/client.ts`(브라우저)와 `lib/supabase/server.ts`(서버)가 이미 설정되어 있다
- RLS 정책이 제대로 설정되어 있어 서버 사이드 액션 없이 클라이언트에서 직접 안전하게 DB에 접근 가능하다
- Supabase Storage를 이미지 업로드에 활용한다 (Storage 버킷은 이 SPEC에서 신규 생성)
- `supabase gen types typescript --local` 명령으로 정확한 타입을 재생성한다
- packages/shared 타입과 DB 컬럼명 간 불일치는 매핑 레이어에서 해소한다 (camelCase <-> snake_case)
- TanStack Query 캐시 키는 기존 패턴을 유지하여 UI 컴포넌트 재작업을 최소화한다

## 3. Scope

### 3.1 범위 내 (In Scope)

- `apps/web/types/supabase.ts` 재생성: 실제 DB 스키마에 맞는 TypeScript 타입
- Supabase Storage 버킷 설정 (마이그레이션 파일)
- `apps/web/lib/supabase/courses.ts` 신규: Course 도메인 Supabase 쿼리 함수
- `apps/web/lib/supabase/materials.ts` 신규: Material 도메인 Supabase 쿼리 함수
- `apps/web/lib/supabase/storage.ts` 신규: Storage 업로드/삭제 유틸리티
- 12개 Course hooks 전환 (REST API → Supabase 직접 쿼리)
- 7개 Material hooks 전환 (REST API → Supabase 직접 쿼리)
- `packages/shared/src/types/course.types.ts` 정렬: DB 스키마와 타입 일치
- `packages/shared/src/types/material.types.ts` 정렬: DB 스키마와 타입 일치
- `apps/web/lib/api/courses.ts` 삭제 (REST 클라이언트 제거)
- `apps/web/lib/api/materials.ts` 삭제 (REST 클라이언트 제거)

### 3.2 범위 외 (Out of Scope)

- Q&A hooks 전환 (SPEC-BE-004)
- Quiz hooks 전환 (SPEC-BE-005)
- Team/Memo hooks 전환 (SPEC-BE-006)
- Dashboard hooks 전환 (SPEC-BE-007)
- Edge Functions 구현 (AI-001)
- 프론트엔드 UI 컴포넌트 변경 (인터페이스 호환성 유지)
- NextAuth 관련 코드 (이미 SPEC-AUTH-001에서 제거됨)

## 4. Requirements

### 4.1 TypeScript 타입 재생성

**REQ-BE-003-001**: 시스템은 **항상** `apps/web/types/supabase.ts`가 실제 Supabase DB 스키마를 정확히 반영하도록 유지해야 한다.

**REQ-BE-003-002**: **WHEN** `pnpm db:types` 스크립트가 실행되면 **THEN** Supabase CLI가 로컬 DB 스키마에서 TypeScript 타입을 자동 생성하여 `apps/web/types/supabase.ts`를 업데이트해야 한다.

**REQ-BE-003-003**: **IF** 현재 `supabase.ts` 파일이 실제 스키마와 불일치(예: `is_active` 컬럼이 존재하나 실제로는 `status`, `category`, `visibility` 컬럼 사용)하면 **THEN** 정확한 스키마를 반영하여 수동 업데이트 또는 재생성해야 한다.

핵심 불일치 항목:
- `courses.is_active` (타입에 있음) → 실제: `status`, `category`, `visibility`, `invite_code` 컬럼
- `courses` 테이블의 `Row` 타입에 누락된 컬럼들: `category`, `status`, `visibility`, `invite_code`
- `materials` 테이블의 타입 완전 누락 (placeholder 상태)

### 4.2 Supabase Storage 버킷 설정

**REQ-BE-003-004**: 시스템은 **항상** 강좌 썸네일과 학습자료 인라인 이미지를 위한 Supabase Storage 버킷을 제공해야 한다.

**REQ-BE-003-005**: **WHEN** 강사가 강좌 커버 이미지를 업로드하면 **THEN** `course-images` 버킷에 저장되어야 한다.

**REQ-BE-003-006**: **WHEN** 강사가 학습자료 내 인라인 이미지를 업로드하면 **THEN** `material-images` 버킷에 저장되어야 한다.

**REQ-BE-003-007**: **IF** 인증되지 않은 사용자가 Storage 버킷에 쓰기를 시도하면 **THEN** 시스템은 해당 요청을 거부해야 한다.

**REQ-BE-003-008**: **WHERE** public 강좌의 커버 이미지가 존재하면 **THEN** 인증 없이도 이미지를 읽을 수 있어야 한다.

Storage 버킷 설계:
- `course-images`: public 접근 가능, 강사만 쓰기 가능
- `material-images`: public 접근 가능, 강사만 쓰기 가능
- 파일 크기 제한: 이미지당 5MB
- 허용 MIME 타입: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

### 4.3 Supabase 쿼리 레이어 신규 생성

**REQ-BE-003-009**: 시스템은 **항상** Course 도메인 쿼리를 `apps/web/lib/supabase/courses.ts` 파일에 집중시켜야 한다.

**REQ-BE-003-010**: 시스템은 **항상** Material 도메인 쿼리를 `apps/web/lib/supabase/materials.ts` 파일에 집중시켜야 한다.

**REQ-BE-003-011**: 시스템은 **항상** Storage 연산을 `apps/web/lib/supabase/storage.ts` 파일에 집중시켜야 한다.

**REQ-BE-003-012**: **IF** DB 컬럼명(snake_case)과 shared 타입 필드명(camelCase)이 불일치하면 **THEN** 쿼리 레이어에서 매핑을 수행해야 한다.

핵심 매핑 예시:
- `courses.cover_image_url` → `CourseListItem.thumbnailUrl`
- `courses.instructor_id` → `CourseListItem.instructor` (profiles JOIN 필요)
- `materials.read_time_minutes` → `Material.readTimeMinutes`
- `materials.course_id` → `Material.courseId`

### 4.4 Course CRUD - Supabase 전환

**REQ-BE-003-013**: **WHEN** `useCourses(params?)` 훅이 호출되면 **THEN** Supabase로부터 페이지네이션된 강좌 목록을 반환해야 한다.

쿼리 요구사항:
- `courses` 테이블에서 `profiles` 테이블을 JOIN하여 instructor 정보 포함
- `course_enrollments` COUNT로 `enrolledCount` 계산
- `materials` COUNT로 `materialCount` 계산
- status, category, search(title/description ILIKE) 필터링 지원
- 현재 사용자가 강사면 본인 강좌(전체 status), 학생이면 published만 표시
- RLS 정책이 이를 자동으로 처리

**REQ-BE-003-014**: **WHEN** `useCourse(courseId)` 훅이 호출되면 **THEN** 단일 강좌 상세 정보를 반환해야 한다.

**REQ-BE-003-015**: **WHEN** `useCreateCourse()` mutation이 실행되면 **THEN** 현재 인증 사용자를 `instructor_id`로 하여 courses 테이블에 새 레코드를 삽입해야 한다.

**REQ-BE-003-016**: **WHEN** `useUpdateCourse()` mutation이 실행되면 **THEN** 해당 강좌 레코드를 업데이트해야 한다.

**REQ-BE-003-017**: **IF** 현재 사용자가 해당 강좌의 강사가 아닌 경우 **THEN** 업데이트는 RLS 정책에 의해 차단되어야 한다.

**REQ-BE-003-018**: **WHEN** `useDeleteCourse()` mutation이 실행되면 **THEN** 해당 강좌를 삭제해야 한다 (CASCADE 삭제로 연관 materials, enrollments 포함).

**REQ-BE-003-019**: **WHEN** `useArchiveCourse()` mutation이 실행되면 **THEN** 강좌의 `status`를 `'archived'`로 업데이트해야 한다.

### 4.5 Course 수강 관리 - Supabase 전환

**REQ-BE-003-020**: **WHEN** `useEnrollCourse()` mutation이 실행되면 **THEN** `course_enrollments` 테이블에 새 수강 레코드를 삽입해야 한다.

**REQ-BE-003-021**: **IF** 이미 수강 중인 강좌에 재수강을 시도하면 **THEN** 시스템은 UNIQUE 제약 조건 위반 에러를 처리하고 적절한 오류 메시지를 반환해야 한다.

**REQ-BE-003-022**: **WHEN** `useEnrollWithCode()` mutation이 실행되면 **THEN** 입력된 초대 코드로 강좌를 찾아 `course_enrollments`에 삽입해야 한다.

**REQ-BE-003-023**: **IF** 유효하지 않은 초대 코드가 입력되면 **THEN** 시스템은 명확한 오류 메시지를 반환해야 한다.

**REQ-BE-003-024**: **WHEN** `useGenerateInviteCode()` mutation이 실행되면 **THEN** 무작위 코드를 생성하여 `courses.invite_code` 컬럼을 업데이트해야 한다.

**REQ-BE-003-025**: **WHEN** `useCourseStudents(courseId)` 훅이 호출되면 **THEN** `course_enrollments` 테이블과 `profiles`를 JOIN하여 수강 학생 목록을 반환해야 한다.

**REQ-BE-003-026**: **WHEN** `useCourseProgress(courseId)` 훅이 호출되면 **THEN** 현재 사용자의 `course_enrollments` 레코드를 반환해야 한다.

**REQ-BE-003-027**: **WHEN** `useRemoveStudent()` mutation이 실행되면 **THEN** 해당 `course_enrollments` 레코드를 삭제해야 한다.

**REQ-BE-003-028**: **IF** 현재 사용자가 해당 강좌의 강사가 아닌 경우 **THEN** 학생 제거는 RLS 정책에 의해 차단되어야 한다.

### 4.6 Material CRUD - Supabase 전환

**REQ-BE-003-029**: **WHEN** `useMaterials(courseId, params?)` 훅이 호출되면 **THEN** 해당 강좌의 페이지네이션된 학습자료 목록을 반환해야 한다.

쿼리 요구사항:
- 강사의 경우 draft/published 모두 반환, 학생의 경우 published만 반환 (RLS가 처리)
- `position` 기본 정렬
- search(title ILIKE), status, tags 필터링 지원
- 페이지네이션: range 기반 (Supabase .range() 메서드)

**REQ-BE-003-030**: **WHEN** `useMaterial(courseId, materialId)` 훅이 호출되면 **THEN** 전체 content를 포함한 단일 학습자료를 반환해야 한다.

**REQ-BE-003-031**: **WHEN** `useCreateMaterial()` mutation이 실행되면 **THEN** `materials` 테이블에 새 레코드를 삽입해야 한다.

**REQ-BE-003-032**: **WHEN** `useUpdateMaterial()` mutation이 실행되면 **THEN** 해당 material 레코드를 업데이트해야 한다.

**REQ-BE-003-033**: **WHEN** `useDeleteMaterial()` mutation이 실행되면 **THEN** 해당 material 레코드를 삭제해야 한다.

**REQ-BE-003-034**: **WHEN** `useToggleMaterialStatus()` mutation이 실행되면 **THEN** `status`를 `'draft'` ↔ `'published'` 간 토글해야 한다.

**REQ-BE-003-035**: **IF** 현재 사용자가 해당 강좌의 강사가 아닌 경우 **THEN** Material 생성/수정/삭제는 RLS 정책에 의해 차단되어야 한다.

### 4.7 Material 이미지 업로드 - Storage 전환

**REQ-BE-003-036**: **WHEN** `useUploadMaterialImage()` mutation이 실행되면 **THEN** Supabase Storage `material-images` 버킷에 파일을 업로드하고 public URL을 반환해야 한다.

**REQ-BE-003-037**: **WHEN** 강좌 커버 이미지가 업로드되면 **THEN** Supabase Storage `course-images` 버킷에 저장되고 `courses.cover_image_url`이 업데이트되어야 한다.

**REQ-BE-003-038**: **IF** 파일 크기가 5MB를 초과하면 **THEN** 업로드 전 클라이언트에서 검증하여 오류 메시지를 표시해야 한다.

**REQ-BE-003-039**: **IF** 허용되지 않은 MIME 타입의 파일을 업로드하면 **THEN** 시스템은 업로드를 거부해야 한다.

### 4.8 타입 정렬 및 매핑

**REQ-BE-003-040**: 시스템은 **항상** `packages/shared/src/types/course.types.ts`에서 정의된 타입이 DB 스키마와 일치하도록 유지해야 한다.

주요 정렬 항목:
- `CourseListItem.thumbnailUrl` → DB: `courses.cover_image_url` (매핑 레이어에서 처리)
- `Course.syllabus` 필드: DB에 없음, materials 리스트에서 구성하거나 제거 고려
- `CourseEnrollment.completedMaterialIds`: DB에 없음, 별도 처리 필요 또는 제거

**REQ-BE-003-041**: 시스템은 **항상** `packages/shared/src/types/material.types.ts`에서 정의된 타입이 DB 스키마와 일치하도록 유지해야 한다.

주요 정렬 항목:
- `Material.author` 필드: DB에 `author_id` 없음, `materials.course_id` → `courses.instructor_id` → `profiles` 경로로 JOIN
- `Material.authorId` 필드: materials 테이블에 author_id 없음, 강좌 instructor_id를 사용

**REQ-BE-003-042**: **IF** shared 타입과 DB 스키마 간 호환 불가능한 구조 차이가 존재하면 **THEN** 쿼리 레이어에서 변환을 수행하고 UI 컴포넌트는 최소한으로 수정해야 한다.

### 4.9 레거시 REST 클라이언트 제거

**REQ-BE-003-043**: **WHEN** Supabase 쿼리 레이어 구현이 완료되면 **THEN** `apps/web/lib/api/courses.ts` 파일을 삭제해야 한다.

**REQ-BE-003-044**: **WHEN** Supabase 쿼리 레이어 구현이 완료되면 **THEN** `apps/web/lib/api/materials.ts` 파일을 삭제해야 한다.

**REQ-BE-003-045**: **IF** `apps/web/lib/api/index.ts`가 courses, materials 이외 다른 REST 클라이언트를 내보내지 않으면 **THEN** 해당 파일도 정리해야 한다.

**REQ-BE-003-046**: **WHEN** REST 클라이언트 파일이 제거되면 **THEN** 이를 참조하던 모든 import가 Supabase 쿼리 레이어로 업데이트되어야 한다.

## 5. Specifications

### 5.1 신규 파일 구조

```
apps/web/
  lib/
    supabase/
      client.ts        (기존, 유지)
      server.ts        (기존, 유지)
      middleware.ts    (기존, 유지)
      courses.ts       (신규) ← Course 도메인 쿼리 함수
      materials.ts     (신규) ← Material 도메인 쿼리 함수
      storage.ts       (신규) ← Storage 업로드/삭제 유틸리티
  types/
    supabase.ts        (재생성) ← DB 스키마 정확 반영

supabase/
  migrations/
    00013_create_storage_buckets.sql  (신규) ← Storage 버킷 + RLS 정책

packages/shared/src/types/
  course.types.ts      (수정) ← DB 스키마와 정렬
  material.types.ts    (수정) ← DB 스키마와 정렬
```

### 5.2 수정 파일 목록

```
apps/web/hooks/
  useCourses.ts          (수정) ← REST API → Supabase
  useCourse.ts           (수정) ← REST API → Supabase
  useCreateCourse.ts     (수정) ← REST API → Supabase
  useUpdateCourse.ts     (수정) ← REST API → Supabase
  useDeleteCourse.ts     (수정) ← REST API → Supabase
  useArchiveCourse.ts    (수정) ← REST API → Supabase
  useEnrollCourse.ts     (수정) ← REST API → Supabase
  useEnrollWithCode.ts   (수정) ← REST API → Supabase
  useGenerateInviteCode.ts (수정) ← REST API → Supabase
  useCourseStudents.ts   (수정) ← REST API → Supabase
  useCourseProgress.ts   (수정) ← REST API → Supabase
  useRemoveStudent.ts    (수정) ← REST API → Supabase
  materials/
    useMaterials.ts      (수정) ← REST API → Supabase
    useMaterial.ts       (수정) ← REST API → Supabase
    useCreateMaterial.ts (수정) ← REST API → Supabase
    useUpdateMaterial.ts (수정) ← REST API → Supabase
    useDeleteMaterial.ts (수정) ← REST API → Supabase
    useToggleMaterialStatus.ts (수정) ← REST API → Supabase
    useUploadMaterialImage.ts  (수정) ← REST API → Storage
```

### 5.3 삭제 파일 목록

```
apps/web/lib/api/
  courses.ts    (삭제) ← Supabase 쿼리 레이어로 대체
  materials.ts  (삭제) ← Supabase 쿼리 레이어로 대체
```

### 5.4 Storage 버킷 마이그레이션 설계

`supabase/migrations/00013_create_storage_buckets.sql`:

```sql
-- course-images 버킷 (강좌 커버 이미지)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-images',
  'course-images',
  true,  -- public: 인증 없이 읽기 가능
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- material-images 버킷 (학습자료 인라인 이미지)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'material-images',
  'material-images',
  true,  -- public: 인증 없이 읽기 가능
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- RLS: course-images 쓰기는 강사(instructor 역할)만 가능
CREATE POLICY "Instructors can upload course images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-images' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'instructor'
);

-- RLS: material-images 쓰기는 강사만 가능
CREATE POLICY "Instructors can upload material images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'material-images' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'instructor'
);

-- RLS: 본인이 업로드한 파일만 삭제 가능
CREATE POLICY "Users can delete own storage objects"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid() = owner);
```

### 5.5 Supabase 쿼리 레이어 설계

#### 5.5.1 `lib/supabase/courses.ts` 인터페이스

```typescript
// Course 목록 조회 (JOIN + 집계 포함)
export async function getCourses(params?: CourseListParams): Promise<PaginatedCourseList>

// 단일 Course 조회
export async function getCourse(courseId: string): Promise<Course>

// Course 생성
export async function createCourse(payload: CreateCoursePayload): Promise<Course>

// Course 수정
export async function updateCourse(courseId: string, payload: UpdateCoursePayload): Promise<Course>

// Course 삭제
export async function deleteCourse(courseId: string): Promise<void>

// Course 아카이브 (status → 'archived')
export async function archiveCourse(courseId: string): Promise<void>

// 수강 등록
export async function enrollCourse(courseId: string): Promise<void>

// 초대 코드로 수강 등록
export async function enrollWithCode(code: string): Promise<{ courseId: string }>

// 초대 코드 생성
export async function generateInviteCode(courseId: string): Promise<InviteCodeResponse>

// 수강 학생 목록 (강사용)
export async function getCourseStudents(courseId: string): Promise<StudentProgress[]>

// 수강 진행률 (학생용)
export async function getCourseProgress(courseId: string): Promise<CourseEnrollment>

// 학생 제거
export async function removeStudent(courseId: string, studentId: string): Promise<void>
```

#### 5.5.2 `lib/supabase/materials.ts` 인터페이스

```typescript
// Material 목록 조회 (페이지네이션 + 필터)
export async function getMaterials(
  courseId: string,
  params?: MaterialsQueryParams
): Promise<PaginatedResponse<MaterialListItem>>

// 단일 Material 조회 (전체 content 포함)
export async function getMaterial(courseId: string, materialId: string): Promise<Material>

// Material 생성
export async function createMaterial(courseId: string, dto: CreateMaterialDto): Promise<Material>

// Material 수정
export async function updateMaterial(
  courseId: string,
  materialId: string,
  dto: UpdateMaterialDto
): Promise<Material>

// Material 삭제
export async function deleteMaterial(courseId: string, materialId: string): Promise<void>

// Material status 토글 (draft ↔ published)
export async function toggleMaterialStatus(courseId: string, materialId: string): Promise<Material>
```

#### 5.5.3 `lib/supabase/storage.ts` 인터페이스

```typescript
// 이미지 업로드 (버킷 이름, 파일 경로, 파일)
export async function uploadImage(
  bucket: 'course-images' | 'material-images',
  path: string,
  file: File
): Promise<{ url: string }>

// 이미지 삭제
export async function deleteImage(
  bucket: 'course-images' | 'material-images',
  path: string
): Promise<void>

// Public URL 생성
export function getPublicUrl(
  bucket: 'course-images' | 'material-images',
  path: string
): string
```

### 5.6 타입 정렬 전략

#### `packages/shared/src/types/course.types.ts` 수정 방향

```
CourseListItem 변경:
- thumbnailUrl?: string → 유지 (DB: cover_image_url, 쿼리 레이어에서 매핑)
- instructor: CourseInstructor → 유지 (profiles JOIN으로 구성)
- enrolledCount: number → 유지 (COUNT 집계)
- materialCount: number → 유지 (COUNT 집계)

Course 변경:
- syllabus: CourseSyllabusSection[] → 제거 또는 옵셔널로 변경
  (DB에 구현 없음, materials 리스트로 대체)
- inviteCode?: string → 유지 (courses.invite_code 매핑)

CourseEnrollment 변경:
- completedMaterialIds: string[] → 제거 (DB에 구현 없음)
- progressPercent: number → 유지 (course_enrollments.progress_percent 매핑)
```

#### `packages/shared/src/types/material.types.ts` 수정 방향

```
Material 변경:
- authorId: string → 유지 (courses.instructor_id 경로로 resolve)
- author: { id, name, avatarUrl } → 유지 (profiles JOIN으로 구성, 쿼리 레이어)
- qaCount: number → 옵셔널로 변경 (이 SPEC 범위 외, Q&A SPEC에서 처리)
```

### 5.7 초대 코드 생성 로직

```typescript
// 클라이언트 사이드에서 랜덤 코드 생성 후 DB 업데이트
function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// courses.invite_code를 새 코드로 업데이트
// UNIQUE 제약: 충돌 시 재생성
```

### 5.8 페이지네이션 패턴

Supabase `.range(from, to)` 기반:

```typescript
// 예시: page=2, limit=20 → from=20, to=39
const from = (page - 1) * limit;
const to = from + limit - 1;

const { data, count } = await supabase
  .from('courses')
  .select('*, profiles!instructor_id(*)', { count: 'exact' })
  .range(from, to);

return {
  data: data.map(mapCourseRow),
  total: count ?? 0,
  page,
  limit,
};
```

## 6. Risks and Mitigations

| 위험 | 심각도 | 완화 방안 |
|------|--------|-----------|
| supabase.ts 타입 불일치로 인한 TypeScript 컴파일 오류 | 높음 | `pnpm db:types`로 재생성 우선 실행, 또는 수동으로 실제 스키마 반영 |
| RLS 정책이 예상과 다르게 동작하여 데이터가 반환되지 않음 | 중간 | 로컬 Supabase에서 각 역할별 수동 테스트, `SECURITY DEFINER` 함수 활용 |
| courses JOIN 집계 쿼리 성능 저하 | 낮음 | SPEC-BE-001에서 이미 인덱스 생성 완료; 필요시 DB View 활용 |
| UI 컴포넌트가 변경된 타입에 의존하여 런타임 오류 발생 | 높음 | 기존 타입 인터페이스 유지 최대화, 쿼리 레이어에서 변환 |
| Storage 버킷 RLS 정책 누락으로 인한 무단 업로드 | 높음 | 마이그레이션에 명시적 RLS 정책 포함, 테스트에서 검증 |
| Material.author JOIN 경로 복잡 (materials → courses → profiles) | 중간 | 쿼리 레이어에서 다단계 JOIN 또는 별도 함수로 처리 |

## 7. Dependencies

### 외부 의존성 (이미 설치됨)

- `@supabase/supabase-js ^2.49.x` - Supabase 클라이언트
- `@supabase/ssr ^0.6.x` - SSR 헬퍼
- `@tanstack/react-query v5` - 상태 관리

### 내부 의존성

- `lib/supabase/client.ts` - 브라우저 클라이언트 (이미 존재)
- `lib/supabase/server.ts` - 서버 클라이언트 (이미 존재)
- `packages/shared` - 공유 타입 (수정 대상)

### 선행 조건

- `supabase start` 로컬 실행 중
- DB 마이그레이션 00001~00012 적용 완료
- Supabase Auth 세션 관리 정상 동작

## 8. Traceability

| 요구사항 ID | 설명 | plan.md 매핑 | acceptance.md 매핑 |
|------------|------|-------------|-------------------|
| REQ-BE-003-001~003 | TypeScript 타입 재생성 | Phase A | AC-001 |
| REQ-BE-003-004~008 | Storage 버킷 설정 | Phase B | AC-002 |
| REQ-BE-003-009~012 | 쿼리 레이어 신규 생성 | Phase C | AC-003 |
| REQ-BE-003-013~019 | Course CRUD 전환 | Phase D | AC-004 |
| REQ-BE-003-020~028 | Course 수강 관리 전환 | Phase D | AC-004 |
| REQ-BE-003-029~035 | Material CRUD 전환 | Phase E | AC-005 |
| REQ-BE-003-036~039 | Storage 이미지 업로드 전환 | Phase E | AC-005 |
| REQ-BE-003-040~042 | 타입 정렬 및 매핑 | Phase A, C | AC-001, AC-003 |
| REQ-BE-003-043~046 | 레거시 REST 제거 | Phase F | AC-006 |

## 9. Implementation Notes (Post-Completion)

### 완료일: 2026-02-21

### 구현 요약

SPEC-BE-003의 모든 Primary Goal이 성공적으로 구현되었다.

**Phase A - TypeScript 타입 재생성**: `apps/web/types/supabase.ts`를 실제 DB 스키마에 맞게 업데이트. courses 테이블에 `category`, `status`, `visibility`, `invite_code` 컬럼 반영, materials 테이블 전체 타입 추가.

**Phase B - Storage 버킷**: `supabase/migrations/00013_create_storage_buckets.sql` 작성. `course-images`, `material-images` 버킷 + RLS 정책 포함. `apps/web/lib/supabase/storage.ts` 유틸리티 구현 (uploadImage, deleteImage, getPublicUrl + 클라이언트 사이드 크기/MIME 검증).

**Phase C - Supabase 쿼리 레이어**: `apps/web/lib/supabase/courses.ts` (12개 함수), `apps/web/lib/supabase/materials.ts` (6개 함수) 신규 생성. snake_case → camelCase 매핑 레이어 포함.

**Phase D - Course Hooks 전환**: 12개 hooks 모두 REST API → Supabase 직접 쿼리로 전환 완료. TanStack Query 캐시 키 호환성 유지.

**Phase E - Material Hooks 전환**: 7개 hooks 모두 전환 완료. `useUploadMaterialImage`는 Supabase Storage 직접 사용으로 전환.

**Phase F - 레거시 REST 제거**: `apps/web/lib/api/materials.ts` 삭제. `courses.ts` REST 파일은 원래 별도 파일로 존재하지 않았음 (api/index.ts에 인라인). `api/index.ts`는 quiz 등 타 도메인 API가 남아있어 유지.

**Phase G - 테스트**: 1,577개 → 1,699개 테스트 (+122개). Supabase 쿼리 레이어 단위 테스트 추가 (courses 57개, materials 40개, storage 25개).

### 품질 검증 결과

| 지표 | 결과 |
|------|------|
| 테스트 통과 | 1,699/1,699 (100%) |
| TypeScript 컴파일 오류 | 0개 |
| ESLint 경고/오류 | 0개 |
| REST API 참조 잔여 | 0개 (Course/Material 도메인) |

### 범위 변경 사항

- `apps/web/app/(dashboard)/courses/[courseId]/materials/[materialId]/edit/page.tsx` UI 조정 (계획 외, 타입 호환을 위한 수정)
- `.env.example`에서 NextAuth 환경변수 제거 (SPEC-AUTH-001 잔여 정리, SPEC-BE-003 범위 외)

### 후속 SPEC 영향

이 SPEC에서 수립된 패턴 (Supabase 쿼리 레이어, snake_case 매핑, TanStack Query 통합)은 다음 SPEC에서 재사용:
- SPEC-BE-004: Q&A hooks 전환
- SPEC-BE-005: Quiz hooks 전환
- SPEC-BE-006: Team/Memo hooks 전환
