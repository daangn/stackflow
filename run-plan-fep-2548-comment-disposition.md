# Run Plan — PR #723 리뷰 코멘트 처분 (FEP-2548)

## 1. 과제 스펙 · 판단 기준

### 과제 스펙

GitHub PR #723 (daangn/stackflow, base `main` ← head `feature/fep-2548`)에 달린 리뷰 코멘트를 전수 처분한다. 로컬 worktree `/Users/anakin/Programming/stackflow--feature-fep-2548-wt`(브랜치 `feature-fep-2548-wt`, upstream `feature/fep-2548`)가 PR head(`d83506ea`)와 동기 상태다.

**처리 대상** — PR conversation의 리뷰 보고서 코멘트 2건(작성자 ENvironmentSet, 이전 리뷰 run의 산출물). GitHub review thread(인라인 코멘트)는 0건이다:

- **C1** = comment `4912272833` — 종합 리뷰: 머지 전 필수 2건(#1 구조 검사 강화, #2 루트 문서 큐레이션) + Major 2건(#3 로드 검증 경계, #4 훅 throw 테스트) + Minor 9건(#5–#13) + Nit 5건 + 기각된 후보 3건(참고용 — 처분 불요).
- **C2** = comment `4912272962` — 설계 충실성·요구사항 검증: findings 7건(전부 minor/info) + open question 소견 2건(둘 다 "현상 유지 동의" — 처분 불요이나 확인 필요).

**처분 단위는 개별 finding**이다(코멘트가 아니라). 각 finding에 대해:

- **수용** → 조치 커밋 1개(유사 finding 병합 허용 — 병합 시 finding↔커밋 매핑을 처분표에 명시). cross-comment 중복이 실재한다: C1#1≈C2#2(구조 검사), C1#5≈C2#1(RB3 자구 차이), C1 nit "중복 id last-wins"≈C2#7 등.
- **기각** → 기각 사유(검증 가능한 근거 필수).
- **에스컬레이션** → 설계 변경을 요구하는 finding은 수용/기각하지 않고 사용자(인간) 판단으로 회부하고, 그 결정에 따라 처분한다.

**공표(외부 작용)는 리뷰 게이트 최종 통과 후에만**: finding별 처분·커밋 해시를 원 코멘트별 답글 1개(C1용·C2용)로 게시하고, 커밋을 PR 브랜치에 push한다. 대상 코멘트는 issue comment라 GitHub resolve 메커니즘이 없다 — 답글 게시가 resolve를 대신한다(스레드 resolve 대상 없음).

**후속 단계(run 범위 밖, 산출물 요건에 영향)**: 공표 후 사용자가 직접 PR에 **inline review thread를 달며 리뷰할 예정**이다. 따라서 이 run의 산출물은 그 리뷰의 입력으로 기능해야 한다 — finding↔커밋 1:1 추적성(커밋 메시지의 finding 태그), 답글의 처분표, 작은 커밋 단위가 사용자의 diff 단위 리뷰를 지원한다. 사용자 인라인 리뷰의 처리는 이 run에 포함되지 않는다.

**참조 정본** (둘 다 branch에 동거 또는 Linear):

- 설계 문서 `design-fep-2548-init-load-mechanism.md` — §3 공개 계약 / §4 생성 시퀀스 / §5 불변식.
- Linear FEP-2548 코멘트 `comment-3dbff893` — 요구사항 R1–R13·완료정의·비목표·설계이연.

**주의**: worktree의 미커밋 파일 `run-plan-fep-2548-review.md`(이전 run의 로컬 산물)와 이 plan 파일은 과제 범위 밖 — 커밋에 혼입 금지.

### 이번 작업 고유 판단 기준 (role 중립 — worker에겐 달성 목표, reviewer에겐 리뷰 포커스)

1. **전수성** — C1·C2의 모든 finding(nit 포함)이 처분표에 등재되고 처분이 있다. 누락 0. "처분 불요" 항목(C1 기각된 후보 3건, C2 open question 소견)도 그렇게 판단한 근거와 함께 표에 남긴다.
2. **처분 정당성** — 수용/기각/에스컬레이션 분류가 설계 문서·Linear 요구사항·코드/실행 실측에 근거한다. 기각 사유는 검증 가능해야 한다(인상·추정 불가).
3. **에스컬레이션 분류 기준** — 다음을 요구하는 finding은 worker가 수용/기각을 결정하지 않고 에스컬레이션 버킷에 넣는다: ① 설계 문서의 내용 수정(특히 §3/§4/§5 — 예: C1#5/C2#1의 "RB3 구현 또는 설계 개정" 양자택일, C1#3의 설계 한계 명시·FEP-2546 등재, C1#13의 §7.1.3 승격) ② 스코프/이연 결정(예: C1#12 문서 사이트 유예의 명시적 결정 기록) ③ 그 밖에 요구사항·설계의 취지 자체를 바꾸는 변경.
4. **계약 보존** — 수용 조치는 설계 문서 §3 공개 계약·§4 생성 시퀀스·§5 불변식을 위반하지 않는다. 이 절들의 수정이 필요한 항목은 기준 3에 따라 애초에 에스컬레이션 대상이므로, "변경 자체가 해당 절 수정인 경우" 예외는 사용자 결정을 통해서만 발동된다 — worker 재량이 아니다.
5. **커밋 규율** — 수용 finding 1건 = 커밋 1개(병합 시 매핑 명시). 커밋은 path-scope로 무관 변경 혼입 금지. 이미 만들어진 커밋의 수정(amend/rebase/force-push) 금지 — 정정은 새 커밋 stack. 커밋 메시지에 트리거 finding(예: `C1#8`)을 명시한다.
6. **실측 의무** — 조치 완료 상태에서 `yarn typecheck`·`yarn build`·`yarn test`(core)를 실제 실행해 green을 확인한다. 타입·빌드·테스트 주장은 추론 단정이 아니라 실행 결과로만 성립한다.
7. **답글 정확성** — 답글 초안(C1용·C2용 각 1개)이 finding별 처분·근거·커밋 해시를 정확히 반영하고, 수행하지 않은 조치를 수행한 것처럼 서술하지 않는다.
8. **처분표 자기완결성** — 트리아지 산출물(처분표)은 조치 단계의 **별도 세션**이 추가 맥락 없이 그대로 집행·검증할 수 있어야 한다: finding별 원문 인용/위치, 처분·근거, 수용 항목의 계획된 조치와 커밋 단위(병합 매핑 포함), 에스컬레이션 항목의 쟁점·선택지 정리를 자체 포함한다.

## 2. 워크플로우

**review-loop** (`~/.agents/orchestration/workflows/review-loop.md`) **2회 직렬 실행** — 단계별 독립 바인딩(사용자 지정: 트라이지 단계 세션과 조치 단계 세션 분리), 사이에 에스컬레이션 회부 단계.

- **Loop A — 트리아지**: triage-worker가 finding 전수 처분표(판단 기준 1–4·8)를 산출 → triage-reviewer 게이트(전원 `APPROVE`까지 review-loop 절차 그대로). 이 게이트는 분류의 정당성을 검증한다 — 오처분이 구현·공표로 번지기 전에 차단하기 위함.
- **에스컬레이션 회부**: Loop A 종료 후, 에스컬레이션 버킷을 오케스트레이터가 사용자에게 판단 질문으로 회부한다(각 항목의 쟁점·선택지·트레이드오프 자기완결 서술, worker 권고가 있으면 "worker 권고"로 귀속). 사용자 결정은 Loop B 스코프에 편입된다.
- **Loop B — 조치**: impl-worker가 승인된 처분표(+사용자 결정)를 입력으로 수용 항목을 구현 — 커밋·실측·답글 초안까지가 산출물 → impl-reviewer 게이트(판단 기준 전체, 특히 5–7). 차단 시 review-loop 3·4단계(판정 처리·거부 처리) 그대로.
- **종료 조건**: Loop B에서 reviewer 전원 `APPROVE`.
- **공표**: 종료 후 게이트 통과 산출물 그대로 답글 게시 + PR 브랜치 push. 공표 내용이 게이트 통과본과 달라지면 안 된다. 공표로 run이 끝나고, 이후 사용자의 inline review 리뷰가 후속된다(1절).
- 판정 어휘·라운드 캡(각 loop 5라운드)·쟁점 중재는 review-loop 기본을 따른다.

## 3. 세션 테이블

| 논리 세션명 | 슬롯 | role | 런타임 | 모델 | 세부 지침 | lens |
|---|---|---|---|---|---|---|
| triage-worker-claude | worker (Loop A) | worker | Claude | Fable 5 (1M, `claude-fable-5[1m]`) · effort xhigh | C1·C2 원문에서 finding을 직접 전수 추출(요약본 의존 금지). 처분 근거는 설계 문서·Linear 요구사항·코드 실측으로 삼각측량. 산출물은 판단 기준 8의 자기완결 처분표. | design, architecture, implementation, test |
| triage-reviewer-claude | reviewer (Loop A) | reviewer | Claude | 기본 | 처분표의 분류·근거를 finding 원문·설계 문서·코드와 대조(특히 기각 사유의 검증 가능성과 에스컬레이션 경계 — 판단 기준 2·3). 자기완결성(기준 8)도 게이트 대상. | design, architecture, implementation, test |
| triage-reviewer-codex | reviewer (Loop A) | reviewer | Codex | 기본 | triage-reviewer-claude와 동일 지침 — 교차 런타임 합의 게이트. | design, architecture, implementation, test |
| impl-worker-claude | worker (Loop B) | worker | Claude | Fable 5 (1M, `claude-fable-5[1m]`) · effort xhigh | 승인된 처분표(+에스컬레이션 사용자 결정)를 집행. 조치는 finding 1건씩 편집→검증→커밋의 lockstep(다건 일괄 편집 후 사후 분할 금지). 처분표와 다른 판단이 필요해지면 임의 이탈하지 않고 에스컬레이션. | design, architecture, implementation, test |
| impl-reviewer-claude | reviewer (Loop B) | reviewer | Claude | 기본 | **§3 공개 계약·§4 생성 시퀀스·§5 불변식 검증 전담**(판단 기준 4) — 각 커밋 diff가 설계 계약을 위반하지 않는지, 계약 절 수정이 사용자 결정 없이 끼어들지 않았는지 설계 문서와 대조. | design, implementation |
| impl-reviewer-codex | reviewer (Loop B) | reviewer | Codex | 기본 | **커밋별 finding 해소 여부·실측 재현·답글 정확성 전담**(판단 기준 5–7) — 각 커밋이 대응 finding을 실제 해소하는지 diff 단위 확인, `yarn typecheck`/`build`/`test`(core) 직접 재현 실행, 답글 초안의 처분·커밋 해시 사실 대조. | implementation, test |

- 각 loop의 reviewer 2행은 게이트 fan-out — 해당 loop 종료는 전원 `APPROVE`. Loop A는 동일 지침 합의 게이트, Loop B는 **포커스 분담 게이트**(사용자 지정: claude=계약 검증 / codex=해소·실측·답글 — 두 담당의 합집합이 Loop B 판단 기준 전체를 커버하며, 각자 자기 담당에서 차단 사유를 내면 게이트가 막힌다).
- 트리아지 단계와 조치 단계는 세션을 공유하지 않는다(사용자 지정) — 단계 간 전달물은 승인된 처분표뿐이며, 그래서 기준 8(자기완결성)이 게이트 대상이다.

## 4. 인라인 자산 정의

해당 없음 — 워크플로우(review-loop)·role(worker/reviewer)·lens(design/implementation/test) 전부 자산 재사용. 2회 직렬 실행·에스컬레이션 회부는 run 한정 구성(2절)이지 신규 워크플로우가 아니다.

## 5. 설계 메타

- **사용자 명시 입력** (디폴트보다 우선):
  - 트리아지 단계 세션과 조치·리뷰 단계 세션 분리 → review-loop 2회 직렬, 단계별 독립 바인딩(세션 6개).
  - worker role 세션 전원 **Fable 5 (1M, `claude-fable-5[1m]`) + effort xhigh** (사용자 메모리: "fable 5" 지정은 항상 1M variant).
  - 공표 후 사용자 인라인 리뷰 후속 → 산출물 요건(finding↔커밋 추적성·작은 커밋)으로 1절에 반영.
  - **architecture lens** 부여: Loop A 전원 + impl-worker-claude.
  - **Loop B 게이트 포커스 분담**: impl-reviewer-claude = §3/§4/§5 계약 검증 전담(test 렌즈 제거), impl-reviewer-codex = 커밋별 해소 여부·실측 재현·답글 정확성 전담.
- **적용된 디폴트**:
  - worker 각 단계 1명(일반 슬롯 디폴트). Loop B는 다수 finding이 같은 파일(`loadSnapshot.ts` 등)에 겹치고 커밋이 단일 스트림이어야 해 분할 이득이 없음.
  - reviewer 각 단계 2명 Claude+Codex(합의 게이트 슬롯 디폴트) — 처분·커밋이 공표(외부 작용)로 이어지는 게이트라 교차 런타임 유지. Loop A는 동일 지침, Loop B는 사용자 지정 분담.
  - reviewer 모델 미지정(런타임 기본). lens 자산 바인딩.
  - impl-reviewer-codex의 lens에서 **design 제거**(implementation, test만 부착) — 계약 검증이 claude 전담으로 넘어간 분담에 맞춘 스킬 설계(사용자 미지정 — 이견 있으면 조정).
- **설계 근거**:
  - 산출물(처분표+조치 커밋+답글)을 만들고 독립 검증 게이트를 통과시켜야 하는 과제 → review-loop.
  - **단계 분할**: 처분 오류(잘못된 기각·누락된 에스컬레이션)는 공표되면 정정 비용이 큼 — 분류를 먼저 게이트하고, 에스컬레이션 항목은 사용자 결정이 선행돼야 구현 가능하므로 Loop A 직후 회부가 자연스러운 타이밍.
  - **공표 후행**: 답글 게시·push는 외부 작용이라 게이트 전원 통과 후에만 — 게이트가 공표 품질의 방어선.
- **메모리 반영** (`~/.agents/orchestration/memory/` + 사용자 메모리):
  - `worker-decision-fork-escalate-to-owner-not-orchestrator-pick` (seen 4) → 에스컬레이션 버킷의 사용자 회부 절차·자기완결 질문·worker 권고 귀속 규율을 2절에 내장.
  - `empirical-behavioral-review-catches-input-defects-logic-review-approves` (seen 6) → 교차 런타임 합의 게이트 + reviewer 재현 실행 의무 유지.
  - `typeheavy-design-impl-gate-must-compile-not-reason-tsc-beats-review-by-inspection` (seen 3) → 실측 의무(판단 기준 6)로 명문화 — 이 PR 후속 조치도 타입 헤비 계약을 만짐.
  - `per-fix-commit-split-unidiff-zero-mismaps-prefer-lockstep-verify-tree-clean` (seen 2) → per-fix 커밋은 lockstep 기본(impl-worker 세부 지침)·path-scope·기존 커밋 무수정(판단 기준 5).
  - 사용자 메모리 `feedback_fable5_means_1m` → worker 모델 표기를 `claude-fable-5[1m]`로 고정.
