# Stackflow Navigation

Stackflow에서 navigation 요청이 Core의 domain event가 되기 전까지 적용되는 계약을 정의한다.

## Language

**Prevented Action**:
Pre-effect hook이 domain event dispatch 전에 취소한 action. 기본 dispatch는 취소되지만 남은 pre-effect hook의 실행은 끝까지 이어진다.
_Avoid_: Blocked navigation, cancelled event
