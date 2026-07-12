# Stackflow Navigation

Stackflow에서 Activity 사이를 탐색할 때 사용하는 핵심 개념과 정책 용어를 정의한다.

## Language

**Activity Entry**:
탐색 요청에 따라 새로운 Activity가 진입 대상으로 받아들여지는 것. 기존 Activity가 다시 드러나는 Activity Reactivation은 포함하지 않는다.
_Avoid_: Activity access, route access

**Activity Reactivation**:
pop 등으로 이미 존재하는 Activity가 다시 현재 Activity가 되는 것. 새로운 Activity Entry로 간주하지 않는다.
_Avoid_: Re-entry, resumed entry

**Activity Guard**:
특정 Activity Entry를 허용하거나 Guard Resolution을 선택하는 탐색 정책.
_Avoid_: Route validator, exit blocker

**Guard Result**:
Activity Guard 평가 결과. 진입 허용을 나타내는 `true` 또는 적용할 Guard Resolution이다.
_Avoid_: Boolean result, validation result

**Composite Guard**:
여러 Activity Guards를 논리 규칙에 따라 하나로 결합한 Activity Guard.
_Avoid_: Guards list, guard chain

**Guard Combinator**:
Activity Guards를 Composite Guard로 만드는 도구. 표준 조합 규칙은 AND와 OR이다.
_Avoid_: Guard middleware, condition runner

**Guard Resolution**:
Activity Guard가 진입을 허용하는 대신 선택한 명시적인 대체 탐색 결과.
_Avoid_: Guard action, validation result

**Redirect**:
원래 대상 Activity 대신 등록된 다른 Activity와 그 params를 새로운 Activity Entry 대상으로 삼는 Guard Resolution. Redirect 대상의 Activity Guard도 동일하게 적용된다.
_Avoid_: Fallback, escape

**Guard Evaluation Failure**:
Activity Guard가 Guard Result를 결정하지 못한 예외 상황. Guard Resolution으로 간주하지 않는다.
_Avoid_: Guard rejection, denied entry
