---
spec_id: SPEC-BE-003
version: "1.0.0"
created: "2026-02-20"
updated: "2026-02-20"
---

# SPEC-BE-003 Implementation Plan: Course + Material Supabase Backend Integration

## Development Methodology

**Hybrid Mode**:
- 기존 hooks 전환 (DDD): ANALYZE-PRESERVE-IMPROVE 사이클 적용
- 신규 파일 (TDD): 쿼리 함수 먼저 테스트 작성 후 구현

**품질 목표**: 85%+ 테스트 커버리지 (현재: courses 80%, materials 0%)

---

## Phase Overview

| Phase | 내용 | 우선순위 |
|-------|------|---------|
| A | TypeScript 타입 재생성 | Primary Goal |
| B | Storage 버킷 마이그레이션 | Primary Goal |
| C | Supabase 쿼리 레이어 신규 생성 | Primary Goal |
| D | Course hooks 전환 (12개) | Primary Goal |
| E | Material hooks 전환 (7개) | Primary Goal |
| F | 레거시 REST 클라이언트 제거 | Secondary Goal |
| G | 테스트 커버리지 달성 | Secondary Goal |

---

## Phase A: TypeScript 타입 재생성 (Primary Goal)

**목표**: `apps/web/types/supabase.ts`가 실제 DB 스키마를 정확히 반영

### 작업 목록

1. **로컬 Supabase 실행 확인**
   - `pnpm db:start` 실행 및 정상 동작 확인
   - `supabase status`로 로컬 DB 연결 상태 확인

2. **타입 재생성 시도**
   - `pnpm db:types` 실행
   - 결과물 검토: courses 테이블에 category, status, visibility, invite_code 포함 여부 확인
   - 실패 시: 수동으로 실제 마이그레이션 SQL 기반으로 작성

3. **수동 타입 업데이트 (재생성 불가 시)**
   - courses Row: `category`, `status`, `visibility`, `invite_code` 컬럼 추가, `is_active` 제거
   - materials Row: 전체 테이블 타입 추가 (title, content, excerpt, status, position, tags, read_time_minutes, version)
   - course_enrollments Row: `status`, `progress_percent` 컬럼 확인 및 추가
   - 15개 테이블 모두 00001~00012 마이그레이션과 대조

4. **TypeScript 컴파일 확인**
   - `pnpm --filter web tsc --noEmit`
   - 타입 오류 목록 파악 및 우선순위 분류

**요구사항 매핑**: REQ-BE-003-001~003, REQ-BE-003-040~042

---

## Phase B: Storage 버킷 마이그레이션 (Primary Goal)

**목표**: 이미지 업로드를 위한 Supabase Storage 버킷 구성

### 작업 목록

