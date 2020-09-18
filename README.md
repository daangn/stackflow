![](./cover.png)

## Demo
아래 QR 코드를 카메라로 찍어보세요. 당근마켓 앱 내에서 데모를 볼 수 있어요.

![](./demo-qr.png)

## 시작하기

```bash
$ yarn add @daangn/karrotframe
```

```typescript
import * as kf from '@daangn/karrotframe'
```

## 네비게이터
네비게이터는 화면간 전환 효과와 History를 관리합니다. 네비게이터의 핵심 로직은 `react-router-dom`과 `recoil`에 의존하고 있습니다.

- 자연스러운 화면전환
- History 지원
- 네비게이션 바
- 이전, 닫기 버튼

### 시작하기
네비게이터의 핵심 컴포넌트로는 `Navigator`와 `Screen`이 존재합니다. `Navigator`의 `environment` props로 iOS(`Cupertino`), Android, Web 환경의 UI/애니메이션을 다르게 설정할 수 있습니다.
```tsx
import { Navigator, Screen } from '@daangn/karrotframe'

const App: React.FC = () => {
  return (
    <Navigator
      environment='Cupertino'
      onClose={() => {
        window.alert('닫기')
      }}
    >
      <Screen path='/'>
        <Home />
      </Screen>
      <Screen path='/posts'>
        <PostList />
      </Screen>
      <Screen path='/posts/:post_id'>
        <Post />
      </Screen>
    </Navigator>
  )
}
```

### `ScreenHelmet`
기본적으로 Screen은 상단 네비게이션 바를 포함하고 있지 않습니다. 기본 제공되는 상단 네비게이션 바를 수정하기 위해서는 `ScreenHelmet` 컴포넌트를 사용하세요.

```tsx
import { ScreenHelmet } from '@daangn/karrotframe'

const Home: React.FC = () => {
  return (
    <div>
      <ScreenHelmet
        title='홈'
      />
    </div>
  )
}
```

다음과 같이 좌측, 우측에 Element를 추가하고, 가운데 타이틀을 덮어씌울수 있습니다.

```tsx
import { ScreenHelmet } from '@daangn/karrotframe'

const Home: React.FC = () => {
  return (
    <div>
      <ScreenHelmet
        title={
          <div style={{ color: 'red' }}>홈</div>
        }
        appendLeft={
          <div>left</div>
        }
        appendRight={
          <div>right</div>
        }
      />
    </div>
  )
}
```

### URL 파라미터 받기
`useLocation`, `useParams`, `useRouteMatch`를 활용할 수 있습니다

```tsx
import { useLocation, useParams, useRouteMatch } from '@daangn/karrotframe'

const Post: React.FC = () => {
  const location = useLocation()

  const params = useParams()

  const match = useRouteMatch({
    path: '/:post_id',
  })

  return /* ... */
}
```

### 화면 전환
화면 전환은 `Link` 또는 `useNavigator` 를 통해 수행할 수 있습니다.

```tsx
import { Link } from '@daangn/karrotframe'

const Home: React.FC = () => {
  return (
    <div>
      <Link to='/posts'>글 목록</Link>
    </div>
  )
}
```

또는

```tsx
import { useNavigator } from '@daangn/karrotframe'

const Home: React.FC = () => {
  const { push } = useNavigator()
  return (
    <div>
      <button
        onClick={() => {
          push('/posts')
        }}
      >
        글 목록
      </Link>
    </div>
  )
}
```

### 화면 간 데이터 전송
`useNavigator`의 `pop()`과 `await push()`를 통해 화면간 데이터 전송을 할 수 있습니다.

`pop()` 함수 내 `depth` argument를 2 이상으로 부여할 시 여러 화면을 뛰어넘어서 전송도 가능합니다.

```tsx
import { useNavigator } from '@daangn/karrotframe'

const Home: React.FC = () => {
  const { push } = useNavigator()
  return (
    <div>
      <button
        onClick={async () => {
          const data = await push('/form')

          console.log(data)          
          // {
          //   title: '안녕하세요',
          //   content: '데이터 전송합니다.'
          // }
        }}
      >
        글 작성하기
      </Link>
    </div>
  )
}

const Form: React.FC = () => {
  const { pop } = useNavigator()

  const onSubmit = () => {
    pop(1, {
      title: '안녕하세요',
      content: '데이터 전송합니다.'
    })
  }

  return /* ... */
}
```

## Contributor
- Bucky (bucky@daangn.com)
- Tony (tony@daangn.com)

## Help
슬랙의 #dev-frontend로 언제든지 편하게 문의해주세요!
