# Define ordered short-circuit semantics for Guard Combinators

AND는 Activity Guards를 선언 순서대로 평가하고 처음 Guard Resolution을 반환한 Guard의 결과를 채택하며, 모두 `true`를 반환해야 진입을 허용한다. OR도 선언 순서대로 평가하지만 하나라도 `true`를 반환하면 진입을 허용하고, 모두 Guard Resolution을 반환한 경우 자식 Resolution 중 하나를 암묵적으로 선택하지 않는다. 대신 OR로 만들어진 Composite Guard가 명시적인 공통 Guard Resolution을 소유한다. 이 규칙은 Guard 순서를 결정적으로 만들면서도 OR의 대체 결과가 우연한 선언 순서에 좌우되지 않게 한다.
