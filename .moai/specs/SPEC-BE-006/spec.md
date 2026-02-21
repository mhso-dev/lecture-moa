---
id: SPEC-BE-006
version: "1.0.0"
status: draft
created: "2026-02-21"
updated: "2026-02-21"
author: mhso-dev
priority: high
depends_on: [SPEC-BE-001, SPEC-AUTH-001, SPEC-BE-003]
---

# SPEC-BE-006: Team + Memo Supabase Backend Integration & Realtime

## HISTORY

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0.0 | 2026-02-21 | mhso-dev | 초기 작성 |

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
| Realtime | Supabase Realtime (postgres_changes) | ^2.49.x |

### 1.2 프로젝트 컨텍스트

lecture-moa는 강사가 Markdown 강의 자료를 업로드하고 학생이 인라인 Q&A와 함께 학습하는 교육 플랫폼이다.

**현재 상태:**
- SPEC-BE-001(Supabase 초기 설정) COMPLETE: DB 스키마 15개 테이블, RLS 정책, 마이그레이션 완료
- SPEC-AUTH-001(인증 전환) COMPLETE: Supabase Auth 기반 인증 레이어 완성
- SPEC-BE-003(Course + Material 전환) COMPLETE: Course/Material hooks를 Supabase 직접 쿼리로 전환 완료
- 프론트엔드 SPEC-FE-001 ~ FE-008 COMPLETE: UI 컴포넌트 및 hooks 완성
- 문제: Team(6개 hooks) + Memo(4개 hooks)가 존재하지 않는 REST API 엔드포인트(apps/api Fastify 서버) 호출 중
- useTeamMemoSocket은 skeleton 구현(setTimeout mock)으로, 실제 Realtime 연동 필요

**핵심 전환 과제:**
1. 기존 `api.get('/api/v1/teams/...')` / `api.get('/api/v1/memos/...')` 패턴을 `createClient().from('teams')` / `createClient().from('memos')` Supabase 직접 쿼리로 전환
2. 팀 초대 방식을 email 기반에서 `invite_code` 기반으로 변경
3. useTeamMemoSocket skeleton을 Supabase Realtime `postgres_changes` 구독으로 재구현

### 1.3 의존성

- **선행 SPEC**: SPEC-BE-001 (DB 스키마, RLS 정책), SPEC-AUTH-001 (Supabase Auth), SPEC-BE-003 (Supabase 쿼리 패턴 확립)
- **DB 테이블**: teams, team_members, memos, profiles, courses, materials
- **RLS 정책**: 00012_create_rls_policies.sql에 정의된 teams/team_members/memos 정책

### 1.4 참조 패턴

SPEC-BE-003에서 확립된 Supabase 쿼리 레이어 패턴을 따른다:
- `lib/supabase/teams.ts`, `lib/supabase/memos.ts` 신규 생성
- snake_case → camelCase 매핑 함수
- TanStack Query key factory 유지
- hooks에서 쿼리 함수만 교체 (hook 시그니처 보존)

---

## 2. Assumptions

### 2.1 기존 코드 전제

- `apps/web/hooks/team/` 디렉토리에 6개 hook 파일이 존재한다 (useTeams.ts, useTeam.ts, useTeamMutations.ts, useTeamMembership.ts, useTeamSearch.ts, useTeamMemoSocket.ts)
- `apps/web/hooks/memo/` 디렉토리에 4개 hook 파일이 존재한다 (useMemos.ts, useMemoDetail.ts, useAutoSaveDraft.ts, index.ts)
- 모든 기존 hooks는 `api` (axios 인스턴스) 기반 REST 호출 사용
- `packages/shared/src/types/team.types.ts`와 `memo.types.ts`가 존재한다
- `useAutoSaveDraft`는 localStorage 기반이므로 이 SPEC에서 변경하지 않는다

### 2.2 DB 스키마 전제

- `teams` 테이블: `invite_code TEXT UNIQUE` 컬럼이 존재한다 (00006_create_teams.sql)
- `team_members` 테이블: `UNIQUE(team_id, user_id)` 제약이 존재한다
- `memos` 테이블: `visibility TEXT CHECK (visibility IN ('personal', 'team'))` 컬럼이 존재한다
- teams.course_id는 단일 UUID이다 (기존 타입의 courseIds: string[]와 불일치)

