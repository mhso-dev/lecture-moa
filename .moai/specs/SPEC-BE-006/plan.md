---
spec_id: SPEC-BE-006
version: "1.0.0"
created: "2026-02-21"
updated: "2026-02-21"
---

# SPEC-BE-006 Implementation Plan: Team + Memo Supabase Backend Integration & Realtime

## Development Methodology

**Hybrid Mode**:
- 기존 hooks 전환 (DDD): ANALYZE-PRESERVE-IMPROVE 사이클 적용
- 신규 파일 (TDD): lib/supabase/teams.ts, lib/supabase/memos.ts, constants/realtime.ts는 테스트 작성 후 구현

**품질 목표**: 85%+ 테스트 커버리지

---

## Phase Overview

| Phase | 내용 | 우선순위 |
|-------|------|---------|
| A | TypeScript 타입 정렬 + Realtime 상수 | Primary Goal |
| B | Supabase 쿼리 레이어 생성 (teams) | Primary Goal |
| C | Supabase 쿼리 레이어 생성 (memos) | Primary Goal |
| D | Team hooks 전환 (조회 + CRUD + 멤버십) | Primary Goal |
| E | Memo hooks 전환 (조회 + CRUD) | Primary Goal |
| F | Supabase Realtime 구현 (useTeamMemoSocket) | Primary Goal |
| G | index 업데이트 + 레거시 REST 제거 + 테스트 커버리지 | Secondary Goal |

---

## Phase A: TypeScript 타입 정렬 + Realtime 상수 (Primary Goal)

**목표**: shared 타입과 DB 스키마를 일치시키고, Realtime 상수를 정의한다.

### 작업 목록

1. **team.types.ts 수정**
   - `Team.courseIds: string[]` → `Team.courseId: string` 변경
   - `Team.inviteCode: string | null` 필드 추가
   - `TeamInvitation` 인터페이스 제거
   - `TeamInvitationStatus` 타입 제거
   - `TeamInviteRequest` 인터페이스 제거
   - `TeamMemberDetail.email` 필드 제거
   - `TeamDetailResponse` 유지 (team + members 구조)

2. **memo.types.ts 검증**
   - DB 스키마와 1:1 매핑 확인
   - `authorName`, `authorAvatarUrl` 필드 유지 (profiles JOIN으로 제공)
   - `PaginatedResponse<Memo>` → Supabase range 기반으로 변환 필요 여부 검토

3. **packages/shared/src/constants/realtime.ts 생성** (신규)
   - `REALTIME_CHANNELS` 객체: `TEAM_MEMOS: (teamId: string) => \`team-memos:\${teamId}\``
   - `REALTIME_EVENTS` 객체: `MEMO_INSERTED`, `MEMO_UPDATED`, `MEMO_DELETED`
   - `REALTIME_CONFIG` 객체: `PAGE_SIZE: 20`

4. **packages/shared/src/constants/index.ts 업데이트**
   - realtime.ts export 추가

5. **빌드 영향 검토**
   - `courseIds` → `courseId` 변경으로 영향받는 컴포넌트 목록 파악
   - 컴포넌트 수정은 Phase D에서 hooks 전환과 동시 처리

### 완료 기준
- [ ] team.types.ts가 DB 스키마와 정렬
- [ ] email 초대 관련 타입 3개 제거
- [ ] realtime.ts 상수 파일 생성
- [ ] TypeScript 컴파일 오류 없음 (courseIds 사용처 임시 수정 포함)

---

## Phase B: Supabase 쿼리 레이어 - Teams (Primary Goal)

**목표**: `lib/supabase/teams.ts` 신규 생성. SPEC-BE-003의 `lib/supabase/courses.ts` 패턴을 따른다.

### 작업 목록

1. **TDD: 테스트 먼저 작성**
   - `lib/supabase/teams.test.ts` 생성
   - 각 쿼리 함수에 대한 테스트 케이스 작성
   - Supabase client mock 패턴은 SPEC-BE-003 테스트 참조

2. **fetchMyTeams(userId)**
   - `team_members` JOIN `teams` + `courses` + profiles(count)
   - `team_members.user_id = userId` 필터
   - snake_case → camelCase 매핑 적용
   - 반환 타입: `Team[]`

3. **fetchAvailableTeams(search?)**
   - `teams` 테이블에서 현재 사용자가 미가입 팀 조회
   - search 있으면 `ilike('name', \`%\${search}%\`)`
   - `courses` JOIN으로 courseName 포함
   - 반환 타입: `Team[]`

4. **fetchTeamDetail(teamId)**
   - `teams` JOIN `courses` + member count
   - `eq('id', teamId).single()`
   - 반환 타입: `TeamDetailResponse` (team + members)

