# Define one Activity Guard per Activity

각 Activity에는 단일 Activity Guard만 등록할 수 있다. 여러 Guard가 필요한 사용자는 플러그인이 제공하는 AND 또는 OR Guard Combinator로 이들을 하나의 Composite Guard로 병합한다. Activity별 설정에 Guard 배열과 암묵적인 합성 규칙을 두지 않음으로써 공개 형태를 단순하게 유지하고, 조합의 의도를 명시하며, 모든 Composite Guard가 동일한 조합 시맨틱을 사용하게 한다.
