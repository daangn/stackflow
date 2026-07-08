# Run Plan — PR #723 (FEP-2548 create/load 구분 메커니즘) 리뷰

## 1. 과제 스펙 · 판단 기준

### 과제 스펙

GitHub PR #723 (`feat(core): create/load distinction mechanism for snapshot restoration`, base `main` ← head `feature/fep-2548`)를 리뷰한다. head branch가 현재 worktree(`/Users/anakin/Programming/stackflow--feature-fep-2548-wt`)에 checkout돼 있다.

- **리뷰 범위 = PR의 `main...HEAD` diff.** 로컬 워킹트리의 미커밋 변경은 범위 밖.
- 산출물의 성격: `@stackflow/core`에 create(신규 생성) vs load(스냅샷 복원) 구분을 **순수 additive 플러그인 계약**으로 도입. 신규 공개 표면 = `StackSnapshot`/`NavigationEvent` 타입, `actions.captureSnapshot()`, 플러그인 훅 `provideSnapshot`/`onLoadError`, `SnapshotLoadError`, `onInit`의 `initializedBy` 인자.
- 핵심 참조 문서(둘 다 branch에 동거): 설계 `design-fep-2548-init-load-mechanism.md`, 요구사항 정본 Linear FEP-2548 코멘트 `comment-3dbff893`(R1–R13·완료정의·비목표·설계이연).

### 이번 작업 고유 판단 기준 (role 중립 — reviewer에겐 리뷰 포커스)

이 PR이 다음 둘을 **모두** 충족하는가:

1. **설계 충실성** — `design-fep-2548-init-load-mechanism.md`의 메커니즘을 충실히 구현했는가:
   - §3 공개 계약(스냅샷 형식·`captureSnapshot`·`provideSnapshot`·`onLoadError`·`initializedBy`·create 가로채기 지점)
   - §4 생성 시퀀스와 재기저 규칙 RB1–RB5
   - §5 불변식 C1–C4 / N1–N2 / L1–L6
   - §8 스냅샷 형식 결정, §3.1의 "값 변환 허용·집합 가정 금지" 계약
2. **요구사항 충족** — Linear FEP-2548 `comment-3dbff893`을 전수:
   - R1–R13 각각 (소스 불문 load / 이진 분류 / 동기 load / 명시적 에러 / 공급자 1차 처리 / create 가로채기·load 비대상 / 일회성 신호 / non-breaking / 단일 스냅샷 자리 / 왕복 폐쇄 / 충실 재구성 / 복원 범위 / codec 소비자 책임)
   - **완료정의**: persister 역할을 흉내낸 테스트 플러그인이 core API만으로 load 경로를 탈 수 있는가
   - **비목표**가 실수로 구현·누출되지 않았는가
   - **설계이연** 4항이 구현 메커니즘으로 실제 해소됐는가

### 범위·고도 화해 조항 (필수 — 오지적 방지)

리뷰어는 아래를 준수한다. **범위 밖 항목을 결함으로 지적하면 안 된다.**

- **범위 안(결함으로 지적)**: 설계 메커니즘 이탈, 요구사항 미충족, 공개 계약 불일치, 조용한 실패/폴백, non-breaking(R8) 위반, 근거 없는 설계 이탈, 비목표의 우발적 구현·누출.
- **범위 밖(결함 아님 — PR이 명시적으로 이연/비목표로 선언)**:
  - `provideSnapshot`/`onLoadError` 훅 **자체가 throw**할 때의 동작 — 설계가 미정의로 남긴 것(PR 노트 open question 1).
  - 설계 문서의 "all-popped history" 예시의 부정확성 — 메커니즘(`empty-navigation`)은 건전(PR 노트 open question 2).
  - 설계 문서·run plan·glossary가 branch에 동거하는 것과 머지 전 문서 큐레이션·주석 sweep — 문서 관리 항목이지 코드 결함 아님.
  - 선언된 비목표: late load / create 하위 세분화의 core 어휘화 / 구분의 지속 속성화 / react 앱 개발자 향한 신규 표면 / 스냅샷 버전 마이그레이션.