### 2.3 Realtime 전제

- Supabase Realtime `postgres_changes` 채널은 RLS 정책을 적용한다
- `postgres_changes` 이벤트는 INSERT, UPDATE, DELETE를 지원한다
- Realtime 구독은 클라이언트 컴포넌트("use client")에서만 동작한다

### 2.4 사용자 결정 사항

- 팀 초대: `invite_code` 방식 ONLY (email 기반 초대 제거, team_invitations 테이블 없음)
- `useTeamActivity`: 이 SPEC에서 제외 (SPEC-BE-007 Dashboard로 연기)
- Realtime: `postgres_changes` ONLY (Presence 기능 미포함)
- `useAutoSaveDraft`: 변경 없음 (localStorage 기반 유지)

---

## 3. Scope

### 3.1 범위 내 (In Scope)

| 영역 | 항목 |
|------|------|
| 타입 정렬 | team.types.ts DB 스키마 정렬 (courseIds→courseId, inviteCode 추가, email 초대 관련 타입 제거) |
| 타입 정렬 | memo.types.ts DB 스키마 검증 |
| 쿼리 레이어 | lib/supabase/teams.ts 신규 생성 |
| 쿼리 레이어 | lib/supabase/memos.ts 신규 생성 |
| Team hooks 전환 | useTeams.ts (useMyTeams, useAvailableTeams) |
| Team hooks 전환 | useTeam.ts (useTeamDetail, useTeamMembers) — useTeamActivity 제외 |
| Team hooks 전환 | useTeamMutations.ts (useCreateTeam, useUpdateTeam, useDeleteTeam) |
| Team hooks 전환 | useTeamMembership.ts (joinByInviteCode, leave, remove, changeRole) — inviteMember 제거 |
| Memo hooks 전환 | useMemos.ts (usePersonalMemos, useTeamMemos) |
| Memo hooks 전환 | useMemoDetail.ts (useMemoDetail, useCreateMemo, useUpdateMemo, useDeleteMemo) |
| Realtime | useTeamMemoSocket.ts → Supabase Realtime postgres_changes 재구현 |
| Realtime | packages/shared/src/constants/realtime.ts 신규 생성 |
| index 업데이트 | team/index.ts에서 useTeamActivity export 제거 |
| 레거시 제거 | 남아있는 REST API 클라이언트 코드 확인 및 정리 |

### 3.2 범위 외 (Out of Scope)

| 항목 | 사유 |
|------|------|
| useTeamActivity hook | SPEC-BE-007 Dashboard SPEC으로 연기 |
| useAutoSaveDraft | localStorage 기반, 백엔드 무관 |
| useTeamSearch | useAvailableTeams 래퍼, 별도 전환 불필요 |
| Supabase Realtime Presence | 이 SPEC에서 미포함 |
| team_invitations 테이블 | invite_code 방식으로 결정, 미사용 |
| Dashboard 데이터 통합 | SPEC-BE-007로 연기 |

---

## 4. Requirements

### 4.1 타입 정렬

**REQ-BE-006-001**: WHEN team.types.ts의 Team 인터페이스를 확인하면 THEN `courseIds: string[]`가 `courseId: string`으로 변경되어야 한다.

**REQ-BE-006-002**: WHEN team.types.ts의 Team 인터페이스를 확인하면 THEN `inviteCode: string | null` 필드가 추가되어야 한다.

**REQ-BE-006-003**: 시스템은 항상 team.types.ts에서 `TeamInvitation`, `TeamInvitationStatus`, `TeamInviteRequest` 타입을 제거해야 한다.

**REQ-BE-006-004**: WHEN team.types.ts의 TeamMemberDetail 인터페이스를 확인하면 THEN `email` 필드가 제거되어야 한다.

**REQ-BE-006-005**: WHEN memo.types.ts의 Memo 인터페이스를 DB 스키마(00007_create_memos.sql)와 비교하면 THEN 모든 필드가 1:1 매핑되어야 한다 (authorName, authorAvatarUrl은 profiles JOIN으로 제공).

**REQ-BE-006-006**: WHEN packages/shared/src/constants/realtime.ts를 확인하면 THEN Supabase Realtime 채널 이름 상수와 이벤트 타입이 정의되어야 한다.

### 4.2 Supabase 쿼리 레이어

