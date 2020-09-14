# @daangn/karrotframe

> swipe back 을 웹에서 구현하는 프로젝트 입니다.

**일반 페이지에서는 OS Swipe back 과 같이 실행되기 때문에 `open` 이벤트로 연 웹뷰 에서만 사용하세요!!!!!**

## [Example](./example)

## API

- `components`
  - [SwiperRouter](#SwiperRouter)
  - [PageRoute](#PageRoute)
  - [Link](#Link)
  - [Layout](#Layout)
- `hooks`
  - [useHistory](#useSwiper)
  - [useSwiper](#useSwiper)
  - [useLocation](#useSwiper)
  - [useMatch](#useSwiper)
  - [useRoute](#useSwiper)
  - [useIsActivePage](#useSwiper)


### SwiperRouter

> react-router 의 Router + Switch + Swipe 가 합쳐진 Provider 입니다.

| props | types | required | description |
| ----- | ----- | -------- | ----------- |
| `history` | `HashHistory` | `false` | `history@5.0.0` 이상의 버전의 `createHashHistory` 로 생성되어야 합니다.<br/>따로 정의되지 않을 경우 내부적으로 생성됩니다. |
| `onLastPagePop` | `() => void` | `false` | 최초 페이지가 `swipe back` 되거나 [Layout](#Layout) 컴포넌트를 사용하여 웹뷰를 닫을 때 사용되는 함수입니다.<br> |
| `disabled` | `boolean` | `false` | `swipe back` 의 이벤트 사용 여부입니다. |

**이 컴포넌트의 경우에는 `children` 중 `PageRoute` 가 아닌 컴포넌트는 렌더링 하지 않습니다.**

### PageRoute

> react-router 의 Route 컴포넌트와 유사합니다.

**해당 컴포넌트는 반드시 [SwiperRouter](#SwiperRouter) 의 바로 안에 작성하셔야 합니다.**

렌더링 우선순위

1. `children`
2. `component`
3. `render`

| props | types | required | description |
| ----- | ----- | -------- | ----------- |
| `component` | `React.ComponentType` | `false` | - |
| `render` | `(props: RouteContextState<any>) => React.ReactNode` | `false` | - |
| `path` | `string | string[]` | `false` | - |
| `exact` | `boolean` | `false` | - |


### Link

> react-router-dom 의 Link 와 유사합니다.

| props | types | required | description |
| ----- | ----- | -------- | ----------- |
| `to` | `string` | `true` | 변경될 페이지 주소 |
| `replace` | `boolean` | `false` | `push` 가 아닌 `replace` 를 하겠다는 이벤트 |
| `customStyle` | `SerializedStyles` | `false` | `emotion` 의 `css` 함수로 만든 스타일을 커스텀하게 추가할 수 있습니다. |

**이외의 <a> 태그에 들어가는 attribute 들도 props 로 넣을 수 있습니다.**

### Layout

> 상단 네비게이션의 스타일과 `contents` 스크롤 영역을 스타일링 해줍니다. 

> 화면 전체를 꽉 채워야 하는 컴포넌트가 있다면 이 컴포넌트를 사용하지 마시고 새롭게 컴포넌트를 만드는것을 추천드립니다. (width, height 를 100%로 할 시 화면 전체를 덮을 수 있습니다.)

역할
- 상단 네비게이션 스타일링.
- 스와이핑 중 scroll 이 되지 않도록 block.
- `SwipeRouter` 의 `onLastPagePop` 에 넣은 함수를 가장 마지막 페이지에서 `X` 버튼을 클릭시에 실행시킴.
 

### useHistory

> react-router 의 useHistory 와 동일합니다.

```ts
const useHistory: () => HashHistory
```

### useSwiper

> SwipeRouter 에서 스와이핑을 할 때 필요한 정보입니다.

```ts
interface SwiperContextState {
    setDisable: (isDisabled: boolean) => void; // 스와이프의 disabled 를 컨트롤 하는 함수입니다.
    onLastPagePop?: () => void; // `SwipeRouter` 의 `onLastPagePop` 에 넣은 함수 입니다.
    disabled: boolean; // 현재 스와이프가 불가능 한 상태인지
}
const useSwiper: () => SwiperContextState;
```

### useLocation

> react-router 의 useLocation 과 동일합니다.

```ts
const useLocation: () => import("history").Location
```

### useMatch

> react-router 의 useMatch 와 동일합니다.

```ts
interface Match<Params extends {
    [K in keyof Params]?: string;
} = {}> {
    path: string;
    url: string;
    params: {
        [key: string]: string;
    };
    isExact: boolean;
}

const useMatch: () => Match<any>
```

### useRoute

> 각 페이지에 대한 location + swiper 의 정보입니다.

```ts
interface RouteContextState<Params = any> {
    location: HashHistory["location"];
    match: Match<Params>;
    isActive: boolean; // 현재 최 상단에 있는 페이지인지에 대한 정보. (최상단에 있는 페이지인지)
    currentIndex: number; // 현재 페이지가 몇번째 페이지인지 에 대한 정보.
    scrollBlock: boolean; // 이 페이지의 스크롤을 막아야 하는지에 대한 정보. (activeIndex !== idx || isSwiping)
}
const useRoute: () => RouteContextState<any>
```

### useIsActivePage

> 현재 페이지가 최 상단에 있는 페이지인가에 대한 정보입니다.

```ts
const useIsActivePage: () => boolean
```



### Tips

- `replace` 하면서애니메이션 주는 방법
  - `replace('/', { renderAnimate: true })`
  - state 로 `renderAnimate: true` 를 보내주면 우측에서 새로 나오는 모션을 줍니다.
