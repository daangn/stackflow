# 범위 — 플러그인 한정, core 불변, reload 제외

이 작업의 수정은 `plugin-history-sync` 안에 가두고 `@stackflow/core`의 이벤트/훅 계약은 바꾸지 않는다. 또한 페이지 새로고침(reload) 이후의 동기화는 이 범위에서 제외한다.

## Considered Options

- **core의 pre-effect 훅 계약 변경(예: `preventDefault` 시 후속 훅 중단/롤백)** — 기각. 모든 플러그인이 의존하는 계약을 넓히는 대신, 이 플러그인이 pre-effect에서 부작용을 없애 순서 의존성을 *소멸*시키는 쪽이 blast radius가 작고 되돌리기 쉽다.

## Consequences

- 문제 4(훅 순서 의존성)는 core 변경 없이 플러그인 측 무부작용화로 해소된다.
- reload 시에는 현재 엔트리 하나만 관측 가능해 entry ordinal을 재구축할 수 없다. 따라서 reload 직후의 과거 엔트리 동기화는 보장하지 않으며(후속 과제), 이 메커니즘은 "초기 진입 시 브라우저==스택"을 출발 불변식으로 삼는다.
