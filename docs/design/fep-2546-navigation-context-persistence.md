# FEP-2546 탐색 맥락 보존 플러그인 설계

> 상태: 확정 (2026-07-12). 합의된 공개 기능과 시맨틱만 기록하며 구현 메커니즘과 코드 변경안은 다루지 않는다.

## 목적

JavaScript 실행기나 앱의 수명이 끝나도 Stackflow의 탐색 맥락을 보존하고, 다음 시작 시 전체 맥락을 즉시 복원할 수 있는 별도 플러그인을 제공한다. 이를 통해 새로고침이나 WebView 재시작 후에도 뒤로 갈 Activity, AppBar의 뒤로가기 의미, swipe-back 가능 여부를 첫 화면부터 올바르게 판단할 수 있다.

## 제공 형태

- `@stackflow/plugin-stack-persistence` 패키지의 `stackPersistencePlugin(...)`으로 제공한다.
- 공개 저장소 타입의 이름은 `StackSnapshotStorage`로 한다.
- core plugin 계약만 사용하는 프레임워크 중립 패키지로 제공하며 React 컴포넌트·hook·Context를 추가하지 않는다.
- `plugin-history-sync`와 분리된 Stackflow 플러그인으로 제공한다.
- 플러그인은 탐색 맥락의 보존과 복원을 담당하고, `plugin-history-sync`는 정상 상태인 Stack과 브라우저 History의 동기화를 담당한다.
- 소비자가 제공하는 저장소를 사용한다. 저장 매체에 맞춘 인코딩과 디코딩은 저장소의 책임이며 플러그인의 책임이 아니다.
- 패키지는 특정 저장 매체의 구현이나 codec을 포함하지 않고 플러그인·공개 타입·저장소 계약을 제공한다. 공식 문서에는 저장소 어댑터 예시만 제공한다.
- 저장소는 Stack 생성 시 준비된 `Snapshot | null`을 동기적으로 제공한다.
- 비동기 저장 매체를 사용하는 애플리케이션은 Snapshot을 읽어올 때까지 Stack 생성을 지연하고, 읽기가 끝난 저장소와 Stackflow를 연결한다.
- 플러그인이 기본 Stack을 먼저 노출한 뒤 비동기 복원 결과로 교체하는 동작은 제공하지 않는다.
- 저장소의 쓰기 함수는 항상 `Promise<void>`를 반환한다. 실제 저장이 즉시 끝날 수 있는 저장소도 같은 비동기 계약을 따른다.
- `save(record)`는 동기적으로 throw하지 않으며 모든 실패를 rejected Promise로 전달해야 한다.
- 저장소가 이 계약을 위반해 동기적으로 throw한 경우를 플러그인이 정규화하거나 `onSaveError`로 처리한다고 보장하지 않는다.
- 저장소는 쓰기 요청을 호출된 순서대로 처리해야 한다. 이 순서 보장은 플러그인이 아니라 저장소 구현자의 계약이다.
- 앞선 쓰기 요청이 실패해도 뒤따르는 요청을 계속 처리해야 한다. 호출 순서 규약은 성공과 실패를 포함한 전체 작업열에 적용된다.
- 플러그인은 저장 키, 사용자 ID, 앱 버전, tenant 등의 namespace를 알지 않는다.
- 소비자는 필요한 범위로 이미 한정된 저장소를 제공한다. Snapshot의 식별과 사용자·환경 간 격리는 저장소의 책임이다.
- 한 Stack에는 탐색 맥락 보존 플러그인과 Snapshot 저장소를 각각 하나만 연결한다.
- 여러 저장 매체로의 복제나 fallback 조회가 필요하면 소비자가 하나의 복합 Snapshot 저장소로 조합한다. 플러그인은 저장소 간 우선순위나 부분 성공을 해석하지 않는다.
- 하나의 저장소 범위는 원칙적으로 하나의 활성 Stack이 소유하는 single-writer 계약을 따른다.
- 여러 탭이나 WebView가 같은 record를 사용해야 하면 저장소가 실행기 간 충돌 조정과 전역 쓰기 순서를 책임진다. 플러그인은 Snapshot 병합이나 leader 선출을 제공하지 않는다.

### Snapshot record와 저장소 API

