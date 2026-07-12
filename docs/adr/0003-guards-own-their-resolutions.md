# Let Activity Guards own their Guard Resolutions

Activity Guard는 진입 허용 여부뿐 아니라 진입을 허용하지 않을 때 적용할 Guard Resolution까지 결정한다. Activity 설정에 공통 Resolution을 별도로 두는 방식보다 Guard와 후속 결과의 관계를 자기완결적으로 표현하며, Composite Guard를 구성하는 각 Guard가 서로 다른 Redirect 또는 향후 추가될 Resolution을 선택할 수 있게 한다. Guard 평가 자체가 실패한 경우는 Guard Result로 변환하지 않고 예외로 구분한다.
