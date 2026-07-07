# Run Plan — FEP-2548 create/load 구분 메커니즘 core 구현 (harness-first)

## 1. 과제 스펙 · 판단 기준

### 과제

확정 설계서 `design-fep-2548-init-load-mechanism.md`(레포 루트 — 이 run의 **스펙 정본**,
사용자 확정본)의 메커니즘을 `@stackflow/core`에 구현한다. 설계는 확정 완료 — 이 run은
설계를 다시 열지 않는다. 구현 중 설계서의 결함·모호·현행 소스와의 괴리를 발견하면
임의 해석·자체 설계 변경 없이 표면화해 에스컬레이션한다(설계 정본 개정은 사용자 결정).

**구현 범위** (설계서 §0·§3 — 신규 공개 표면 네 조각 + 신호 1):

- `StackSnapshot` 타입(+ `NavigationEvent` = 기존 탐색 이벤트 6종 부분합) —
  `$schema: "stackflow.snapshot.v1"`, 탐색 이벤트만 담음 (§3.1)
- `actions.captureSnapshot()` — 이벤트 로그를 탐색 이벤트로 필터·정규화(eventDate
  오름차순 + id 중복 제거)해 반환, 어느 훅에서든 호출 가능 (§3.2)
- 플러그인 옵셔널 훅 `provideSnapshot({ initialContext })` — 생성 시점 동기 폴링,
  단일 스냅샷 자리(non-null 2개 이상 = 충돌 key 명시한 생성 에러, `onLoadError`
  비라우팅) (§3.3)
- 플러그인 옵셔널 훅 `onLoadError({ error, initialContext })` + `SnapshotLoadError`
  (cause 3분류: `incompatible-schema` / `invalid-events` / `empty-navigation`) —
  `{ recover: "create" }` 반환 시 create 재개(재폴링 없음), void/부재 시
  `makeCoreStore` 밖으로 throw (§3.4)
- `onInit` 인자에 `initializedBy: "create" | "load"` 추가 (순수 additive, §3.6)
- create 경로 = 설계서 §4.1 시퀀스 — 공급자 전무 시 오늘의 코드 경로와 관찰상
  동일(불변식 N1·N2)
- load 경로 = 설계서 §4.2 시퀀스 — 구조 검사 → 등록 검사(activity 도입 이벤트
  Pushed·**Replaced** 전수의 activityName ∈ 등록 집합) → 재기저(RB1–RB5) →
  기존 `aggregate`+`validateEvents` 재생 → 사후조건(enter activity ≥ 1) →
  실패 시 공급자 `onLoadError` 라우팅
- **금지 (설계서 §0·§6 R8)**: 신규 도메인 이벤트 0, 신규 Stack 상태 속성 0, react 앱
  개발자 향 신규 표면 0, `makeCoreStore` 옵션 추가 0,
  `aggregate`/`validateEvents`/리듀서/`overrideInitialEvents` 변경 0

**최종 산출**: ① 테스트 기획서 ② 하니스(테스트 스위트) ③ 하니스를 전부 통과하는
core 구현 + `@stackflow/core` minor changeset — 전부 `feature/fep-2548` 브랜치 커밋,
풀 스위트(`yarn test`)·`yarn typecheck`·`yarn lint` green. PR 생성은 run 범위 밖
(게이트 통과 후 사용자 결정).

**하니스 인프라 전제**: core 테스트 컨벤션은 jest, 소스 옆 `*.spec.ts`
(`core/src/makeCoreStore.spec.ts` 등 기존 선례), core 패키지에서 `yarn test`.
하니스 단계(2단계)는 스위트가 컴파일되도록 신규 공개 표면의 **타입 시그니처
스텁**(설계서 §3 계약 그대로, 본문은 unimplemented throw)을 함께 산출할 수 있다 —
red는 런타임 실패로 성립하고, 3단계(구현)가 스텁 본문을 채운다.

**검증 항목의 원천 — 기획 중심은 설계서 §3·§4·§5 세 섹션이다** (사용자 지정;
상세 열거는 기획서의 몫):

- **§3 공개 계약** 전수: 스냅샷 형식(§3.1)·캡처와 그 엣지 — 전환 중·pause 중
  캡처(§3.2)·`provideSnapshot` 단일 자리와 R9 위반 생성 에러(§3.3)·에러 3분류
  각각의 검출과 `onLoadError` 라우팅 — recover / throw / 핸들러 부재(§3.4)·create
  가로채기 지점(§3.5)·`initializedBy` 신호(§3.6). §7.1 persister 완료 기준 —
  "persister를 흉내낸 테스트 플러그인이 core API만으로 load 경로를 탈 수 있다" —
  은 §3 계약 표면만으로 왕복이 닫힘을 검증하는 통합 시나리오로 포함한다
- **§4 생성 시퀀스** 전수: create 경로 §4.1(스텝별 관찰 가능 결과)·load 경로
  §4.2(구조 검사→등록 검사→재기저 RB1–RB5(세션 간 시계역행·신규 이벤트 후행
  정렬·id 보존 포함)→재생→사후조건→실패 라우팅)·기존 경로와의 관계 §4.3
