---
spec_id: SPEC-BE-006
version: "1.0.0"
created: "2026-02-21"
updated: "2026-02-21"
---

# SPEC-BE-006 Acceptance Criteria: Team + Memo Supabase Backend Integration & Realtime

## Quality Gates

- 테스트 통과: 기존 테스트 + 신규 테스트 모두 pass
- 커버리지: `lib/supabase/teams.ts`, `lib/supabase/memos.ts` 각 85%+
- TypeScript: 컴파일 오류 0개
- ESLint: 새로운 경고 0개
- REST API 호출 코드 완전 제거: team/memo hooks에서 `import { api }` 0건
- Realtime: useTeamMemoSocket에서 setTimeout mock 코드 0건
- 팀 초대: email 기반 초대 코드 0건, invite_code 방식만 존재

---

## AC-001: TypeScript 타입 정렬

**연관 요구사항**: REQ-BE-006-001~006

### Scenario 1: Team 타입 DB 스키마 정렬

**Given** `packages/shared/src/types/team.types.ts` 파일이 존재하고
**When** `Team` 인터페이스를 확인하면
**Then** 다음 필드가 포함되어야 한다:
- `courseId: string` (courseIds가 아님)
- `inviteCode: string | null`
- `maxMembers: number`
- `createdBy: string`
- `updatedAt: Date`

### Scenario 2: email 초대 관련 타입 제거

**Given** `packages/shared/src/types/team.types.ts` 파일이 존재하고
**When** 파일 내용을 검색하면
**Then** 다음 타입이 존재하지 않아야 한다:
- `TeamInvitation` 인터페이스
- `TeamInvitationStatus` 타입
- `TeamInviteRequest` 인터페이스

### Scenario 3: TeamMemberDetail email 필드 제거

**Given** `packages/shared/src/types/team.types.ts` 파일이 존재하고
**When** `TeamMemberDetail` 인터페이스를 확인하면
**Then** `email` 필드가 존재하지 않아야 한다

### Scenario 4: Realtime 상수 정의

**Given** `packages/shared/src/constants/realtime.ts` 파일이 존재하고
**When** export된 상수를 확인하면
**Then** 다음이 정의되어야 한다:
- `REALTIME_CHANNELS.TEAM_MEMOS` 함수 (teamId를 받아 채널명 반환)
- `REALTIME_EVENTS.MEMO_INSERTED`, `MEMO_UPDATED`, `MEMO_DELETED`

---

## AC-002: Supabase 쿼리 레이어 - Teams

**연관 요구사항**: REQ-BE-006-007, 009, 010

### Scenario 1: fetchMyTeams 정상 동작

**Given** 현재 사용자가 2개 팀의 멤버이고
**When** `fetchMyTeams(userId)`를 호출하면
**Then** 2개의 Team 객체가 반환되고
**And** 각 객체의 필드가 camelCase여야 한다 (courseId, maxMembers, inviteCode, createdAt 등)

### Scenario 2: fetchAvailableTeams 검색

**Given** "React Study" 이름의 팀이 존재하고
**When** `fetchAvailableTeams("react")`를 호출하면
**Then** "React Study" 팀이 결과에 포함되어야 한다

### Scenario 3: fetchTeamDetail 조회

**Given** teamId에 해당하는 팀이 존재하고
**When** `fetchTeamDetail(teamId)`를 호출하면
**Then** `TeamDetailResponse` 형태로 team + members가 반환되어야 한다

### Scenario 4: joinTeamByInviteCode 정상 가입

**Given** 유효한 invite_code를 가진 팀이 존재하고
**And** 현재 사용자가 해당 팀의 멤버가 아니고
**And** 팀 인원이 max_members 미만이면
**When** `joinTeamByInviteCode(inviteCode, userId)`를 호출하면
**Then** `{ teamId }` 가 반환되고
**And** team_members 테이블에 role='member'로 추가되어야 한다

### Scenario 5: joinTeamByInviteCode 유효하지 않은 코드

