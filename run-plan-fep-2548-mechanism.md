# Run Plan — FEP-2548 core init/load 구분 메커니즘 설계 확정 (발산→수렴→정련)

## 1. 과제 스펙 · 판단 기준

### 과제

stackflow core의 Stack 초기화(init)/복원(load) 경로 구분에 대한 **메커니즘 설계를 확정**한다.
요구사항은 2026-07-07 인터뷰로 확정 완료(Linear FEP-2548 코멘트, 레포 `CONTEXT.md` 용어 정의).
서로 다른 메커니즘이 트레이드오프를 두고 경쟁할 수 있는 문제이므로, 후보를 발산 생성해
선별·상대 비교로 수렴한 뒤 우승안을 완전한 설계서로 정련한다. 코드 구현은 후속 작업이며
이 run의 산출물이 아니다.

**최종 산출물**: 메커니즘 설계서 1부(마크다운) + `decision-log.md`. 설계서는 자기완결이어야
하며 다음을 포함한다:

- 플러그인 향한 공개 계약 — 스냅샷 형식(소유: core), 캡처 방법, load 진입 방법, load 실패
  에러 계약, init 진입 가로채기 지점
- init 경로·load 경로 각각의 생성 시퀀스(타이밍·이벤트 흐름)와 기존 경로와의 관계
- 확정 요구사항 R1–R13 각각이 이 메커니즘으로 충족됨의 논증 (특히 R8 non-breaking:
  기존 생태계·현행 history-sync `overrideInitialEvents` 무변경 동작 논증)
- 소비자 성립 논증 — 이 계약만으로 ① persister(FEP-2546)의 캡처→보존→load 왕복
  ② guard(FEP-2521)의 init 가로채기·load 스킵 ③ history-sync(FEP-2001)의 "스택을 진실의
  원천으로 동기화"가 성립함을 시나리오로 보인다 (완료 기준: "persister를 흉내낸 테스트
  플러그인이 core API만으로 load 경로를 탈 수 있다"의 설계 수준 증명)
- 이연된 설계 결정 4건의 해소(각각 D-채번, 근거·기각 대안 포함):
  ① init 가로채기 지점과 기존 `onBeforePush` 파이프라인의 통일 여부
  ② 스냅샷 형식의 구체적 모양(이벤트 이력 vs 집계 상태 등)
  ③ activity 단위 출처(어느 activity가 스냅샷 출신인지) 표현 여부
  ④ load 실패 에러의 구체적 전달 형태(throw vs 콜백 등)

**중간 산출물 — 후보 스케치** (발산·선별·대결 단계의 단위; 자기완결 — 선별과 대결은
후보 문서만으로 이뤄진다):

① 메커니즘 개요(원리) ② 공개 계약의 형태(개념적 시그니처·타입 구조) ③ 이연 4건 각각에
대한 입장과 근거 ④ R1–R13·비목표 충족 방식 요약 — 충족 불가·긴장 지점은 은폐 없이 명시
⑤ 트레이드오프(지불하는 것/획득하는 것) ⑥ 전제하는 현행 소스 사실(파일 위치 인용).

**확정 요구사항 (요약 임베드 — 정본: Linear FEP-2548 코멘트 2026-07-07, 레포 CONTEXT.md)**:

- R1 load 경계 소스 불문: 스냅샷 복원은 저장 매체 무관 전부 load
- R2 이진 분류: core 어휘는 init/load 둘뿐 (deep link 세분은 core 어휘 아님)
- R3 생성 시점 동기 load만: "복원 대기 중" 중간 상태 없음, 비동기 소스는 상위 레이어 부트스트랩 문제
- R4 load 실패 = 명시적 에러 (조용한 폴백 금지)
- R5 에러 1차 처리자 = 스냅샷 공급자 (앱 개발자는 기본 무관여)
- R6 init 진입은 가로채기 가능(의미상 push), load 진입은 가로채기 대상 아님
- R7 init/load 구분은 생성 시점 일회성 신호 (지속 속성 아님)
- R8 non-breaking: `overrideInitialEvents` 유지, 그 결과는 init 취급
- R9 단일 스냅샷 자리: 생성은 스냅샷 최대 1개, 경합 조정은 core 위 계층
- R10 스냅샷 왕복(캡처→보존→load)은 core 계약만으로 닫힘
- R11 load 사후조건: 스냅샷이 보존한 정상 상태(불변식 충족 = 도달 가능 상태)의 충실한 재구성
- R12 복원 범위 — 탐색 기록이 필수, 나머지는 부가: 반드시 보존·복원해야 하는 것은
  탐색 기록(`stack.activities` — 무엇을 지금 보고 있고, 무엇을 봤었고, 어떤 순서로
  보았는가)이며, 복원 후 이전과 같이 네비게이션할 수 있으면 충분. `transitionDuration`·
  `globalTransitionState`·`pausedEvents`·`registeredActivities`는 복원 비필수.
  transition 관련 정보는 프로세스 생애주기를 넘나들며 다루기 어려우므로 폐기도 열린
  선택. R11의 "충실한 재구성"은 이 필수 범위(탐색 기록)에 적용
