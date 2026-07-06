# plugin-history-sync — 새로고침(reload) 이후 동기화

`@stackflow/plugin-history-sync`가 페이지 새로고침을 건너 스택과 브라우저 history의 동기화를 지속하게 하는 설계. reconciler 구조(`plans/fep-2001/`)의 후속으로, 그 문서들이 범위에서 제외했던 reload를 다룬다. 이 문서는 코드 없이 메커니즘을 결정적으로 명세하며, 구현 세션이 이 문서만으로 정확히 구현할 수 있는 것을 목표로 한다.

용어는 `plans/fep-2001/glossary.md`를 따르고, 이 문서가 추가하는 용어는 [§4 용어](#4-용어)에 정의한다.

## 1. 문제

### 1.1 실사용 근거

- 웹뷰에서 메모리 압박으로 탭(렌더러 프로세스)이 종료된 뒤 사용자가 복귀하면 페이지가 자동 reload된다. 모바일 웹뷰의 일상적 사건이다.
- 오류 처리를 위해 강제 refresh를 수행하는 코드가 웹뷰 내부와 앱 양쪽에 존재한다.
- 두 경우 모두에서 "이전 화면들이 사라지고 뒤로가기가 이상해진다"는 CS가 다수 접수되어 있고, 각 서비스 조직 개발자들의 불만 이슈로 남아 있다.

### 1.2 현재 동작 (소스 기준)

reload 후 현재 브라우저 엔트리의 `history.state`에는 이 플러그인이 기록한 stamp(직렬화된 활동 스냅샷·step·entry ordinal)가 남아 있다. 현재 구현은 이 stamp만으로 부트한다.

1. **스택 소실**: `overrideInitialEvents`는 stamp의 현재 활동(+현재 step) 하나만 리플레이한다. 하위 활동들, 각 활동의 step 구성, exit 상태로 잔존하던 활동이 모두 사라진다.
2. **좌표 파탄**: `HistorySyncController.start()`는 stamp가 있으면 `browserCursor`만 그 ordinal로 맞추고 재스탬프하지 않는다. 결과적으로 브라우저는 ordinal K(예: 5)에 서 있는데 스택이 만드는 entry ordinal은 0에서 다시 시작한다. 첫 커밋(예: push)에서 sync pass가 `delta = 1 − 5 = −4`를 계산해 `history.go(-4)`를 실행하고, 브라우저가 4칸 뒤로 점프하며 세션이 파탄난다.
3. **번역 어긋남**: 이전 엔트리들의 stamp는 남아 있지만 스택에 대응 활동이 없어, back/forward의 파이프라인 번역이 성립하지 않는다.

근본 원인은 reconciler의 출발 불변식 — "초기 진입 시 브라우저==스택" — 을 reload가 위반하는 것이다. 스택의 유일한 진실인 커밋 이벤트 로그가 문서(document) 수명에 갇혀 있고, reload를 건너 남는 것(엔트리·stamp)만으로는 이를 재구축할 수 없다. 브라우저는 부트 시점에 **현재 엔트리의 state만** 동기 관측을 허용하므로, 과거 엔트리들을 열거해 재구축하는 길도 없다.

## 2. 목표와 계약

### 2.1 필수 조건

- **(1) 스택 보존**: 새로고침 이후에도 스택이 보존된다. 동치 기준은 [커밋 로그 동치](#4-용어) — 활동 구성·순서·params·activityContext·steps(각 step의 id·params·순서)·zIndex 파생값·exit 상태 잔존 활동·활동/step id·eventDate까지, 마지막 idle 정지점의 커밋 스택과 동치인 스택으로 부트한다.
- **(2) back/forward 동일 동작**: 새로고침 이후에도 브라우저 뒤로/앞으로가 이전과 관찰상 동일하게 동작한다. history 길이·현재 위치·각 엔트리의 대응이 보존되고, 착지 시 동일한 파이프라인 번역(동일한 화면 전환, `preventDefault` 존중 포함)이 일어난다.

### 2.2 보장 표면

메커니즘은 "현재 엔트리에 이 플러그인의 stamp가 있고, 그에 짝맞는 스냅샷이 남아 있으면 복원"으로 조건화된다. 보장하는 표면:

- **(a) 명시적 reload**: F5, `location.reload()`, 당겨서 새로고침, 오류 복구용 강제 refresh.
- **(b) 렌더러/콘텐츠 프로세스 사망 후 복귀 reload**: 같은 탭/웹뷰 인스턴스가 유지된 채 문서만 다시 로드되는 경우(웹뷰 eviction 복귀, Chrome tab discard, WKWebView의 WebContent 프로세스 종료 후 reload).

파생 케이스(같은 메커니즘이 커버하지만 보장하지 않음):

- **탭 복제**: Chromium 계열은 history와 sessionStorage를 함께 복사하므로 복제 탭에서도 복원된다. Firefox/Safari는 sessionStorage를 복사하지 않아 폴백 부트로 강등된다.
- **브라우저 재시작 세션 복원**: Firefox는 sessionStorage를 복원하므로 동작한다. Chrome/Safari는 복원하지 않아 폴백 부트로 강등된다.

명시적 제외:

- 새 탭에 URL 붙여넣기·외부 유입·주소창에서 URL 수정 후 이동: history 세션이 없거나 새 엔트리이므로 지금처럼 cold start.
- 호스트 앱 프로세스 재시작(웹뷰를 가진 앱이 죽었다 재실행): Android `saveState`/iOS `interactionState`로 history를 복원하더라도 sessionStorage는 어느 플랫폼도 복원하지 않는다 — stamp는 있으나 스냅샷이 없어 폴백 부트.

### 2.3 비목표

- 활동 컴포넌트의 transient UI 상태(폼 입력·스크롤·컴포넌트 state)와 loader 데이터의 복원. 이는 스택 상태가 아니라 앱 상태다. loader와의 계약은 다음과 같이 정밀하다:
  - loader의 실행 산물(loaderData·preloadRef 등 [런타임 파생 필드](#4-용어))은 **스냅샷에 영속화하지 않는다** — 기록 시점에 스트립한다([§5.1](#51-저장-표면과-스키마)). Promise를 품는 이 값들은 구조 직렬화로 원형을 잃으므로(직렬화하면 `.then` 없는 순수 객체가 되어 `useLoaderData()`가 깨진 래퍼를 반환한다), 영속화는 애초에 성립하지 않는다.
  - 복원 부트는 **복원 스택에서 entered 상태인 활동**에 한해 loader를 재실행한다 — 진입 이벤트가 `Pushed`든 `Replaced`든([§5.3](#53-복원-부트)). exit 상태로 잔존하는 활동은 재실행하지 않는다: 렌더되지 않아 데이터를 소비하지 않고, forward로 재진입하는 순간 정상 push 파이프라인의 loader 훅이 신선하게 실행된다.
  - 따라서 부트 시점 loader 동시 실행량은 세션 누적 push 수가 아니라 **복원 스택의 entered 깊이**에 비례한다. cold start(1건)보다 많은 동시 실행이며, 부작용 있는 loader를 쓰는 앱은 이 성질을 알아야 한다 — 명시된 공개 성질로 둔다.
- 커밋 로그의 컴팩션. 실사용에서 극단적으로 긴 세션이 관측된 바 없어, v1은 크기 안전 밸브([§5.1](#51-저장-표면과-스키마))로 대체한다. 컴팩션은 로그 동치 기준을 훼손하므로(오래된 exit 잔존 활동의 이벤트를 지우면 동치가 깨진다) 실수요가 관측될 때까지 도입하지 않는다.
- 커밋되지 않은(전이 중이던) 네비게이션 시도의 보존. 복원은 마지막 idle 정지점 기준이다 — 기존 eventual consistency 계약("모든 정지점에서 브라우저==스택")을 reload를 건너는 것으로 확장한 해석이다.

## 3. 전제

이 설계가 의존하는 브라우저·플랫폼 성질. 각각을 P-번호로 인용한다.

- **P1 — history 세션은 reload를 건너 보존된다.** 같은 탭에서 문서만 다시 로드될 때(§2.2의 (a)(b)) history 엔트리의 수·순서·URL·**엔트리별 `history.state`** 가 보존되고, 현재 엔트리의 state는 새 문서에서 `history.state`로 동기 관측된다. 이는 HTML 스펙의 세션 히스토리 모델이 보장하며, 현재 구현의 stamp 복원 경로가 이미 프로덕션에서 의존하는 성질이다.
- **P2 — reload 후 back/forward는 같은 문서의 popstate로 발화한다 (실측 검증).** reload는 현재 엔트리의 문서만 교체하며, 이전에 `pushState`로 만들어진 엔트리로의 back/forward는 전체 로드가 아니라 **교체된 새 문서 안에서 popstate 이벤트로** 발화하고, 착지 엔트리의 state가 그대로 전달된다. 검증 절차: 로컬 HTTP 페이지에서 `pushState`로 엔트리 2개를 만들고 문서 식별자를 심은 뒤 reload → back → forward → 착지 엔트리에서 재 `pushState` → back 순으로 이동하며, 각 단계에서 문서 식별자 유지 여부·popstate 발화 여부·`history.state` 내용을 관측했다. Chromium 149와 WebKit 26.5에서 동일하게 성립함을 확인했다. 이 성질 덕에 **기존 popstate 번역 메커니즘이 reload 이전과 이후에 걸쳐 동일하게 동작한다.**
- **P3 — sessionStorage는 보장 표면을 건너 생존하고, 탭별로 격리되며, 동기 API다.** sessionStorage는 렌더러가 아닌 브라우저측 프로세스(Chromium: 브라우저 프로세스, WebKit: 네트워크 프로세스)가 소유하므로 (a)(b)에서 생존한다. 탭마다 독립 사본이며, 탭 복제 시 Chromium은 복사하고 Firefox/Safari는 복사하지 않는다. 브라우저 재시작 세션 복원 시 Firefox만 복원한다. 원본 조사 출처: WebKit Storage Architecture(docs.webkit.org), Chromium DOM Storage README, Chrome tab discarding 문서, WHATWG HTML Web Storage.
- **P4 — 부트 시점 sessionStorage 읽기는 신뢰할 수 있다.** 과거 WebKit에는 부트 직후의 조기 접근이 스토리지와 단절되는 결함(Bug 199929)이 있었으나 수정되었다. 다만 이 설계의 **정확성은 P4에 의존하지 않는다**: 읽기가 실패하면 부트 판정이 폴백 부트로 결정론적으로 강등될 뿐이다([§5.2](#52-부트-판정)). P4는 복원 적중률에만 영향을 준다.
- **P5 — 직렬화 가능성.** 활동 params(문자열 맵)·step params, 그리고 [런타임 파생 필드](#4-용어)를 스트립한 뒤의 activityContext는 구조 직렬화(flatted) 가능해야 한다. 현재 stamp가 full 활동 스냅샷을 `history.state`에 직렬화하면서 이미 지고 있는 전제와 동일하며, 새 제약이 아니다.
- **P6 — sole author.** 앱 구간의 브라우저 엔트리는 이 플러그인이 유일하게 발행한다(기존 전제 승계). 한 문서에는 이 플러그인 인스턴스가 하나만 존재한다.

## 4. 용어

`plans/fep-2001/glossary.md`의 언어 위에 다음을 추가한다.

- **커밋 로그 (committed log)**: 코어 스토어를 구성하는 도메인 이벤트 로그 중 네비게이션 이벤트 6종(`Pushed`·`Replaced`·`Popped`·`StepPushed`·`StepReplaced`·`StepPopped`)의 전체 순서열. 커밋된 스택의 완전한 인과 기록이다. `Initialized`·`ActivityRegistered`는 매 부트가 재생성하므로 포함하지 않는다. `Paused`·`Resumed`는 현행 코어가 발행하지 않는 휴면 이벤트이고 세션 내 일시 상태이므로 포함하지 않는다.
- **런타임 파생 필드 (runtime-derived context)**: loader·preload류 플러그인이 액션 파이프라인에서 `activityContext`에 주입하는 실행 산물 — `loaderData`(loader 결과를 감싼 동기 관측 Promise), `preloadRef`. 값이 아니라 실행의 핸들이므로 직렬화로 원형이 보존되지 않으며, 스냅샷 기록 시 제거되고 복원 시 재실행으로 재확립되는 것이 원칙이다.
- **스냅샷 (snapshot)**: 마지막 idle 정지점의 상태를 담은 sessionStorage 레코드 — 커밋 로그(런타임 파생 필드 스트립 적용)와 활성 시드([§5.1](#51-저장-표면과-스키마))로 구성된다. 세대별 키 하나에 통째로 교체 기록되며 부분 갱신이 없다.
- **세대 (generation)**: 하나의 동기화 계보를 식별하는 값. cold start(폴백 부트 포함)마다 새로 발급되고, 복원 부트는 착지 엔트리 stamp의 세대를 채택해 계보를 지속한다. 모든 stamp와 스냅샷 키에 기록되어 둘의 짝맞춤 근거가 된다. entry ordinal의 의미(순서·거리·방향)는 **같은 세대 안에서만** 정의된다.
- **복원 부트 (restore boot)**: stamp와 스냅샷의 짝이 성립해, 커밋 로그 리플레이로 스택을 재구성하는 부트.
- **치유 복원 (healing restore)**: 복원 부트의 변형. stamp 위치와 스냅샷의 스택 위치가 어긋난 경우(정지점 사이에 reload가 낀 레이스), 스냅샷을 진실로 복원한 뒤 표준 sync pass가 브라우저를 스택 위치로 맞춘다.
- **폴백 부트 (fallback boot)**: stamp는 있으나 짝이 성립하지 않아 cold start로 승격하고, 이전 세대 엔트리를 정리하는 부트.
- **부트 정리 (boot purge)**: 폴백 부트가 이전 세대 엔트리들을 self-induced 뒤로 이동으로 소거하고 새 세대의 좌표를 재확립하는 동작.
- **커밋 로그 동치 (committed-log equivalence)**: 복원된 스택이 `aggregate(스냅샷 로그)`의 결과와 같다는 성질. 코어 런타임 자체가 매 dispatch마다 전체 이벤트 로그를 재집계하므로(`makeCoreStore`), 로그를 보존해 리플레이하면 활동 구성·순서·params·activityContext·steps·zIndex 파생·exit 잔존·id·eventDate가 **구성적으로** 보존된다. 개별 필드를 열거해 검증할 필요가 없는 것이 이 기준의 요점이다. **명시적 예외 하나**: activityContext의 런타임 파생 필드는 동치 대상이 아니다 — 기록 시 스트립되고, entered 활동에 한해 복원 시 loader/preload 재실행으로 재확립된다([§2.3](#23-비목표)의 계약).
- **체크포인트 불변식 (checkpoint invariant)**: 모든 idle 정지점에서 ① 현재 엔트리의 stamp가 그 엔트리의 identity·ordinal·세대를 담고 ② 스냅샷이 그 시점의 커밋 로그를 담는다. 따라서 임의 시점의 reload는 항상 마지막 idle 정지점의 커밋 상태를 발견한다.

## 5. 메커니즘

### 5.1 저장 표면과 스키마

**stamp (`history.state`, 엔트리별)** — 기존 스키마에 세대 필드를 추가한다:

| 필드 | 상태 | 역할 |
|---|---|---|
| `activity` (full 스냅샷) | 기존 | forward 번역의 원천, 부트 identity 판정 |
| `step?` | 기존 | 동일 |
| `ordinal` | 기존 | 좌표 (같은 세대 내에서만 유효) |
| `generation` | **신규** | 스냅샷 짝맞춤·세대 판별 |

stamp는 소형을 유지한다 — 커밋 로그를 `history.state`에 싣지 않는다. 모든 엔트리에 당시 로그가 사장(死藏)되어 브라우저측 메모리·세션 파일에 누적되는 비용을 피하기 위한 선택이다.

**스냅샷 (sessionStorage, 세대별 키 1건)** — `{generation, committedLog, activationSeeds}`. 키는 플러그인 식별 접두어 + 세대. 세대별 키로 나누는 이유: 같은 오리진·같은 탭에서 복수의 앱/문서가 왕래해도(예: 다른 SPA로 이동 후 back으로 귀환) 서로의 스냅샷을 덮어쓰지 않는다 — 각 문서의 부트는 자기 stamp의 세대 키만 조회하므로 계보 간 오염이 없다. 죽은 세대의 스냅샷은 탭 수명 동안 잔존할 수 있으며 용량 밸브가 상한이 된다.

- `committedLog`에는 **런타임 파생 필드 스트립**을 적용한다: 각 `Pushed`/`Replaced` 이벤트의 `activityContext`에서 `loaderData`·`preloadRef`를 제거한 사본을 기록한다(원본 이벤트 객체는 변형하지 않는다 — 스토어의 로그는 손대지 않고 직렬화 입력만 스트립). 근거: 이 값들은 Promise를 품은 실행 핸들이라 직렬화로 원형을 잃고([§2.3](#23-비목표)), 놔두면 스냅샷 크기가 이벤트당 loader 응답 크기(KB~MB급)로 부풀어 아래 크기 산정과 밸브 헤드룸이 성립하지 않는다.
- `activationSeeds`는 이 플러그인의 부속 런타임 상태다: 활성 모니터([§5.3](#53-복원-부트))가 추적 중인 활동 id와 활성 카운트의 목록. 공개 훅 `useIsActivatedActivity()`의 값이 reload를 건너 보존되기 위한 시드로, 커밋 로그에서 유도할 수 없어(어느 활동이 defaultHistory 합성물인지는 이벤트에 남지 않는다) 별도 기록한다.

**기록 시점 — sync pass의 정착 지점에서만.** 브라우저 history를 변경하는 유일한 권위인 sync pass가 스냅샷 기록도 함께 소유한다. 기록할 커밋 로그는 그 시점 코어 스토어의 공개 이벤트 로그(`getStack().events`)를 네비게이션 6종으로 필터해 얻는다 — sync pass는 idle에서만 돌므로 이 로그는 전부 정착 상태다.

- `delta > 0`: 마지막 stampPush(현재 엔트리가 되는 push) 직전에 스냅샷을 기록한다.
- `delta == 0`: identity가 달라 stampReplace할 때 함께 기록한다. identity가 같아도 **스냅샷 신선도 검사** — 스냅샷의 마지막 이벤트 id ≠ 스토어 로그의 마지막 이벤트 id — 가 다르면 스냅샷만 갱신한다.
- `delta < 0`: 이동만 하는 비정착 상태이므로 기록하지 않는다. 착지 후 이어지는 pass가 위 규칙으로 갱신한다.

**기록 순서: 스냅샷(setItem) → stamp(replaceState/pushState).** 이 순서에서 중간 중단(크래시)이 나면 "stamp만 낡은" 상태가 되는데, 낡은 stamp든 새 stamp든 스냅샷과의 짝 판정([§5.2](#52-부트-판정))이 결정론적으로 처리한다. 반대 순서라면 "stamp는 새것, 스냅샷은 낡음"이 생겨 치유 복원의 레이스 창이 불필요하게 넓어진다.

이 규칙들이 유지하는 것이 **체크포인트 불변식**이다: 모든 idle 정지점에서 (stamp, 스냅샷) 쌍이 그 시점의 커밋 상태를 담는다.

**크기 안전 밸브.** 스냅샷 직렬화 문자열이 한도를 넘거나 `setItem`이 quota 예외를 던지면:

1. 그 세대의 스냅샷 키를 **삭제**한다. 낡은 스냅샷을 남겨두면 이후 reload가 밸브 발동 시점 이전의 과거 상태로 치유 복원되어 staleness 창이 무한정 넓어지므로, 솔직하게 "복원 불가"로 강등하는 것이 계약("마지막 idle 정지점으로 복원")에 부합한다.
2. 이 세션에서 스냅샷 기록을 중단한다(커밋 로그는 단조 성장하므로 재시도는 무익 — 고수위 플래그). 이후 이 세션의 reload는 폴백 부트가 된다.
3. 개발 환경에서 1회 경고한다. 조용한 실패가 아니라 문서화·통보되는 강등이다.

한도 기본값은 512 KiB를 권고한다. 근거: 실측 직렬화 크기 이벤트당 평균 약 215 B(대표적 params·context를 담은 Pushed/StepPushed/Popped 혼합 기준 — **런타임 파생 필드 스트립이 전제**다; 스트립 없이는 loader 응답이 실려 이 산정 자체가 무효다) → 512 KiB ≈ 이벤트 약 2,400개. 실사용 세션(수십~수백 이벤트)의 10배 이상 헤드룸이면서, sessionStorage quota(통상 오리진·탭당 5 MB)의 10% 수준이다.

### 5.2 부트 판정

부트 판정은 `overrideInitialEvents` 시점에 **전부 동기로** 완결된다. 결정 트리:

1. `history.state`에서 stamp 파싱. **부재/파싱 실패** → **cold start** (기존 경로 그대로: URL 매칭 또는 `fallbackActivity` + defaultHistory 셋업 + 새 세대 발급).
2. stamp 있음 → stamp의 세대 키로 sessionStorage에서 스냅샷 조회. **부재 / 파싱 실패 / 로그가 빈 것 / 레코드의 세대 ≠ stamp의 세대 / sessionStorage 접근 자체가 예외** → **폴백 부트**.
3. 스냅샷 로그의 모든 `Pushed`·`Replaced`의 `activityName`이 이 플러그인의 현재 라우트 집합에 존재하는지 검사(배포 스큐 가드 — 활동이 제거된 새 버전에서 낡은 로그를 리플레이하면 코어 `validateEvents`가 "미등록 활동명"으로 throw하여 부트가 죽는다; 이를 사전 차단한다). **실패** → **폴백 부트**.
4. 판정용 committed entries 계산: **커밋 로그 + 현재 부트가 라우트 집합에서 합성한 `ActivityRegistered`(라우트당 1건)** 를 코어 공개 `aggregate`에 넘겨 committed entries(엔트리 좌표 순서열 — 기존 컨트롤러와 동일한 계산)를 얻는다. 합성 없이 커밋 로그만 넘기면 안 된다 — `aggregate`는 내부에서 `validateEvents`를 호출하고, 이 검증은 **전달받은 배열 안의** `ActivityRegistered`로 등록 집합을 만들어 모든 `Pushed`를 대조하므로, `ActivityRegistered`를 제외하는 커밋 로그([§4](#4-용어)) 단독으로는 항상 throw한다(step 3의 라우트 대조는 이를 대신하지 못한다 — 검증의 출처가 다르다). `Initialized`는 포함하지 않아도 된다: 검증은 "2개 이상"만 금지하며, 부재 시 transitionDuration 0과 과거 eventDate의 조합으로 committed entries가 요구하는 enter-done 판정이 그대로 성립한다. 이 합성은 실집계와 일관된다 — 실제 부트의 스토어 구성도 같은 config에서 생성된 `ActivityRegistered`가 초기 이벤트로 선행되고, committed entries는 활동 이벤트에만 의존하므로 두 집계가 같은 순서열을 낸다. 이렇게 얻은 committed entries에서 `stamp.ordinal` 위치의 entry가 존재하고 그 identity(step id ?? activity id)가 stamp의 identity와 **일치** → **복원 부트** ([§5.3](#53-복원-부트)).
5. **불일치 또는 범위 밖** — 같은 세대에서만 도달 가능하며, 정지점 사이(번역 커밋과 정착 기록 사이)에 reload가 낀 레이스를 뜻한다 → **치유 복원**: 복원 부트와 동일하되, 부트 직후 예약된 sync pass가 `delta = 스택 ordinal − stamp.ordinal`로 브라우저를 스택 위치에 맞춘다(전진이면 pushState 재구축, 후퇴면 self-induced 이동 — 표준 sync pass 그대로). 정착에 이르지 못했던 사용자 제스처는 소실되며, 이는 §2.3의 staleness 계약과 일관된다. 스냅샷이 진실이고 브라우저가 추종자라는 방향성도 기존 원리 그대로다.

**부트 전 제스처 창.** 문서 로드 후 컨트롤러가 리스너를 세우기 전에 사용자가 back/forward를 하면(P2에 의해 popstate는 발화하나 아직 듣는 이가 없다), 부트 판정은 **최종 착지한 엔트리의 stamp**를 기준으로 이뤄진다. 착지 엔트리의 identity가 스냅샷과 일치해 "복원 부트"로 분류되더라도, 스냅샷 스택의 top은 여전히 reload 시점 위치이므로, 부트 직후 예약된 sync pass가 delta로 브라우저를 스냅샷 위치로 되돌린다 — 그 제스처는 소실된다. 즉 소실 창은 "전이 1회"에 부트 소요 시간이 더해진 것이며([§10](#10-리스크와-한계)), 결과는 결정론적이고 desync를 만들지 않는다. 구현은 "복원 부트의 초기 sync는 무동작"을 불변식으로 단언해서는 안 된다 — 무동작은 delta 0일 때의 결과이지 보장이 아니다.

판정이 폴백으로 강등되는 모든 분기는 예외를 삼키지 않는다 — 각 분기는 위에 열거된 관측 가능한 조건이며, 개발 환경에서 사유를 1회 로그한다.

**판정 인계.** 부트 판정과 그 산물(부트 유형 — cold/복원/치유/폴백, 채택 또는 새로 발급한 세대, stamp의 ordinal, 복원 시 스냅샷 로그)은 `overrideInitialEvents`에서 **한 번** 확정되어 플러그인 내부 상태로 보관되고, 컨트롤러가 생성·시작될 때 그대로 소비된다 — 코어 actions를 `onInit`에서 캡처해 뒤 시점의 effect가 읽는 기존 패턴과 같은 인계다. 컨트롤러는 `history.state`를 재파싱해 판정을 **재유도하지 않는다**: 재파싱으로는 스냅샷 짝맞춤 결과를 재현할 수 없고, 두 지점의 판정이 어긋나면 부트 모드가 발산한다. state 파싱은 이후 런타임의 좌표 읽기(popstate 착지 해석)에만 쓴다.

### 5.3 복원 부트

- `overrideInitialEvents`가 스냅샷 로그의 이벤트들을 **기록된 그대로**(id·eventDate 보존; 기록 시점의 런타임 파생 필드 스트립 외에는 어떤 변형·재작성도 없음) 초기 이벤트로 반환한다. 코어가 이를 정렬·집계해 스택을 재구성한다 — 커밋 로그 동치가 성립하는 지점이다. 모든 이벤트의 eventDate가 과거이므로 transitionState는 즉시 정착값(enter-done/exit-done)이 되고, 전환 애니메이션은 재생되지 않는다. 특히 `Replaced`로 진입한 활동의 `enteredBy`는 `Replaced`로 유지된다 — 오늘의 stamp 경로가 쓰던 `enteredBy`→`Pushed` 강제 재작성은 단일 활동 복원에서만 무해했던 편법으로, 전체 로그 리플레이에서는 치환 시맨틱을 파괴하므로(치환됐던 활동이 잔존 entered로 남는다) 이 경로와 함께 제거된다.
- 부트가 자체 생성하는 `Initialized`·`ActivityRegistered`의 eventDate는 리플레이 이벤트들과 정렬 순서가 어긋날 수 있으나(react 통합은 "충분히 과거"의 시각을 쓴다 — 마지막 네비게이션 직후 reload면 리플레이 이벤트가 그보다 최신일 수도 있다), 코어의 이벤트 검증도 리듀서도 이 순서를 제약하지 않는다(`Initialized` 중복 금지와 활동명 등록 검사뿐). 현행 stamp 복원 경로가 같은 성질(과거 eventDate 리플레이)에 이미 의존하고 있어 프로덕션에서 검증된 동작이다.
- **loader·preload 재실행**: 스트립된 런타임 파생 필드는 loader/preload 플러그인의 초기 이벤트 훅이 재확립한다. 이 훅들은 현재 모든 `Pushed`에 무조건 재실행하는데(그리고 `Replaced`는 건너뛴다), 복원 로그에 대해 그대로 두면 ① `Replaced` 진입 활동은 loader가 재실행되지 않아 `useLoaderData()`가 깨진 값을 반환하고 ② pop된 활동의 유령 loader까지 세션 누적 push 수만큼 일제 발화한다. 따라서 이 훅들을 **entered-한정 규칙**으로 보강한다([§7](#7-범위)): 초기 이벤트 배열을 집계해(부트 판정 step 4와 동일한 요령 — 자기 config에서 `ActivityRegistered` 합성) **최종 스택에서 entered인 활동의 진입 이벤트(`Pushed`·`Replaced` 모두)에만** loader/preload를 주입하고, 그 외 이벤트는 그대로 통과시킨다. SSR의 `initialContext.initialLoaderData`는 **active top의 진입 이벤트에만** 적용한다(현행 "모든 Pushed에 배포"는 초기 이벤트가 1건일 때만 무해한 우연이었다). 기존 경로 동작 불변: 오늘의 모든 부트(cold start·defaultHistory 셋업)에서 초기 이벤트는 전부 entered인 `Pushed`뿐이라 이 규칙은 같은 결과를 낸다.
- **활성 모니터 시딩**: 복원 부트는 스냅샷의 `activationSeeds`로 활성 모니터를 재구성한다 — 시드의 활동 id별로 카운트를 이어받는 모니터를 만들어, 공개 훅 `useIsActivatedActivity()`가 reload 전과 같은 값을 반환하게 한다(시딩하지 않으면 "한 번도 활성화되지 않은" defaultHistory 합성 활동이 복원 후 활성으로 뒤집힌다). defaultHistory 셋업 자체는 수행하지 않으므로 새 모니터는 생기지 않는다.
- **lifecycle 훅은 발화하지 않는다**: 복원된 엔트리들에 대해 `onPushed`·`onChanged` 등 코어 lifecycle 훅은 0회 발화한다(초기 이벤트는 집계로 스택을 직접 구성하며 effect 훅을 거치지 않는다 — `onInit`만 발화). 이는 오늘의 cold start·stamp 복원과 같은 부트 성질의 1→N 확대다. 훅 스트림으로 파생 상태를 쌓는 플러그인(analytics·breadcrumb류)은 복원 후 in-session과 다른 상태를 가지므로, 플러그인 저자는 `getStack()` 기준(getStack-first)으로 상태를 유도해야 한다 — 관찰 계약은 `getStack()` 동치이지 훅 재생이 아니다.
- defaultHistory 셋업은 수행하지 않는다. 셋업의 산물(합성 엔트리들)이 있었다면 스냅샷 로그 안에 이미 들어 있다. 현행 stamp 경로와 동일한 생략이다.
- 컨트롤러 시작: `browserCursor`를 stamp의 ordinal로, 세대를 stamp의 세대로 **채택**한다. 재스탬프는 하지 않는다 — 기존 엔트리들의 stamp·ordinal은 그대로 유효하다(리플레이가 활동/step id를 보존하므로 엔트리 identity 매칭이 계속 성립한다).
- 시작 직후 sync pass를 **무조건 1회 예약**한다. 이 pass는 **delta 0이면 무동작**(재직렬화 == 스냅샷이면 스냅샷 갱신도 생략)이고, delta가 있으면 — 치유 복원, 또는 부트 전 제스처 창([§5.2](#52-부트-판정))의 이동 — 표준 규칙으로 브라우저를 스택 위치에 맞춘다. "복원 부트의 초기 sync는 항상 무동작"은 불변식이 아니다. (예약이 없으면 다음 사용자/앱 커밋까지 치유가 지연된다.)
- 이후 런타임은 기존 reconciler 그대로다. P2에 의해 popstate 번역은 reload 이전과 동일하게 동작한다 — back은 pop/stepPop 파이프라인 번역(prevented면 sync pass가 재확립), forward는 착지 엔트리 stamp의 활동 스냅샷으로 push/stepPush 번역. 이 설계가 정상 상태에 추가하는 것은 정착 시 스냅샷 기록([§5.1](#51-저장-표면과-스키마))뿐이다.

### 5.4 렌더 2단 (hydration 규율)

코어는 부트 시점부터 완전하다(동기 전체 복원). SSR hydration을 위해 **렌더 계층만** 2단으로 나눈다.

- **frame 0**: 복원 스택의 active top 활동만 콘텐츠를 렌더하고, 나머지 활동은 빈 출력으로 게이트한다. 앵커는 React 플러그인 인터페이스가 제공하는 활동별 래핑 지점인 `wrapActivity` 훅이다 — 이 플러그인은 현재 `wrapStack`만 구현하므로 이 훅 구현을 **새로 추가**한다. 주의: React 렌더러(PluginRenderer)의 훅 합성은 `wrapActivity`가 null/undefined를 반환하면 원래 출력으로 되돌리므로, 게이트는 반드시 "빈 출력"(DOM 노드를 만들지 않는 빈 요소)을 반환해야 한다. 서버 렌더에는 stamp가 없어 게이트가 발동하지 않으며, 클라이언트 frame 0의 DOM(현재 활동 1개)은 서버 출력과 일치한다 — 현행 reload 경로의 frame 0과 동일한 모양이다.
- **게이트 해제 — 마운트 커밋 직후, paint 이전**: 해제는 첫 커밋의 레이아웃 효과 시점에 1회 수행한다(StrictMode 이중 실행 가드; 서버 렌더 경고를 피하는 isomorphic layout effect 관용구). 레이아웃 효과에서의 상태 전환은 브라우저 paint 전에 동기 재렌더를 일으키므로, hydration 커밋(frame 0 — 서버 DOM과 일치)은 성립하면서 **사용자가 보는 첫 화면은 이미 전체 스택**이다. 이로써 top이 비전체화면(모달·바텀시트류)일 때 빈 배경이 잠깐 노출되는 문제, Modal/BottomSheet의 등장 지연 프레임 동안 하위 없이 떠 있는 문제가 생기지 않는다. 트레이드오프: 복원 스택이 클수록 첫 paint가 그만큼 늦어진다(전체 렌더가 paint를 가로막는다) — 복원 깊이는 통상 수 개 수준이라 수용한다. 구현이 해제를 paint 뒤(post-commit effect)로 미루면 위 두 노출이 되살아남을 알아야 한다(하위가 아예 없는 현행 reload 대비 회귀는 아니나, 이 문서의 기본은 paint 이전 해제다).
- **게이트 전파와 Rules of Hooks**: 게이트 상태 구독은 `wrapStack`의 **단일 지점**에서 한다(플러그인이 이미 쓰는 Publisher + `useSyncExternalStore` 패턴). `wrapActivity`는 렌더러가 활동마다 호출하므로 그 안에서 훅을 호출해서는 안 된다 — 활동 수가 바뀌면 렌더당 훅 호출 수가 바뀌어 Rules of Hooks를 위반한다. `wrapActivity`는 클로저로 게이트 값을 읽어 순수 분기만 한다.
- **cross-activity style effect와의 정합 (참조 UI 보강 — [§7](#7-범위))**: 해제로 드러나는 하위 활동들이 enter-done 정착 상태라 전환 애니메이션이 재생되지 않는 것은 참이지만, **"시각 영향 없음"은 성립하지 않는다**. react-ui-core의 style effect(가려진 활동 숨김, 스와이프백 패럴랙스)는 활동 간 cross-effect다: top이 자기 아래 활동들의 refs를 모듈 레벨 등록부(connections)에서 수집하는데, 그 수집·적용 효과가 **transitionState 변화에 키잉**되어 있다. 복원 top은 전이 없이 enter-done으로 고정이므로 frame 0(하위 미마운트)에서 빈 수집을 하고, 게이트 해제로 하위가 마운트·등록돼도 재수집이 트리거되지 않는다 — 그대로 두면 top 바로 아래 활동이 숨김 제어에서 빠지고 **복원 후 첫 스와이프백에서 아래 화면이 패럴랙스로 따라오지 않는다**(iOS cupertino 핵심 제스처의 시각 붕괴). 따라서 react-ui-core를 보강한다: 등록부를 구독 가능하게 하여 **자기 수집 범위(자기 아래)의 등록/해제 변화에도 적용 효과가 재실행**되게 한다. 적용 효과는 멱등이어야 한다(재실행이 같은 시각 상태로 수렴). 이 반응성은 게이팅 고유의 요구가 아니라 원래 성립해야 할 성질이다 — 늦게 마운트되는 하위 활동(lazy 컴포넌트) 일반에서 같은 누락이 잠재해 있었고, 이 설계는 그 표면을 흔한 경로로 넓혔을 뿐이다. 기존 경로 동작 불변: 하위 등록이 전이와 동시에 일어나는 경로에서는 추가 재실행이 관측상 무동작(멱등)이다.
- 코어를 2단으로 하지 않는 이유: 렌더가 아니라 스택을 늦게 채우면 `getStack()`이 거짓말하는 창이 생겨, 그 창을 지나는 popstate 번역·플러그인 관측을 위한 별도 대기 모드가 컨트롤러에 필요해진다. reconciler가 적출했던 종류의 모드 플래그를 재도입하는 것이므로 기각한다. hydration은 표현 계층의 문제이고, 표현 계층의 표준 기법(two-pass rendering)으로 푼다.
- 알려진 승계·캐비앗:
  - defaultHistory를 가진 라우트 + SSR 조합에서 서버 프레임(스테이징 출력)과 복원 frame 0(현재 활동)의 hydration 불일치가 생길 수 있다. 현행 reload 경로에도 동일하게 존재하는 수용된 불일치의 승계이며 신규 회귀가 아니다.
  - 치유 복원의 레이스에서는 frame 0의 활동이 URL과 일시 불일치할 수 있다 — 예약 sync가 곧바로 해소하는 일시 글리치 범주다.
  - frame 0에서 `useStack()`은 전체 복원 스택(N)을 반환하지만 DOM에는 top 1개만 있다 — cold start에는 없는 data-vs-DOM 괴리가 해제 커밋 전까지(기본 타이밍에선 paint 이전까지) 존재한다. 스택 길이를 렌더된 DOM과 결합하는 소비자는 이 창을 볼 수 있다.

### 5.5 폴백 부트 (cold start 승격 + 부트 정리)

복원이 불가능한 부트(§5.2의 2·3 분기)는 **"새 진입"으로 승격**한다: 스택은 cold start와 동일하게 구성하고(URL 매칭 활동 + defaultHistory 셋업), 새 세대를 발급하며, history에서 이전 세대의 흔적을 정리해 **history 모양까지 cold start와 동일하게** 만든다. back 제스처가 무시되는(화면 전환 없이 흡수되는) 상황을 구조적으로 없애는 것이 정리의 목적이다.

**부트 정리 절차** (컨트롤러 시작 시). 착지 stamp의 ordinal K는 sole author 전제(P6) 하에 "이 엔트리 아래에 이전 세대 엔트리가 K개 있다"는 주장이지만, 브라우저가 오래된 엔트리를 절삭했을 수 있어 K를 그대로 걸음 수로 쓸 수 없다. History API는 현재 위치 인덱스를 노출하지 않고, `history.length`는 앞쪽(forward)·앱 밖 엔트리를 포함하므로 "뒤로 갈 수 있는 걸음 수"의 상한이 아니다. 범위 밖 `history.go`는 **조용한 무동작**(popstate 없음)이라, 과대한 걸음은 suppression token이 소비되지 않는 교착을 만든다. 따라서 정리는 범위 밖 이동이 **원천적으로 불가능한** 절차로 수행한다. (이 절차가 딛는 세 성질 — 범위 밖 go의 무동작, pushState의 forward 절단이 `history.length`에 동기 반영됨, 범위 안 go의 popstate 도착 보장 — 은 P2와 같은 방식으로 Chromium 149·WebKit 26.5에서 실측 확인했다.)

1. **K == 0**: 걸을 것이 없다. 현재 엔트리를 새 세대·ordinal 0으로 replaceState(+스냅샷 기록)하고 끝. 이후 커밋들은 기존 규칙대로 pushState로 쌓인다. (앱 루트에서의 reload 폴백 — 가장 흔한 경우 — 는 엔트리 churn 없이 여기서 끝난다.)
2. **K > 0 — 위치 측정**: 같은 URL로 pushState 1회(**측정 엔트리** — 이전 세대·ordinal K+1로 stamp해, 정리가 못 지우고 남더라도 아래 안전망의 forward 잔해 규칙이 그대로 처리하게 한다). pushState는 현재 위치 위의 forward 엔트리를 전부 절단한 뒤 append하고 `history.length`를 동기 갱신하므로, 직후의 `history.length`로부터 부트 엔트리 아래의 엔트리 수 **P = `history.length` − 2** 가 확정된다.
3. **한 번의 in-range 이동**: suppression token을 set하고 `history.go(−(min(K, P) + 1))`. 이동 크기는 측정 엔트리의 위치(P+1) 이하이므로 항상 범위 안이고, P2에 의해 착지 popstate가 같은 문서에서 반드시 도착해 token을 1:1 소비한다 — **무동작을 감지해야 하는 경로 자체가 존재하지 않는다**. 착지점은 이전 세대의 루트 슬롯(P ≥ K일 때), 또는 절삭된 탭의 바닥(P < K일 때)이다.
4. 착지 후: 착지 엔트리를 새 세대·ordinal 0으로 replaceState(+스냅샷 기록)하고, 유보된 sync 예약(pendingSync)을 flush한다 → 걷는 동안 커밋된 스택(defaultHistory 스테이징 등)의 엔트리들이 pushState로 쌓이며 측정 엔트리를 포함한 위쪽 잔해를 절단한다. 걷는 동안(1 비동기 홉) 발생하는 스택 커밋은 기존 pendingSync 기제가 자연스럽게 흡수한다.

- 재기준의 replaceState는 stamp만이 아니라 **URL도 새 스택 루트의 라우트 URL로 재작성**한다. 재작성하지 않으면 이전 세대 루트의 URL이 주소창에 잔존해, back으로 루트에 도달한 사용자가 화면과 다른 URL(딥링크 부트였다면 전혀 다른 경로)을 보게 된다.
- popstate 직렬성: go 직후 도착하는 첫 popstate는 자기 유발 착지다(브라우저는 traversal을 직렬화한다 — 기존 self-induced 규약과 같은 가정). 그 사이 끼어든 사용자 제스처는 뒤이어 도착하며, 그 시점의 컨트롤러는 이미 재기준을 마쳤으므로 정상 규칙(번역/안전망)으로 처리된다.
- 측정의 오차는 **과소 방향으로만** 생긴다(예: 브라우저의 엔트리 수 상한에서 측정 pushState가 가장 오래된 엔트리를 밀어내는 경우). 걸음이 과대해져 범위 밖이 되는 일은 구조적으로 없고, 덜 걸어 남는 하부 잔해는 정상 상태 안전망(back 방향 규칙)이 처리한다.
- cold start의 첫 엔트리 스탬핑이 원래 replaceState(제자리 교체)이므로, 정리가 도달하는 이전 세대의 루트 슬롯은 앱 진입 전 엔트리(외부 페이지 등)를 밀어내지 않는다 — 정리 후 루트에서의 back은 자연스럽게 앱 밖으로 나간다.

**정상 상태 안전망 — 이전 세대 엔트리 착지 규칙.** 정리가 전부 소거하지 못한 이전 세대 엔트리(측정이 과소해 남은 하부 잔해, 또는 신규 커밋이 1개뿐이라 절단되지 않은 측정 엔트리 등 상부 잔해)에 사용자가 착지하면:

- 컨트롤러는 재기준 시점에 "이전 세대 기준점"(재기준한 엔트리의 이전 세대 ordinal ↔ 새 세대 ordinal의 대응 1건)을 세션 메모리에 유지한다. 이전 세대 ordinal은 절대 좌표로는 무의미하지만, 같은 이전 세대 안에서의 **상대 순서**는 sole author 전제로 신뢰할 수 있다 — 기준점과의 부호 비교로 착지 방향을 판별한다.
- **기준점보다 낮은 ordinal (back 방향)**: 뒤로 1레벨 번역(정상 pop/stepPop 파이프라인 — 화면 전환이 실제로 발생한다). 커밋되면 착지 엔트리를 새 세대(현 스택 위치의 identity·ordinal)로 재기록해 **채택**하고 기준점을 갱신한다. 커밋되지 않으면(스택 루트이거나 prevented) sync pass가 재확립한다. back이 화면 전환 없이 무시되는 경우는 스택 루트에서 더 팝할 것이 없는 극단뿐이다.
- **기준점보다 높은 ordinal (forward 방향 잔해)**: sync pass 재확립(pushState) — 1회 흡수 후 위쪽 잔해가 절단된다. 브라우저 앞으로가기(redo) 능력의 축소는 기존 restore-via-pushState 결정(`plans/fep-2001/adr/0006`)이 이미 수용한 시맨틱이다.
- 복원 부트 세션에는 이전 세대 엔트리가 존재하지 않으므로(세대 채택) 이 규칙은 폴백 세션에서만 발동한다. 세대 필드가 없는 stamp(이 설계 이전 버전의 플러그인이 발행)도 "이전 세대"로 판정되므로, stamp 스키마의 버전 스큐가 별도 마이그레이션 없이 같은 경로로 흡수된다.

### 5.6 시나리오 워크스루

각 시나리오는 필수 조건 (1)(2)의 관찰 계약을 구체화한다.

**A — 기본 복원.** A push B push C, C에서 step 2회 push, idle 정착 후 reload.
스냅샷 = 5개 엔트리(A, B, C, C/s2, C/s3)에 해당하는 커밋 로그. 부트: stamp(C의 s3, ordinal 4) ↔ 스냅샷 identity 일치 → 복원. `getStack()`은 reload 전과 커밋 로그 동치(활동 3, C의 steps 3, id·순서·params·zIndex 동일). frame 0(하이드레이션 커밋)은 C만 렌더하고, 첫 paint 전에 A·B가 뒤에 채워진다. back 4회: 각각 popstate 번역(stepPop, stepPop, pop, pop)으로 reload 전과 동일한 화면 열·URL 열. forward 4회: 착지 stamp 번역(stepPush/push)으로 동일 복귀.

**B — 중간 위치 reload.** 위에서 back 2회(정착) 후 reload — 현재 엔트리는 C의 base(ordinal 2), forward에 s2·s3 엔트리 잔존.
스냅샷은 back 커밋들(StepPopped×2)을 포함하므로 stackOrdinal 2 == stamp.ordinal ✓ 복원. 복원 스택의 C는 step 1개(s2·s3 pop 반영). forward 2회는 착지 엔트리 stamp의 step 스냅샷으로 stepPush 번역 — reload 전과 동일. history 길이·위치도 브라우저가 보존(P1)하므로 관찰상 동일.

**C — preventDefault 공존.** blocker 플러그인이 pop을 prevent하는 화면에서 reload 후 back.
복원 부트 후 popstate 번역이 `onBeforePop`을 거치고 prevented → 커밋 없음 → 예약된 sync pass가 pushState로 재확립. reload 이전과 동일한 관찰 결과(화면 유지, blocker 통보 발생, history 위치 재확립).

**D — 폴백.** 스냅샷이 없는(예: Safari에서 탭 복제) stamp 엔트리(ordinal 3)에서 부트.
cold start 승격: URL 매칭 활동 + defaultHistory 셋업, 새 세대. 부트 정리: 같은 URL로 측정 pushState(forward 잔해 절단 + `history.length`로 P 확정) → `history.go(−(min(3, P)+1))`(항상 범위 안, suppressed) → 이전 세대 루트 슬롯 착지 → 새 세대 ordinal 0 replaceState → defaultHistory 커밋들이 pushState로 쌓이며 측정 엔트리까지 절단. 이후 back은 새 스택의 pop(화면 전환), 루트에서의 back은 앱 진입 전으로 탈출. 어떤 back도 화면 전환 없이 흡수되지 않는다.

**E — 치유 복원 (레이스).** A push B(idle 정착, 스냅샷 stackOrdinal 1) → 사용자가 back → pop 커밋 직후, 정착 기록 전에 reload.
착지 엔트리는 A(ordinal 0), 스냅샷은 아직 B 시대(stackOrdinal 1, committedEntries[0] = A ✓ identity 일치 — 복원). 복원 스택 top = B(ordinal 1), 브라우저는 ordinal 0 → 예약 sync가 delta +1로 B 엔트리를 pushState 재구축. 사용자의 미정착 back은 소실(마지막 정착 상태로 복원 — 계약과 일관). 반대 방향(정착 전 forward+reload)이면 delta −1로 self-induced 후퇴 후 정착.

## 6. 기존 reconciler 구조와의 정합

- **원리 A — 커밋된 effect에만 history를 만진다**: 스냅샷·stamp 기록은 모두 idle sync pass(커밋 후 정착 지점) 내부다. pre-effect 훅은 여전히 무부작용이다. 이 설계는 원리 A가 만지는 표면에 sessionStorage를 추가했을 뿐 시점 규율을 바꾸지 않는다.
- **원리 B — 사용자 popstate는 번역만**: 복원 부트 이후의 popstate 처리(§5.3), 이전 세대 착지 규칙(§5.5)까지 전부 파이프라인 번역 또는 sync pass 재확립이다. 브라우저 직접 조작 경로는 재도입되지 않는다. 부트 정리의 이동은 self-induced이며 기존 suppression token의 1:1 소비 규약을 그대로 쓴다.
- **단일 동기화 권위**: 새로 생기는 모든 쓰기(스냅샷 기록·재기준·채택 재기록)는 컨트롤러의 sync pass/부트 절차 안에 있다. 권위 분산 없음.
- **plugin-owned ordinal**(`plans/fep-2001/adr/0003`): 세대는 ordinal 좌표계의 계보 식별자다. ordinal의 절대 의미는 같은 세대 안에서만 성립하고, 다른 세대의 ordinal은 기준점 대비 부호 비교(방향 판별)에만 쓴다는 규칙이 좌표 계약에 추가된다.
- **출발 불변식**(`plans/fep-2001/adr/0008`)의 확장: "초기 진입 시 브라우저==스택"은 이제 가정이 아니라 부트 절차가 **성립시키는 사후 조건**이다 — 복원 부트는 좌표 채택으로, 치유 복원은 예약 sync로, 폴백 부트는 재기준으로 각각 성립시킨다. reload는 더 이상 불변식의 예외가 아니다.
- **restore-via-pushState**(`plans/fep-2001/adr/0006`) 승계: 안전망의 forward 잔해 절단, 치유 복원의 전진 재구축 모두 같은 시맨틱이다.
- **무회귀 논거**: reload가 없는 세션에서 이 설계가 추가·변경하는 동작은 ① 정착 시 스냅샷 기록 ② stamp의 세대 필드 ③ loader/preload 초기 훅의 entered-한정 규칙(오늘의 모든 부트에서 초기 이벤트는 전부 entered인 `Pushed`라 결과 동일 — [§5.3](#53-복원-부트)) ④ react-ui-core의 등록 반응성(하위 등록이 전이와 동시인 기존 경로에선 멱등 무동작 — [§5.4](#54-렌더-2단-hydration-규율))이며, 어느 것도 기존 관찰 계약(SCREEN·URL·STACK·NAVIGABILITY·blocker 통보)에 나타나지 않는다. 기존 검증 스위트(e2e 87 케이스)가 그대로 green이어야 한다.
- **훅 스트림은 관찰 계약이 아니다**: 복원 부트는 lifecycle 훅을 재생하지 않는다([§5.3](#53-복원-부트)). `getStack()` 동치가 계약이며, 훅 기반 파생 상태를 가진 플러그인의 복원 후 상태 차이는 이 설계가 보증하지 않는 표면이다.

## 7. 범위

주 수정은 `extensions/plugin-history-sync` 내부에 갇히되, 참조 모듈과의 정합을 위해 다음의 좁고 동작-보존적인 동반 수정을 포함한다:

- **`@stackflow/core` — initial-override 타이핑 확장 (동작 무변경)**: `StackflowPlugin.overrideInitialEvents`의 선언을 현재의 `Pushed`/`StepPushed` 한정에서 네비게이션 이벤트 전반으로 넓힌다 — **반환 타입과 입력 매개변수(`initialEvents`) 모두**. `makeCoreStore`의 override 체인은 이전 플러그인의 반환을 다음 플러그인의 입력으로 흘리는 reduce이므로, 반환만 넓히면 체인이 컴파일되지 않는다(타입 단언 우회는 기각 — 아래). 연쇄되는 선언들 — `MakeCoreStoreOptions.handlers.onInitialActivityIgnored`의 매개변수 서명, React 통합의 초기 활동 경고가 쓰는 `PushedEvent` 캐스트 — 도 같은 폭으로 정합시킨다. 코어 런타임(초기 이벤트 집계·`aggregate`·`validateEvents`)은 이미 이벤트 종류를 제한하지 않고 수용하므로 사실상의 런타임 계약을 선언 계약으로 정직화하는 것이며, 기존 구현체에 하위호환이다. 타입 단언으로 우회하는 대안은 선언 스펙과 어긋난 구현 디테일 의존이므로 기각한다.
- **React 통합 loaderPlugin·`@stackflow/plugin-preload` — 초기 이벤트 훅의 entered-한정 규칙 (기존 부트 결과 동일)**: [§5.3](#53-복원-부트)에 명세한 대로, 초기 이벤트 배열에서 최종 스택 기준 entered 활동의 진입 이벤트(`Pushed`·`Replaced` 모두)에만 loader/preload를 주입하고 나머지는 통과시키며, SSR `initialLoaderData`는 active top의 진입 이벤트에만 적용한다. 오늘의 모든 부트 경로에서 초기 이벤트는 전부 entered인 `Pushed`뿐이므로 관찰 결과가 동일하다.
- **`react-ui-core` — cross-activity style effect의 등록 반응성 (공개 API 불변)**: [§5.4](#54-렌더-2단-hydration-규율)에 명세한 대로, 활동별 refs 등록부를 구독 가능하게 하고 적용 효과가 자기 수집 범위의 등록/해제 변화에 재실행되게 한다. 적용 효과의 멱등성 전제 하에 기존 경로에서 관찰 무변화.
- **플러그인 순서 전제 (명문화)**: `overrideInitialEvents`는 등록 순서의 reduce 체인이고, 일부 플러그인(예: `plugin-map-initial-activity`)은 초기 이벤트를 **치환(REPLACE)** 한다. 복원 로그를 생산하는 이 플러그인 **뒤에** 치환형 override가 놓이면 복원 로그가 통째로 버려져 복원이 조용히 붕괴한다. 전제: 치환형 override는 이 플러그인보다 **앞에** 두고, 이 플러그인 뒤의 override는 사상(MAP)이어야 한다. loader/preload는 MAP이며 loaderPlugin은 프레임워크가 강제로 최후순에 두므로 자동 충족된다. 이 전제를 플러그인 사용자 문서와 해당 훅의 선언 주석에 명문화한다.
- 공개 API 비파괴. stamp 스키마의 세대 필드 추가는 내부 데이터이며, 구버전 stamp(세대 부재)는 이전 세대 판정으로 자동 포섭되어 마이그레이션이 필요 없다. 스냅샷 레코드(커밋 로그·활성 시드)도 내부 데이터다.
- 이벤트·훅의 런타임 계약과 코어 리듀서는 불변.

## 8. 실패 경로 총람

| 상황 | 감지 지점 | 동작 |
|---|---|---|
| stamp 부재/파싱 실패 | 부트 판정 1 | cold start (기존 경로) |
| 스냅샷 부재·파싱 실패·빈 로그·세대 불일치 | 부트 판정 2 | 폴백 부트 |
| sessionStorage 접근이 예외를 던짐 | 부트 판정 2 / 정착 기록 | 부트: 폴백 부트. 런타임: 스냅샷 기능 비활성 + dev 경고 1회 (동기화 본체는 무해하게 지속) |
| 스냅샷 로그의 활동명이 현재 라우트에 없음 (배포 스큐) | 부트 판정 3 | 폴백 부트 (코어 validateEvents의 boot-crash 사전 차단) |
| stamp 위치와 스냅샷 불일치 (같은 세대 — 정착 레이스) | 부트 판정 5 | 치유 복원 (스냅샷 진실, 예약 sync가 delta 치유) |
| 스냅샷 직렬화 한도 초과 / quota 예외 | 정착 기록 | 해당 세대 스냅샷 삭제 + 세션 내 기록 중단 + dev 경고 1회 → 이후 reload는 폴백 부트 |
| replaceState/pushState 예외 | 정착 기록 | 이번 pass 포기 + dev 경고. 다음 정착이 자연 재시도 (기존 메커니즘과 동일한 취급) |
| 이전 세대 엔트리가 절삭되어 실제 위치가 K보다 얕음 | 폴백 부트 (위치 측정) | 측정 pushState로 P를 확정하고 min(K, P)+1만 걷는다 — 걸음은 구조적으로 범위 안(무동작 go 불가). 탭 바닥에서 재기준, 잔여 하부 잔해는 안전망 |
| 이전 세대 엔트리 착지 — back 방향 | popstate | 뒤로 1레벨 번역(화면 전환) + 커밋 시 채택 재기록. 루트·prevented면 sync pass 재확립 |
| 이전 세대 엔트리 착지 — forward 방향 | popstate | sync pass 재확립 1회(흡수) + 상부 잔해 절단 (forward-redo 축소 시맨틱) |
| 이 플러그인이 발행하지 않은 엔트리의 popstate | popstate | 기존 계약 유지 — 불변식 위반으로 시끄럽게 throw (외부 pushState 개입) |
| 복원 시 loader/preload 재실행 중 예외 | 부트 | 기존 loader 에러 계약과 동일(콘솔 에러 + 해당 활동의 에러 표면) — 복원 자체는 계속 |
| 복원 부트 직후 첫 정착 | sync pass | delta 0이면 멱등 무동작(재직렬화 == 스냅샷 → 스냅샷 갱신 생략); delta 있으면 표준 치유(§5.2 부트 전 제스처 창 포함) |

## 9. 검증

관찰 계약(SCREEN·URL·STACK(`getStack()` 공개 표면)·NAVIGABILITY·blocker 통보)만 단언하고 내부 좌표를 단언하지 않는 기존 검증 방침을 따른다.

- **T1 (실브라우저 Chromium)**: `page.reload()`로 §5.6의 시나리오 A~E를 각각 검증한다. 추가로:
  - reload 직후 추가 조작 없이 재-reload(멱등 복원), 크기 밸브 발동 세션의 reload(폴백 경로), 탭 복제(Chromium — 두 탭의 독립 진행), reload 후 첫 push에서 브라우저 점프 부재(§1.2-2의 회귀 방지).
  - **replace 진입 복원**: loader를 가진 활동을 `replace()`로 진입시킨 뒤 reload → 복원 후 `useLoaderData()`가 정상 데이터를 반환(래퍼 아님)하고 해당 loader가 재실행됐음을 관측.
  - **loader 발화량**: push/pop을 반복해 pop된 활동을 여럿 남긴 세션에서 reload → loader 호출 수가 entered 깊이와 같음(pop된 활동의 유령 발화 없음).
  - **첫 스와이프백 (cupertino)**: 2개 이상 복원된 스택에서 reload 직후 첫 스와이프백 제스처 → 하위 활동이 패럴랙스로 따라오고, 정지 상태에서 top 바로 아래 활동의 숨김 제어가 성립함을 관측.
  - **활성 카운트 보존**: defaultHistory 합성 루트가 한 번도 활성화되지 않은 세션에서 reload → `useIsActivatedActivity()`가 reload 전과 같은 값(false)을 유지.
- **T2i (jsdom)**: jsdom은 문서 교체를 재현하지 못하므로, history와 sessionStorage 내용을 유지한 채 플러그인 인스턴스·코어 스토어만 재생성하는 방식으로 부트 판정 결정 트리(§5.2의 다섯 분기)와 기록 규칙(§5.1 — 런타임 파생 필드 스트립, 활성 시드 기록 포함)을 단위 수준에서 검증한다.
- **무회귀**: 기존 e2e 스위트(87 케이스) 전부 green 유지.

## 10. 리스크와 한계

- **브라우저 재시작 세션 복원은 Firefox에서만 복원된다** (Chrome/Safari는 sessionStorage 미복원 → 폴백). 보장 계약에서 제외된 파생 케이스로 문서화된다.
- **마지막 idle 정지점 이후의 변화는 소실된다** (전이 중 reload, 치유 복원의 미정착 제스처, 부트 전 제스처 창의 이동 — §5.2). eventual consistency 계약의 reload 확장으로, 창은 전이 1회 + 부트 소요 시간이다(저사양 기기에서 부트가 길수록 창도 길다).
- **크기 밸브 발동 세션은 복원을 포기한다**. 실사용 관측(수십~수백 이벤트) 대비 10배 이상 헤드룸이므로 발동은 예외적이어야 하며, 발동 시에도 결정론적 폴백으로 강등된다.
- **P2는 Chromium·WebKit 데스크톱 엔진 실측이다**. iOS 실기기·인앱 웹뷰 변주 가능성은 T1 하니스와 실기기 QA로 상쇄한다. P2가 성립하지 않는 가상의 환경에서도 각 엔트리 착지가 새 부트가 되어 그 엔트리의 stamp·스냅샷으로 판정이 이뤄지므로, 정의되지 않은 상태로 빠지지는 않는다.
- **같은 오리진·같은 탭의 다른 문서가 sessionStorage를 지울 수 있다** (외부 코드의 `clear()` 등). 스냅샷 소실은 폴백 부트로 강등될 뿐 desync를 만들지 않는다.
- **Safari의 history API 호출 빈도 제한**(100회/30초): 이 설계가 추가하는 호출은 정착당 replaceState 최대 1회로, 인간 속도의 네비게이션에서 제한에 도달하지 않는다.
- **죽은 세대 스냅샷의 누적이 quota를 채우면 살아있는 세션의 기록이 밸브에 걸릴 수 있다** (밸브는 현행 세대의 쓰기에서 발동하므로 부담이 전가된다). 통상 세대당 수십 KB라 현실 위험은 낮다. 후속 과제: 쓰기 실패 시 자기 세대 외 키의 best-effort 정리 — 단, 같은 오리진·같은 탭에서 suspend된 다른 문서의 살아있는 세대를 구별할 수 없다는 한계를 감수해야 한다.
- **정착마다 전체 로그를 다시 직렬화한다** (O(로그)). idle 시점이라 전환 jank는 없지만, 밸브 상한 근처의 긴 세션에서는 저사양 기기 기준 정착 직후 첫 입력이 수십 ms 지연될 수 있다. 검증 하니스에서 로그 크기별 정착 비용을 관측해 두는 것을 권고한다.
- **크기 밸브의 임계값은 옵션으로 노출되지 않고, 발동은 개발 환경 경고뿐이다** — 프로덕션에서는 복원 포기가 조용히 일어난다. 후속 과제: 임계 옵션화와 발동 관측 신호(예: 플러그인 훅/콜백) 검토.
- **배포 스큐의 폴백 표면이 넓어진다**: 세션 도중 활동 rename/removal이 배포되면, 복원 스택의 (현재 화면이 아닌) **임의 과거 활동명**이 라우트에 없어도 전체가 폴백으로 강등된다 — 오늘의 stamp 경로(현재 활동만 검사됨)보다 강등 조건이 넓다. 의도된 안전 강등이지만, 활동 rename을 배포할 때 reload 사용자의 세션이 초기화됨을 운영이 알고 있어야 한다.
- **transient 상태 복원의 출구가 처음 열린다**: 이 설계가 활동/step id를 보존하므로, 앱이 자체 transient 상태(스크롤 등)를 activity id 키로 저장해 복원하는 패턴이 성립하게 된다. 사용자 문서에 이 가이드를 남기는 후속을 권고한다 — "스크롤 위치 소실" 계열 CS를 앱 레벨에서 닫을 수 있는 경로다.
