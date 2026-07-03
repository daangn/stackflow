# 위치 좌표는 플러그인 소유 ordinal로, core의 id 순서성에 의존하지 않는다

동기화의 방향·거리를 정하려면 "브라우저가 스택 대비 어디에 있나"를 알아야 한다. 이를 위해 각 브라우저 history 엔트리의 `state`에 **플러그인이 소유하는 선형 위치 좌표(entry ordinal)** 를 직접 기록하고, `stack ordinal − browser ordinal`로 방향·거리를 정한다. core의 활동 id가 시간순이라는 성질은 **구현 상세**이므로 거기에 의존하지 않는다 — id는 "어느 활동/step인지"의 동일성(equality) 매칭에만 쓰고, "어느 것이 더 최신인가"의 순서(ordering) 판단에는 쓰지 않는다.

사용자 브라우저 네비게이션(back/forward)을 대응 스택 액션으로 번역할 때도 방향·거리는 **browser cursor 대비 ordinal delta(movement)** 로 정한다 — 도착 엔트리의 activity/step id를 스택에서 찾아 "거기까지" 이동하는 방식이 아니다.

## Considered Options

- **활동 id 비교로 방향 판단** — 기각. id 생성 방식과 그 순서성에 플러그인이 결합되어, core 구현이 바뀌면 깨진다.
- **브라우저 엔트리 전체를 미러링하는 자체 모델** — 기각. 두 번째 진실 출처가 되어 드리프트 위험이 있고, 거리는 어차피 스택 델타에서 나온다.
- **도착 엔트리의 activity/step id를 스택에서 찾아 거기까지 이동** — 기각. 전이 중엔 대상이 스택에 아직/이미 없을 수 있어 방향을 오판한다. 더 근본적으로, 이 앱의 **모든 UI 네비게이션은 Stack을 진실의 원천**으로 삼는데 브라우저 버튼만 History-엔트리 identity로 해석하면 Stack≠History인 순간(전이·prevented·in-flight)에 브라우저 버튼이 나머지 UI와 다르게 동작해 UX가 어긋난다. 브라우저의 *이동량(ordinal delta)* 을 스택에 그대로 미러링하면 그 일관성이 유지된다.

## Consequences

- 거리가 ordinal 뺄셈 한 번으로 나와 "무엇이 빠졌나" 조사가 불필요하다.
- 좌표 책임이 분리된다: "무엇을 가리키나"는 id 동일성, "어디에/얼마나"는 ordinal.
- 사용자 브라우저 네비게이션은 ordinal delta(movement)의 부호·크기로 번역한다: 뒤로는 스택 구조로 pop/stepPop을 개수만큼 peel, 앞으로는 도착 엔트리의 activity/step을 재생성한다. 방향 판정에 엔트리 id를 쓰지 않으므로 브라우저 버튼도 Stack-기준 UI와 일관된다.