- R13 직렬화는 core 밖 — codec은 스냅샷 사용자 책임: 스냅샷의 직렬화·역직렬화(codec)는
  스냅샷을 사용하는 쪽(persister 등 공급자)이 마련한다. core는 `activityParams`·
  `activityContext`에 어떤 값이 들어와도 동작한다고 전제하며 serialization issue를
  다루지 않는다. R10의 "형식 소유"는 구조(무엇이 담기는가)의 소유이며 보존 매체
  인코딩(codec)은 제외. 참고(소비자 계획): loader plugin은 스냅샷에서 loader data를
  제거하고 load 시 loader를 재실행해 promise를 재주입할 예정 — 재파생 가능한 런타임
  데이터는 스냅샷에 담지 않고 load 후 재파생하는 패턴

비목표: late load / init 하위 세분화의 core 어휘화 / 구분의 지속 속성화 /
react 앱 개발자 향한 신규 표면 / 스냅샷 버전 마이그레이션 보장(비호환 = load 실패).

**소스**: 레포 `CONTEXT.md`(용어 정본) · `core/src/makeCoreStore.ts` ·
`core/src/aggregate.ts` · `core/src/event-types/` ·
`extensions/plugin-history-sync/src/historySyncPlugin.tsx` ·
Linear FEP-2548(요구사항 코멘트)·FEP-2546·FEP-2521·FEP-2001(소비자 요구).

### 이번 작업 고유 판단 기준

메커니즘이 확정 요구사항 R1–R13과 비목표에 정합하고(위배 0), 이연 4건이 근거와 함께
결정되었으며, 설계가 전제하는 현행 core·플러그인 동작이 전부 소스 사실과 일치하고,
R8 non-breaking 논증과 세 소비자(persister·guard·history-sync) 성립 논증이 서는 상태.
후보 간 우열은 이 기준 충족을 전제로 트레이드오프의 질(지불 대비 획득, 미래 확장 여지,
오용 여지의 적음)로 가른다. 목표 고도는 메커니즘(원리·공개 계약·타이밍·불변식)이며,
구현(코드 변경)은 후속 작업으로 이 run의 범위 밖이다.

## 2. 워크플로우

`diverge-converge-refine` (4절 인라인 정의 — generate-filter → tournament → review-loop
합성, wfspec.compose). 임베드 자산의 절차·판정 어휘·라운드 캡은 각 자산 정의 그대로.
run 한정 오버라이드: 없음. 중간 사용자 확인 없이 최종 산출물까지 자율 진행한다
(에스컬레이션은 각 워크플로우의 기존 규칙 — 교착·판단 불가·생존 0건 — 에 한정).

## 3. 세션 테이블

