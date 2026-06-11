# FEP-2001 — 방향성 설정

## 1. 기각된 접근과 기각 사유

### (a) 델타 패치 접근 — 기각

최초 제안: history 부수효과를 onBefore* → post-effect 훅으로 이동 + core 액션이 `{ isPrevented }` 반환 + POPPED effect에 pop 직전 스냅샷(`prevActivity`) 추가 + prevent 시 entryIndex 기반 `history.go(delta)` 복원.

기각 사유 (검토 중 단계적으로 드러남):
1. **steps truncate**: exit-done 직행 시 steps가 `[steps[0]]`로 잘려 post 훅의 effect에서 popCount를 계산할 수 없음 (`pop({animate:false})`·스와이프백 등 흔한 경로). prevActivity 스냅샷으로 보완 가능하지만 —
2. **재진입이 치명타**: post 훅 동기 실행 하에서 훅 시점 큐잉은 큐 순서 ≠ 이벤트 순서를 보장할 수 없다 (pop 처리 중 다른 플러그인이 push하면 [pushState(B), back×N]으로 역전). pre/post 어느 쪽에 둬도 거울상 버그. "이벤트별 명령형 델타를 훅 시점에 큐잉"하는 패러다임 자체가 재진입 하에서 성립 불가.

### (b) effect 버퍼링 접근 — 기각

델타를 유지하되 effect를 버퍼에 모아 이벤트 순서로 드레인. 순서 문제는 해결되지만 pushFlag/silentFlag 류 플래그 기계와 prevent 복원 로직이 전부 존속 — 이슈의 목표가 "안정화"인데 버그가 자라던 토양(플래그 동기화)을 남김.

### (c) 채택: reconciliation 패러다임

브라우저 히스토리를 React의 DOM처럼 **렌더 타깃**으로 취급. 이벤트→연산 번역을 버리고, "스택이 요구하는 히스토리 모습(desired)"과 "실제 브라우저 히스토리 모델(actual)"을 비동기 직렬 큐에서 수렴시킨다. 효과:
- 훅에서 히스토리 연산 자체가 사라짐 → 재진입·순서·플래그 문제가 **설계상 비존재**.
- reconcile은 드레인 시점의 최신 스택만 읽음 → 중간 상태 자연 붕괴.
- prevent 복원이 별도 로직이 아니라 수렴의 자연 결과 (스택 불변 → browser↔stack 차이 감지 → 자동 복원).
- popCount 계산 자체가 소멸 (desired에 없는 엔트리는 actual 모델이 제거량을 앎).

## 2. 결정 원칙 (이후 모든 판정의 기준)

1. **core 무변경**: 이슈 범위에서 `@stackflow/core`는 건드리지 않는다. 코어 동작(재진입, truncate, 슬롯 순서 등)은 제약으로 수용하고 플러그인 쪽에서 해결. 코어 개선(중첩 dispatch 큐잉 등)은 별도 이슈 후보.
2. **공개 API 불변 + 캡슐화**: historySyncPlugin 옵션(routes/config, fallbackActivity, useHash, history, urlPatternOptions), HistoryQueueContext 계약(requestHistoryTick), SSR/defaultHistory staged setup 경로, 부팅 UX(리로드 후 현재 액티비티만 복원) 전부 보존. 새 내부 모듈은 비export.
3. **판정은 관찰 가능한 종단 결과 기준**: "레거시도 그랬다(패리티)"는 엔트리 잔존 같은 중간 상태가 아니라 **사용자가 관찰하는 최종 결과**(URL↔화면)까지 추적해야 성립한다. 본 사이클 리뷰에서 이 원칙으로 replace-shrink 결함의 차단 여부를 중재했다 (레거시는 같은 입력에서 기이하게나마 수렴했으므로 새 엔진의 안정 desync는 회귀).
4. **수용 기준 = "지원 내비게이션으로 도달 가능한 안정 desync의 제거"**: forward/back 버튼·go(n)·액션 호출·blocker prevent/proceed 조합으로 도달 가능한 모든 상태에서 settle 후 URL↔스택 일치.
5. **낙관 보존 불변**: 모델이 모르는(이전 세션) 엔트리는 복원 타깃이므로 절대 덮어쓰지 않는다. 후속 사이클에서 "관찰되었다고 보호가 풀리지 않는다"로 강화됨 (재작성 자격 = 이번 세션이 직접 기록한 엔트리).
6. **예외는 3분류**: expected(값/플래그로 처리 — prevent, 미지 엔트리, out-of-app, pause, 저널 실패), unexpected(`HistorySyncDesyncError` — 진단 + 1회 resync + give-up, 삼킴 금지), teardown(`ReconcilerSuspendedError` — 무음 정상 경로).

