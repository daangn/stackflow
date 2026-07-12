# Keep Activity Guard resolutions extensible

Activity Guard는 `true`를 반환해 진입을 허용하거나 우선 Redirect Guard Resolution을 반환한다. 현재 확인된 요구가 모두 Redirect라고 해서 공개 결과 모델을 닫힌 세 갈래로 고정하지는 않는다. 향후 구체적인 유즈케이스가 확인되면 Redirect 이외의 명시적인 Guard Resolution을 추가할 수 있도록 하되, 임의 탐색 액션은 선제적으로 공개하지 않는다. Guard 평가 자체의 실패는 Guard Resolution이 아니라 예외로 구분한다.