| 논리 세션명 | 슬롯 | role | 런타임 | 모델 | 세부 지침 | lens |
|---|---|---|---|---|---|---|
| diverge-generator-claude1 | generator | worker | Claude | fable-5[1m] / effort xhigh | 시드: **이벤트 재생형** — 스냅샷=이벤트 이력(`DomainEvent[]`), load=aggregate 재생. 공통 규칙(전 generator): 시드는 출발점일 뿐 — 소스·요구사항이 다른 방향을 가리키면 근거를 명시하고 이탈 가능 | problem, design |
| diverge-generator-claude2 | generator | worker | Claude | fable-5[1m] / effort xhigh | 시드: **상태 주입형** — 스냅샷=집계된 `Stack` 상태, load=상태 직접 주입(재생 없음) | problem, design |
| diverge-generator-claude3 | generator | worker | Claude | fable-5[1m] / effort xhigh | 시드: **신규 이벤트 어휘형** — `Loaded` 계열 도메인 이벤트를 1급 어휘로 신설, load가 이벤트 로그에 남는 사건이 됨(R7 "일회성 신호"와의 긴장 정면 탐구) | problem, design |
| diverge-generator-claude4 | generator | worker | Claude | fable-5[1m] / effort xhigh | 시드: **계약 역산형(from usage)** — persister·guard·history-sync 세 소비자의 이상적 사용 코드를 먼저 쓰고 core 계약을 역산 | problem, design |
| diverge-generator-claude5 | generator | worker | Claude | fable-5[1m] / effort xhigh | 시드: **최소 변경형** — 현행 `makeCoreStore`·`overrideInitialEvents` 구조 최대 보존, 구분만 증분으로 얹기 | problem, design |
| diverge-generator-claude6 | generator | worker | Claude | fable-5[1m] / effort xhigh | 시드: **생성 API 분리형(from nothing)** — 스택 생성 경로 자체를 재설계, init/load를 별도 팩토리·생성 모드로 분리하는 데서 출발 | problem, design |
| diverge-generator-claude7 | generator | worker | Claude | fable-5[1m] / effort xhigh | 시드: **선례 이식형** — 타 생태계 복원 패턴(브라우저 탭 복원, Android SavedInstanceState, react-navigation persistence, XState snapshot 등) 벤치마킹에서 역산 | problem, design |
| filter-curator-claude | curator | curator | Claude | 기본 / effort xhigh | 탈락 기준의 축: 요구사항·비목표 위배(치유 불가), 자기완결성 미달, 본질 동일 후보는 접기. 소스 사실의 심층 검증은 정련 단계 게이트 몫 — 여기선 명백한 오류만 | problem, design |
| converge-judge-claude | judge | judge | Claude | 기본 / effort xhigh | 비교 축: 판단 기준 충족을 전제로 트레이드오프의 질. 판정문에 패자·차점안의 **이식 가치**(우승안에 가져올 강점)를 명시 | problem, design |
| refine-worker-claude | worker | worker | Claude | fable-5[1m] / effort xhigh | 우승안을 완전한 설계서로 정련. 차점안 강점 이식은 judge 판정문이 지목한 것에 한정(설계 뒤섞기 금지). 모든 결정을 현행 소스로 검증·근거 위치 기록, 이연 4건 D-채번. 우승안의 방향 자체를 뒤집을 발견·사용자 판단이 필요한 트레이드오프는 자체 결정하지 말고 에스컬레이션 | problem, design |
| review-reviewer-claude | reviewer | reviewer | Claude | 기본 / effort xhigh | 전담 축: 요구사항 정합·메커니즘 완결성 — R1–R13·비목표 위배, 계약 간 모순, 미결정 잔존, 소비자 성립 논증의 구멍 | problem, design |
| review-reviewer-codex | reviewer | reviewer | Codex | 기본 / high | 전담 축: 소스 사실 검증 — 설계가 전제하는 현행 core·history-sync 동작을 레포 코드와 대조, R8 non-breaking 논증을 실제 코드 경로로 검증 | problem, design |

## 4. 인라인 자산 정의

### workflow: diverge-converge-refine (run-local)

경쟁 가능한 설계 접근이 여럿일 때, 후보를 발산 생성해 선별·상대 비교로 수렴하고
우승안을 정련해 독립 검증 게이트를 통과시키는 합성 워크플로우입니다.

#### 슬롯

| 슬롯 | 롤 카드 | 책임 한 줄 |
|---|---|---|
| generator | ~/.agents/orchestration/roles/worker.md | 배정 접근법으로 후보 스케치 작성 (generate-filter 임베드 슬롯) |
| curator | ~/.agents/orchestration/roles/curator.md | 중복 접기·생존/탈락 판정 (generate-filter 임베드 슬롯) |
| judge | ~/.agents/orchestration/roles/judge.md | 대결별 비교 판정 (tournament 임베드 슬롯) |
| worker | ~/.agents/orchestration/roles/worker.md | 우승안 기반 설계서 정련 (review-loop 임베드 슬롯) |
| reviewer | ~/.agents/orchestration/roles/reviewer.md | 설계서 독립 리뷰·판정 (review-loop 임베드 슬롯) |

#### 절차

1. **발산·선별** — generate-filter 워크플로우 실행 (정련 라운드 0회)
   - 바인딩: generator ← 세션 테이블 diverge-generator-\*, curator ← filter-curator-claude
   - 입력: `handoff.md`(과제 스펙·판단 기준·후보 스케치 형식)
   - 산출: 생존 후보 목록 → 2단계 입력
