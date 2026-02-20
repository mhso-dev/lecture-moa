---
spec_id: SPEC-BE-003
version: "1.0.0"
created: "2026-02-20"
updated: "2026-02-20"
---

# SPEC-BE-003 Acceptance Criteria: Course + Material Supabase Backend Integration

## Quality Gates

- 테스트 통과: 기존 1,577개 + 신규 테스트 모두 pass
- 커버리지: `lib/supabase/courses.ts`, `lib/supabase/materials.ts`, `lib/supabase/storage.ts` 각 85%+
- Material hooks 전체 85%+
- TypeScript: 컴파일 오류 0개 (기존 pre-existing 오류는 허용)
- ESLint: 새로운 경고 0개
- REST API 호출 코드 완전 제거: `lib/api/courses.ts`, `lib/api/materials.ts` 삭제 확인

---

## AC-001: TypeScript 타입 재생성

**연관 요구사항**: REQ-BE-003-001~003, REQ-BE-003-040~042

### Scenario 1: courses 테이블 타입 정확성

**Given** `apps/web/types/supabase.ts` 파일이 존재하고
**When** `Database['public']['Tables']['courses']['Row']` 타입을 확인하면
**Then** 다음 컬럼이 모두 포함되어야 한다:
- `id: string`
- `instructor_id: string`
- `title: string`
- `description: string | null`
- `cover_image_url: string | null`
- `category: string | null`
- `status: string`
- `visibility: string`
- `invite_code: string | null`
- `created_at: string`
- `updated_at: string`
- `is_active` 컬럼은 존재하지 않아야 한다

### Scenario 2: materials 테이블 타입 정확성

**Given** `apps/web/types/supabase.ts` 파일이 존재하고
**When** `Database['public']['Tables']['materials']['Row']` 타입을 확인하면
**Then** 다음 컬럼이 모두 포함되어야 한다:
- `id: string`
- `course_id: string`
- `title: string`
- `content: string`
- `excerpt: string | null`
- `status: string`
- `position: number`
- `tags: string[]`
- `read_time_minutes: number | null`
- `version: number | null`
- `created_at: string`
- `updated_at: string`

### Scenario 3: course_enrollments 타입 정확성

**Given** `apps/web/types/supabase.ts` 파일이 존재하고
**When** `Database['public']['Tables']['course_enrollments']['Row']` 타입을 확인하면
**Then** 다음 컬럼이 포함되어야 한다:
- `status: string`
- `progress_percent: number`

### Scenario 4: TypeScript 컴파일 성공

**Given** `apps/web/types/supabase.ts`가 올바른 타입을 포함하고
**When** `pnpm --filter web tsc --noEmit` 명령을 실행하면
**Then** SPEC-BE-003에서 추가된 코드로 인한 새로운 타입 오류가 없어야 한다

### Scenario 5: course.types.ts 정렬

**Given** `packages/shared/src/types/course.types.ts`가 수정되고
**When** Supabase 쿼리 레이어에서 DB Row를 `CourseListItem`으로 매핑하면
**Then** 컴파일 오류 없이 타입 호환이 이루어져야 한다
**And** `thumbnailUrl`은 옵셔널 string 타입이어야 한다

### Scenario 6: material.types.ts 정렬

**Given** `packages/shared/src/types/material.types.ts`가 수정되고
**When** Supabase 쿼리 레이어에서 DB Row를 `Material`로 매핑하면
**Then** `author` 필드가 정상적으로 구성되어야 한다

---

## AC-002: Supabase Storage 버킷 설정

**연관 요구사항**: REQ-BE-003-004~008

### Scenario 1: course-images 버킷 생성

**Given** `00013_create_storage_buckets.sql` 마이그레이션이 적용되고
**When** Supabase Storage 버킷 목록을 조회하면
**Then** `course-images` 버킷이 존재해야 한다
**And** 해당 버킷은 public 접근이 가능해야 한다
**And** 파일 크기 제한은 5MB여야 한다
**And** 허용 MIME 타입은 `['image/jpeg', 'image/png', 'image/webp', 'image/gif']`여야 한다

### Scenario 2: material-images 버킷 생성

**Given** 마이그레이션이 적용되고
**When** Supabase Storage 버킷 목록을 조회하면
**Then** `material-images` 버킷이 존재해야 한다
**And** 동일한 public/size/MIME 설정이어야 한다

### Scenario 3: 강사 이미지 업로드 허용

**Given** instructor 역할의 인증된 사용자가 존재하고
**When** `course-images` 버킷에 파일을 업로드하면
**Then** 업로드가 성공해야 한다
**And** public URL이 반환되어야 한다

### Scenario 4: 학생 이미지 업로드 차단