```ts
type StackSnapshotRecord<Metadata = undefined> = {
  snapshot: StackSnapshot;
  metadata: Metadata;
};

interface StackSnapshotStorage<Metadata = undefined> {
  load(): StackSnapshotRecord<Metadata> | null;
  save(record: StackSnapshotRecord<Metadata>): Promise<void>;
}
```

- strategy를 사용하지 않으면 `Metadata = undefined`이며 `metadata`를 `undefined`로 초기화한다.
- 저장 매체가 `undefined`를 직접 표현하지 못하면 저장소의 codec이 이를 왕복 가능한 형태로 다룬다.
- 저장소는 record 전체를 저장하며, 저장 매체에 맞춘 직렬화 형태는 저장소가 정한다.
- `StackSnapshotRecord` 자체에는 별도 `$schema`나 version 필드를 두지 않는다. core Snapshot의 버전은 `snapshot.$schema`, metadata의 버전과 변환은 strategy·저장소가 담당한다.

### 오류 API

```ts
type StackPersistenceLoadErrorCause =
  | { kind: "storage"; detail: unknown }
  | { kind: "strategy"; detail: unknown };

class StackPersistenceLoadError extends Error {
  cause: StackPersistenceLoadErrorCause;
}

type StackPersistenceSaveErrorCause =
  | { kind: "strategy"; detail: unknown }
  | { kind: "storage"; detail: unknown };

class StackPersistenceSaveError extends Error {
  cause: StackPersistenceSaveErrorCause;
}

type StackPersistenceErrorHandlers = {
  onLoadError?: (args: {
    error: StackPersistenceLoadError | SnapshotLoadError;
    initialContext: unknown;
  }) => { policy: "recover" | "propagate" };
  onSaveError?: (args: { error: StackPersistenceSaveError }) => void;
};
```

- 저장소에서 발생한 예상 가능한 load 실패는 `StackPersistenceLoadError`로 표현한다.
- core의 Snapshot 유효성 검증이 실패하면 core가 만든 `SnapshotLoadError`를 감싸지 않고 그대로 `onLoadError`에 전달한다.
- `onLoadError`가 `{ policy: "propagate" }`를 반환하면 전달받은 오류의 정체성을 보존한다. persistence 오류는 `StackPersistenceLoadError`, core 오류는 `SnapshotLoadError`로 전파한다.
- `shouldReuse` throw, 플러그인 내부 결함이나 저장소의 동기 `save` throw 같은 계약 위반은 unexpected exception이며, `StackPersistenceLoadError` 또는 `StackPersistenceSaveError`로 정규화한다고 보장하지 않는다.
- 오류 객체에 실패한 record 전체를 포함하지 않는다.

### Plugin options의 metadata 결합

```ts
type StackPersistencePluginBaseOptions<Metadata> = {
  storage: StackSnapshotStorage<Metadata>;
  onLoadError?: (args: {
    error: StackPersistenceLoadError | SnapshotLoadError;
    initialContext: unknown;
  }) => { policy: "recover" | "propagate" };
  onSaveError?: (args: { error: StackPersistenceSaveError }) => void;
};

type StackPersistencePluginOptions<Metadata = undefined> =
  | (StackPersistencePluginBaseOptions<undefined> & {
      strategy?: undefined;
    })
  | (StackPersistencePluginBaseOptions<Metadata> & {
      strategy: StackSnapshotStrategy<Metadata>;
    });

declare function stackPersistencePlugin<Metadata = undefined>(
  options: StackPersistencePluginOptions<Metadata>,
): StackflowPlugin;
```

- strategy가 없으면 storage의 metadata 타입도 `undefined`다.
- strategy가 있으면 storage와 strategy가 같은 `Metadata`를 사용하며 options에서 이를 추론한다.

## 보존 범위

- Activity와 Step의 구성, 순서, 파라미터를 포함하는 Stackflow의 전체 논리적 탐색 상태를 보존한다.
- 폼 입력값, 스크롤 위치, 서버 데이터 등 Activity 내부의 애플리케이션 상태는 보존하지 않는다.
- Activity와 Step 파라미터는 Snapshot record의 일부로 외부 저장소에 전달된다.
- 플러그인은 파라미터를 필터링·마스킹·암호화하지 않는다. 저장 매체 암호화와 접근 통제는 Snapshot 저장소가 담당한다.
- 복원되거나 외부에 보존되어서는 안 되는 비밀값은 탐색 파라미터에 두지 않는다.

