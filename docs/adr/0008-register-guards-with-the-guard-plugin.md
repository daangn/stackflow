# Register Activity Guards with the Activity Guard plugin

Activity Guards는 `defineConfig()`의 Activity 정의를 확장하지 않고 Activity Guard 플러그인의 `guards` 옵션에 Activity name 기반 맵으로 등록한다. 이 형태는 플러그인의 활성화와 Guard 선언을 한곳에 묶어 Guard만 선언되고 플러그인이 빠지는 구성을 만들지 않으며, 각 Activity key와 해당 Guard의 name·params 타입 관계를 유지한다. 맵에 없는 Activity는 Guard 없이 진입을 허용한다.
