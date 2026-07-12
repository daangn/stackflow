# Run Plan — FEP-2546 탐색 맥락 보존 플러그인 구현 (설계서 → @stackflow/plugin-stack-persistence)

## 1. 과제 스펙 · 판단 기준

### 과제 스펙

확정 설계서 `docs/design/fep-2546-navigation-context-persistence.md`(2026-07-12 확정)대로 `@stackflow/plugin-stack-persistence` 패키지를 구현한다.

- **작업 위치**: 이 worktree(`/Users/anakin/Programming/stackflow--feature-fep-2546`, 브랜치 `feature/fep-2546`). 신규 패키지는 `extensions/plugin-stack-persistence`에 두고 패키지 구성(package.json·빌드 설정·exports)은 인접 extensions 패키지 관례를 따른다.
- **스펙 정본은 설계서다.** 공개 표면(`stackPersistencePlugin`, `StackSnapshotStorage`, `StackSnapshotRecord`, `StackSnapshotStrategy`, `StackPersistenceLoadError`/`StackPersistenceSaveError`, `onLoadError`/`onSaveError`)과 시맨틱(시작 시 복원, `shouldReuse` 선행 후 core 검증, 오류 정책 `recover`/`propagate`와 기본 `recover`, 오류 정체성 보존, 실행 중 Idle 자동 보존, 저장 실패 비간섭과 `onSaveError` 생략 시 비동기 전파, `createMetadata` 실패 시 record 저장 전체 실패, SSR 중립성)·명시적 비목표 전부가 규범이다. 미결사항(성공 관찰 callback)은 구현하지 않는다.
- **기반**: FEP-2548로 머지된 core의 create/load 구분 메커니즘 — `provideSnapshot` 훅, `onInit`의 `initInfo.kind`, `SnapshotLoadError`, `captureSnapshot`(`core/src/interfaces/StackflowPlugin.ts`, `core/src/index.ts`). 플러그인은 core plugin 계약만 사용하는 프레임워크 중립 패키지이며 React 표면을 추가하지 않는다.
- **산출물**: 패키지 소스 + 테스트(`*.spec.ts`, 소스 옆) + changeset, `feature/fep-2546` 브랜치 커밋. 최종 게이트(3단계 전원 APPROVE) 통과 후 `main` 베이스 PR 생성까지가 완료다.
- **레포 규율**: yarn(Berry)만 사용, Biome 포맷/린트, 테스트는 vitest `*.spec.ts`. 하니스 기획서 등 과정 문서는 repo에 커밋하지 않는다(run 작업 디렉터리에 둔다) — 근거는 코드 주석으로, 과정 서술은 PR 본문으로.

### 이번 작업 고유 판단 기준

산출물이 설계서의 확정 계약·시맨틱과 1:1로 일치하는가 — 명시된 시맨틱의 누락·왜곡·비목표 침범이 없어야 한다. 특히 타입-레벨 계약(strategy 유무에 따른 `Metadata` 추론, options 유니온)은 tsc 실측으로만 판정한다 — 추론으로 단정하지 말고, 컴파일되면 안 되는 오용은 `@ts-expect-error` 네거티브 컨트롤로 teeth를 확인한다.

## 2. 워크플로우

**harness-first** (자산 — `~/.agents/orchestration/workflows/harness-first.md`, 스킬 제안).

run 한정 오버라이드:

- **2단계 산출에 신규 공개 표면의 타입 시그니처 스텁 포함** — 시그니처는 완성하되 본문은 unimplemented throw. TS 스위트가 미구현 API를 참조해도 컴파일되고, red가 "런타임 실패"로 성립하게 한다(red=컴파일 실패는 하니스로 무의미). 3단계가 본문을 채운다.
- **1단계 기획 리뷰는 설계서 섹션 분담** — 두 리뷰어가 축이 아니라 설계서 섹션을 나눠 "담당 섹션이 판별력 있는 하니스 항목으로 온전히 기획되었는가"를 각자 책임진다(분담은 3절 세부 지침).
- 하니스 기획서(1단계 산출)는 run 작업 디렉터리에 둔다 — repo 커밋 금지(사용자 규율).

## 3. 세션 테이블

