# FEP-2001 — 솔루션 기획

## 1. 본 사이클: reconciliation 엔진

### 구성 요소

1. **Desired entries** — reconcile 시점의 최신 스택에서 계산: entered(enter-active/enter-done) 액티비티들을 enteredBy.eventDate 순으로 정렬해 live steps를 펼친 엔트리 리스트 `[{identity: {activityId, stepId}, path, state}]`. 첫 스텝 엔트리는 step 필드를 생략해 레거시 state 모양을 유지. enter-active Replaced 액티비티의 직전 생존자 drop 보정 포함(victim이 transition 완료 전 미마킹인 코어 동작의 선반영 — 단, **새 슬롯을 만든 Replaced에 한정**: in-place replace(기존 activityId 재사용)는 코어가 victim을 영원히 마킹하지 않으므로 drop 미적용).
2. **Actual model** (`BrowserHistoryEntryModel`) — 절대 entryIndex 좌표계의 부분적(partial) 브라우저 히스토리 모델: knownEntries Map(identity + state + 기록 path), currentIndex, topIndex(존재를 믿는 최고 인덱스), anchorIndex(desired[0]의 절대 인덱스), outOfApp 플래그. entryIndex는 history state(flatted 직렬화 내부)에 영속 — 구버전 state와 양방향 호환.
3. **Reconciler** (`HistoryReconciler`) — Mutex 직렬 큐 + **1-op-per-iteration 수렴 루프**: 매 반복 desired/actual을 재계산하고 연산(go/pushState/replaceState) 1개만 실행 → 패스 도중 끼어드는 popstate/재진입 디스패치를 다음 반복이 흡수. 자기 유발 popstate는 **expectation**(go 발행 전 등록, 직렬 큐라 깊이 1)으로 식별 — silentFlag 대체. requestHistoryTick 어댑터로 기존 컨텍스트 계약 유지.
4. **popstate → 정식 액션 번역** — 방향 판정은 entryIndex 비교(레거시 state만 id 비교 폴백). backward(타깃 entered)는 활동 단위 `actions.pop()` 루프 + 동일 활동 내 `stepPop()` 루프 — **전부 pre-hook(blocker preventDefault) 통과**. prevent 감지는 이벤트 로그 증가분의 name 검사(코어 무변경 제약 하 유일한 동기 판정 수단). backward(타깃 미지·리로드 후)는 pop(preventable) + 스냅샷 역사적 재생(dispatchEvent — 사용자 내비게이션이 아닌 상태 재구축이므로 의도적으로 pre-hook 미통과). forward는 known 중간 엔트리 순차 재생(각각 preventable), unknown은 낙관 skip. **처리 후 무조건 requestReconcile** → prevent 시 스택 불변이므로 reconciler가 브라우저를 자동 복원.
5. **트리거** — onChanged + popstate 처리 직후. onBefore*는 path 채우기(순수 param override)만. pushFlag/silentFlag/onPushed/onStepPushed/onReplaced/onStepReplaced/onBeforePop/onBeforeStepPop 전부 제거.

### 정렬(alignment)·절단 규칙

- 불변식: desired D(m개)는 절대 인덱스 [anchor, anchor+m-1]을 점유, 수렴 후 커서 = anchor+m-1.
- 미지 엔트리는 낙관적 일치로 간주하고 절대 재작성하지 않음(이전 세션 복원 타깃 보존). anchor 미만(외부 엔트리)은 불가침. anchor는 backward 복원 성공 시에만 `착지인덱스 - (m_new - 1)`로 하향 확장.
- divergence(known 엔트리의 identity ∪ 기록-path 불일치) 처리 3분기: 커서 > 분기점 → go 후진 + replaceState(위쪽이 여전히 desired인 케이스의 per-entry 수선) / 커서 == 분기점 → in-place replaceState(실브라우저 의미론) / 커서 < 분기점(죽은 forward 가지) → go(분기점-1) + **pushState 재구축으로 가지 절단**.
- 절단 강화: divergence가 desired **마지막** 엔트리이고 그 위에 이번 세션 기록 엔트리가 잔존하면(replace-shrink) push 재구축으로 stale suffix 절단. 루트(anchor)는 push 발판이 없어 in-place 유지(레거시 패리티, 문서화된 한계).
- 예외 3분류는 02-direction §2-6 참조. unexpected는 go 타임아웃(10s)/수렴 상한(100회)/out-of-range go 사전 차단.

### 수용 기준 (2단계 산출, blocker.spec)