**REQ-BE-006-007**: WHEN `lib/supabase/teams.ts`를 확인하면 THEN 다음 함수가 정의되어야 한다: `fetchMyTeams`, `fetchAvailableTeams`, `fetchTeamDetail`, `fetchTeamMembers`, `createTeam`, `updateTeam`, `deleteTeam`, `joinTeamByInviteCode`, `leaveTeam`, `removeMember`, `changeMemberRole`.

**REQ-BE-006-008**: WHEN `lib/supabase/memos.ts`를 확인하면 THEN 다음 함수가 정의되어야 한다: `fetchPersonalMemos`, `fetchTeamMemos`, `fetchMemoDetail`, `createMemo`, `updateMemo`, `deleteMemo`.

**REQ-BE-006-009**: 시스템은 항상 Supabase 쿼리 결과의 snake_case 컬럼명을 camelCase 프론트엔드 타입으로 매핑해야 한다.

**REQ-BE-006-010**: WHEN Supabase 쿼리에서 오류가 발생하면 THEN 적절한 Error 객체를 throw하여 TanStack Query의 error state로 전파해야 한다.

### 4.3 Team 조회 hooks 전환

**REQ-BE-006-011**: WHEN useMyTeams hook이 호출되면 THEN `supabase.from('team_members').select('..., teams(...)').eq('user_id', userId)` 패턴으로 현재 사용자의 팀 목록을 조회해야 한다.

**REQ-BE-006-012**: WHEN useAvailableTeams hook이 search 파라미터와 함께 호출되면 THEN `supabase.from('teams').select('...').ilike('name', search)` 패턴으로 가입 가능한 팀을 검색해야 한다.

**REQ-BE-006-013**: WHEN useTeamDetail hook이 teamId와 함께 호출되면 THEN `supabase.from('teams').select('..., team_members(count)').eq('id', teamId).single()` 패턴으로 팀 상세 정보를 조회해야 한다.

**REQ-BE-006-014**: WHEN useTeamMembers hook이 teamId와 함께 호출되면 THEN `supabase.from('team_members').select('..., profiles(...)').eq('team_id', teamId)` 패턴으로 팀 멤버 목록을 조회해야 한다.

**REQ-BE-006-015**: 시스템은 항상 기존 teamKeys query key factory 구조를 유지해야 한다 (all, lists, myTeams, availableTeams, details, detail, members).

**REQ-BE-006-016**: WHEN team 조회 hooks의 반환 타입을 확인하면 THEN 기존 hook 시그니처와 동일해야 한다 (useMyTeams → Team[], useTeamDetail → TeamDetailResponse 등).

### 4.4 Team CRUD mutation hooks 전환

**REQ-BE-006-017**: WHEN useCreateTeam mutation이 실행되면 THEN `supabase.from('teams').insert(...)` 후 `team_members`에 leader로 자동 추가해야 한다.

**REQ-BE-006-018**: WHEN useCreateTeam이 성공하면 THEN `nanoid` 또는 유사 방식으로 생성된 `invite_code`가 teams 레코드에 포함되어야 한다.

**REQ-BE-006-019**: WHEN useUpdateTeam mutation이 실행되면 THEN `supabase.from('teams').update(...).eq('id', teamId)` 패턴으로 팀 정보를 수정해야 한다.

**REQ-BE-006-020**: WHEN useDeleteTeam mutation이 실행되면 THEN `supabase.from('teams').delete().eq('id', teamId)` 패턴으로 팀을 삭제해야 한다 (CASCADE로 team_members 자동 삭제).

**REQ-BE-006-021**: 시스템은 항상 Team mutation 성공 시 관련 query key를 invalidate해야 한다 (teamKeys.lists, teamKeys.detail 등).

### 4.5 Team 멤버십 hooks 전환

**REQ-BE-006-022**: WHEN joinTeamByInviteCode가 invite_code와 함께 호출되면 THEN `supabase.from('teams').select('id').eq('invite_code', code).single()` 후 `team_members`에 member로 INSERT해야 한다.

**REQ-BE-006-023**: WHEN 이미 팀 멤버인 사용자가 joinTeamByInviteCode를 호출하면 THEN "이미 팀에 가입되어 있습니다" 오류를 반환해야 한다.

**REQ-BE-006-024**: WHEN 팀의 max_members에 도달한 상태에서 join을 시도하면 THEN "팀 인원이 가득 찼습니다" 오류를 반환해야 한다.

