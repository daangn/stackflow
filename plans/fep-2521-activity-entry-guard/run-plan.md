# Run Plan — FEP-2521 `@stackflow/plugin-activity-guard` 구현 (확정 설계서 → 구현)

## 1. 과제 스펙 · 판단 기준

**과제**: 확정 설계서 `plans/fep-2521-activity-entry-guard/design.md`(인터뷰 합의 완료)를 스펙으로 `@stackflow/plugin-activity-guard` 패키지를 신규 구현한다.

- 대상: `/Users/anakin/Programming/stackflow--feature-fep-2521` (worktree), 브랜치 `feature/fep-2521`.
- 신규 패키지 위치: `extensions/plugin-activity-guard` — 기존 `extensions/*` 플러그인 패키지의 빌드·테스트·패키징 관례(esbuild CJS+ESM, `*.spec.ts`, Biome, Yarn Berry, changesets)를 그대로 따른다.
- 구현 범위 = 설계서의 공개 계약 전부:
  - **공개 표면**: `activityGuardPlugin`, `redirect`, `and`, `or`, 타입 `ActivityGuard`·`GuardResolution`.
  - **Activity Guard 계약**: `true` 또는 GuardResolution 반환(`false` 비유효 — 런타임 재검사 없음), 평가 실패는 원 예외 무변경 전파(push·replace 미진입, 초기 Activity면 초기화 실패), 입력 `{ activityName, params }`(guards 맵 key별 타입 적용), 부수효과 실행 여부·횟수 미지원.
  - **Entry 적용 범위**: 적용 5종(push / replace / deep link 초기 / default Activity 초기 / Redirect 대상), 비적용 3종(Activity Reactivation / 보존 Stack load / step push·replace·pop). Redirect는 원래 Entry의 **무흔적 대체**(push·replace·초기 진입 성격 계승, 원 대상은 진입·스택 흔적 없음), 중간 Redirect 발생 시 이전 통과 Entry 유지 + 후속 예정 navigation 전부 취소, Redirect 대상에도 guard 재적용(우회 없음).
  - **Combinators**: `and({ guards })`·`or({ guards, otherwise })` — 선언 순 평가·단락 의미론, or의 필수 `otherwise`, 타입상 non-empty `guards`.
  - **미결정 항목 존중**: 설계서가 계약으로 닫지 않은 것(guard↔loader 상대 순서, 타입 계약 우회 시 동작, Redirect 순환 감지)을 구현·하니스가 임의로 계약으로 굳히지 않는다.
- **범위 외**: 현행 `plugin-history-sync`와의 호환·정합 검사는 하지 않는다 — history-sync는 이 플러그인에 맞게 재작성될 예정이다. 초기 진입 의미론(deep link·default Activity, 단일·복수 Entry 초기 묶음)은 core 공개 표면 수준에서 구현·검증한다.
- 산출: 패키지 소스 + 테스트 스위트 + changeset, `feature/fep-2521` 브랜치 커밋 + **Draft PR 생성**(base: `main`)까지.

**판단 기준** (role 중립 — reviewer에겐 리뷰 포커스, worker에겐 달성 목표):

산출물은 설계서의 공개 계약과 정확히 일치해야 하며, 그 일치는 추론이 아니라 **실측**으로 증명한다.

1. **타입 계약은 tsc 실측으로 검증한다** — 추론으로 단정 금지. guards 맵 key별 params 타입 적용, non-empty guards, redirect 대상(등록 Activity + 해당 params 타입)이 대상이며, forge·불가능 상태(`false` 반환, 미등록 activity로 redirect, params 타입 불일치, 빈 guards 목록)는 `@ts-expect-error` 네거티브 컨트롤 하니스로 teeth를 확인한다.
2. **Entry 의미론은 ground truth 위에서 검증한다** — 적용 5종·비적용 3종·무흔적 대체·Redirect 대상 guard 재적용·후속 navigation 취소를, 설계서가 전제하는 core의 현행 동작(레포 소스 대조 + 실제 구동) 위에서 확인한다. 초기 진입 경로는 core 공개 표면 수준에서 검증하며, 현행 plugin-history-sync와의 정합 검사는 하지 않는다.
3. **플러그인 생태계 정합을 깨지 않는다** — loader·plugin-basic-ui 등 참조 모듈(현행 plugin-history-sync 제외)이 guard·redirect 개입 후에도 정상 동작하고, 사용자 체감 손상(원 대상 Activity flash, 전이 붕괴)이 없어야 한다.

## 2. 워크플로우

**harness-first** (자산 — `~/.agents/orchestration/workflows/harness-first.md`). 세 단계(하니스 기획 → 하니스 구현 → 구현) 각각 review-loop를 임베드하며, 판정 어휘·종료 조건·라운드 캡은 자산 정의를 따른다.