**Given** student 역할의 인증된 사용자가 존재하고
**When** `course-images` 또는 `material-images` 버킷에 파일을 업로드 시도하면
**Then** Storage RLS 정책에 의해 403 오류가 반환되어야 한다

### Scenario 5: 비인증 사용자 업로드 차단

**Given** 인증되지 않은 사용자가 존재하고
**When** Storage 버킷에 파일을 업로드 시도하면
**Then** 401 또는 403 오류가 반환되어야 한다

### Scenario 6: 공개 이미지 URL 접근

**Given** `course-images` 버킷에 이미지가 업로드되고
**When** 인증 없이 해당 이미지의 public URL에 접근하면
**Then** 이미지가 정상 반환되어야 한다

### Scenario 7: 클라이언트 파일 크기 검증

**Given** `lib/supabase/storage.ts`의 `uploadImage` 함수를 사용하고
**When** 5MB를 초과하는 파일을 업로드하면
**Then** 서버 요청 전에 클라이언트에서 Error가 throw되어야 한다
**And** 오류 메시지에 파일 크기 제한 정보가 포함되어야 한다

### Scenario 8: 허용되지 않은 MIME 타입 검증

**Given** `lib/supabase/storage.ts`의 `uploadImage` 함수를 사용하고
**When** `image/svg+xml` 또는 `application/pdf` 파일을 업로드하면
**Then** Error가 throw되어야 한다

---

## AC-003: Supabase 쿼리 레이어

**연관 요구사항**: REQ-BE-003-009~012

### Scenario 1: courses.ts 파일 존재

**Given** Phase C 구현이 완료되고
**When** `apps/web/lib/supabase/` 디렉토리를 확인하면
**Then** `courses.ts`, `materials.ts`, `storage.ts` 파일이 모두 존재해야 한다

### Scenario 2: getCourses 기본 동작

**Given** Supabase 클라이언트가 mock되고 courses 데이터가 준비되었을 때
**When** `getCourses()` 함수를 호출하면
**Then** `{ data: CourseListItem[], total: number, page: number, limit: number }` 형태가 반환되어야 한다
**And** 각 항목은 `thumbnailUrl` 필드가 DB의 `cover_image_url`에서 매핑되어야 한다
**And** `instructor.name`이 DB의 `profiles.display_name`에서 매핑되어야 한다

### Scenario 3: getCourses 필터링

**Given** `{ status: 'published', category: 'programming' }` 파라미터로 호출할 때
**When** `getCourses(params)` 함수가 실행되면
**Then** Supabase 쿼리에 해당 필터 조건이 포함되어야 한다

### Scenario 4: getCourses 페이지네이션

**Given** `{ page: 2, limit: 10 }` 파라미터로 호출할 때
**When** `getCourses(params)` 함수가 실행되면
**Then** `.range(10, 19)` 쿼리가 실행되어야 한다

### Scenario 5: createCourse 사용자 ID 바인딩

**Given** 인증된 사용자 ID가 `user123`이고
**When** `createCourse({ title: '강좌명', ... })` 함수를 호출하면
**Then** 삽입되는 레코드의 `instructor_id`가 `user123`이어야 한다

### Scenario 6: getMaterials author 매핑

**Given** materials 레코드와 관련 profiles 데이터가 존재하고
**When** `getMaterials(courseId)` 함수를 호출하면
**Then** 반환되는 각 항목의 `author.name`이 `profiles.display_name`에서 채워져야 한다

### Scenario 7: toggleMaterialStatus 토글 로직

**Given** materialId가 현재 `status: 'draft'`인 material이고
**When** `toggleMaterialStatus(courseId, materialId)` 함수를 호출하면
**Then** `status`가 `'published'`로 업데이트되어야 한다
**And** 업데이트된 material이 반환되어야 한다

### Scenario 8: Supabase 에러 전파

**Given** Supabase 클라이언트가 오류를 반환하도록 mock되고
**When** 쿼리 레이어 함수가 호출되면
**Then** `Error` 객체가 throw되어야 한다
**And** 오류 메시지가 포함되어야 한다

### Scenario 9: 쿼리 레이어 테스트 커버리지

**Given** 구현이 완료되고
**When** `pnpm --filter web test --coverage lib/supabase/` 커버리지를 측정하면
**Then** `courses.ts`, `materials.ts`, `storage.ts` 각각 85% 이상이어야 한다

---

## AC-004: Course Hooks 전환

**연관 요구사항**: REQ-BE-003-013~028

### Scenario 1: useCourses Supabase 사용

**Given** `useCourses()` 훅이 수정되고
**When** 컴포넌트에서 `useCourses({ status: 'published' })`를 호출하면
**Then** REST API(`/api/v1/courses`) 대신 `getCourses()` Supabase 쿼리가 실행되어야 한다
**And** 반환 타입이 `PaginatedCourseList`와 호환되어야 한다