1. **마이그레이션 파일 작성**
   - `supabase/migrations/00013_create_storage_buckets.sql` 생성
   - `course-images` 버킷 생성 (public, 5MB, image/* MIME)
   - `material-images` 버킷 생성 (public, 5MB, image/* MIME)
   - Storage RLS 정책 3개 추가:
     - 강사만 course-images에 쓰기 가능
     - 강사만 material-images에 쓰기 가능
     - 본인이 업로드한 객체만 삭제 가능

2. **마이그레이션 적용**
   - `pnpm db:reset` 또는 `supabase migration up` 실행
   - Supabase Dashboard(로컬)에서 버킷 생성 확인

3. **Storage 유틸리티 작성** (`apps/web/lib/supabase/storage.ts`)
   - `uploadImage(bucket, path, file)`: Supabase Storage에 업로드 후 public URL 반환
   - `deleteImage(bucket, path)`: Storage에서 파일 삭제
   - `getPublicUrl(bucket, path)`: public URL 조회
   - 파일 크기 검증 (5MB 초과 시 클라이언트 오류)
   - MIME 타입 검증 함수

**요구사항 매핑**: REQ-BE-003-004~008, REQ-BE-003-036~039

---

## Phase C: Supabase 쿼리 레이어 신규 생성 (Primary Goal)

**목표**: hooks가 사용할 Supabase 쿼리 함수 모듈 작성 (TDD 방식)

### 작업 목록

#### C-1: `apps/web/lib/supabase/courses.ts` 작성

작성 순서 (TDD):
1. `getCourses(params?)` 테스트 먼저 작성 → 구현
   - courses + profiles(instructor) JOIN
   - course_enrollments COUNT 집계 (enrolledCount)
   - materials COUNT 집계 (materialCount)
   - 페이지네이션: .range() 기반
   - 필터: status, category, search(ILIKE)
   - DB Row → CourseListItem 매핑 함수

2. `getCourse(courseId)` 테스트 → 구현
   - 단일 강좌 + instructor JOIN

3. `createCourse(payload)` 테스트 → 구현
   - auth.uid()를 instructor_id로
   - thumbnailUrl → cover_image_url 매핑

4. `updateCourse(courseId, payload)` 테스트 → 구현

5. `deleteCourse(courseId)` 테스트 → 구현

6. `archiveCourse(courseId)` 테스트 → 구현
   - status를 'archived'로 업데이트

7. `enrollCourse(courseId)` 테스트 → 구현
   - course_enrollments INSERT
   - 중복 에러 처리

8. `enrollWithCode(code)` 테스트 → 구현
   - courses WHERE invite_code = code
   - course_enrollments INSERT

9. `generateInviteCode(courseId)` 테스트 → 구현
   - 랜덤 8자리 코드 생성
   - courses UPDATE invite_code

10. `getCourseStudents(courseId)` 테스트 → 구현
    - course_enrollments + profiles JOIN
    - StudentProgress 형태로 매핑

11. `getCourseProgress(courseId)` 테스트 → 구현
    - course_enrollments WHERE student_id = auth.uid()

12. `removeStudent(courseId, studentId)` 테스트 → 구현
    - course_enrollments DELETE

#### C-2: `apps/web/lib/supabase/materials.ts` 작성

작성 순서 (TDD):
1. `getMaterials(courseId, params?)` 테스트 → 구현
   - materials + courses JOIN → profiles (author 정보)
   - 필터: status, tags(@>, GIN 인덱스), title ILIKE
   - 정렬: position(기본), title, createdAt
   - 페이지네이션: .range()
   - DB Row → MaterialListItem 매핑

2. `getMaterial(courseId, materialId)` 테스트 → 구현
   - 전체 content 포함

3. `createMaterial(courseId, dto)` 테스트 → 구현

4. `updateMaterial(courseId, materialId, dto)` 테스트 → 구현

5. `deleteMaterial(courseId, materialId)` 테스트 → 구현

6. `toggleMaterialStatus(courseId, materialId)` 테스트 → 구현
   - 현재 status 조회 → 반전하여 업데이트

**요구사항 매핑**: REQ-BE-003-009~012

---

## Phase D: Course Hooks 전환 (Primary Goal)

**목표**: 12개 Course hooks를 REST API → Supabase 쿼리 레이어로 전환

**DDD 접근법** (기존 코드이므로):
- ANALYZE: 각 hook의 현재 동작과 TanStack Query 키 확인
- PRESERVE: query key 형식 유지, 반환 타입 인터페이스 유지
- IMPROVE: `api.get/post/patch/delete` → `lib/supabase/courses.ts` 함수 호출

### 전환 대상 (12개)

| 파일 | 현재 | 변경 후 |
|------|------|---------|
| `useCourses.ts` | `api.get('/api/v1/courses')` | `getCourses(params)` |
| `useCourse.ts` | `api.get('/api/v1/courses/:id')` | `getCourse(courseId)` |
| `useCreateCourse.ts` | `api.post('/api/v1/courses')` | `createCourse(payload)` |
| `useUpdateCourse.ts` | `api.patch('/api/v1/courses/:id')` | `updateCourse(id, payload)` |
| `useDeleteCourse.ts` | `api.delete('/api/v1/courses/:id')` | `deleteCourse(courseId)` |
| `useArchiveCourse.ts` | `api.post('/api/v1/courses/:id/archive')` | `archiveCourse(courseId)` |
| `useEnrollCourse.ts` | `api.post('/api/v1/courses/:id/enroll')` | `enrollCourse(courseId)` |
| `useEnrollWithCode.ts` | `api.post('/api/v1/courses/enroll-with-code')` | `enrollWithCode(code)` |
| `useGenerateInviteCode.ts` | `api.post('/api/v1/courses/:id/invite-code')` | `generateInviteCode(courseId)` |
| `useCourseStudents.ts` | `api.get('/api/v1/courses/:id/students')` | `getCourseStudents(courseId)` |
| `useCourseProgress.ts` | `api.get('/api/v1/courses/:id/progress')` | `getCourseProgress(courseId)` |
| `useRemoveStudent.ts` | `api.delete('/api/v1/courses/:id/students/:studentId')` | `removeStudent(courseId, studentId)` |

**요구사항 매핑**: REQ-BE-003-013~028

---

## Phase E: Material Hooks 전환 (Primary Goal)

**목표**: 7개 Material hooks를 REST API → Supabase 쿼리 레이어로 전환

| 파일 | 현재 | 변경 후 |
|------|------|---------|
| `materials/useMaterials.ts` | `getMaterials()` from `lib/api/materials` | `getMaterials()` from `lib/supabase/materials` |
| `materials/useMaterial.ts` | `getMaterial()` from `lib/api/materials` | `getMaterial()` from `lib/supabase/materials` |
| `materials/useCreateMaterial.ts` | `createMaterial()` from `lib/api/materials` | `createMaterial()` from `lib/supabase/materials` |
| `materials/useUpdateMaterial.ts` | `updateMaterial()` from `lib/api/materials` | `updateMaterial()` from `lib/supabase/materials` |
| `materials/useDeleteMaterial.ts` | `deleteMaterial()` from `lib/api/materials` | `deleteMaterial()` from `lib/supabase/materials` |
| `materials/useToggleMaterialStatus.ts` | `toggleMaterialStatus()` from `lib/api/materials` | `toggleMaterialStatus()` from `lib/supabase/materials` |
| `materials/useUploadMaterialImage.ts` | `uploadMaterialImage()` from `lib/api/materials` | `uploadImage()` from `lib/supabase/storage` |

**요구사항 매핑**: REQ-BE-003-029~039

---

## Phase F: 레거시 REST 클라이언트 제거 (Secondary Goal)

**목표**: 더 이상 사용하지 않는 REST API 클라이언트 파일 제거

### 작업 목록

1. **`apps/web/lib/api/courses.ts` 삭제 검증**
   - 이 파일을 import하는 곳이 없는지 grep 확인
   - 파일 삭제

2. **`apps/web/lib/api/materials.ts` 삭제 검증**
   - 이 파일을 import하는 곳이 없는지 grep 확인
   - 파일 삭제

3. **`apps/web/lib/api/index.ts` 검토**
   - courses, materials 이외 다른 export가 있는지 확인
   - quiz.api.ts 등 다른 API 파일 확인
   - 안전한 경우에만 정리

4. **TypeScript 컴파일 재확인**
   - `pnpm --filter web tsc --noEmit`
   - ESLint: `pnpm --filter web lint`

**요구사항 매핑**: REQ-BE-003-043~046

---

## Phase G: 테스트 커버리지 달성 (Secondary Goal)

**목표**: Material hooks 0% → 85%+, 전체 API 레이어 85%+

### 테스트 전략

**신규 쿼리 레이어** (TDD - Phase C에서 먼저 작성):
- `lib/supabase/courses.ts`: 각 함수별 vitest 단위 테스트
  - Mock: Supabase client mock (vitest.mock)
  - 정상 케이스 + 에러 케이스
- `lib/supabase/materials.ts`: 동일 패턴
- `lib/supabase/storage.ts`: 파일 크기/타입 검증 테스트

**기존 hooks** (DDD - 전환 후 검증):
- 기존 course hooks: 현재 80% 커버리지 유지
- material hooks: 신규 테스트 작성 (특히 useCreateMaterial, useUpdateMaterial)

**통합 테스트** (Optional):
- 로컬 Supabase에서 실제 DB 연동 테스트 (e2e 범위)

### 커버리지 목표

| 모듈 | 현재 | 목표 |
|------|------|------|
| `lib/supabase/courses.ts` | - (신규) | 85%+ |
| `lib/supabase/materials.ts` | - (신규) | 85%+ |
| `lib/supabase/storage.ts` | - (신규) | 85%+ |
| `hooks/materials/**` | 0% | 85%+ |
| `hooks/courses/**` | 80% | 85%+ |

---

## Technical Approach

### Supabase 쿼리 패턴

**집계 포함 SELECT (courses 목록)**:
```typescript
// instructor JOIN + COUNT 집계
const { data, count } = await supabase
  .from('courses')
  .select(
    `
    *,
    instructor:profiles!instructor_id(id, display_name, avatar_url),
    enrolledCount:course_enrollments(count),
    materialCount:materials(count)
    `,
    { count: 'exact' }
  )
  .range(from, to);
```

**INSERT 후 SELECT**:
```typescript
const { data, error } = await supabase
  .from('courses')
  .insert({ ...payload, instructor_id: userId })
  .select('*, instructor:profiles!instructor_id(*)')
  .single();
```

**snake_case → camelCase 매핑**:
```typescript
function mapCourseRow(row: CourseRow): CourseListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    category: row.category as CourseCategory,
    status: row.status as CourseStatus,
    visibility: row.visibility as CourseVisibility,
    thumbnailUrl: row.cover_image_url ?? undefined,  // 핵심 매핑
    instructor: {
      id: row.instructor.id,
      name: row.instructor.display_name,  // display_name → name
      avatarUrl: row.instructor.avatar_url ?? undefined,
    },
    enrolledCount: row.enrolledCount[0]?.count ?? 0,
    materialCount: row.materialCount[0]?.count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
```

### 에러 처리 패턴

```typescript
const { data, error } = await supabase.from('courses').select('*');
if (error) {
  // Supabase 에러를 일반 Error로 변환
  throw new Error(error.message);
}
return data;
```

### TanStack Query 키 전략

기존 키 패턴 유지 (UI 컴포넌트 변경 최소화):
- 강좌 목록: `['courses', params]`
- 단일 강좌: `['course', courseId]`
- 수강 학생: `['course', courseId, 'students']`
- 수강 진행률: `['course', courseId, 'progress']`
- 학습자료 목록: `materialKeys.list(courseId, params)` (기존 유지)
- 단일 학습자료: `materialKeys.detail(courseId, materialId)` (기존 유지)

---

## Priority Order

### Primary Goal (필수 - run phase 완료 조건)

1. Phase A: 타입 재생성 (모든 것의 기반)
2. Phase B: Storage 버킷 설정 (이미지 업로드 필요)
3. Phase C: 쿼리 레이어 신규 생성 (hooks가 의존)
4. Phase D: Course hooks 12개 전환
5. Phase E: Material hooks 7개 전환

### Secondary Goal (품질 향상)

6. Phase F: 레거시 REST 제거
7. Phase G: 테스트 커버리지 달성

### Optional Goal (시간 여유 있을 때)

- Storage 이미지 삭제 시 기존 파일 cleanup 로직
- 강좌 커버 이미지 업로드 UI와 Storage 연동 (현재 thumbnailUrl 필드에 URL 직접 입력)
- 초대 코드 만료 기능 (현재 만료 없음)

---

## Implementation Notes

### 주의사항

1. **RLS 정책 신뢰**: 별도 권한 체크 불필요, Supabase RLS가 처리
2. **타입 안전성**: Supabase 클라이언트에 `Database` 제네릭 타입 전달 필수
3. **서버 vs 클라이언트**: hooks는 클라이언트 컴포넌트에서 실행되므로 `createClient()`(browser) 사용
4. **실시간 구독 제외**: 이 SPEC에서는 Realtime 구독 없음 (BE-004~006 범위)

### 파일 수정 순서 (의존성 기반)

```
supabase.ts (타입 재생성)
  ↓
00013_create_storage_buckets.sql (Storage 버킷)
  ↓
lib/supabase/storage.ts (Storage 유틸리티)
  ↓
lib/supabase/courses.ts (Course 쿼리 함수)
lib/supabase/materials.ts (Material 쿼리 함수)
  ↓
hooks/ (각 hook 파일 전환)
  ↓
lib/api/courses.ts, materials.ts (삭제)
```

### 테스트 실행 명령어

```bash
# 전체 테스트
pnpm test

# 특정 모듈 테스트
pnpm --filter web test lib/supabase/courses
pnpm --filter web test hooks/materials

# 커버리지 확인
pnpm --filter web test --coverage

# 타입 체크
pnpm --filter web tsc --noEmit

# ESLint
pnpm --filter web lint
```
