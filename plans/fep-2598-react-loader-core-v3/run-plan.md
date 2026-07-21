# Run Plan — FEP-2598 react 내장 loaderPlugin의 core v3 load path 지원 구현

## 1. 과제 스펙 · 판단 기준

**과제 스펙**: `plans/fep-2598-react-loader-core-v3/plan.md`(확정 스펙, 2026-07-21 인터뷰 완료)가 스펙 정본이다. 요지:

- `integrations/react/src/loader/loaderPlugin.tsx`를 core v3 load path에 대응시킨다 — `overrideInitialEvents`(load일 때만)에서 loader 있는 activity의 `Pushed`/`Replaced`에 sync-inspectable deferred를 심고, `onInit`에서 core가 계산한 최종 스택 기준(`transitionState !== "exit-done"`)으로 alive activity에만 loader를 1회 실행해 resolve한다.
- 확정 스펙 1–7(불변식·렌더 가능 경계·`initInfo` 경로 판별·stale 불신·`initialLoaderData` create 전용·loader 실패 비승격·create path의 `Replaced` eager 처리)과 비목표를 그대로 따른다.
- **테스트는 작성하지 않는다**(사용자 지시 — plan.md의 테스트 계획 섹션은 이번 run의 산출 범위에서 제외). 테스트 미작성은 검증 삭제가 아니라 검증 책임의 이관이다: worker는 산출물을 실제로 로드·실행해 핵심 경로(load path의 alive-only loader 실행·sync-inspect FULFILLED, create path 무회귀)가 성립함을 실측한다 — 임시 스크립트 허용, 테스트 파일 작성 금지. 게이트의 실측 축이 이를 독립 재검증한다.
- 산출: 구현, `@stackflow/react` patch changeset(`fix:`), 작은 의미 단위 커밋(구현 → changeset), 작업 브랜치 `feature/fep-2598`. 게이트 통과(전원 APPROVE) 후 Draft PR 생성.

**이번 작업 고유 판단 기준**: 확정 스펙(plan.md)의 스펙 1–7과 load path 메커니즘에 대한 정합 — 특히 ① `initInfo` 부재/`"create"` 경로에서 기존 create 동작이 v2-합법 입력에 대해 보존되는가(무회귀), ② deferred가 SyncInspectablePromise 규약(동기 loader의 suspend 없는 첫 렌더)을 지키는가. 검증은 코드 독해로 대체할 수 없다 — 산출물이 전제하는 core v3 사실(SnapshotEvent/`initInfo`/aggregate의 `activityContext` 채택 등)은 core 소스와 직접 대조하고, 핵심 경로의 성립·무회귀는 실제 로드·실행으로 실측한다(임시 스크립트 허용, 테스트 파일 작성 금지).

## 2. 워크플로우

`review-loop` (자산 — `~/.agents/orchestration/workflows/review-loop.md`). 오버라이드 없음(라운드 캡 5, 종료 = reviewer 전원 APPROVE).

확정 설계 문서 구현의 harness-first 선례가 있으나 이번엔 채택하지 않는다: 테스트를 작성하지 않는 run이라 하니스 단계 자체가 성립하지 않고, 대상이 기존 패키지 내 플러그인 1개 수정으로 소규모라 단일 review-loop 축소 선례(FEP-2584)에 가깝다. 독립 안전망은 게이트의 실측 축이 담당한다.

## 3. 세션 테이블

| 논리 세션명 | 슬롯 | role | 런타임 | 모델 | 세부 지침 | lens |
|---|---|---|---|---|---|---|
| impl-worker-codex | worker | worker | Codex | GPT-5.6 sol xhigh, fast mode | 작은 의미 단위 커밋(구현 → changeset 분리). 테스트 파일 작성 금지 — 대신 산출물을 실제 로드·실행해 핵심 경로 성립을 실측(임시 스크립트 허용)한 뒤 완료 보고. yarn Berry 레포 — npm 금지 | implementation, react, architecture |
| review-reviewer-claude1 | reviewer | reviewer | Claude | claude-fable-5[1m] xhigh, ultracode | **축 A — 스펙 전수 대조·ground truth**: plan.md 확정 스펙 1–7·load path 메커니즘·비목표와 산출물을 항목 단위로 전수 대조. 산출물이 전제하는 core v3 소스 사실(SnapshotEvent 타입, `initInfo` 전달 경로, aggregate의 `activityContext` 채택, `store.init()` 타이밍)을 core 소스와 직접 대조해 검증 | — |
| review-reviewer-claude2 | reviewer | reviewer | Claude | claude-fable-5[1m] xhigh, ultracode | **축 B — 실측·렌즈 전방위**: 산출물을 실제 로드·실행해 load path(alive-only loader 실행, 동기 loader의 sync-inspect FULFILLED, 죽은 activity pending 유지)와 create path 무회귀를 실측 — 코드 독해로 대체 금지, 임시 스크립트 허용·테스트 파일 작성 금지. 그 위에 렌즈 위반 전방위 탐색 | implementation, react |

## 4. 인라인 자산 정의

해당 없음 — 워크플로우·role·lens 모두 자산 참조.

## 5. 설계 메타

- **적용된 디폴트**: 게이트 2명(합의 게이트 슬롯 디폴트 — 단 런타임은 교차 대신 Claude 듀얼 + 축 분담, 아래 근거). worker 1명(일반 슬롯 디폴트). 라운드 캡 5(워크플로우 기본).
- **설계 근거**: 산출물(코드)을 만들고 독립 검증 게이트를 통과시키는 과제 → review-loop. 게이트 상보성은 런타임 다양성 대신 **검사 방법 축 분리**(정적 전수 대조+소스 사실 / 실측 구동+렌즈)로 확보하고 런타임 교차는 worker(Codex)↔reviewer(Claude) 사이에 둔다 — FEP-2546/2521/2584에서 사용자 교정으로 수렴한 바인딩 패턴. 두 리뷰어 모두 ultracode(사용자 지정 — FEP-2521의 "실측 축 비-ultracode" 교정을 이번 run에서 오버라이드).
- **사용자 오버라이드**: worker fast mode 구동 / 테스트 미작성·test 렌즈 전면 제거 / worker에 architecture 렌즈 / 축 B도 ultracode.
- **메모리 반영**:
  - `confirmed-design-doc-impl-runs-harness-first…`(seen 5): harness-first를 기본 제안으로 검토했으나 테스트 미작성·소규모라 미채택(2절에 근거 명시). 저작=Codex sol xhigh, 리뷰어=Claude 1m 바인딩 패턴은 채택.
  - `confirmed-fep2584-small-package-spec-impl-single-reviewloop-no-tests`(seen 2): 소규모 과제의 단일 review-loop 축소 + 테스트 미작성 시 검증 책임을 실측·게이트로 이관(worker·게이트에 "실제 로드·실행 실측, 임시 스크립트 허용" 명시) + 리뷰어 fable-5 xhigh ultracode 선호 + Draft PR은 게이트 통과 후 생성.
  - `empirical-behavioral-review-catches-input-defects-logic-review-approves`(seen 11): 게이트에 ground-truth 축(core 소스 대조)과 실행 실측 축을 명시적으로 편성 — 논리 리뷰가 구조적으로 못 보는 결함 대비. 테스트 없는 run이므로 실측 축이 게이트 안에 필수.
  - `worker-context-exhaustion…`(seen 12): 리뷰어를 1m으로 바인딩(worker는 Codex라 해당 없음).
  - 사용자 메모리: "fable 5 = 1M variant"(bare fable-5 금지), 작은 커밋 단위 선호.