## 3. 프로세스 방향 (협업 구조)

메인테이너 지시로 3단계 × 다중 세션 구조 채택. 각 단계 산출물은 커밋 1개.

1. **테스트 클랜징**: 리뷰 세션 2개(Claude/Codex)가 독립 전수 리뷰 → 판정 불일치는 1라운드 토론으로 수렴 → 오케스트레이터 확정 → 작업자가 정리.
2. **테스트 작성 (TDD)**: 작성자(Codex) ↔ 리뷰어(Claude) 루프. 목표 동작은 `it.failing`으로 스펙화해 suite를 green으로 유지하고, 구현 단계에서 해제하는 것이 수용 기준. 리뷰어는 **flip 실험**(failing→it 치환 후 실패 지점 확인)으로 "올바른 이유로 red인지"를 전수 검증 — 가짜 red(셋업 오류로 죽는 테스트)와 green 불가능한 거짓 타깃을 차단.
3. **구현**: 작성자(Claude) ↔ 이중 리뷰(Claude + Codex), 양측 APPROVE까지 루프, 충돌은 오케스트레이터 중재. 리뷰는 **probe 실증주의**: 차단 판정은 재현 probe를 동반하고, 승인된 probe는 회귀 테스트로 고정.

### 구속력 정의

- plugin-blocker 스펙 §8(proceed = 신규 디스패치로 전체 파이프라인 재통과) + §7-1(무재진입)은 **구속력 있는 생태계 계약** — FEP-2001 합성의 전제.
- §7-2(블로커 간 세부 알림 순서)는 advisory.
- 기존 historySyncPlugin.spec.ts의 단언(URL, entry 수, 스택 end-state)은 보존 대상 계약. `history.index` 단언은 "entry 수 = back 가능 횟수"로 관찰 가능하므로 유지.

## 4. 후속 사이클 방향 (Obs-1 + 멀티 점프)

두 문제의 공통 뿌리("리로드 후 모델이 자기 히스토리를 모름")에 대해 **HistoryEntryJournal**(sessionStorage 영속화)을 도입하되, 검증된 reconciler 불변을 보존하는 **보수적 통합**을 채택:

- 부팅 시 **모델만** 저널로 풀 시드. 스택 복원(overrideInitialEvents)은 현행 유지 — 전체 스택 부팅 복원 대안은 리로드 시 하위 액티비티 로더/마운트가 전부 실행되는 UX 변화라 기각.
- anchor 연속성 불변과 낙관적 부팅 허구는 유지하고, 대신 **재작성 자격을 provenance(session-write)로 축소**해 허구를 무해화 — Obs-1은 저널 유무와 무관하게(폴백 모드 포함) 해결되어야 함.
- 멀티 점프는 저널 스냅샷의 **역사적 재생**(원본 id/eventDate 보존 재디스패치 — 기존 복원 메커니즘의 확장)으로 체인 충실도 복원.
- 저널 실패는 expected → 진단 동반 폴백. 폴백 모드는 기존 동작으로 자연 축퇴.

프로세스는 동일하되 1단계(클랜징) 생략, 리뷰어 추가 포커스: 2단계 "이슈를 테스트로 온전히 표현했는가", 3단계 "이슈를 온전히 해결했는가"(모드 한정/부분 수정 검출).