**REQ-BE-006-025**: WHEN leaveTeam이 호출되면 THEN `supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', userId)` 패턴으로 멤버를 제거해야 한다.

**REQ-BE-006-026**: WHEN removeMember가 호출되면 THEN leader 권한을 확인하고 `supabase.from('team_members').delete().eq('id', memberId)` 패턴으로 멤버를 제거해야 한다.

**REQ-BE-006-027**: WHEN changeMemberRole이 호출되면 THEN `supabase.from('team_members').update({ role }).eq('team_id', teamId).eq('user_id', userId)` 패턴으로 역할을 변경해야 한다.

**REQ-BE-006-028**: 시스템은 항상 useTeamMembership에서 `inviteMember` (email 기반)를 제거해야 한다.

**REQ-BE-006-029**: WHEN useJoinTeam(standalone hook)의 시그니처를 확인하면 THEN `mutationFn`의 인자가 `string` (teamId)에서 `string` (inviteCode)로 변경되어야 한다.

### 4.6 Memo 조회 hooks 전환

**REQ-BE-006-030**: WHEN usePersonalMemos hook이 호출되면 THEN `supabase.from('memos').select('..., profiles(...)').eq('author_id', userId).eq('visibility', 'personal')` 패턴으로 개인 메모를 조회해야 한다.

**REQ-BE-006-031**: WHEN usePersonalMemos에 filters가 전달되면 THEN materialId, tags, isDraft, search 필터가 Supabase 쿼리에 적용되어야 한다.

**REQ-BE-006-032**: WHEN useTeamMemos hook이 teamId와 함께 호출되면 THEN `supabase.from('memos').select('..., profiles(...)').eq('team_id', teamId).eq('visibility', 'team')` 패턴으로 팀 메모를 조회해야 한다.

**REQ-BE-006-033**: 시스템은 항상 Memo 목록 조회에 Supabase의 `.range()` 기반 페이지네이션을 사용하여 useInfiniteQuery 패턴을 유지해야 한다.

**REQ-BE-006-034**: 시스템은 항상 기존 memoKeys query key factory 구조를 유지해야 한다 (all, lists, personalList, teamList, details, detail).

### 4.7 Memo CRUD mutation hooks 전환

**REQ-BE-006-035**: WHEN useMemoDetail hook이 memoId와 함께 호출되면 THEN `supabase.from('memos').select('..., profiles(...), materials(...)').eq('id', memoId).single()` 패턴으로 메모 상세를 조회해야 한다.

**REQ-BE-006-036**: WHEN useCreateMemo mutation이 실행되면 THEN `supabase.from('memos').insert(...)` 패턴으로 메모를 생성해야 한다.

**REQ-BE-006-037**: WHEN useUpdateMemo mutation이 실행되면 THEN `supabase.from('memos').update(...).eq('id', memoId)` 패턴으로 메모를 수정해야 한다.

**REQ-BE-006-038**: WHEN useDeleteMemo mutation이 실행되면 THEN `supabase.from('memos').delete().eq('id', memoId)` 패턴으로 메모를 삭제해야 한다.

**REQ-BE-006-039**: 시스템은 항상 Memo mutation 성공 시 관련 query key를 invalidate해야 한다 (memoKeys.lists, memoKeys.detail, 팀 메모인 경우 memoKeys.teamList 등).

### 4.8 Supabase Realtime (postgres_changes)

**REQ-BE-006-040**: WHEN useTeamMemoSocket hook이 teamId와 함께 마운트되면 THEN `supabase.channel('team-memos:{teamId}').on('postgres_changes', { event: '*', schema: 'public', table: 'memos', filter: 'team_id=eq.{teamId}' })` 패턴으로 구독해야 한다.

**REQ-BE-006-041**: WHEN memos 테이블에 INSERT 이벤트가 발생하면 THEN `queryClient.invalidateQueries({ queryKey: memoKeys.teamList(teamId) })` 으로 팀 메모 목록을 갱신해야 한다.

**REQ-BE-006-042**: WHEN memos 테이블에 UPDATE 이벤트가 발생하면 THEN 해당 메모의 detail 캐시를 업데이트하고 목록을 invalidate해야 한다.