**Given** 존재하지 않는 invite_code가 주어지면
**When** `joinTeamByInviteCode(invalidCode, userId)`를 호출하면
**Then** "유효하지 않은 초대 코드" 오류가 throw되어야 한다

### Scenario 6: joinTeamByInviteCode 인원 초과

**Given** max_members에 도달한 팀의 invite_code가 주어지면
**When** `joinTeamByInviteCode(inviteCode, userId)`를 호출하면
**Then** "팀 인원이 가득 찼습니다" 오류가 throw되어야 한다

### Scenario 7: joinTeamByInviteCode 중복 가입

**Given** 이미 멤버인 팀의 invite_code가 주어지면
**When** `joinTeamByInviteCode(inviteCode, userId)`를 호출하면
**Then** "이미 팀에 가입되어 있습니다" 오류가 throw되어야 한다

### Scenario 8: createTeam invite_code 자동 생성

**Given** 유효한 팀 생성 데이터가 주어지면
**When** `createTeam(data, userId)`를 호출하면
**Then** 생성된 Team에 null이 아닌 `inviteCode`가 포함되어야 한다
**And** 현재 사용자가 leader로 team_members에 추가되어야 한다

### Scenario 9: Supabase 오류 처리

**Given** Supabase 쿼리가 오류를 반환하면
**When** 임의의 쿼리 함수를 호출하면
**Then** Error 객체가 throw되어야 한다
**And** error.message에 의미 있는 메시지가 포함되어야 한다

---

## AC-003: Supabase 쿼리 레이어 - Memos

**연관 요구사항**: REQ-BE-006-008, 009, 010

### Scenario 1: fetchPersonalMemos 페이지네이션

**Given** 현재 사용자가 25개의 개인 메모를 보유하고
**When** `fetchPersonalMemos(userId, {}, { from: 0, to: 19 })`를 호출하면
**Then** `{ data: Memo[20], count: 25 }` 형태로 반환되어야 한다

### Scenario 2: fetchPersonalMemos 필터링

**Given** 현재 사용자가 태그 `["react"]`를 가진 메모 3개를 보유하고
**When** `fetchPersonalMemos(userId, { tags: ["react"] }, { from: 0, to: 19 })`를 호출하면
**Then** 3개의 메모만 반환되어야 한다

### Scenario 3: fetchTeamMemos 조회

**Given** teamId에 해당하는 팀에 10개의 팀 메모가 존재하고
**When** `fetchTeamMemos(teamId, { from: 0, to: 19 })`를 호출하면
**Then** 10개의 Memo 객체가 반환되어야 한다
**And** 각 메모의 `visibility`가 'team'이어야 한다

### Scenario 4: fetchMemoDetail 조회

**Given** memoId에 해당하는 메모가 존재하고
**And** 해당 메모가 materialId를 참조하고
**When** `fetchMemoDetail(memoId)`를 호출하면
**Then** `MemoDetailResponse` 형태로 memo + linkTarget이 반환되어야 한다
**And** linkTarget에 materialTitle과 courseId가 포함되어야 한다

### Scenario 5: Memo authorName profiles JOIN

**Given** 메모가 존재하고
**When** 메모를 조회하면
**Then** `authorName`과 `authorAvatarUrl`이 profiles 테이블에서 JOIN되어 포함되어야 한다

---

## AC-004: Team hooks 전환

**연관 요구사항**: REQ-BE-006-011~029

### Scenario 1: useMyTeams Supabase 전환

**Given** hooks/team/useTeams.ts 파일이 존재하고
**When** useMyTeams hook의 구현을 확인하면
**Then** `import { api }` 대신 `lib/supabase/teams`에서 import해야 한다
**And** teamKeys.myTeams() query key를 사용해야 한다
**And** 반환 타입이 `Team[]`이어야 한다

### Scenario 2: useTeamMembership inviteMember 제거

**Given** hooks/team/useTeamMembership.ts 파일이 존재하고
**When** 파일 내용을 검색하면
**Then** `inviteMember` 함수와 mutation이 존재하지 않아야 한다
**And** `InviteMemberData` 인터페이스가 존재하지 않아야 한다