### Scenario 2: useCreateCourse Supabase 사용

**Given** `useCreateCourse()` 훅이 수정되고
**When** `mutate({ title: '새 강좌', category: 'programming', visibility: 'public', description: '설명' })`을 실행하면
**Then** `createCourse(payload)` Supabase 함수가 호출되어야 한다
**And** 성공 시 `courses` 쿼리 캐시가 무효화되어야 한다

### Scenario 3: useEnrollCourse 중복 등록 처리

**Given** 이미 수강 중인 강좌에 `useEnrollCourse()` mutation을 실행하면
**When** Supabase UNIQUE 제약 오류가 발생하면
**Then** 사용자에게 적절한 오류 메시지가 표시되어야 한다 (예: "이미 수강 중인 강좌입니다")

### Scenario 4: useEnrollWithCode 유효하지 않은 코드

**Given** `useEnrollWithCode()` mutation이 수정되고
**When** 존재하지 않는 초대 코드 `'INVALID1'`로 enrollWithCode를 호출하면
**Then** 적절한 오류(`유효하지 않은 초대 코드입니다`)가 발생해야 한다

### Scenario 5: useGenerateInviteCode 코드 생성

**Given** `useGenerateInviteCode()` mutation이 수정되고
**When** `mutate({ courseId: 'course123' })`을 실행하면
**Then** Supabase에서 `courses.invite_code`가 새 코드로 업데이트되어야 한다
**And** 반환값에 `code: string` 필드가 포함되어야 한다

### Scenario 6: useArchiveCourse status 업데이트

**Given** `useArchiveCourse()` mutation이 수정되고
**When** `mutate({ courseId: 'course123' })`을 실행하면
**Then** DB에서 해당 강좌의 `status`가 `'archived'`로 업데이트되어야 한다

### Scenario 7: useCourseStudents 데이터 형태

**Given** `useCourseStudents('course123')` 훅이 호출되면
**When** Supabase에서 데이터가 반환되면
**Then** 배열 요소가 `StudentProgress` 타입과 호환되어야 한다
**And** 각 요소에 `progressPercent` 필드가 포함되어야 한다

### Scenario 8: 기존 Query Key 호환성

**Given** hooks가 Supabase로 전환된 후
**When** 기존 컴포넌트가 동일한 query key로 캐시를 invalidate하면
**Then** 정상적으로 캐시 무효화가 작동해야 한다
**And** UI 컴포넌트 코드를 변경하지 않아도 된다

---

## AC-005: Material Hooks 전환

**연관 요구사항**: REQ-BE-003-029~039

### Scenario 1: useMaterials Supabase 사용

**Given** `useMaterials(courseId)` 훅이 수정되고
**When** 컴포넌트에서 호출되면
**Then** REST API(`/api/courses/:id/materials`) 대신 `getMaterials()` Supabase 쿼리가 실행되어야 한다

### Scenario 2: useMaterials 필터링 동작

**Given** `useMaterials(courseId, { status: 'published', search: '입문' })` 파라미터로 호출될 때
**When** Supabase 쿼리가 실행되면
**Then** `status = 'published'` AND `title ILIKE '%입문%'` 조건이 적용되어야 한다

### Scenario 3: useMaterials 페이지네이션

**Given** `useMaterials(courseId, { page: 1, limit: 20 })` 파라미터로 호출될 때
**When** Supabase 쿼리가 실행되면
**Then** `.range(0, 19)` 쿼리가 실행되어야 한다
**And** 반환값이 `{ data: MaterialListItem[], meta: { total, page, totalPages } }` 형태여야 한다

### Scenario 4: useMaterial 전체 content 반환

**Given** `useMaterial(courseId, materialId)` 훅이 호출될 때
**When** Supabase에서 데이터가 반환되면
**Then** `content` 필드(Markdown 전문)가 포함되어야 한다

### Scenario 5: useCreateMaterial 정상 동작

**Given** `useCreateMaterial(courseId)` mutation이 수정되고
**When** `mutate({ title: '새 자료', content: '# 내용', status: 'draft' })`을 실행하면
**Then** Supabase `materials` 테이블에 레코드가 삽입되어야 한다
**And** 성공 시 materials 목록 캐시가 무효화되어야 한다

### Scenario 6: useToggleMaterialStatus 토글

**Given** `draft` 상태의 material이 있고
**When** `useToggleMaterialStatus(courseId)` mutation으로 해당 material을 토글하면
**Then** DB에서 `status`가 `'published'`로 변경되어야 한다

### Scenario 7: useUploadMaterialImage Storage 사용

**Given** `useUploadMaterialImage(courseId)` mutation이 수정되고
**When** `mutate(imageFile)`을 실행하면
**Then** Supabase Storage `material-images` 버킷에 파일이 업로드되어야 한다
**And** 반환값에 `url: string`이 포함되어야 한다
**And** 반환된 URL이 공개적으로 접근 가능한 형태여야 한다