**REQ-BE-006-043**: WHEN memos 테이블에 DELETE 이벤트가 발생하면 THEN 해당 메모의 detail 캐시를 제거하고 목록을 invalidate해야 한다.

**REQ-BE-006-044**: WHEN useTeamMemoSocket hook이 언마운트되면 THEN `supabase.removeChannel(channel)` 로 구독을 정리해야 한다.

**REQ-BE-006-045**: 시스템은 항상 useTeamMemoSocket의 연결 상태를 ui.store.ts의 `teamSocketStatus`에 반영해야 한다 (`connected`, `disconnected`, `connecting`, `error`).

**REQ-BE-006-046**: IF Realtime 연결이 끊어지면 THEN Supabase 클라이언트의 내장 재연결 메커니즘을 활용해야 한다 (수동 재시도 로직 불필요).

### 4.9 index 파일 및 레거시 제거

**REQ-BE-006-047**: WHEN team/index.ts를 확인하면 THEN `useTeamActivity` export가 제거되어야 한다.

**REQ-BE-006-048**: WHEN team/index.ts를 확인하면 THEN `useJoinTeam` export가 추가되어야 한다 (invite_code 기반 join).

**REQ-BE-006-049**: 시스템은 항상 전환 완료 후 team/memo hooks에서 `import { api } from "~/lib/api"` 참조가 완전히 제거되어야 한다.

**REQ-BE-006-050**: IF `lib/api/teams.ts` 또는 `lib/api/memos.ts` REST API 파일이 존재하면 THEN 삭제해야 한다.

---

## 5. Specifications

### 5.1 Supabase 쿼리 함수 구조

`lib/supabase/teams.ts` 구조:

```
fetchMyTeams(userId: string): Promise<Team[]>
fetchAvailableTeams(search?: string): Promise<Team[]>
fetchTeamDetail(teamId: string): Promise<TeamDetailResponse>
fetchTeamMembers(teamId: string): Promise<TeamMemberDetail[]>
createTeam(data: CreateTeamData, userId: string): Promise<Team>
updateTeam(teamId: string, data: UpdateTeamData): Promise<Team>
deleteTeam(teamId: string): Promise<void>
joinTeamByInviteCode(inviteCode: string, userId: string): Promise<{ teamId: string }>
leaveTeam(teamId: string, userId: string): Promise<void>
removeMember(teamId: string, userId: string): Promise<void>
changeMemberRole(teamId: string, userId: string, role: TeamMemberRole): Promise<void>
```

`lib/supabase/memos.ts` 구조:

```
fetchPersonalMemos(userId: string, filters: MemoFilterParams, range: { from: number; to: number }): Promise<{ data: Memo[]; count: number }>
fetchTeamMemos(teamId: string, range: { from: number; to: number }): Promise<{ data: Memo[]; count: number }>
fetchMemoDetail(memoId: string): Promise<MemoDetailResponse>
createMemo(data: CreateMemoRequest, userId: string): Promise<Memo>
updateMemo(memoId: string, data: UpdateMemoRequest): Promise<Memo>
deleteMemo(memoId: string): Promise<void>
```

### 5.2 snake_case → camelCase 매핑 전략

SPEC-BE-003에서 확립된 패턴 적용:
- DB 컬럼: `author_id`, `team_id`, `material_id`, `anchor_id`, `is_draft`, `created_at`, `updated_at`, `invite_code`, `max_members`, `created_by`, `joined_at`, `last_active_at`, `cover_image_url`, `course_id`
- 프론트엔드 타입: `authorId`, `teamId`, `materialId`, `anchorId`, `isDraft`, `createdAt`, `updatedAt`, `inviteCode`, `maxMembers`, `createdBy`, `joinedAt`, `lastActiveAt`, `coverImageUrl`, `courseId`

### 5.3 Realtime 채널 설계

채널명 패턴: `team-memos:{teamId}`
이벤트 필터: `team_id=eq.{teamId}`
구독 이벤트: INSERT, UPDATE, DELETE

```
packages/shared/src/constants/realtime.ts:
  REALTIME_CHANNELS.TEAM_MEMOS(teamId) → `team-memos:${teamId}`
  REALTIME_EVENTS.MEMO_INSERTED
  REALTIME_EVENTS.MEMO_UPDATED
  REALTIME_EVENTS.MEMO_DELETED
```