### Scenario 3: useJoinTeam invite_code 방식

**Given** hooks/team/useTeamMembership.ts에서 useJoinTeam이 export되고
**When** useJoinTeam의 mutationFn 시그니처를 확인하면
**Then** 인자 타입이 `string` (inviteCode)이어야 한다
**And** 내부에서 `joinTeamByInviteCode`를 호출해야 한다

### Scenario 4: CreateTeamData courseId 변경

**Given** hooks/team/useTeamMutations.ts 파일이 존재하고
**When** CreateTeamData 인터페이스를 확인하면
**Then** `courseId: string` 필드가 존재해야 한다
**And** `courseIds: string[]` 필드가 존재하지 않아야 한다

### Scenario 5: useTeamActivity export 제거

**Given** hooks/team/index.ts 파일이 존재하고
**When** export 목록을 확인하면
**Then** `useTeamActivity`가 export되지 않아야 한다

### Scenario 6: query invalidation 유지

**Given** Team mutation hooks가 성공적으로 실행되면
**When** onSuccess 콜백을 확인하면
**Then** 관련 teamKeys가 invalidate되어야 한다
**And** invalidation 패턴이 기존과 동일해야 한다

---

## AC-005: Memo hooks 전환

**연관 요구사항**: REQ-BE-006-030~039

### Scenario 1: usePersonalMemos InfiniteQuery range 전환

**Given** hooks/memo/useMemos.ts 파일이 존재하고
**When** usePersonalMemos hook의 구현을 확인하면
**Then** `initialPageParam`이 0 (range 시작)이어야 한다
**And** `getNextPageParam`이 range 기반으로 다음 페이지를 계산해야 한다
**And** `lib/supabase/memos`에서 import해야 한다

### Scenario 2: useTeamMemos InfiniteQuery range 전환

**Given** hooks/memo/useMemos.ts 파일이 존재하고
**When** useTeamMemos hook의 구현을 확인하면
**Then** usePersonalMemos와 동일한 range 기반 페이지네이션을 사용해야 한다
**And** `enabled: !!teamId` 조건을 유지해야 한다

### Scenario 3: useMemoDetail Supabase 전환

**Given** hooks/memo/useMemoDetail.ts 파일이 존재하고
**When** useMemoDetail hook의 구현을 확인하면
**Then** `lib/supabase/memos`에서 import해야 한다
**And** `MemoDetailResponse` 반환 타입을 유지해야 한다

### Scenario 4: Memo mutation query invalidation

**Given** useCreateMemo가 성공적으로 실행되고
**And** 생성된 메모의 teamId가 존재하면
**When** onSuccess 콜백이 실행되면
**Then** `memoKeys.lists()`와 `memoKeys.teamList(teamId)`가 모두 invalidate되어야 한다

---

## AC-006: Supabase Realtime

**연관 요구사항**: REQ-BE-006-040~046

### Scenario 1: Realtime 채널 구독

**Given** useTeamMemoSocket(teamId)이 마운트되고
**When** Supabase Realtime 채널 설정을 확인하면
**Then** 채널명이 `team-memos:{teamId}` 형식이어야 한다
**And** `postgres_changes` 이벤트를 `memos` 테이블에 대해 구독해야 한다
**And** `team_id=eq.{teamId}` 필터가 적용되어야 한다

### Scenario 2: INSERT 이벤트 처리

**Given** useTeamMemoSocket이 활성화된 상태에서
**When** 다른 사용자가 해당 팀에 새 메모를 생성하면 (INSERT 이벤트)
**Then** `memoKeys.teamList(teamId)` query가 invalidate되어야 한다

### Scenario 3: UPDATE 이벤트 처리

**Given** useTeamMemoSocket이 활성화된 상태에서
**When** 다른 사용자가 팀 메모를 수정하면 (UPDATE 이벤트)
**Then** 해당 메모의 detail 캐시가 업데이트되어야 한다
**And** `memoKeys.teamList(teamId)` query가 invalidate되어야 한다

### Scenario 4: DELETE 이벤트 처리