- **§5 불변식** 전수: C1–C4(경로 배타·자리 하나·신호 일회성·생성 중 무발화),
  N1–N2(create 현행 동일성·핸들러 보존), L1–L6(무가로채기·도달 가능성·사후조건·
  재기저·왕복 안정·등록 봉인 — 특히 L6의 미등록 **Replaced** 케이스)
- R8 무회귀: 기존 전체 스위트 green이 1차 안전망 — 기획서는 기존 스위트가 담당하는
  축과 신규 하니스가 담당하는 축의 경계를 명시한다

**소스·정본**: `design-fep-2548-init-load-mechanism.md`(스펙 정본 — §10에 현행 소스
사실 S1–S23 파일:라인 인용) · 레포 `CONTEXT.md`(용어 정본) · `core/src/**` ·
Linear FEP-2548(요구사항 R1–R13 코멘트). 소비자 맥락: FEP-2546(persister) ·
FEP-2521(guard) · FEP-2001(history-sync 개정).

### 이번 작업 고유 판단 기준

확정 설계서의 충실한 구현: 공개 계약(§3)·생성 시퀀스(§4)·불변식(§5 전수)이 코드로
성립하고, 하니스가 설계 불변식·소비자 시나리오를 판별력 있게 인코딩하며(결함 구현이
실제로 red를 냄), 구현이 하니스를 전부 통과하고, R8 non-breaking이 실측으로
확인된 상태(기존 풀 스위트·typecheck·lint green, 기존 코드 경로 무변경 — §6 R8의
구조 논증이 코드에서 성립). 타입·동작 주장은 tsc·테스트 실행으로 실측한다 — 추론
단정 금지. 설계서와 구현의 괴리는 어느 방향이든 침묵 처리 금지 — 하니스 결함은
harness-first 결함 절차로, 설계서 결함은 사용자 에스컬레이션으로 표면화한다.
하니스를 통과시키기 위한 근거 없는 하니스 우회·약화 금지.

## 2. 워크플로우

`harness-first` (자산 — `~/.agents/orchestration/workflows/harness-first.md`).
run 한정 오버라이드: 없음. 중간 사용자 확인 없이 최종 산출물까지 자율 진행한다
(에스컬레이션은 워크플로우 기존 규칙 — 라운드 캡·교착·하니스/설계 결함 — 에 한정).

## 3. 세션 테이블

| 논리 세션명 | 슬롯 | role | 런타임 | 모델 | 세부 지침 | lens |
|---|---|---|---|---|---|---|
| hplan-worker-claude | harness-plan-worker | worker | Claude | opus-4.8[1m] | 기획 중심은 설계서 §3 공개 계약·§4 생성 시퀀스·§5 불변식(§1 "검증 항목의 원천"). 항목마다 given-when-then과 "이 항목이 잡는 결함 구현"을 명시(판별력). 기존 스위트 담당 축과 신규 하니스 담당 축의 경계를 기획서에 명시 | test, problem |
| hplan-reviewer-claude | harness-plan-reviewer | reviewer | Claude | opus-4.8[1m] | 전담 섹션: **§3 공개 계약·§5 불변식** — 담당 섹션(3.1–3.6 전수·C1–C4·N1–N2·L1–L6 전수)이 판별력 있는 하니스로 온전히 기획되었는지 확인(누락 항목 적발, 항목이 결함 구현에 실제로 red를 내는지) | test, problem |
| hplan-reviewer-codex | harness-plan-reviewer | reviewer | Codex | 기본 | 전담 섹션: **§4 생성 시퀀스** — 담당 섹션(§4.1 create·§4.2 load 각 스텝, 재기저 RB1–RB5, §4.3 기존 경로 관계)이 판별력 있는 하니스로 온전히 기획되었는지 확인(누락 스텝·엣지 적발, 항목의 판별력) | test, problem |
| himpl-worker-claude | harness-impl-worker | worker | Claude | opus-4.8[1m] | 기획서와 1:1(누락·초과 없음) 스위트 구현. 신규 표면은 설계서 §3 시그니처의 스텁(본문 throw)으로 컴파일 확보 — 인도 상태: 신규 하니스 red(올바른 지점에서 실패)·기존 스위트 green. 타입 주장은 tsc 실측 | test, implementation, architecture |
| himpl-reviewer-claude | harness-impl-reviewer | reviewer | Claude | opus-4.8[1m] | 전담 축: 기획 1:1 대응·테스트 질 — 각 테스트가 기획 항목의 검증 의도를 실제로 검사하는가, red가 올바른 이유의 red인가(스텁 throw가 아닌 단언 실패로 오인되는 항목 적발) | test, implementation, architecture |
| himpl-reviewer-codex | harness-impl-reviewer | reviewer | Codex | 기본 | 전담 축: 실측 — 스위트를 실제 구동해 red 상태·실패 지점 확인, 기존 스위트·typecheck 무회귀를 실행으로 확인. 추론 단정 금지 | test, implementation, architecture |
| impl-worker-claude | impl-worker | worker | Claude | opus-4.8[1m] | 설계서가 스펙 정본 — 괴리·모호는 에스컬레이션(임의 해석 금지). 하니스 우회·약화 금지(결함 시 harness-first 절차). 금지 목록(§1) 준수. 타입 주장은 tsc 실측. changeset 포함. yarn(Berry)·Biome 등 레포 규율 준수 | implementation, design, architecture |
| impl-reviewer-claude | impl-reviewer | reviewer | Claude | opus-4.8[1m] | 전담 축: 설계 정합 — 구현 ↔ 설계서 §3 계약·§4 시퀀스·§5 불변식 대조, §6 R8 구조 논증의 코드 성립(신규 표면 전부 additive·미공급 시 기존 경로 무변경·금지 목록 0건) | implementation, design, architecture |
| impl-reviewer-codex | impl-reviewer | reviewer | Codex | 기본 | 전담 축: 실측 — 하니스 전 통과·기존 풀 스위트·typecheck·lint를 실제 실행으로 확인. 경계 시나리오(미등록 Replaced load·R9 이중 공급·시계역행 재기저)를 직접 재현. 추론 단정 금지 | implementation, architecture |