5. **fetchTeamMembers(teamId)**
   - `team_members` JOIN `profiles`
   - `eq('team_id', teamId)`
   - 반환 타입: `TeamMemberDetail[]`

6. **createTeam(data, userId)**
   - `teams` INSERT (nanoid로 invite_code 자동 생성)
   - `team_members` INSERT (role: 'leader')
   - 트랜잭션 또는 순차 실행
   - 반환 타입: `Team`

7. **updateTeam(teamId, data)**
   - `teams` UPDATE
   - 반환 타입: `Team`

8. **deleteTeam(teamId)**
   - `teams` DELETE (CASCADE로 team_members 자동 삭제)

9. **joinTeamByInviteCode(inviteCode, userId)**
   - invite_code로 팀 조회 → 멤버 수 체크 → 중복 체크 → INSERT
   - 오류 케이스: 유효하지 않은 코드, 인원 초과, 이미 멤버

10. **leaveTeam(teamId, userId)**
    - `team_members` DELETE

11. **removeMember(teamId, userId)**
    - `team_members` DELETE (RLS가 leader 권한 체크)

12. **changeMemberRole(teamId, userId, role)**
    - `team_members` UPDATE role

### snake_case → camelCase 매핑

| DB 컬럼 | TS 필드 |
|---------|---------|
| course_id | courseId |
| created_by | createdBy |
| max_members | maxMembers |
| invite_code | inviteCode |
| created_at | createdAt |
| updated_at | updatedAt |
| team_id | teamId |
| user_id | userId |
| joined_at | joinedAt |
| member_count | memberCount |

### 완료 기준
- [ ] lib/supabase/teams.ts 모든 함수 구현
- [ ] lib/supabase/teams.test.ts 85%+ 커버리지
- [ ] snake_case → camelCase 매핑 정상 동작
- [ ] 오류 처리 (not found, duplicate, max members)

---

## Phase C: Supabase 쿼리 레이어 - Memos (Primary Goal)

**목표**: `lib/supabase/memos.ts` 신규 생성.

### 작업 목록

1. **TDD: 테스트 먼저 작성**
   - `lib/supabase/memos.test.ts` 생성

2. **fetchPersonalMemos(userId, filters, range)**
   - `memos` JOIN `profiles` (authorName, authorAvatarUrl)
   - `eq('author_id', userId).eq('visibility', 'personal')`
   - filters: materialId, tags (`@>` 연산자), isDraft, search (ilike on title)
   - `.range(from, to)` 페이지네이션 + `{ count: 'exact' }`
   - 반환: `{ data: Memo[], count: number }`

3. **fetchTeamMemos(teamId, range)**
   - `memos` JOIN `profiles`
   - `eq('team_id', teamId).eq('visibility', 'team')`
   - `.range(from, to)` + `{ count: 'exact' }`
   - 반환: `{ data: Memo[], count: number }`

4. **fetchMemoDetail(memoId)**
   - `memos` JOIN `profiles` + `materials`
   - `.eq('id', memoId).single()`
   - linkTarget 구성: material이 있으면 MemoLinkTarget 생성
   - 반환: `MemoDetailResponse`

5. **createMemo(data, userId)**
   - `memos` INSERT (author_id: userId)
   - 반환: `Memo` (profiles JOIN으로 authorName 포함)

6. **updateMemo(memoId, data)**
   - `memos` UPDATE
   - 반환: `Memo`

7. **deleteMemo(memoId)**
   - `memos` DELETE

### Memo 페이지네이션 전략

기존 REST API 방식:
```
page: 1, limit: 20 → { data: Memo[], pagination: { page, totalPages, total } }
```

Supabase 전환 후:
```
range: { from: 0, to: 19 } → { data: Memo[], count: 150 }
getNextPageParam: data.length === 20 ? lastFrom + 20 : undefined
```

### 완료 기준
- [ ] lib/supabase/memos.ts 모든 함수 구현
- [ ] lib/supabase/memos.test.ts 85%+ 커버리지
- [ ] 필터링 (tags, search, isDraft 등) 정상 동작
- [ ] 페이지네이션 range 기반 전환 완료

---

## Phase D: Team hooks 전환 (Primary Goal)

**목표**: 기존 REST API 호출을 Supabase 쿼리 함수로 교체. DDD ANALYZE-PRESERVE-IMPROVE 적용.

### 작업 목록

1. **ANALYZE: 기존 hook 동작 파악**
   - 각 hook의 반환 타입, 파라미터, cache key 확인
   - query invalidation 패턴 파악
   - courseIds → courseId 영향 범위 파악

2. **PRESERVE: 기존 테스트 확보**
   - 기존 hooks 테스트가 있으면 보존
   - 없으면 characterization test 작성 (현재 동작 스냅샷)

