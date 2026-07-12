# Stackflow Navigation

Stackflow가 소유하는 탐색 상태와 그 보존 기능을 일관된 언어로 설명하기 위한 용어집이다.

## Language

**탐색 맥락 (Navigation Context)**:
Stackflow가 소유하는 전체 논리적 탐색 상태로, Activity와 Step의 구성·순서·파라미터를 포함한다. 폼 입력값, 스크롤 위치, 서버 데이터 등 Activity 내부의 애플리케이션 상태는 포함하지 않는다.
_Avoid_: 화면 상태, 애플리케이션 상태, 세션 상태

**Idle Stack**:
진행 중인 전환이 없고 일시정지되지 않아 완전히 정착된 Stack이다. Stack Persistence가 Snapshot을 자동 capture하는 상태의 경계다.
_Avoid_: 안정 상태, 완료 상태, 중간 상태

**탐색 Snapshot (Navigation Snapshot)**:
탐색 맥락을 Stackflow 실행기의 수명보다 오래 보존하고 이후 복원할 수 있도록 표현한 값이다.
_Avoid_: 백업, 캐시, 세션

**Snapshot 부가 정보 (Snapshot Metadata)**:
Snapshot을 생성한 외부 맥락을 나중의 시작 맥락과 비교할 수 있도록 Snapshot과 함께 보존하는 불투명한 값이다. Stack Persistence는 그 의미를 해석하지 않는다.
_Avoid_: 탐색 맥락, Activity 파라미터, Snapshot codec

**Snapshot 재사용 정책 (Snapshot Reuse Policy)**:
Snapshot record와 현재 시작 맥락을 해석해 저장된 Snapshot을 이번 Stack 생성에 적용할지만 결정하는 정책이다. Snapshot을 변환하거나 다른 진입 정보와 병합하지 않는다.
_Avoid_: Snapshot migration, 병합 정책, 복원 정책

**Snapshot 유효성 (Snapshot Validity)**:
Snapshot의 schema와 event 구조가 올바르고 현재 Stackflow 설정에서 정상 Stack으로 복원될 수 있는 성질이다. 현재 URL이나 다른 시작 맥락과 함께 재사용할지에 대한 판단과는 구별한다.
_Avoid_: 재사용 가능성, URL 호환성, 시작 맥락 일치

**재사용 호환성 (Reuse Compatibility)**:
유효한 Snapshot record가 현재 URL 등 이번 시작 맥락에 적합해 그대로 적용될 수 있는 성질이다. Snapshot 재사용 정책이 Snapshot 내용과 부가 정보를 해석해 판단한다.
_Avoid_: Snapshot 유효성, schema 호환성, migration 가능성

**Snapshot 저장소 (Snapshot Storage)**:
탐색 Snapshot을 실행기 바깥에 보존하고 Stack 생성 시 준비된 Snapshot을 제공하는 경계다. 저장 매체·codec·보존 범위 식별을 소유하며, Snapshot 저장 요청을 호출된 순서대로 처리한다.
_Avoid_: 플러그인 저장소, Snapshot codec, 캐시

**Snapshot record**:
탐색 Snapshot과 Snapshot 부가 정보를 함께 보존하는 저장 단위다. 저장 매체에서 사용하는 직렬화 형태와는 구별한다.
_Avoid_: Snapshot, 직렬화 값, 저장 포맷

**Stack Persistence**:
탐색 Snapshot을 이용해 Stack의 탐색 맥락을 실행기 수명 밖에 보존하는 기능이다. Activity 내부 상태를 포함하는 애플리케이션 전체 persistence와 구별한다.
_Avoid_: Persister, 앱 상태 보존, 세션 복원
