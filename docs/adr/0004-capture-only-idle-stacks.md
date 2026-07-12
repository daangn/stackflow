# Idle Stack만 Snapshot으로 보존

플러그인은 전환 중이 아니며 일시정지되지 않은 Idle Stack에서만 Snapshot을 저장한다. 실행기가 Idle 도달 전에 종료되면 최신 탐색 변경 대신 마지막으로 저장 완료된 Snapshot으로 돌아갈 수 있지만, 플러그인이 생성하는 record에 전환 중인 상태를 다루는 별도 capture 규칙을 만들지 않는다. 저장소가 load에서 제공한 Snapshot은 Idle 여부를 추가로 검사하거나 정규화하지 않고 그대로 core에 전달한다.