**Given** useTeamMemoSocket이 활성화된 상태에서
**When** 다른 사용자가 팀 메모를 삭제하면 (DELETE 이벤트)
**Then** 해당 메모의 detail 캐시가 제거되어야 한다
**And** `memoKeys.teamList(teamId)` query가 invalidate되어야 한다

### Scenario 5: 연결 상태 관리

**Given** useTeamMemoSocket이 마운트되면
**When** Realtime 채널 구독 상태가 변경되면
**Then** ui.store의 `teamSocketStatus`가 다음과 같이 업데이트되어야 한다:
- 구독 시작: `connecting`
- SUBSCRIBED: `connected`
- CHANNEL_ERROR: `error`
- CLOSED: `disconnected`

### Scenario 6: 언마운트 시 정리

**Given** useTeamMemoSocket이 활성화된 상태에서
**When** 컴포넌트가 언마운트되면
**Then** `supabase.removeChannel(channel)` 이 호출되어야 한다
**And** `teamSocketStatus`가 `disconnected`로 설정되어야 한다

### Scenario 7: skeleton 코드 제거

**Given** hooks/team/useTeamMemoSocket.ts 파일이 존재하고
**When** 파일 내용을 검색하면
**Then** `setTimeout` 호출이 존재하지 않아야 한다
**And** "TODO: Implement actual WebSocket" 주석이 존재하지 않아야 한다

---

## AC-007: 레거시 제거 및 빌드

**연관 요구사항**: REQ-BE-006-047~050

### Scenario 1: REST API import 완전 제거

**Given** hooks/team/ 및 hooks/memo/ 디렉토리의 모든 파일에서
**When** `import { api }` 또는 `from "~/lib/api"` 를 검색하면
**Then** 결과가 0건이어야 한다

### Scenario 2: REST API 파일 삭제

**Given** `lib/api/` 디렉토리를 확인하면
**When** team 또는 memo 관련 API 파일을 검색하면
**Then** `lib/api/teams.ts`와 `lib/api/memos.ts`가 존재하지 않아야 한다

### Scenario 3: TypeScript 빌드 성공

**Given** 모든 전환 작업이 완료되면
**When** `pnpm build`를 실행하면
**Then** 빌드가 성공해야 한다
**And** TypeScript 컴파일 오류가 0개여야 한다

### Scenario 4: ESLint 경고 확인

**Given** 모든 전환 작업이 완료되면
**When** ESLint를 실행하면
**Then** 새로운 경고가 0개여야 한다

### Scenario 5: courseIds 참조 제거

**Given** 프로젝트 전체에서
**When** `courseIds` 문자열을 검색하면
**Then** team 관련 코드에서 결과가 0건이어야 한다 (다른 도메인은 제외)

---

## Definition of Done

- [ ] packages/shared/src/types/team.types.ts DB 스키마 정렬 완료
- [ ] packages/shared/src/constants/realtime.ts 생성 완료
- [ ] lib/supabase/teams.ts 신규 생성 + 85%+ 커버리지
- [ ] lib/supabase/memos.ts 신규 생성 + 85%+ 커버리지
- [ ] hooks/team/useTeams.ts Supabase 전환 완료
- [ ] hooks/team/useTeam.ts Supabase 전환 완료 (useTeamActivity 제외)
- [ ] hooks/team/useTeamMutations.ts Supabase 전환 완료
- [ ] hooks/team/useTeamMembership.ts invite_code 방식 전환 + inviteMember 제거
- [ ] hooks/memo/useMemos.ts Supabase 전환 + range 페이지네이션
- [ ] hooks/memo/useMemoDetail.ts Supabase 전환 완료
- [ ] hooks/team/useTeamMemoSocket.ts Supabase Realtime 재구현
- [ ] hooks/team/index.ts useTeamActivity 제거 + useJoinTeam 추가
- [ ] REST API import 완전 제거
- [ ] courseIds → courseId 전환 완료
- [ ] TypeScript 빌드 성공 (오류 0개)
- [ ] ESLint 새로운 경고 0개
- [ ] 테스트 전체 pass