- **실측 의무(타입 헤비 계약)**: 타입·빌드·테스트 주장은 추론 단정이 아니라 `yarn typecheck`(tsc)·`yarn build`·`yarn test`(core)의 **실제 실행 결과**로 확정한다. 최소 두 리뷰어가 실측을 수행한다.

## 2. 워크플로우

**review-loop** (`~/.agents/orchestration/workflows/review-loop.md`) — **run 한정 review-only 오버라이드**.

- 산출물(PR)은 이미 작성돼 있고 저자는 run 밖(사용자 본인)이다. 따라서 이 run은 review-loop의 **리뷰 게이트 절반만** 실행한다: worker 슬롯을 바인딩하지 않고, reviewer fan-out → 판정 → 오케스트레이터 종합에서 **종료**한다.
- **종료 조건(오버라이드)**: reviewer 전원 판정 제출 + 오케스트레이터가 중복 제거·심각도 종합한 **통합 판정문**(차단 집합 = 잔존 Critical/Major, 비차단 = Minor/Advisory, 최종 APPROVE/REQUEST_CHANGES) 산출. 수정·재리뷰 라운드는 이 run의 범위 밖 — 차단 지적은 저자(사용자)에게 회부된다.
- **판정 어휘**: reviewer 카드의 출력 계약 그대로(통과=`APPROVE` / 차단=`REQUEST_CHANGES`, Critical/Major 잔존 시 차단). 심각도 분기(같은 사실을 리뷰어가 다른 심각도로 낼 때) 처리는 오케스트레이터 종합이 higher-severity를 차단 집합으로 삼고 corroboration을 중립 전달한다.
- **확장 경로(결정점)**: 저자가 리뷰에 그치지 않고 **차단 지적 수정까지** 원하면 worker 슬롯을 바인딩해 표준 review-loop(작성↔리뷰 루프)로 승격한다 — 이 경우 이 오버라이드는 해제된다.

## 3. 세션 테이블

| 논리 세션명 | 슬롯 | role | 런타임 | 모델 | 세부 지침 | lens |
|---|---|---|---|---|---|---|
| spec-reviewer-claude | reviewer | reviewer | Claude | 기본 | 판단 기준 1(설계 충실성 §3–§5·RB·불변식) + 2(요구사항 R1–R13·완료정의·비목표·설계이연) 전수. 설계 문서·Linear 코멘트를 나란히 놓고 대조. | design |
| spec-reviewer-codex | reviewer | reviewer | Codex | 기본 | spec-reviewer-claude와 동일 포커스 — 사용자가 명시한 1차 rubric에 교차 런타임 합의 게이트. | design |
| correctness-reviewer-codex | reviewer | reviewer | Codex | 기본 | `loadSnapshot.ts`·`makeCoreStore.ts` 분기·`rebase` 수학(RB1–RB5 경계·퇴화 창·정밀도)·`captureSnapshot` 정규화·구조검사 깊이(payload 결손 이벤트)·중복 id 경계에 대한 적대적 버그 헌트. 타입 주장은 `yarn typecheck` 실측, 스위트는 `yarn test`(core) 실행 후 계약 커버리지 공백 식별. | implementation, test |
| ecosystem-reviewer-claude | reviewer | reviewer | Claude | 기본 | R8 non-breaking 전수 — core 외 변경 0 확인, `onInit` 소비자 6종·`overrideInitialEvents` 소비자·`StackflowActions` 생성부 무영향, 소비자 3인(persister FEP-2546·guard FEP-2521·history-sync FEP-2001) 성립 논증(§7) 검증. `yarn build` 전 패키지 + `yarn typecheck` 레포 전체 실측(무거운 빌드는 동시 경합 시 flake 유의 — 재현되면 quiescent 재실행으로 환경/제품 구분). | react, codebase-analysis |