## 시작 시 복원

- 재사용 정책이 적용하기로 결정한 사용할 수 있는 탐색 Snapshot이 있으면 새 Stack을 잠정적으로 노출하지 않고 복원된 Stack을 최초 상태로 제공한다.
- 저장된 Snapshot이 없으면 새 Stack을 정상 생성한다.
- Snapshot이 손상됐거나 현재 앱과 호환되지 않으면 오류를 관찰 가능하게 알린 뒤 해당 Snapshot을 포기하고 새 Stack으로 복구하는 것을 기본 정책으로 한다.
- 탐색 연속성을 필수 조건으로 취급하는 소비자는 복원 오류 전파를 선택할 수 있다.
- 저장소 읽기 실패와 사용할 수 없는 Snapshot은 `onLoadError`로 알린다. 콜백은 `recover` 또는 `propagate` 정책을 반환하며, 생략했을 때의 기본값은 `recover`다.
- `shouldReuse`가 `false`를 반환하면 정상적인 비재사용 판단이다. 예외를 던지면 strategy 계약 위반으로 보고 `onLoadError`나 `StackPersistenceLoadError`로 정규화하지 않은 원본 오류를 Stack 생성 밖으로 전파한다.
- 현재 Stackflow 설정에서 그대로 복원 가능한 Snapshot만 사용한다.
- Snapshot schema가 다르거나 현재 설정에 없는 Activity를 포함하는 등 호환되지 않는 Snapshot은 migration하지 않고 `onLoadError` 정책을 따른다.
- 버전별 저장소 분리나 Snapshot 변환이 필요하면 소비자가 Snapshot 저장소 경계에서 담당한다.

## Snapshot 부가 정보와 재사용

- 플러그인은 core `StackSnapshot`과 별도로 불투명한 Snapshot 부가 정보를 함께 보존할 수 있는 API를 제공한다.
- 부가 정보의 생성과 Snapshot record의 정책적 해석은 주입된 strategy의 책임이며 Stack Persistence는 그 의미를 알지 않는다.
- `stackPersistencePlugin`은 하나의 metadata/reuse strategy를 옵션으로 명시적으로 주입받는다.
- strategy는 선택 사항이다. 생략하면 Snapshot 부가 정보를 기록하지 않고, 구조와 현재 설정에 호환되는 Snapshot을 항상 재사용한다.
- `plugin-history-sync`는 URL용 strategy를 생성하는 공개 helper를 제공할 수 있으며, 소비자가 그 결과를 `stackPersistencePlugin`에 전달한다.
- 여러 외부 맥락을 함께 판단해야 하면 소비자가 하나의 strategy로 합성한다. Stack Persistence는 여러 strategy의 우선순위를 중재하지 않는다.
- 플러그인 배열에 특정 플러그인이 있다는 사실이나 플러그인 순서만으로 재사용 정책이 암묵적으로 바뀌지 않는다.
- Snapshot 재사용 정책은 record 전체와 현재 시작 맥락을 해석해 Snapshot을 이번 Stack 생성에 적용할지만 동기적으로 결정한다.
- strategy는 Snapshot 내용과 부가 정보를 이용해 URL/deep link 충돌 같은 재사용 호환성을 판단한다.
- `shouldReuse`를 먼저 호출하고, 적용하기로 한 Snapshot만 core에 전달해 유효성을 검증한다.
- schema, event 구조, 등록된 Activity와의 일치, 정상 Stack으로 복원 가능한지 같은 Snapshot 자체의 유효성은 적용 대상으로 선택된 뒤 core가 판단한다.
- 재사용하지 않기로 한 Snapshot은 core가 유효성을 검증하거나 해석하지 않는다.
- 재사용하지 않기로 한 결과는 오류가 아니라 이번 시작에 Snapshot이 없는 것과 동일하게 취급하며, 새로운 탐색 연속성을 시작한다.
- 새 Stack이 Idle에 도달하면 그 상태를 저장해 재사용하지 않은 기존 Snapshot을 대체한다. 이전 Snapshot을 나중에 다시 사용해야 한다면 소비자가 별도의 저장소 범위로 분리한다.
- 재사용 정책은 Snapshot을 변환하거나 URL·`initialActivity` 같은 새 진입 정보와 병합할 수 없다.
- `plugin-history-sync` 같은 통합 플러그인은 URL을 나타내는 부가 정보와 그 비교 정책을 제공할 수 있다. Stack Persistence 자체는 URL을 알지 않는다.
- 재사용하기로 한 Snapshot은 전체 Stack의 진실로 사용하며, 복원 후 `plugin-history-sync`는 복원된 Stack을 기준으로 History를 동기화한다.

