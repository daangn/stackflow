# Activity Guard 기능 설계

> 상태: 인터뷰 합의 완료

## 공개 API 이름

- 패키지: `@stackflow/plugin-activity-guard`
- plugin factory: `activityGuardPlugin`
- Guard Resolution factory: `redirect`
- Guard Combinators: `and`, `or`
- 주요 공개 타입: `ActivityGuard`, `GuardResolution`

## 공개 사용 형태

```ts
activityGuardPlugin({
  guards: {
    ArticleEdit: and({
      guards: [
        ({ params }) =>
          isSignedIn()
            ? true
            : redirect("Login", { returnTo: params.articleId }),
        ({ params }) =>
          canEdit(params.articleId)
            ? true
            : redirect("Article", { articleId: params.articleId }),
      ],
    }),
    RestrictedPost: or({
      guards: [isAuthor, isAdmin],
      otherwise: ({ params }) =>
        redirect("Article", { articleId: params.articleId }),
    }),
  },
})
```

이 예시는 공개 계약의 형태를 보여주기 위한 것으로, 상태 조회 방식은 플러그인이 정하지 않는다.

## 목적

Activity Guard 플러그인은 Activity별 Guard를 등록하고, 새로운 Activity Entry가 요청될 때 이를 평가하여 유효한 Activity만 진입 대상으로 받아들이게 한다. Guard는 Activity에서 나가는 탐색을 제어하는 blocker와 달리, 외부에서 Activity로 들어오는 탐색의 진입 조건을 표현한다.

## 제공 범위

- 각 Activity에는 하나의 Activity Guard를 등록할 수 있다.
- Activity Guard가 `true`를 반환하면 원래 Activity Entry를 허용한다.
- Activity Guard가 Guard Resolution을 반환하면 이를 적용한다.
- 최초 제공하는 대체 Guard Resolution은 다른 Activity로의 Redirect다.
- Redirect 목적지는 등록된 Stackflow Activity와 해당 Activity의 타입이 적용된 params로 표현한다. URL·상대 경로·외부 사이트 이동은 Redirect가 직접 표현하지 않는다.
- Redirect는 `redirect(activityName, params)` helper로 생성한다. helper는 탐색을 실행하지 않으며, push·replace·animate 등 별도 탐색 옵션을 받지 않는다.
- Guard Resolution 모델은 향후 구체적인 유즈케이스에 따라 Redirect 이외의 결과를 추가할 수 있도록 닫지 않는다. 확인되지 않은 임의 탐색 액션을 미리 제공하지는 않는다.
- 이번 범위에서는 동기 Activity Guards만 지원한다. 비동기 Activity Guards는 향후 확장 후보이며 non-goal로 규정하지 않는다.
- Activity Guard와 Activity loader의 상대 평가·실행 순서는 이번 설계에서 정하지 않으며 공개 계약으로 보장하지 않는다.

## Entry 적용 범위

Guard를 적용하는 새로운 Activity Entry는 다음과 같다.

- push로 요청한 Activity
- replace로 요청한 Activity
- deep link로 요청한 초기 Activity
- default Activity로 요청한 초기 Activity
- Guard Redirect가 대상으로 삼은 Activity

일반적인 `defaultHistory` 구성에서는 첫 Entry가 fresh 초기 진입으로 검사되고, 이후 Entry는 순차적인 push로 검사된다. `skipDefaultHistorySetupTransition`으로 여러 fresh Entry를 초기 묶음에 포함하더라도 각 Activity를 동일하게 검사한다. 중간 Activity에서 Guard Resolution이 발생하면 Redirect 이전까지 Guard를 통과한 Entry는 유지하고, 원래 대상은 Redirect 대상으로 대체하며, 그 뒤에 예정되어 있던 Activity navigations는 모두 취소한다.

다음은 새로운 Activity Entry로 보지 않으므로 Guard를 적용하지 않는다.

- pop 등으로 기존 Activity가 다시 드러나는 Activity Reactivation
- 보존된 Stack의 load
- Activity를 새로 진입시키지 않는 step push·replace·pop

Redirect 대상도 일반적인 Activity Entry로 취급하므로 대상 Activity의 Guard를 우회하지 않는다.

Redirect는 별도의 후속 탐색이 아니라 원래 Activity Entry 대상의 대체다. Redirect 대상은 원래 요청의 push·replace·초기 진입 성격을 계승하며, 원래 대상 Activity는 먼저 진입하거나 Stack에 흔적을 남기지 않는다.

## 보안 경계

