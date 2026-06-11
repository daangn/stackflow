# FEP-2001 — 문제 인식 및 정의

> 이 worklog는 FEP-2001(plugin-history-sync preventDefault 지원) 작업의 인계 문서다.
> 문서 순서: 01-problem(문제) → 02-direction(방향성) → 03-solution(솔루션 기획) → 04-implementation(구현 맥락).
> 작업 산출물: PR #719 (feature/fep-2001), 커밋 6개. 상태는 04 문서 말미 참조.

## 1. 원 이슈 (Linear FEP-2001)

`plugin-history-sync`는 `preventDefault`와 합성될 수 없었다. `plugin-blocker`(액티비티 이탈 제어, FEP-1530)와 함께 쓰려면 해결이 필요했다.

### 문제 1: 브라우저 뒤로가기의 pop을 preventDefault할 수 없음

popstate 핸들러가 backward/step-backward 판정 시 `dispatchEvent("Popped"/"StepPopped")`를 직접 발행했다. `dispatchEvent`는 pre-effect 훅(`triggerPreEffectHook`)을 거치지 않으므로, 다른 플러그인이 `onBeforePop`에서 `preventDefault()`를 호출해도 효과가 없었다.

### 문제 2: 프로그래밍적 pop() 시 history desync

`onBeforePop`/`onBeforeStepPop`/`onBeforeReplace`가 **prevent 여부가 결정되기 전에** `history.back()` 틱을 비동기 큐에 등록했다. 이후 다른 플러그인이 prevent하면 스택은 불변인데 큐의 back()은 실행됨 → URL과 스택의 영구 불일치.

### 문제 3: 브라우저 앞으로가기 prevent 시 desync + pushFlag 오염

forward 판정 시 `pushFlag += 1` 후 `push()`를 호출했는데, push가 prevent되면 ① 브라우저 URL은 이미 이동했는데 스택은 불변 ② `pushFlag`는 `onPushed`에서만 차감되므로 누수되어 **다음 정상 push의 history sync가 삼켜지는 연쇄 desync**.

### 문제 4: 훅 실행 순서 의존성

pre-effect 훅은 순차 실행되며 prevent돼도 이미 실행된 훅의 부수효과는 롤백되지 않는다. plugin-history-sync가 먼저 등록되면 back() 큐잉 후 뒤늦게 prevent되는 구조.

## 2. 설계 검토에서 추가 발견된 심층 제약

이슈에 없었으나 솔루션을 결정지은 제약들:

### 재진입 (reentrancy)

core의 `dispatchEvent`는 post-effect 훅을 **동기 실행**한다. 훅 체인 중간에 누군가 push/pop을 호출하면 중첩 dispatch의 전체 훅 체인이 바깥 이벤트의 남은 훅들보다 먼저 완료된다. 결과:
- 훅 실행 시점의 `getStack()`은 자기 effect보다 **미래 상태**일 수 있다 (effect 페이로드는 스냅샷이라 안전).
- **훅 시점에 히스토리 연산을 큐잉하면 큐 순서 ≠ 이벤트 순서**가 된다. pre/post 어디에 두든 마찬가지 — 기존 코드도 back()은 pre, pushState는 post에 있어 거울상의 순서 역전 버그를 갖고 있었다.

### steps truncate와 가짜 STEP_POPPED

`makeActivityReducer`의 Popped 리듀서는 exit-done 직행 시(`skipExitActiveState`(= `pop({animate:false})`, 스와이프백), transitionDuration 경과, pause-resume) `steps`를 `[steps[0]]`로 truncate한다. 이때 `produceEffects`의 step diff가 **가짜 STEP_POPPED 효과를 N-1개 방출**한다. 따라서 effect 페이로드 기반의 "pop된 엔트리 수" 계산은 신뢰 불가.

### 기타 기존 결함 (작업 중 함께 해소)

- 방향 판정이 16진 id의 **사전순 비교**라 자릿수 경계에서 오판 가능.
- 멀티 엔트리 점프(`go(-n)`, 히스토리 길게 누르기)에 popstate 1회 → Popped 1회만 발행되어 여러 액티비티를 건너뛰면 미수렴.
- 플러그인이 history 리스너를 해제하지 않는 누수.

## 3. 후속 사이클에서 추가된 문제 2건 (같은 PR에서 해결)

본 사이클 리뷰 과정과 최종 브리핑에서 식별되어, 메인테이너 결정으로 PR #719에 포함:

### Obs-1: 리로드 경계 너머 backward 복원이 prevent되면 관찰-only 엔트리 재작성

리로드 시 플러그인은 현재 엔트리의 state만으로 스택을 복원한다(중간 스텝 미복원, 예: X[s0,c] — 물리 히스토리는 [s0, b, c]). desired↔인덱스 매핑은 "s0가 k-1에 있다"는 **낙관적 허구**로 부팅되며, 평소엔 unknown 보호(미지 엔트리 비재작성)와 복원 성공 시 anchor 재조정으로 무해하다. 그러나 ① back popstate로 b가 **관찰**되어 known이 되면 보호가 풀리고 ② blocker가 stepPop을 prevent하면 anchor가 허구에 고착되어 ③ reconcile이 b를 s0로 **재작성** → 이전 세션 스텝 엔트리 영구 소실(이후 back이 b를 건너뜀 — back granularity 손실). 안정 desync는 아니지만 복원 타깃 파괴.

### 멀티 엔트리 점프의 unknown 영역 한계

History API는 go(±n)에서 착지 엔트리의 state만 제공한다(중간 엔트리 정보 없음). 본 사이클 엔진은 **이번 세션 기록 범위**의 점프를 정확히 수렴시키지만, unknown(리로드 이전 기록) 엔트리가 경로에 끼면 backward는 착지 스냅샷만 재생, forward는 unknown 중간을 낙관 skip → 수렴은 유지되나 **스택 충실도**(중간 액티비티/스텝 체인)가 손실된다. 두 문제의 공통 뿌리는 "리로드 후 모델이 자기 히스토리를 모른다"이다.

## 4. 문제의 분류 (수용 기준의 근거)

1. **합성 불가 부류**: 브라우저 발 내비게이션이 플러그인 파이프라인(onBefore*/preventDefault)을 우회 — 문제 1.
2. **안정 desync 부류**: 지원되는 내비게이션(액션 호출, back/forward 버튼)으로 도달 가능한, settle 후에도 지속되는 URL↔스택 불일치 — 문제 2, 3, replace-shrink(리뷰 중 발견), 좀비 forward 가지(리뷰 중 발견).
3. **충실도 부류**: 수렴은 하나 스택/히스토리의 정보가 손실 — Obs-1, 멀티 점프 한계.

수용 기준은 이 분류를 따른다: 1·2는 구조적으로 불가능해야 하고, 3은 저널 지식이 있는 한 복원되며 없으면 우아하게 저하되어야 한다.
