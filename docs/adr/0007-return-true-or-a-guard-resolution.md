# Return true or a Guard Resolution from Activity Guards

Activity Guard는 진입을 허용하면 `true`, 그렇지 않으면 Redirect 등 명시적인 Guard Resolution을 반환한다. `false`는 후속 결과를 결정하지 못하므로 유효한 반환값이 아니며, 평가 중 발생한 예외도 Guard Result로 변환하지 않는다. 이 결과 모델은 현재의 Redirect와 향후 추가될 Resolution을 하나의 확장 가능한 합집합으로 제공하면서 대체 탐색 결과와 평가 실패를 구분한다.
