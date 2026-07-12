# Stop batched initial navigation after a Guard Resolution

`skipDefaultHistorySetupTransition`으로 여러 fresh Activity Entry가 초기 묶음에 포함되더라도 각 Entry를 순서대로 Guard한다. 중간 Entry에서 Guard Resolution이 발생하면 그 이전까지 Guard를 통과한 Entry는 유지하고, 실패한 Entry를 Redirect 대상으로 대체한 뒤, 이후 예정된 Activity navigations는 모두 취소한다. 전체 묶음을 롤백하거나 Redirect 이후의 계획을 계속 진행하는 대신 일반적인 순차 push와 같은 Stack 결과를 만든다.