결정적 harness(고정 sleep 금지): isolated window shim(pushState forward-truncate/popstate 비동기 발화 등 실브라우저 의미론), settle = 17ms/샘플 × 연속 2회 안정(core interval 16.67ms 초과) + 상한 60회 throw, 실제 `stackflow()` 사용, 단언은 관찰 가능 계약만(URL, entry delta, active params, 공개 콜백 — history.index/내부 flag/큐잉 순서 금지).

`it.failing`으로 스펙화 후 구현에서 해제(9건): 브라우저 back의 blocker 경유+복원, proceed replay 동기화, rapid back 수렴, step back 복원, 차단된 pop/stepPop 무desync, 프로그래밍 proceed, 재진입(onBlocked 내 push), go(n) 멀티 점프. 현 엔진 충족분은 일반 it(차단 push/replace/step* 무desync, back/forward 수렴, pause/resume 일괄 수렴, fallbackActivity 실경로 1회, C군). 리뷰 probe는 회귀 테스트로 고정(좀비 forward 절단, in-place replace 루트 보존, replace-shrink 절단).

## 2. 후속 사이클: HistoryEntryJournal (확정 설계 §1~6)

1. **저널**: 이번 탭 세션에서 이 앱이 기록한 엔트리들(entryIndex, 식별자, enteredBy 스냅샷 포함 state, canonical path)의 영속 기록. sessionStorage(탭 단위 — 히스토리와 수명 일치), historyState와 동일한 flatted 직렬화, 단일 키 전량 덮어쓰기(부분 상태 불가). 어댑터 패턴: memory history/SSR/스토리지 불가 → no-op.
2. **부팅**: 저널을 현재 엔트리와 검증(버전 + 현재 entryIndex의 저널 기록 식별자 ↔ location.state 식별자) → 유효하면 **모델만** journal-known으로 풀 시드. 스택 복원은 현행 유지(부팅 UX 무변경). 무효/부재/예외 → reset + 현행 낙관 부팅 폴백.
3. **재작성 자격 축소 (Obs-1 구조적 해결)**: identity-divergence에 의한 재작성/절단 자격을 **provenance === "session-write"**(이번 세션이 직접 기록)로 한정. journal-known·관찰-only(observation) 엔트리는 복원 타깃으로 보호 — **관찰되어도 보호가 풀리지 않음**. Adv-1 규칙(현재 엔트리 ∧ enteredBy.id 불일치 시 refresh)은 유지. 부팅 낙관 허구는 그대로 두되 보호 확대로 무해화. **저널 없는 폴백 모드에서도 관찰-only 보호가 동작**(양 모드 해결).
4. **멀티 점프 체인 재구성**: backward 점프로 journal-known 영역 착지 시 착지 이하 연속 known 체인을 역사적 재생(+ entered 활동 수만큼 formal pop — preventable). forward 점프는 기존 known-중간 재생 경로가 저널 지식으로 자연 확장. 폴백 모드는 착지 엔트리 1건으로 자연 축퇴(기존 동작 + 보호).
5. **예외 정책**: 저널 read/write/quota/SecurityError/검증 불일치 = expected → 1회성 진단 + 폴백. 저널 호출은 전부 내부 try/catch로 reconcile 경로와 격리. 콜드 스타트(부재)는 정상이므로 무진단.
6. **경계**: 듀얼 인스턴스(동일 history 위 두 stackflow)에서 저널 충돌은 부팅 검증 실패 → 폴백이 안전망. 무관 키 비간섭(reset은 자기 키만). 다른 코드의 히스토리 조작은 계약 밖 — 검증 실패 → 폴백.

### 수용 기준 (후속 2단계 산출)

harness 확장: sessionStorage shim(연산 fault 주입 + 부재 + **프로퍼티 접근 자체 throw**(SecurityError)) + `reloadHarness()`(동일 history/storage 위 인스턴스 재생성). `it.failing` 4건: A1(journal 모드 Obs-1 — prevent 후 granularity 보존), A2(폴백 모드 동일 — 저널 없이 보호만으로), B1(cross-reload backward go(-n) 체인 충실도 — activityCount + pop 도달성), B2(cross-reload forward go(+n) 체인 재구성). 일반 it: backward/forward × prevent 복원, 듀얼 인스턴스 × 스토리지, 저널 라이프사이클 4종(무관 데이터/부재/연산 throw/접근 throw).

### 의도적으로 풀지 않은 것 (문서화된 한계)

- 루트 엔트리 in-place 재작성의 절단 불가(레거시 패리티).
- 저널 지식 범위 밖(스토리지 클리어 등) 점프는 착지 스냅샷 복원으로 우아한 저하.
- 사용자가 과거 activityId로 직접 push/비활성 활동 in-place replace하는 케이스는 계약 밖(ordering note에 명시).