### Strategy API

```ts
interface StackSnapshotStrategy<Metadata> {
  createMetadata(args: {
    snapshot: StackSnapshot;
    initialContext: unknown;
  }): Metadata;

  shouldReuse(args: {
    record: Readonly<StackSnapshotRecord<Metadata>>;
    initialContext: unknown;
  }): boolean;
}
```

- 두 함수는 모두 동기 계약이다.
- `initialContext`는 기존 일부 API의 `any`를 따르지 않고 `unknown`으로 제공하며, strategy가 필요한 형태로 좁힌다.
- strategy가 비동기 정보에 의존한다면 소비자가 Stack 생성 전 또는 strategy 구성 전에 그 정보를 준비한다.
- 실제 record 쓰기만 항상 비동기 `Promise<void>` 계약을 따른다.
- `shouldReuse`는 record를 관찰하고 해석할 수 있지만 수정하지 않는다.
- strategy가 반환할 수 있는 결과는 적용 여부뿐이며, 변환된 Snapshot이나 병합 결과를 반환할 수 없다.

### Record 흐름

- 저장 시에는 core의 Snapshot을 Stack Persistence가 strategy에 전달하고, strategy가 만든 부가 정보와 결합한 record를 저장소에 전달한다.
- load 시에는 저장소의 record를 strategy가 먼저 해석하고, `shouldReuse`가 `true`를 반환한 경우에만 Stack Persistence가 Snapshot을 core에 전달한다.
- Stack Persistence는 저장소가 `StackSnapshotStorage` 계약을 충족한다고 전제하며 record envelope를 별도 schema로 검증하지 않는다.
- Stack Persistence는 저장소가 제공한 Snapshot을 정규화하거나 Idle 여부를 추가로 검증하지 않고 그대로 core에 전달한다.
- core는 전달받은 Snapshot을 자신의 기존 계약에 따라 검증하고 복원한다.

## 실행 중 보존

- 새로 생성하거나 Snapshot에서 복원한 최초의 Idle Stack을 자동 보존의 기준점으로 저장한다.
- 사용할 수 없는 Snapshot에서 새 Stack으로 복구하면, 새 Stack이 Idle이 된 뒤 저장을 요청해 이전 Snapshot을 대체한다.
- 플러그인은 전환 중이 아니며 일시정지되지 않은 Idle Stack에서만 Snapshot을 저장한다.
- Idle은 플러그인의 capture 조건이며 저장소가 load에서 제공할 수 있는 Snapshot의 추가 전제조건은 아니다.
- 탐색 변경이 Idle에 도달하면 그 탐색 맥락을 자동으로 보존한다.
- 실행기가 Idle 도달 전에 종료되면 진행 중이던 변경은 복원 대상이 아니다. 다음 시작에서는 마지막으로 저장된 Idle Snapshot을 복원한다.
- 소비자가 탐색 변경마다 직접 호출해야 하는 수동 저장 모델은 제공하지 않는다.
- 별도 수동 저장 API는 구체적인 추가 사용 사례가 생기기 전에는 제공하지 않는다.
- 저장 실패는 이미 확정된 탐색을 취소하거나 앱 사용을 막지 않는다.
- 거부된 저장 Promise의 오류는 `onSaveError`로 알리고, 이후 탐색 맥락 변경에서도 보존을 다시 시도한다.
- `createMetadata`가 예외를 던지면 해당 Snapshot 저장 요청 전체가 실패한 것으로 취급하고, strategy 단계의 오류로 `onSaveError`에 전달한다.
- metadata 생성에 실패했을 때 metadata 없는 record를 저장하거나 이전 metadata를 재사용하지 않는다.
- `onSaveError`의 반환값은 탐색이나 이후 저장에 영향을 주지 않는다.
- `onSaveError`를 생략하면 `StackPersistenceSaveError`를 비동기 오류로 전파하며 조용히 소비하지 않는다.
- `onSaveError`를 제공하면 callback 호출로 해당 오류의 처리 책임을 넘기고 플러그인은 추가로 throw하지 않는다.
- 각 저장 실패는 개별적으로 `onSaveError`에 전달되며, 이후 최신 요청이 성공하면 그 Snapshot record가 최종 저장 상태가 된다.
- 저장 실패 시 기존 Snapshot을 제거할지는 플러그인이 임의로 결정하지 않는다.
- 탐색은 저장 Promise의 완료를 기다리지 않는다.
- 플러그인은 실행기 종료를 지연하거나 pending 저장을 강제로 완료하지 않는다.
- 다음 시작에서 복원을 보장할 수 있는 범위는 저장소가 마지막으로 완료한 Idle Snapshot record까지다. 호출됐지만 완료되지 않은 저장의 내구성은 저장소가 제공하는 수준에 따른다.
- v1에는 `flush()` 또는 unload 차단 API를 제공하지 않는다.
- 오류 콜백을 생략해도 플러그인이 임의로 `console.error`를 출력하지 않는다. load 오류는 기본 `recover` 정책을 따르고, save 오류는 비동기로 전파한다.

