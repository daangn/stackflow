# plugin-history-sync × preventDefault — 용어집

`plugin-history-sync`가 브라우저 history와 stackflow 스택을 동기화하는 메커니즘에서 쓰는 공통 언어. 일반 프로그래밍 개념이 아니라 이 맥락 고유의 용어만 정의한다.

## Language

**Entry ordinal**:
브라우저 history 엔트리 하나의 선형 위치 인덱스로, 이 플러그인이 소유하고 각 엔트리의 history `state`에 직접 기록하는 좌표. 동기화의 방향·거리는 전적으로 이 좌표로 정한다. 이 플러그인이 발행하는 모든 엔트리는 ordinal을 **항상** 싣는다(그래서 `state`의 필수 필드다). 반대로 이 플러그인의 태그가 없는 외부 엔트리는 미인식(파싱 결과 null)으로 걸러지므로, "우리 엔트리인데 ordinal이 없다"는 상태는 존재하지 않는다.
_Avoid_: index, depth, position id, 활동 id(순서 용도로)

**Stack ordinal**:
현재 스택의 top 위치가 가리켜야 할 entry ordinal. 스택 구조(활동·step 수)만으로 계산한다.

**Browser ordinal**:
현재 브라우저 엔트리의 `state`에서 읽은 entry ordinal.

**Sync pass**:
브라우저 history를 *커밋된 현재 스택*에 맞추는 단 하나의 동작. `(현재 스택, 현재 엔트리)`의 순수·멱등 함수이며, `stack ordinal − browser ordinal`(= delta)로 push/뒤로이동/내용교체/무동작을 정한다. 브라우저를 변경하는 유일한 권위.
_Avoid_: reconcile loop, flush, commit-to-browser

**Navigation attempt (translation)**:
사용자가 일으킨 브라우저 네비게이션(popstate)을, 대응하는 스택 액션으로 번역해 **액션 파이프라인으로 시도**하는 것. 브라우저를 직접 만지지 않는다 — 동기화는 이후 sync pass가 한다.
_Avoid_: apply, handle popstate(부작용 포함 의미로)

**Restore**:
사용자 브라우저 네비게이션이 prevented되어 스택이 채택하지 않았을 때, sync pass가 브라우저를 스택 위치로 되돌리는 것. 별도 경로가 아니라 sync pass의 정상 동작(delta≠0의 한 경우)이다.
_Avoid_: rollback, undo

**Self-induced navigation**:
이 플러그인이 동기화를 위해 스스로 일으킨 브라우저 history 변경(엔트리 생성/내용교체/뒤로이동). 사용자가 일으킨 네비게이션과 구분된다.
_Avoid_: silent navigation, internal nav

**Suppression token**:
직렬 history 큐가 소유하는 단일 in-flight 표식. self-induced navigation이 진행 중임을 나타내며, 그동안 도착하는 history 변경을 사용자 네비게이션으로 처리하지 않게 한다. 이동이 없는 동작에는 set하지 않는다.
_Avoid_: silentFlag(코드 식별자), mutex, lock

**Committed-effect anchoring**:
브라우저 history 부작용을 *커밋된* 스택 변화(post-effect)에만 일으키고, pre-effect 훅은 무부작용으로 두는 규율. prevented 네비게이션은 커밋되지 않으므로 history가 건드려지지 않는다.
_Avoid_: post-hook sync

**Sole author**:
관련 브라우저 history 엔트리를 이 플러그인이 유일하게 발행한다는 전제. entry ordinal의 존재·일관성이 여기에 의존한다.

**Eventual consistency (이 맥락에서)**:
모든 정지점(idle·입력 드레인 후)에서 브라우저==스택이 성립한다는 보장. 모든 순간의 글리치 0이 아니라, 영구 desync가 없음을 뜻한다.
_Avoid_: 강한 일관성, 즉시 일관성