### 5.4 invite_code 기반 팀 가입 흐름

1. 사용자가 invite_code 입력
2. `teams` 테이블에서 `invite_code`로 팀 조회
3. 팀 존재 여부 확인 (없으면 "유효하지 않은 초대 코드" 오류)
4. 현재 멤버 수 vs `max_members` 확인 (초과 시 "팀 인원 초과" 오류)
5. 기존 멤버 여부 확인 (이미 멤버이면 "이미 가입된 팀" 오류)
6. `team_members`에 `{ team_id, user_id, role: 'member' }` INSERT
7. 성공 시 `{ teamId }` 반환

### 5.5 Memo 페이지네이션 전략

기존 REST API의 `page` / `totalPages` 기반 페이지네이션을 Supabase `.range(from, to)` 기반으로 전환:
- pageParam: 0-based cursor (from index)
- pageSize: 20 (기존과 동일)
- getNextPageParam: `lastPage.data.length === pageSize ? from + pageSize : undefined`
- count: `{ count: 'exact' }` 옵션 사용

---

## 6. Risks

| 리스크 | 영향 | 대응 |
|--------|------|------|
| RLS 정책이 Realtime 이벤트를 필터링하지 못할 수 있음 | 다른 팀 메모 이벤트 수신 가능 | filter 옵션으로 team_id 명시, 클라이언트 측 이중 검증 |
| invite_code 충돌 가능성 | 팀 가입 실패 | nanoid(10) 사용으로 충돌 확률 극소화, UNIQUE 제약으로 재시도 |
| useInfiniteQuery의 range 기반 전환 시 off-by-one 오류 | 데이터 누락/중복 | 단위 테스트로 경계값 검증 |
| Realtime 연결 비용 (동시 접속 시) | Supabase 과금 증가 | 팀 페이지 진입 시에만 구독, 이탈 시 즉시 해제 |
| team.types.ts 변경 시 기존 컴포넌트 빌드 실패 | 프론트엔드 빌드 오류 | courseIds → courseId 전환 시 사용처 동시 수정 |

---

## 7. Dependencies

### 7.1 내부 의존성

| 소스 | 대상 | 관계 |
|------|------|------|
| lib/supabase/teams.ts | apps/web/lib/supabase/client.ts | createClient() 사용 |
| lib/supabase/memos.ts | apps/web/lib/supabase/client.ts | createClient() 사용 |
| hooks/team/*.ts | lib/supabase/teams.ts | 쿼리 함수 호출 |
| hooks/memo/*.ts | lib/supabase/memos.ts | 쿼리 함수 호출 |
| useTeamMemoSocket.ts | @supabase/supabase-js Realtime | channel 구독 |
| packages/shared/constants/realtime.ts | hooks/team/useTeamMemoSocket.ts | 채널명 상수 |

### 7.2 외부 의존성

| 패키지 | 용도 |
|--------|------|
| @supabase/supabase-js | Supabase 클라이언트, Realtime |
| @tanstack/react-query | 상태 관리, 캐시 |
| nanoid | invite_code 생성 |

---

## 8. Traceability

| 요구사항 ID | 관련 파일 | 설명 |
|-------------|-----------|------|
| REQ-BE-006-001~006 | packages/shared/src/types/team.types.ts, memo.types.ts, constants/realtime.ts | 타입 정렬 및 상수 정의 |
| REQ-BE-006-007~010 | lib/supabase/teams.ts, lib/supabase/memos.ts | Supabase 쿼리 레이어 |
| REQ-BE-006-011~016 | hooks/team/useTeams.ts, hooks/team/useTeam.ts | Team 조회 hooks |
| REQ-BE-006-017~021 | hooks/team/useTeamMutations.ts | Team CRUD mutations |
| REQ-BE-006-022~029 | hooks/team/useTeamMembership.ts | Team 멤버십 (invite_code) |
| REQ-BE-006-030~034 | hooks/memo/useMemos.ts | Memo 조회 hooks |
| REQ-BE-006-035~039 | hooks/memo/useMemoDetail.ts | Memo CRUD mutations |
| REQ-BE-006-040~046 | hooks/team/useTeamMemoSocket.ts | Supabase Realtime |
| REQ-BE-006-047~050 | hooks/team/index.ts, hooks/memo/index.ts, lib/api/ | index 및 레거시 제거 |