## 4. 인라인 자산 정의

해당 없음 (자산 워크플로우·자산 role·자산 lens만 사용).

## 5. 설계 메타

- **사용자 명시(디폴트보다 우선)**: ① 전 Claude 세션 모델 opus-4.8[1m](Codex는
  기본 유지). ② 하니스 기획 중심 = 설계서 §3 공개 계약·§4 생성 시퀀스·§5 불변식.
  ③ 1단계 리뷰어 분담은 섹션 기준 — Claude 리뷰어가 §3·§5, Codex 리뷰어가 §4를
  전담해 "담당 섹션이 판별력 있는 하니스로 온전히 기획되었는가"를 확인(스킬이
  초안했던 축 분담 — 커버리지 vs 소스 사실 — 을 대체). ④ 2단계(하니스 구현) 전
  세션에 `implementation`·`architecture` 렌즈, 3단계(구현) 전 세션에 `architecture`
  렌즈 부여.
- **적용된 디폴트**: 게이트 슬롯 3개(각 단계 reviewer) 각 2명 Claude+Codex 교차 —
  합의 게이트 슬롯 디폴트. worker 3개 슬롯 각 1명 — 일반 슬롯 디폴트. lens는
  harness-first 권장 바인딩(1·2단계 `test`, 3단계 `implementation`)에 사용자 명시
  렌즈를 가산한 구성 + 1단계 `problem`(검증 전략을 요구사항 맥락에서), 3단계
  worker·claude 리뷰어 `design`(설계 정합 축) 가산.
- **워크플로우 제안 근거** (harness-first — 스킬 제안): 확정 설계서가 불변식
  (C·N·L 12개)·에러 계약·재기저 규칙·소비자 완료 기준까지 검증 가능한 형태로 이미
  닫아 두어, 구현 전에 검증 체계를 독립 확정할 수 있는 전형적 조건이다. R8
  non-breaking이 "확률이 아니라 보장"이어야 하는 core 프로덕션 변경이므로 구현자
  자신이 만들지 않은 외부 안전망(하니스 세션 ≠ 구현 세션)이 게이트로 필요하다.
  persister 완료 기준(§7.1) 자체가 "테스트 플러그인"으로 정의되어 있어 하니스가
  산출물 가치를 겸한다(후속 FEP-2546이 소비). 매핑: "검증 체계(하니스)를 먼저 닫고
  그 안에서 구현" → harness-first.
- **메모리 반영**:
  - `worker-context-exhaustion-restart-on-reopen-or-bind-1m-for-multicycle`
    (operations, seen 7) — "PR/머지 단계까지 가는 구현 과제는 worker를 1m으로 선제
    바인딩": 스킬 초안에서 himpl-worker·impl-worker에 선제 적용했고, 이후 사용자
    명시(전 Claude 세션 1m)가 이를 포괄·확장.
  - `typeheavy-design-impl-gate-must-compile-not-reason-tsc-beats-review-by-inspection`
    (design, seen 2) — "타입·동작 주장은 tsc·실행으로 실측, 추론 단정 금지"를 판단
    기준과 worker·실측 리뷰어 세부 지침에 게이트 기준으로 명시.
  - `empirical-behavioral-review-catches-input-defects-logic-review-approves`
    (operations, seen 6) — 논리 검증 축과 별개의 **ground-truth 축**을 게이트에
    전담 배치: 2·3단계 codex 리뷰어가 실측(실행) 전담(직전 FEP-2548 설계 run에서
    이 축이 유일 Critical을 잡은 검증된 구성). 1단계는 사용자 명시의 섹션 분담이
    축 구성을 대체.
  - 그 외 히트(fanout 실측 동시 실행 경합 flake, reviewer 워크트리 격리, 세션 재시작
    신호 등)는 operations scope — 실행 시 orchestrate가 조회·적용할 대상이라 plan에는
    비반영.