run 한정 오버라이드:

- **2단계 산출에 신규 공개 표면의 타입 시그니처 스텁(본문 unimplemented throw)을 포함**한다 — TS 스위트가 미구현 API를 참조해도 컴파일이 성립하고, red는 런타임 실패로 성립한다. 3단계가 스텁 본문을 채운다.
- **3단계 게이트는 교차 런타임 대신 축 분담 4인**으로 구성한다: 설계서 일치 전수 / implementation·architecture 렌즈 위반 전방위 / 생태계 정합 / 데모 실측(각각 별도 세션). 런타임 교차는 worker(Codex)↔reviewer(Claude) 사이로 이동한다. 설계서 일치·렌즈 위반·생태계 정합 리뷰어는 in-session dynamic workflow(Workflow 오케스트레이션) fan-out을 사용한다.

## 3. 세션 테이블

| 논리 세션명 | 슬롯 | role | 런타임 | 모델 | 세부 지침 | lens |
|---|---|---|---|---|---|---|
| harness-plan-worker-codex | harness-plan-worker | worker | Codex | GPT-5.6 sol, xhigh | 설계서의 계약·Entry 적용 범위·Combinators 섹션을 검증 항목의 원천으로 삼아 given-when-then 기획. 타입-레벨 항목(`@ts-expect-error` 네거티브 컨트롤 포함)을 별도 축으로 기획. 설계서가 전제하는 core 현행 동작(초기 entry 경로·navigation 이벤트·플러그인 훅)을 레포 소스로 확인해 기획에 반영. 미결정 항목을 계약으로 굳히는 검증 항목 금지. 현행 plugin-history-sync 정합 검증 항목 금지(범위 외) | test |
| harness-plan-reviewer-claude1 | harness-plan-reviewer | reviewer | Claude | claude-fable-5[1m] | 담당 섹션: §공개 API 이름 / §공개 사용 형태 / §Activity Guard 계약 / §Guard Combinators / §명시적으로 결정하지 않은 항목 — "담당 섹션이 판별력 있는 하니스로 온전히 기획되었는가" | test |
| harness-plan-reviewer-claude2 | harness-plan-reviewer | reviewer | Claude | claude-fable-5[1m] | 담당 섹션: §목적 / §제공 범위 / §Entry 적용 범위 / §보안 경계 — 동일 질문. Entry 의미론(무흔적 대체·후속 취소·Redirect 재적용·초기 진입 경로) 커버리지 전담 | test |
| harness-impl-worker-codex | harness-impl-worker | worker | Codex | GPT-5.6 sol, xhigh | 기획서와 1:1 대응(누락·초과 없음) 스위트 구현 + 공개 표면 타입 스텁(본문 unimplemented throw). red=런타임 실패임을 실측 확인. 타입 하니스는 tsc 실측으로 네거티브 컨트롤 teeth 확인 | test, implementation, architecture |
| harness-impl-reviewer-claude | harness-impl-reviewer | reviewer | Claude | claude-fable-5[1m] | 기획 1:1 대응·red 상태·스텁 공개 표면의 설계서 일치를 독립 실측(tsc·테스트 구동)으로 확인 | test, implementation, architecture |
| harness-impl-reviewer-codex | harness-impl-reviewer | reviewer | Codex | 기본, xhigh | 동일 기준, 독립 실측(tsc·테스트 구동) | test, implementation, architecture |
| impl-worker-codex | impl-worker | worker | Codex | GPT-5.6 sol, xhigh | 하니스 전체 green이 완료 필요조건. 하니스 결함 발견 시 근거를 결정 로그에 남기고 수정 제안(무근거 우회·약화 금지). 신규 패키지는 기존 extensions 관례 준수 + changeset 포함. 게이트 통과 후 커밋·Draft PR 생성(base: `main`) | implementation, architecture |
| impl-reviewer-opus1 | impl-reviewer | reviewer | Claude | claude-opus-4-8 xhigh + ultracode | 축: **설계서 일치 전수 검사** — 설계서 계약 조항별 conformance sweep(in-session Workflow fan-out 사용) | implementation, architecture |
| impl-reviewer-opus2 | impl-reviewer | reviewer | Claude | claude-opus-4-8 xhigh + ultracode | 축: **implementation·architecture 렌즈 위반 전방위 탐색**(in-session Workflow fan-out 사용) | implementation, architecture |
| impl-reviewer-opus3 | impl-reviewer | reviewer | Claude | claude-opus-4-8 xhigh + ultracode | 축: **생태계 정합** — loader·plugin-basic-ui·plugin-devtools·plugin-lifecycle 등 참조 모듈(현행 plugin-history-sync 제외)이 guard·redirect 개입 후에도 정상 동작하는지 전수(in-session Workflow fan-out 사용) | implementation, architecture |
| impl-reviewer-opus4 | impl-reviewer | reviewer | Claude | claude-opus-4-8 xhigh | 축: **데모 실측** — demo 앱에 플러그인을 통합해 실제 브라우저 구동으로 Entry 의미론(적용 5종·비적용 3종·무흔적 대체·후속 취소)과 사용자 체감(원 대상 Activity flash·전이 붕괴 없음)을 실측. 논리 검증 재탕 금지 — 실제 구동 경로를 직접 밟는다 | implementation, architecture |

