# Snapshot 부가 정보와 재사용 gate 주입

Stack Persistence는 core `StackSnapshot`과 별도로 불투명한 부가 정보를 함께 보존하고, 주입된 재사용 정책이 record 전체와 현재 시작 맥락을 해석해 Snapshot의 적용 여부만 동기적으로 결정하게 한다. 이를 통해 `plugin-history-sync` 같은 통합 플러그인이 URL 의미와 재사용 호환성을 소유할 수 있게 하되, persistence 플러그인은 URL을 해석하거나 Snapshot을 변환·병합하지 않으며 `false` 결과는 정상 생성으로 이어진다. Load에서는 strategy가 적용하기로 한 Snapshot만 core가 구조적·설정상 유효성을 검증하며, 적용하지 않은 Snapshot은 core가 해석하지 않는다.