3. **IMPROVE: useTeams.ts 전환**
   - `import { api } from "~/lib/api"` → `import { fetchMyTeams, fetchAvailableTeams } from "~/lib/supabase/teams"`
   - `import { createClient } from "~/lib/supabase/client"` 추가
   - useMyTeams: `queryFn` 교체 (userId는 현재 세션에서 획득)
   - useAvailableTeams: `queryFn` 교체
   - teamKeys 구조 유지 (변경 없음)

4. **IMPROVE: useTeam.ts 전환**
   - useTeamDetail: `queryFn` 교체
   - useTeamMembers: `queryFn` 교체
   - useTeamActivity: 제거하지 않고 주석 처리 또는 stub 유지 (SPEC-BE-007 대비)

5. **IMPROVE: useTeamMutations.ts 전환**
   - useCreateTeam: `createTeam` Supabase 함수 사용
   - useUpdateTeam: `updateTeam` Supabase 함수 사용
   - useDeleteTeam: `deleteTeam` Supabase 함수 사용
   - CreateTeamData에서 `courseIds: string[]` → `courseId: string` 변경
   - query invalidation 패턴 유지

6. **IMPROVE: useTeamMembership.ts 전환**
   - `joinTeam(teamId)` → `joinTeamByInviteCode(inviteCode, userId)` 로 변경
   - `leaveTeam(teamId)` → Supabase 직접 호출
   - `inviteMember` 함수/mutation 완전 제거
   - `removeMember` → Supabase 직접 호출
   - `changeMemberRole` → Supabase 직접 호출
   - useJoinTeam(standalone): mutationFn 인자를 inviteCode: string으로 변경

7. **useTeamSearch.ts 확인**
   - useAvailableTeams 래퍼이므로, Phase D-3에서 useAvailableTeams가 전환되면 자동으로 동작
   - 별도 수정 불필요 확인

### 완료 기준
- [ ] 모든 Team hooks에서 `import { api }` 제거
- [ ] 모든 Team hooks가 Supabase 쿼리 함수 사용
- [ ] inviteMember 관련 코드 완전 제거
- [ ] courseIds → courseId 전환 완료
- [ ] query invalidation 패턴 유지
- [ ] 기존 테스트 통과 (수정된 mock으로)

---

## Phase E: Memo hooks 전환 (Primary Goal)

**목표**: Memo hooks를 Supabase 쿼리 함수로 교체.

### 작업 목록

1. **ANALYZE: 기존 hook 동작 파악**
   - usePersonalMemos: InfiniteQuery, page 기반 → range 기반 전환
   - useTeamMemos: InfiniteQuery, 동일 전환
   - useMemoDetail: 단일 조회
   - useCreateMemo, useUpdateMemo, useDeleteMemo: mutation

2. **PRESERVE: 기존 테스트 확보**
   - characterization test 작성

3. **IMPROVE: useMemos.ts 전환**
   - usePersonalMemos: `queryFn` 교체, pageParam을 range { from, to }로 변환
   - `initialPageParam: 0` (0-based range)
   - `getNextPageParam`: `lastPage.data.length === PAGE_SIZE ? lastFrom + PAGE_SIZE : undefined`
   - useTeamMemos: 동일 패턴 적용
   - memoKeys 구조 유지

4. **IMPROVE: useMemoDetail.ts 전환**
   - useMemoDetail: `queryFn` 교체
   - useCreateMemo: `mutationFn` 교체 (userId 전달)
   - useUpdateMemo: `mutationFn` 교체
   - useDeleteMemo: `mutationFn` 교체
   - query invalidation 패턴 유지

### 완료 기준
- [ ] 모든 Memo hooks에서 `import { api }` 제거
- [ ] InfiniteQuery page → range 전환 완료
- [ ] 필터 기반 검색 정상 동작
- [ ] query invalidation 패턴 유지

---

## Phase F: Supabase Realtime 구현 (Primary Goal)

**목표**: useTeamMemoSocket skeleton을 실제 Supabase Realtime `postgres_changes` 구독으로 재구현.

### 작업 목록

1. **기존 skeleton 분석**
   - useTeamMemoSocket의 현재 구조: setTimeout mock, ui.store 연동
   - 유지할 것: hook 시그니처 (`useTeamMemoSocket(teamId): UseTeamMemoSocketReturn`), ui.store 연동
   - 교체할 것: mock 연결 → 실제 Supabase Realtime 채널

2. **Supabase Realtime 채널 구독 구현**
   - `createClient()` 로 Supabase 인스턴스 획득
   - `supabase.channel(REALTIME_CHANNELS.TEAM_MEMOS(teamId))` 생성
   - `.on('postgres_changes', { event: '*', schema: 'public', table: 'memos', filter: \`team_id=eq.\${teamId}\` }, callback)` 등록
   - `.subscribe((status) => { ... })` 로 연결 상태 추적