## 4. 인라인 자산 정의

해당 없음 — 전 슬롯이 자산 role(`worker`/`reviewer`)·lens(`test`/`implementation`/`architecture`)를 사용한다.

## 5. 설계 메타

- **사용자 지정(디폴트 오버라이드)**: 하니스 구현 worker = Codex GPT-5.6 sol xhigh / 하니스 구현 게이트에 Codex 리뷰어 1명 유지(Claude+Codex 교차) / harness-plan-worker lens는 test만(implementation 제거) / 3단계 게이트에서 생태계 정합·데모 실측을 각각 별도 세션으로 분리 / 데모 실측 리뷰어 = Opus 4.8 / 현행 plugin-history-sync 정합·호환 검사 범위 외(재작성 예정) / Draft PR 생성까지 run 범위.
- **적용된 디폴트**:
  - 각 단계 worker 1명 — 일반 슬롯 디폴트.
  - 1·2단계 게이트 각 2명 — 합의 게이트 슬롯 디폴트(인원). 2단계 구성은 합의 게이트 디폴트(Claude 1 + Codex 1) 그대로(사용자 확인). 1단계 리뷰어는 FEP-2546 바인딩 패턴대로 Claude fable-5[1m] 2명(섹션 분담), 런타임 교차는 worker(Codex)↔reviewer(Claude) 사이에 확보.
  - 판정 어휘·종료 조건·라운드 캡 — harness-first/review-loop 자산 그대로.
- **설계 근거**: "확정 설계 문서 → 구현" 과제의 harness-first 채택 근거 3이 모두 성립 — ① 설계서가 계약(반환·예외·타입)·Entry 의미론·Combinator 의미론을 검증 가능한 형태로 닫아 둠 → 구현 전에 하니스 독립 확정 가능 ② "원 대상 무흔적·후속 navigation 취소·Redirect guard 재적용"은 확률이 아니라 보장이어야 하는 성질 → 구현자가 만들지 않은 외부 안전망(하니스 세션 ≠ 구현 세션)이 게이트여야 함 ③ 하니스가 곧 패키지의 테스트 스위트(`*.spec.ts`)로 남아 산출물 가치를 겸함. 기획 리뷰는 축이 아니라 **설계서 섹션 분담**(누락 책임이 문서 구조와 1:1).
- **메모리 반영**:
  - `confirmed-design-doc-impl-runs-harness-first-with-section-partitioned-plan-review` (seen 2) — 골격 전체 적용: harness-first 기본 제안 + 섹션 분담 기획 리뷰 + lens 확장(2단계 test+implementation+architecture, 3단계 +architecture) + 타입 스텁 red 해법 + FEP-2546 바인딩 패턴(저작=Codex sol xhigh, 최종 게이트=Opus ultracode 축 분담, 리뷰어=fable-5[1m]). 하니스 구현 worker의 Codex 지정은 사용자 오버라이드(패턴에서 한 발 더 확장).
  - `typeheavy-design-impl-gate-must-compile-not-reason-tsc-beats-review-by-inspection` (seen 4) — 판단 기준 ①: 타입 주장 tsc 실측 의무 + `@ts-expect-error` 네거티브 컨트롤.
  - `empirical-behavioral-review-catches-input-defects-logic-review-approves` (seen 8) — 판단 기준 ② + 3단계 데모 실측 전담 세션: 논리 정합 축과 별개의 ground-truth 축(레포 소스 대조 + 실제 구동)을 게이트에 유지.
  - `plugin-ecosystem-review-needs-reference-module-and-ux-lenses` (seen 1) — 판단 기준 ③ + 3단계 생태계 정합 전담 세션(사용자 지정으로 데모 실측과 분리, 현행 history-sync 제외), 넓은 표면 리뷰 슬롯에 in-session Workflow fan-out 지정.
  - `worker-context-exhaustion-restart-on-reopen-or-bind-1m-for-multicycle` (seen 9) — 전 Claude 세션 1m 바인딩(fable-5[1m]) 선제 적용.