Activity Guard는 Activity 진입 UX를 제어하는 탐색 정책이며 데이터 권한을 보장하는 보안 경계가 아니다. API나 서버 리소스의 권한은 데이터 소스에서 별도로 검증해야 하며, Guard 통과를 데이터 접근 권한의 증명으로 사용할 수 없다.

## Activity Guard 계약

- Activity Guard는 Activity Guard 플러그인을 등록할 때 Activity별로 연결한다. `defineConfig()`의 Activity 정의는 확장하지 않는다.
- 플러그인은 `guards` 옵션으로 Activity name 기반 맵을 받는다. 각 key의 값은 해당 Activity의 단일 Activity Guard이며, Guard 입력의 `activityName`과 `params`는 key에 맞게 타입이 결정된다.
- 각 Activity에는 단일 Activity Guard만 연결할 수 있으며, 플러그인에 Guard가 등록되지 않은 Activity는 Guard 없이 진입을 허용한다.
- Activity Guard는 진입 허용 여부와, 진입을 허용하지 않을 때 적용할 Guard Resolution을 함께 결정하는 자기완결적 정책이다.
- Activity Guard는 진입 허용을 나타내는 `true` 또는 적용할 Guard Resolution을 반환한다. `false`는 유효한 결과가 아니다.
- Guard Result의 유효성은 정적 타입 검사를 신뢰하며 동일한 검사를 런타임에 반복하지 않는다. 타입 계약을 우회해 유효하지 않은 값을 반환한 경우의 동작은 보장하지 않는다.
- Activity Guard 평가 자체의 실패는 Guard Resolution으로 변환하지 않고 원래 예외를 변경 없이 전파한다. push·replace 대상은 진입하지 않으며, 초기 Activity 평가 중 발생하면 초기화도 실패한다.
- 이번 범위에서 Activity Guard는 `{ activityName, params }` 객체를 입력받는다. `activityName`은 진입 대상 Activity의 name이며, `params`에는 해당 Activity의 타입이 적용된다.
- config·initialContext 등 추가 정보는 구체적인 니즈가 확인되면 향후 확장할 수 있으며, 이번 범위의 non-goal로 고정하지 않는다.
- Activity Guard는 외부 상태를 읽을 수 있지만 변경해서는 안 된다. 별도 탐색 실행, 상태 변경, API 요청 시작, 평가 횟수에 의존하는 분석 이벤트 등 부수효과의 실행 여부와 횟수는 지원하지 않는다.

## Guard Combinators

여러 Activity Guards가 필요한 사용자를 위해 AND와 OR combinator를 제공한다. Combinator는 여러 Guard를 하나의 Composite Guard로 만든다.

### AND

- `and({ guards })` 옵션 객체 형태로 제공한다.
- `guards`는 타입상 비어 있을 수 없는 순서가 있는 목록이다.
- 선언 순서대로 평가한다.
- 처음 `true` 이외의 결과를 반환한 Guard의 Guard Resolution을 채택하고 평가를 종료한다.
- 모든 Guard가 `true`를 반환해야 Activity Entry를 허용한다.

### OR

- `or({ guards, otherwise })` 옵션 객체 형태로 제공한다.
- `guards`는 타입상 비어 있을 수 없는 순서가 있는 목록이다.
- 선언 순서대로 평가한다.
- 처음 `true`를 반환한 Guard에서 평가를 종료하고 Activity Entry를 허용한다.
- 모든 Guard가 Guard Resolution을 반환하면 필수 `otherwise`가 만든 공통 Guard Resolution을 적용한다. `otherwise`는 Composite Guard와 동일한 `{ activityName, params }`를 입력받는다.
- 자식 Guards의 개별 Guard Resolution 중 하나를 암묵적으로 선택하지 않는다.

## 잘못된 구성

정상적인 Activity Entry에 도달하지 못하는 Guard Redirect 순환은 잘못된 Guard 구성이다. 이번 범위에서는 순환의 감지 방식이나 런타임 오류 및 Stack 보존 동작을 공개 계약으로 보장하지 않는다.

## 명시적으로 결정하지 않은 항목

- Activity Guard와 Activity loader의 상대 평가·실행 순서
- 타입 계약을 우회해 유효하지 않은 Guard Result를 반환했을 때의 동작
- Guard Redirect 순환의 감지, 런타임 오류 및 Stack 보존 동작

이 항목들은 이번 기능의 non-goal로 고정하지 않으며, 구체적인 니즈가 확인되면 별도로 결정한다.
