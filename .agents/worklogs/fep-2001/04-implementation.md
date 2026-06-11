# FEP-2001 — 구현 맥락

> 이어서 작업하는 에이전트는 이 문서를 코드와 함께 읽을 것. /tmp의 세션 산출물은 소실되므로 결정 로그(D/FD)는 여기에 전문 수록했다.

## 1. 모듈 지도 (extensions/plugin-history-sync/src — 신규 모듈 전부 index.ts 비export)

| 모듈 | 역할 |
|---|---|
| `desiredHistoryEntries.ts` | 스택 → 기대 엔트리 계산 (entered 활동 × live steps, eventDate 정렬, Replaced victim drop — in-place replace 제외 판별 포함, ordering note 주석) |
| `BrowserHistoryEntryModel.ts` | actual 모델: knownEntries(identity/state/path/**provenance**), currentIndex/topIndex/anchorIndex/outOfApp, push 기록 시 forward truncate, `restoreJournalEntry`(topIndex 비상승), `hasWrittenEntriesAbove`(session-write 한정) |
| `HistoryReconciler.ts` | Mutex 직렬 큐 + 1-op-per-iteration 수렴, expectation 기반 자기유발 popstate 식별, planNextOp(divergence 3분기 + stale-suffix 절단 + Adv-1), initializeFreshBoot/initializeRestored(저널 검증·시드), retain/release 수명주기, HistorySyncDesyncError/ReconcilerSuspendedError |
| `HistoryEntryJournal.ts` | sessionStorage 어댑터: flatted 단일 키 페이로드 `{version:1, entries:[[entryIndex,{state,path}]]}`, loadValidated/recordWrite(truncateAbove)/reset, 전 호출 내부 try/catch, warn 1회 |
| `historyState.ts` | State에 `entryIndex?` 추가(flatted 내부 — 구버전 양방향 호환), getStateStepId |
| `historySyncPlugin.tsx` | popstate→정식 액션 번역(체인 재생 포함), onChanged→requestReconcile(+defaultHistory staged setup 유지), onBeforePush/Replace는 path 채우기만, wrapStack retain/release |

보존된 기존 경로: overrideInitialEvents(리로드 복원·defaultHistory SerialNavigationProcess), ActivityActivationMonitor, RoutesProvider, HistoryQueueProvider(requestHistoryTick 계약), useHash.

## 2. 코어 동작 확정 사실 (구현의 전제 — 코어를 바꾸면 여기부터 재검토)

- `makeEvent(name, params)`: params에 id/eventDate가 있으면 **원본 보존** → 과거 enteredBy 스냅샷 spread 재디스패치 시 aggregate의 eventDate 정렬로 **역사적 위치에 삽입**, uniqBy(id)로 중복 제거. 복원 메커니즘의 근간.
- `aggregate`: eventDate 정렬 후 리듀스 — 디스패치 순서가 아니라 eventDate가 최종 상태 결정.
- **isActive는 eventDate가 아니라 activities 배열 슬롯 순서**의 마지막 entered (`aggregate.ts` 후처리). `findNewActivityIndex`는 같은 activityId 재push 시 기존 슬롯 재사용 → 슬롯 순서 ≡ 이벤트 날짜 순서 불변이 깨질 수 있음(FD9의 근거).
- Popped: 비exited 활동 1개뿐이면 no-op이지만 **이벤트는 기록됨**(prevented 감지·복원 정합에 활용). exit-done 직행 시 steps truncate + 가짜 STEP_POPPED.
- StepPopped: steps.length > 1일 때만 실제 제거. no-op이어도 이벤트 기록.
- `makeActivityFromEvent`: steps[0].id === activityId (첫 엔트리 stepId = activityId — identity 연속성).
- Replaced: victim은 replacer가 enter-done 전환 시점에 마킹. **in-place replace(기존 activityId 재사용, findTargetActivityIndices의 alreadyExisting 분기)는 victim을 영원히 미마킹**.
- withPauseReducer: pause 중 디스패치는 pausedEvents로 미뤄짐(stack.events 미기록) → prevented 감지가 pause 중엔 '막힘' 판정 — 의도된 동작(스택 동결 → reconcile이 원위치 복원).
- 코어 액션은 prevent 여부를 반환하지 않음 → **디스패치 성공 감지 = getStack().events 증가분의 name 검사** (dispatchChecked).
- react 통합: store.init()은 브라우저에서만 → onInit의 동기 초기 기록은 SSR 안전.

## 3. 결정 로그 — 본 사이클 (D1~D10)

- **D1**: 방향 판정을 entryIndex 비교로 (구 16진 id 사전순 비교는 자릿수 경계 버그). 레거시 state만 id 비교 폴백(±1 추정).
- **D2**: backward 복원 = actions.pop()(blocker 통과) + dispatchEvent(역사적 push). 복원 push는 상태 재구축이므로 의도적으로 pre-hook 미통과.
- **D3**: prevented 감지 = events 증가분의 이벤트 name 검사 (코어 무변경 하 유일한 동기 판정).
- **D4**: unknown 엔트리는 낙관적 일치 — 절대 재작성 금지(이전 세션 복원 타깃 보존).
- **D5**: enter-active Replaced victim drop 보정 (transition 중 신구 동시 포함 방지).
- **D6**: wrapStack effect 기반 retain/release dispose (리스너 누수 수정, StrictMode 안전 마이크로태스크 지연).
- **D7**: pause 중 브라우저 백 → 스택 동결 → reconcile 원위치 복원.
- **D8**: pushFlag/silentFlag/onPushed/onStepPushed/onReplaced/onStepReplaced/onBeforePop/onBeforeStepPop 전부 제거. 히스토리 기록은 오직 reconcile 경로.
- **D9**: victim-drop 일반화 — "그 Replaced 이벤트로 exitedBy 마킹된 활동이 아직 없으면" drop (transition interval 의존 flaky 1건을 사전 트레이스로 발견·해결). 라운드 2에서 "새 슬롯을 만든 Replaced에 한정"(이벤트 로그에서 같은 activityId 선행 진입 이벤트 부재)으로 재한정 — in-place replace 오발동(루트 파괴) 방지.
- **D10**: 기존 spec.ts 27건 이관 0건 — 48ms makeActionsProxy harness가 새 엔진과 비충돌(듀얼 인스턴스 새로고침 테스트 포함).

리뷰에서 추가된 수정: planNextOp 3분기(커서 vs 분기점 — 전진-후-재작성 경로 제거), KnownHistoryEntry.path(in-place replace의 URL 갱신 누락 해결 — 관찰-only는 path null로 비재작성 불변과 양립), replace-shrink stale suffix 절단(hasWrittenEntriesAbove), restored-step liveSteps 가드, retain 시 requestReconcile, MAX_NAVIGATION_DISPATCHES 소진 진단.

## 4. 결정 로그 — 후속 사이클 (FD1~FD10)

- **FD1**: 저널 페이로드에 anchor 필드 생략 (검증은 버전+현재 엔트리 식별자만 사용, 소비자 없음).
- **FD2**: 저널 시드는 knownEntries만, **topIndex는 currentIndex 캡** — 지식(복원용)과 존재 믿음(append 판정)의 분리. 리로드 직후 push가 이전 세션 forward 가지를 구버전처럼 pushState로 절단하는 의미론 보존. 물리 확인은 popstate 도착 시 learnEntry가 상승.
- **FD3**: Adv-1 조건을 path===null → provenance!=="session-write"로 일반화. 부팅·복원 디스패치는 원본 enteredBy.id 보존이라 비발동 보증 유지.
- **FD4**: lost-step 복원의 stepsToPop을 liveSteps-1로 클램프 (낙관 허구 거리의 과대 계산 보정 — 폴백 모드 멀티-back이 bounce trap 대신 정상 복원).
- **FD5**: 저널 인메모리 Map 진실원본 + persist 전량 덮어쓰기 → 실패는 "동결된 일관 스냅샷"만 가능, 다음 부팅 검증이 중재. 실패해도 비활성화하지 않음(일시 quota 자기치유).
- **FD6**: backward 비entered 분기 pop 수 = 현재 entered 활동 수 (기존 1회 고정의 멀티 점프 좀비 잔존 해소). 체인 dates < 세션 dates → Popped(now) k건이 정확히 세션 활동 k개 exit.
- **FD7**: 메모리 히스토리 감지 = `"index" in history` (history v5 MemoryHistory 전용 필드, 실측) → spec.ts 전 구간 저널 no-op.
- **FD8**: forward 체인 재생은 기존 fresh re-push 메커니즘 유지 (저널 지식으로 자연 확장 — 검증된 경로 보존).
- **FD9 (중요)**: backward 체인 재생 시 **forward 영역의 known 활동 슬롯도 구체화** — 역사적 Pushed + 즉시 skipExitActiveState Popped(dispatchEvent, 비preventable 상태 재구축). 근거: isActive의 슬롯 순서 의존(§2) 때문에, 구체화 없이 forward 재생하면 중간 활동이 새 슬롯 append + 착지 활동이 옛 슬롯 재사용 → 잘못된 활동이 active (B2 1차 red로 실증). 역사적 Pushed는 enter-done(과거 날짜), 합성 Popped는 exit-done — 렌더 플래시 없음. 재생 후 active==착지 가드.
- **FD10 (중요)**: Adv-1 divergence는 **in-place replaceState로만 해소** — 절단 경로(go 수반)로 보내면 index===currentIndex 조건이 커서 이동 순간 소멸해 go↔go 무한 진동 (B2 settle 실패로 실증). 절단 자격은 session-write divergence 한정.

## 5. 검증 상태 (HEAD = ad078638 기준)

- plugin-history-sync: 8 suites / **80 tests green** — blocker.spec 28(수용 스펙 + 회귀 3 + 후속 수용 4 해제분 + prevent/듀얼/스토리지), spec.ts 29(복구 2 포함, 48ms harness 그대로), react.spec 4(SSR/hydration), 유닛 4파일 19
- plugin-blocker: 37 green (§8/§7-1 구속 계약 포함). typecheck/biome(기존 warning 3건 외 무결)/build green
- 테스트 실행: `yarn workspace @stackflow/plugin-history-sync jest --watchman=false` (Watchman 소켓 권한 오류 환경 대응)

## 6. 커밋 맵 (feature/fep-2001, PR #719 — draft)

| 커밋 | 내용 |
|---|---|
| `2c1253c0` | 테스트 클랜징 (동어반복 fallbackActivity 테스트 + relay loadRef 테스트 제거 — **ad078638에서 메인테이너 요청으로 복구됨**) |
| `29200573` | 결정적 harness + 수용 스펙 14건 (it.failing 8) |
| `380ed94c` | reconciliation 엔진 (+1770/−614, failing 9건 해제 + 회귀 3건) |
| `6750b448` | 후속 수용 스펙 (sessionStorage/reload harness + it.failing 4) |
| `56a78723` | HistoryEntryJournal + provenance 보호 + 체인 재생 (failing 4건 해제) |
| `ad078638` | 테스트 2건 복구 (relay fixtures/devDeps 포함, 새 엔진에서 통과 확인) |

## 7. 리뷰 이력 요약 (재발 방지 참고)

- 본 사이클 3라운드: R1 Claude가 probe로 Major 2건(좀비 forward 가지·전진-후-재작성 전략, in-place replace victim-drop 오발동→루트 파괴) → R2 Codex가 인접 케이스에서 신규 Major(replace-shrink stale suffix 보존→안정 desync), Claude APPROVE와 충돌 → 오케스트레이터가 "관찰 가능 종단 결과 기준 회귀"로 차단 중재 → R3 양측 APPROVE. 모든 차단 probe는 회귀 테스트로 고정됨.
- 후속 사이클: 2단계 2라운드(가짜 red/green 불가 타깃/변형 누락 교정), 3단계 1라운드 양측 APPROVE (Claude P3/P5 probe로 "올바른 메커니즘" 분리 실증 — Obs-1은 저널 비의존 보호로, 충실도는 저널 지식으로).
- 교훈: ① it.failing 스펙은 flip 실험으로 "올바른 이유의 red + 구현 후 green 가능"을 검증할 것 ② "레거시 패리티" 논거는 종단 결과까지 추적할 것 ③ 인접 변종(replace-shrink 같은)을 probe로 칠 것.

## 8. 알려진 한계 / 열린 항목

- **루트 엔트리 in-place 재작성 절단 불가** (push 발판 부재) — 레거시 패리티, 주석 문서화. 루트 활동에 스텝을 쌓고 replace 후 forward하는 초엣지에서 desync 가능(레거시도 동일 입력에서 미수렴).
- **저널 지식 범위**: 탭 단위(sessionStorage), 이 앱이 기록한 엔트리만. 범위 밖 점프는 착지 스냅샷 복원으로 저하.
- 계약 밖: 외부 코드의 동일 History 조작, 과거 activityId 직접 push, 비활성 활동 in-place replace (ordering note 참조).
- 비차단 관찰(후속 리뷰 O1~O4): Adv-1 refresh 시 보호 엔트리의 session-write 전환(무해 확인), FD9 합성 이벤트의 플러그인 가시성(D2 동급), forward 가지 존재 시 formal pop의 exit 귀속이 로그상 코스메틱 어긋남(최종 상태 정확), warnOnce가 진단 범주 통합 1회.
- 선택 제안(O6): 점프 경로에 스텝 엔트리가 끼는 변형(probe P4 green)의 정식 스펙 승격.
- 남은 작업 후보: changeset 작성(release용 — 아직 없음), PR ready 전환, 코어 개선 별도 이슈(중첩 dispatch 큐잉, 재진입 계약 문서화).