3. **이벤트 핸들러 구현**
   - INSERT: `queryClient.invalidateQueries({ queryKey: memoKeys.teamList(teamId) })`
   - UPDATE: detail 캐시 업데이트 + 목록 invalidate
   - DELETE: detail 캐시 제거 + 목록 invalidate

4. **연결 상태 관리**
   - subscribe callback에서 `SUBSCRIBED` → `setTeamSocketStatus('connected')`
   - `CHANNEL_ERROR` → `setTeamSocketStatus('error')`
   - `CLOSED` → `setTeamSocketStatus('disconnected')`
   - 초기 상태: `setTeamSocketStatus('connecting')`

5. **정리(cleanup) 구현**
   - useEffect cleanup에서 `supabase.removeChannel(channel)` 호출
   - `setTeamSocketStatus('disconnected')` 설정

6. **테스트**
   - Supabase Realtime channel mock 패턴 작성
   - 각 이벤트 타입별 cache invalidation 검증
   - 마운트/언마운트 시 구독/해제 검증

### 완료 기준
- [ ] useTeamMemoSocket이 실제 Supabase Realtime 채널 사용
- [ ] INSERT/UPDATE/DELETE 이벤트 처리 정상
- [ ] 연결 상태가 ui.store에 정확히 반영
- [ ] 언마운트 시 채널 정리 완료
- [ ] setTimeout mock 코드 완전 제거

---

## Phase G: index 업데이트 + 레거시 제거 + 테스트 (Secondary Goal)

**목표**: export 정리, REST API 잔존 코드 제거, 최종 테스트 커버리지 달성.

### 작업 목록

1. **team/index.ts 업데이트**
   - `useTeamActivity` export 제거
   - `useJoinTeam` export 추가 (invite_code 기반)
   - export 목록 정리 및 주석 업데이트

2. **memo/index.ts 확인**
   - 기존 export 유지 (변경 없음 예상)
   - useAutoSaveDraft export 유지

3. **레거시 REST API 코드 정리**
   - `lib/api/teams.ts` 존재 시 삭제
   - `lib/api/memos.ts` 존재 시 삭제
   - hooks에서 `import { api } from "~/lib/api"` 완전 제거 확인
   - `lib/api/index.ts`에서 team/memo 관련 export 제거

4. **courseIds → courseId 사용처 수정**
   - Team 타입을 사용하는 컴포넌트에서 `courseIds` → `courseId` 참조 수정
   - 빌드 오류 0개 확인

5. **최종 테스트 커버리지**
   - lib/supabase/teams.ts: 85%+
   - lib/supabase/memos.ts: 85%+
   - hooks/team/*.ts: 기존 테스트 통과
   - hooks/memo/*.ts: 기존 테스트 통과
   - useTeamMemoSocket.ts: Realtime 이벤트 테스트

6. **빌드 검증**
   - `pnpm build` 성공
   - TypeScript 컴파일 오류 0개
   - ESLint 새로운 경고 0개

### 완료 기준
- [ ] team/index.ts에서 useTeamActivity 제거, useJoinTeam 추가
- [ ] REST API 잔존 코드 0개
- [ ] courseIds 참조 0개
- [ ] 전체 빌드 성공
- [ ] 테스트 커버리지 85%+

---

## Technical Approach

### TanStack Query Key Strategy

기존 key factory 구조를 그대로 유지:

```
teamKeys:
  all: ["teams"]
  lists: ["teams", "list"]
  myTeams: ["teams", "list", "my"]
  availableTeams: ["teams", "list", "available", search?]
  details: ["teams", "detail"]
  detail: ["teams", "detail", teamId]
  members: ["teams", "detail", teamId, "members"]

memoKeys:
  all: ["memos"]
  lists: ["memos", "list"]
  personalList: ["memos", "list", "personal", filters]
  teamList: ["memos", "list", "team", { teamId }]
  details: ["memos", "detail"]
  detail: ["memos", "detail", memoId]
```

### Supabase Client 사용 패턴

SPEC-BE-003에서 확립된 패턴:
- 서버 컴포넌트: `createServerClient()` 사용
- 클라이언트 hooks: `createClient()` 사용
- 쿼리 함수(`lib/supabase/*.ts`)는 Supabase client를 파라미터로 받거나, 내부에서 `createClient()` 호출

### 오류 처리 패턴

```
Supabase 쿼리 실패 → { data: null, error: PostgrestError }
→ error 확인 후 throw new Error(error.message)
→ TanStack Query가 error state로 전환
→ UI 컴포넌트에서 error 렌더링
```