### Scenario 8: useUploadMaterialImage 5MB 초과 거부

**Given** `useUploadMaterialImage(courseId)` mutation이 실행되고
**When** 6MB 파일을 mutate하면
**Then** mutation이 Error 상태가 되어야 한다
**And** 오류 메시지에 파일 크기 제한 내용이 포함되어야 한다

### Scenario 9: Material Hooks 테스트 커버리지

**Given** Material hooks가 구현되고 테스트가 작성된 후
**When** `pnpm --filter web test --coverage hooks/materials/` 커버리지를 측정하면
**Then** 85% 이상이어야 한다

---

## AC-006: 레거시 REST 클라이언트 제거

**연관 요구사항**: REQ-BE-003-043~046

### Scenario 1: courses.ts REST 파일 삭제

**Given** 모든 Course hooks가 Supabase로 전환된 후
**When** `apps/web/lib/api/courses.ts` 파일을 확인하면
**Then** 해당 파일이 존재하지 않아야 한다 (삭제되어야 한다)

### Scenario 2: materials.ts REST 파일 삭제

**Given** 모든 Material hooks가 Supabase로 전환된 후
**When** `apps/web/lib/api/materials.ts` 파일을 확인하면
**Then** 해당 파일이 존재하지 않아야 한다

### Scenario 3: 삭제 후 import 오류 없음

**Given** `lib/api/courses.ts`와 `lib/api/materials.ts`가 삭제된 후
**When** `pnpm --filter web tsc --noEmit`을 실행하면
**Then** 삭제된 파일을 참조하는 import 오류가 없어야 한다

### Scenario 4: /api/v1 REST 호출 제거

**Given** 코드베이스 전체를 grep하면
**When** `api.get('/api/v1/courses`)`, `api.post('/api/v1/courses`)` 패턴을 검색하면
**Then** Course 또는 Material hooks에서 해당 패턴이 발견되지 않아야 한다

### Scenario 5: 기존 테스트 모두 통과

**Given** 레거시 파일 제거 후
**When** `pnpm test`를 실행하면
**Then** 기존 1,577개 이상의 테스트가 모두 통과해야 한다
**And** 새로운 테스트 실패가 없어야 한다

---

## Definition of Done (완료 기준)

SPEC-BE-003이 완료된 것으로 간주하는 최소 조건:

**필수 조건 (Primary Goals)**

- [ ] `apps/web/types/supabase.ts`: courses, materials, course_enrollments 테이블 타입이 실제 DB 스키마와 일치
- [ ] `supabase/migrations/00013_create_storage_buckets.sql`: 마이그레이션 파일 존재 및 적용 가능
- [ ] `apps/web/lib/supabase/courses.ts`: 12개 쿼리 함수 모두 구현
- [ ] `apps/web/lib/supabase/materials.ts`: 6개 쿼리 함수 모두 구현
- [ ] `apps/web/lib/supabase/storage.ts`: uploadImage, deleteImage, getPublicUrl 구현
- [ ] 12개 Course hooks 전환 완료 (REST API 호출 없음)
- [ ] 7개 Material hooks 전환 완료 (REST API 호출 없음)
- [ ] TypeScript 컴파일: 새로운 오류 0개
- [ ] ESLint: 새로운 경고 0개
- [ ] 기존 테스트 1,577개 이상 모두 통과

**권장 조건 (Secondary Goals)**

- [ ] `lib/api/courses.ts` 삭제 완료
- [ ] `lib/api/materials.ts` 삭제 완료
- [ ] `lib/supabase/courses.ts` 테스트 커버리지 85%+
- [ ] `lib/supabase/materials.ts` 테스트 커버리지 85%+
- [ ] `lib/supabase/storage.ts` 테스트 커버리지 85%+
- [ ] Material hooks 테스트 커버리지 85%+

**검증 방법**

```bash
# 1. 타입 검사
pnpm --filter web tsc --noEmit

# 2. 린트 검사
pnpm --filter web lint

# 3. 테스트 실행
pnpm test

# 4. 커버리지 확인
pnpm --filter web test --coverage

# 5. REST API 참조 확인 (0이어야 함)
grep -r "api.get.*\/api\/v1\/courses" apps/web/hooks/
grep -r "api.post.*\/api\/v1\/courses" apps/web/hooks/
grep -r "lib/api/materials" apps/web/hooks/

# 6. 삭제 파일 확인
ls apps/web/lib/api/courses.ts 2>/dev/null && echo "NOT DELETED" || echo "DELETED"
ls apps/web/lib/api/materials.ts 2>/dev/null && echo "NOT DELETED" || echo "DELETED"
```