- fan-out 해석: 4행 모두 reviewer 슬롯의 fan-out(같은 대상=PR을 다른 포커스·다른 런타임으로 독립 리뷰). spec 포커스는 Claude+Codex 2명 합의 게이트, correctness·ecosystem은 각 1명(런타임을 교차 배치해 pool 전체가 2 Claude + 2 Codex).
- 각 reviewer는 reviewer 카드 출력 계약대로 `APPROVE`/`REQUEST_CHANGES` + 번호매긴 차단 지적(심각도·file:line·근거·요구 변경)을 낸다.

## 4. 인라인 자산 정의

해당 없음 — 워크플로우(review-loop)·role(reviewer)·lens(design/implementation/test/react/codebase-analysis) 전부 자산 재사용. review-only는 run 한정 절차 오버라이드(2절)이지 신규 워크플로우가 아니다.

## 5. 설계 메타

- **적용된 디폴트**:
  - 워크플로우: review-loop를 **review-only로 오버라이드**(worker 미바인딩) — 산출물이 run 밖에서 이미 작성됨. → 결정점: 수정까지 원하면 worker 추가로 full loop 승격.
  - reviewer 인원·구성: spec rubric에 **합의 게이트 슬롯 디폴트**(2명 Claude+Codex) 적용 + correctness(Codex)·ecosystem(Claude) 전문 커버리지 2명 = 총 4명.
  - 런타임: 교차(2 Claude + 2 Codex). 모델: 미지정(런타임 기본 — 프롬프트에 모델 지정 없음).
  - lens: 자산 lens 바인딩(design / implementation+test / react+codebase-analysis).
- **설계 근거**:
  - 이미 존재하는 산출물의 **품질 게이트**이므로 review-loop 계열이 적합하나, in-run worker가 없어 리뷰 게이트만 실행(review-only).
  - 사용자가 명시한 두 rubric(설계 충실성·요구사항)이 crown-jewel 기준이라, 여기에 **교차 런타임 합의 게이트**(Claude+Codex)를 직접 걸었다.
  - PR이 **타입 헤비 플러그인 계약**(스냅샷 타입·훅·NavigationEvent union)이자 **플러그인 생태계**(loader·history-sync·devtools 등이 core 계약을 소비)를 건드리므로, correctness 리뷰어에 컴파일 실측 의무를, ecosystem 리뷰어에 참조모듈/DX 전수(소비자 non-breakage)를 각각 전담시켰다.
  - 범위·고도 화해 조항으로 PR이 명시 이연한 open question·비목표를 오지적에서 제외 — round/verdict 낭비 방지.
- **메모리 반영** (`~/.agents/orchestration/memory/`):
  - `empirical-behavioral-review-catches-input-defects-logic-review-approves` (seen 5) → 교차 런타임 게이트 유지 + 최소 2명 실측(빌드/테스트 실행) 의무화.
  - `typeheavy-design-impl-gate-must-compile-not-reason-tsc-beats-review-by-inspection` (seen 2) → 타입 주장은 tsc/build 실측, 추론 단정 금지를 판단 기준·correctness 세부 지침에 명시.
  - `plugin-ecosystem-review-needs-reference-module-and-ux-lenses` (seen 1) → ecosystem(참조모듈/DX) 리뷰어 슬롯 추가(소비자 3인 성립·전 패키지 빌드). UX 리뷰어는 이 PR이 UI 무변경(순수 core 계약)이라 제외.
  - `fanout-reviewer-severity-split-corroboration-relay-blocking-set` (seen 2) → 종합 시 심각도 분기는 higher-severity를 차단 집합, corroboration 중립 전달(오케스트레이터 종합 규율).
  - `planning-run-needs-mechanism-altitude-reconciliation-clause` (seen 3, 이미 `lenses/plan.md`로 자산화) → 메타패턴(고도/범위 화해)을 impl 리뷰용 **범위 화해 조항**으로 적용(plan 렌즈 자체는 impl 리뷰라 미부착).
  - `fanout-empirical-reviewers-concurrent-heavy-suite-contention-flake` (seen 2) → 전 패키지 빌드 동시 실측 경합 flake 가능성을 ecosystem 세부 지침에 선제 명시(재현 시 quiescent 재실행).