## 다른 플러그인과 Analytics 관찰

- Snapshot 복원은 사용자 push의 연속이 아니라 core의 `load` 초기화다.
- 복원된 각 Activity에 새로운 사용자 navigation 이벤트를 발생시키지 않는다.
- 다른 플러그인은 core `onInit`의 `initInfo.kind === "load"`를 이용해 복원과 새 Stack 생성을 구분한다.
- `stackPersistencePlugin`은 같은 의미의 별도 `onRestored` API를 제공하지 않는다.
- Activity 컴포넌트는 복원 시 다시 mount될 수 있다. mount `useEffect`를 사용자 진입 Analytics로 간주하는 애플리케이션은 도입 전에 trigger를 navigation 의미에 맞게 변경해야 한다.

## SSR

- 플러그인은 실행 환경을 추측하지 않고 브라우저와 서버에서 같은 저장소·strategy 계약으로 동작한다.
- SSR에서 사용하려면 서버가 렌더링 전에 Snapshot record와 `initialContext`를 준비한다.
- 서버와 클라이언트는 같은 record와 시작 맥락을 사용해 같은 재사용 결정을 내려야 한다.
- 서버에서 record를 쓰면 안 되는 경우 소비자가 쓰기를 no-op으로 처리하는 저장소를 제공한다.
- 서버에는 Snapshot이 없고 클라이언트에만 있는 등 최초 Stack이 서로 다르면 hydration 일치를 보장하지 않는다.

## 명시적 비목표

- Activity 내부의 애플리케이션 상태 보존
- Snapshot 삭제, TTL, 로그아웃 또는 개인정보 삭제 API 제공. 저장 record의 수명 관리는 저장소가 담당한다.
- Snapshot 파라미터 redaction 또는 암호화 API
- 저장 매체별 codec 제공
- `localStorage`, IndexedDB, native storage 등 매체별 내장 저장소 제공
- 비동기 저장 매체의 초기 읽기 또는 Stack 생성 대기 관리
- 브라우저 History와 Stack의 동기화
- URL용 metadata/reuse strategy helper 구현. 이는 후속 FEP-2001의 `plugin-history-sync` 범위이며, FEP-2546은 helper가 주입될 범용 계약까지만 제공한다.
- Snapshot 버전 간 migration
- 앱 버전별 Snapshot namespace 또는 변환 정책
- 플러그인의 구현 메커니즘 또는 코드 변경안 정의
- React 전용 컴포넌트, hook 또는 Context

## 미결사항

- `onLoaded`, `onSaved`, `onReuseSkipped` 같은 성공 관찰 callback의 필요성은 확정하지 않는다. 필요가 확인되면 이후 추가할 수 있으며, 현재는 core `onInit(initInfo)`, `shouldReuse`, Snapshot 저장소 계측으로 같은 사실을 관찰할 수 있다.