| 논리 세션명 | 슬롯 | role | 런타임 | 모델 | 세부 지침 | lens |
|---|---|---|---|---|---|---|
| harness-plan-worker | harness-plan-worker | worker | Codex | GPT-5.6 sol · xhigh | 설계서의 모든 규범 문장(계약·시맨틱·비목표)을 검증 항목으로 매핑하고 항목마다 근거 섹션을 인용. 타입-레벨 계약은 tsc/`@ts-expect-error` 검증 항목으로 기획 | test, implementation |
| harness-plan-reviewer1 | harness-plan-reviewer | reviewer | Claude | claude-fable-5[1m] | 담당 섹션: 제공 형태(저장소 계약, Snapshot record와 저장소 API, 오류 API, Plugin options의 metadata 결합)·보존 범위·실행 중 보존·SSR. 공통: 명시적 비목표·미결사항 침범 여부 | test |
| harness-plan-reviewer2 | harness-plan-reviewer | reviewer | Codex | GPT-5.6 sol · xhigh | 담당 섹션: 시작 시 복원·Snapshot 부가 정보와 재사용(Strategy API·Record 흐름)·다른 플러그인과 Analytics 관찰. 공통: 명시적 비목표·미결사항 침범 여부. 추가: 기획이 전제하는 core 계약(`provideSnapshot`·`initInfo`·`SnapshotLoadError`·`captureSnapshot`)을 레포 소스와 대조(소스 사실 검증) | test |
| harness-impl-worker | harness-impl-worker | worker | Claude | claude-fable-5[1m] | 기획서 항목과 1:1(누락·초과 없음) 스위트 + 공개 표면 타입 스텁(본문 unimplemented throw). red가 런타임 실패로 성립해야 함. vitest `*.spec.ts`, 기존 레포 테스트 관례 준수 | test, implementation, architecture |
| harness-impl-reviewer1 | harness-impl-reviewer | reviewer | Claude | claude-fable-5[1m] | 기획서↔스위트 1:1 대응과 red 성립(컴파일 OK·런타임 실패)을 실측으로 확인 — 추론 단정 금지 | test, implementation, architecture |
| harness-impl-reviewer2 | harness-impl-reviewer | reviewer | Codex | GPT-5.6 sol · xhigh | 기획서↔스위트 1:1 대응과 red 성립(컴파일 OK·런타임 실패)을 실측으로 확인 — 추론 단정 금지 | test, implementation, architecture |
| impl-worker | impl-worker | worker | Codex | GPT-5.6 sol · xhigh | 하니스 무근거 우회·약화 금지(결함 발견 시 결정 로그 근거 + 워크플로우의 재실행 경로). 전 하니스 통과 + `yarn build`·`yarn typecheck`·`yarn lint` 통과 + changeset 작성 | implementation, architecture |
| impl-reviewer1 | impl-reviewer | reviewer | Claude | claude-opus-4-8 · xhigh · ultracode | **설계서 일치 검사 전담** — 설계서의 규범 문장 전수 대비 구현이 정확히 반영됐는지를 dynamic workflow(Workflow 오케스트레이션, ultracode)로 검사. 타입-레벨 계약 일치는 tsc 실측으로만 판정(`@ts-expect-error` 네거티브 컨트롤 포함, 추론 단정 금지) | implementation, architecture |
| impl-reviewer2 | impl-reviewer | reviewer | Claude | claude-opus-4-8 · xhigh · ultracode | **구현 이슈 전방위 탐색 전담** — implementation·architecture 렌즈가 지시하는 바를 위반한 경우를 dynamic workflow(Workflow 오케스트레이션, ultracode)로 전방위 탐색. 하니스 전 항목 통과를 실측 확인하고, 발견 이슈는 실측(재현)으로 확인해 보고 | implementation, architecture |

## 4. 인라인 자산 정의

해당 없음.

## 5. 설계 메타

- 사용자 지정(디폴트에 우선): harness-plan-worker = Codex GPT-5.6 sol xhigh + implementation lens 가산; impl-worker = Codex GPT-5.6 sol xhigh; impl-reviewer 2명 = 둘 다 claude-opus-4-8 xhigh ultracode + dynamic workflow 사용, 축 분담(설계서 일치 검사 / 구현 이슈 전방위 탐색); 세션 논리명은 바인딩 중립 — 런타임·모델·특성을 이름에 넣지 않는다(`<stage>-<slot>[N]`, 명명 관례의 run 한정 오버라이드 — 피드백 과정에서 바인딩이 바뀌어도 이름이 낡지 않게).
- 적용된 디폴트: 각 단계 reviewer 2명(전원 일치 게이트) — 게이트 슬롯 디폴트. worker 슬롯 1명. 사용자 미지정 Codex 리뷰어 세션(harness-plan-reviewer2, harness-impl-reviewer2)의 모델·effort는 GPT-5.6 sol · xhigh로 명시 바인딩(사용자 지정 Codex 세션과 정합) — 설계 선택.
- 설계 근거: harness-first 채택 근거 3개 성립 — ① 확정 설계서가 계약·시맨틱을 검증 가능한 형태로 닫아 하니스를 구현 전에 독립 확정할 수 있다 ② "잠정 노출 없는 복원", "오류 정체성 보존", "저장 실패 비간섭"처럼 확률이 아니라 보장이어야 하는 성질은 구현자가 만들지 않은 외부 안전망(하니스 세션 ≠ 구현 세션)이 게이트여야 한다 ③ 하니스가 후속 FEP-2001(history-sync URL strategy helper)이 소비할 strategy 계약의 검증 기반을 겸한다. 3단계 게이트는 사용자 지정으로 동일 모델(Opus 4.8) 2명 + 축 분담 구성 — 게이트 내 교차 런타임 대신 축 다양성(설계서 일치 vs 이슈 탐색)으로 상보성을 확보하고, 런타임 교차는 worker(Codex)↔reviewer(Claude) 사이에 유지된다.
- 메모리 반영:
  - `confirmed-design-doc-impl-runs-harness-first-with-section-partitioned-plan-review`(FEP-2548 구현 run 결정안): harness-first 기본 제안, 기획 리뷰 설계서 섹션 분담, 2단계 lens에 implementation·architecture 가산, 3단계 lens에 architecture 가산, 타입 시그니처 스텁으로 red 성립, Claude 세션 fable-5[1m](사용자가 런타임/모델을 지정한 세션은 지정이 우선).
  - `typeheavy-design-impl-gate-must-compile-not-reason-tsc-beats-review-by-inspection`: `Metadata` 추론·options 유니온이 타입-헤비 계약 — 판단 기준에 "tsc 실측 판정 + `@ts-expect-error` 네거티브 컨트롤" 명시.
  - `worker-context-exhaustion-restart-on-reopen-or-bind-1m-for-multicycle`: PR 단계까지 가는 구현 run — Claude 세션 전부 1m 선제 바인딩.
  - `empirical-behavioral-review-catches-input-defects-logic-review-approves`(일반화분): 논리 축과 별개의 ground-truth 축 필요 — 1단계 codex 리뷰어에 core 소스 사실 대조 전담 부여.
