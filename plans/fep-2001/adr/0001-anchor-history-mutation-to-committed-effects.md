# 브라우저 history 부작용을 커밋된 effect에만 앵커링한다

`plugin-history-sync`가 `preventDefault`와 desync를 일으키는 근본 원인은, 브라우저 history 부작용(`history.back()` 등)을 pre-effect 훅(`onBeforePop`/`onBeforeStepPop`/`onBeforeReplace`)에서 — 커밋 전, prevented 여부를 모르는 시점에, 비가역적으로 — 일으키기 때문이다. 그래서 모든 history 부작용을 *커밋된* 스택 변화(post-effect)에만 반응해 일으키고, pre-effect 훅은 관찰 가능한 부작용 없이(멱등 정규화만) 둔다. prevented 네비게이션은 커밋되지 않아 post-effect가 없으므로 history도 건드려지지 않는다.

## Consequences

- 프로그래밍적 pop이 다른 플러그인에 의해 prevented될 때 history가 어긋나던 문제가 사라진다.
- pre-effect 훅이 무부작용이 되어, 훅 실행 순서와 core의 무롤백 동작에 대한 의존성이 소멸한다(별도 core 변경 불필요).