2. **수렴** — tournament 워크플로우 실행 (생존 후보가 2건 이상일 때; 1건이면 그 후보가
   우승으로 3단계 직행)
   - 바인딩: 후보 집합 ← 1단계 생존 목록(외부 제공 — generator 미바인딩),
     judge ← converge-judge-claude
   - 대진 방식: 리그전(round-robin), 전체 순위 산출
   - 산출: 우승안·전체 순위·대결별 판정문 → 3단계 입력
3. **정련·게이트** — review-loop 워크플로우 실행
   - 바인딩: worker ← refine-worker-claude, reviewer ← review-reviewer-\*
   - 입력: `handoff.md` + 우승 후보 전문 + tournament 판정문·순위 + curator 판정문
   - 산출: 확정 메커니즘 설계서 (run 최종 산출; 확정 시 Linear FEP-2548 게재)

#### 판정·종료

- 판정 어휘는 임베드 워크플로우 각자의 것을 그대로 소비합니다(생존/탈락 · 대결 승자 ·
  `APPROVE`/`REQUEST_CHANGES`).
- 각 임베드 단계의 라운드 캡·생존 0건 처리·판단 불가 처리·에스컬레이션 규칙은 해당
  워크플로우 정의를 따릅니다.
- **종료 조건**: 4단계 review-loop의 종료(전원 `APPROVE`).

#### 보고 의무

- 임베드 워크플로우 각자의 보고 의무를 그대로 따릅니다(candidates/·curation/·
  tournament/·reviews/ 경로 규약 포함).
- 오케스트레이터: 단계 전환마다 진행 상황과 산출 경로를 보고합니다(확인 대기 없이
  진행). 수렴 단계 종료 보고는 순위·쟁점별 근거·이식 가치 목록을 포함합니다.

## 5. 설계 메타

- **적용된 디폴트**: reviewer 2명(Claude+Codex 교차, 동일 role) — 합의 게이트 슬롯
  디폴트. curator·judge·worker 각 1명 — 일반 슬롯 디폴트. 리뷰어 전담 축·worker 1m은
  교훈 반영(아래).
- **사용자 명시(디폴트보다 우선)**: 발산→수렴 접근 자체("다양한 메커니즘이 트레이드오프를
  두고 경쟁, 넓은 커버리지로 발산 후 수렴"). generator 전원 Claude Code / fable-5[1m] /
  effort xhigh. 시드 후보 7종 전부 채택(generator 7세션). plan(고도) 렌즈 전 세션 제거 —
  렌즈는 problem·design만. 중간 사용자 확인 없이 최종 산출물까지 자율 진행. 요구사항
  R12(복원 범위 — 탐색 기록 필수, transition 정보 등 비필수)·R13(직렬화는 core 밖 —
  codec은 스냅샷 사용자 책임) 추가.
- **설계 근거**: 매핑 — 후보를 넓게 만들고 걸러냄 → generate-filter, 남은 후보 중
  최선을 상대 비교 → tournament(자산 정의가 명시하는 canonical 후속), 우승안의 완전한
  설계서화 + 독립 검증 → review-loop. 발산 다양화는 fan-out 바인딩의 접근법 시드로 달성.
  정련 worker는 신규 세션(fresh) — 우승 generator 재바인딩 대신 컨텍스트 여유 확보,
  승계는 후보 문서·판정문으로 충분.
- **메모리 반영**:
  - `planning-run-needs-mechanism-altitude-reconciliation-clause`(design) — plan(고도)
    렌즈 적용을 제안했으나 사용자 지시로 전 세션에서 제거(이번 run 비적용, seen 3→2
    되돌림). 목표 고도 명시는 §1 판단 기준의 한 문장으로만 유지.
  - `worker-context-exhaustion-restart-on-reopen-or-bind-1m-for-multicycle`
    (operations, seen 6) — 대형 설계서 + 재오픈 가능 과제라 정련 worker를 fable-5[1m]으로
    선제 바인딩. generator는 스케치 수준이라 기본 모델.
  - `empirical-behavioral-review-catches-input-defects-logic-review-approves`
    (operations) — "논리 검증과 별개의 사실 검증 축" 교훈을 문서 산출물에 번안:
    reviewer-codex에 소스 사실 검증 전담 축 부여.
  - 그 외 히트(orchestrator-routes-design-questions-to-worker,
    large-deliverable-stalls-midstream 등)는 operations scope — 실행 시 orchestrate가
    조회·적용할 대상이라 plan에는 비반영.
