import React from 'react'

import {
  Navigator,
  Screen,
  ScreenHelmet,
  useNavigator,
} from '@karrotframe/navigator'

const App: React.FC = () => {
  return (
    <Navigator onClose={() => {}}>
      <Screen path="/" component={Home} />
      <Screen path="/page1" component={Page1} />
      <Screen path="/page2" component={Page2} />
    </Navigator>
  )
}

const Home: React.FC = () => {
  const { push } = useNavigator()

  return (
    <div style={{ padding: '1rem' }}>
      <ScreenHelmet title="Welcome" />
      Welcome to Karrotframe :)
      <br />
      <br />
      <button
        onClick={() => {
          push('/page1')
        }}
      >
        Go to Page1
      </button>
      <br />
      <button
        onClick={() => {
          push('/page2')
        }}
      >
        Go to Page2
      </button>
    </div>
  )
}

const Page1: React.FC = () => {
  return (
    <>
      <ScreenHelmet title="Page 1" />
      Page 1
    </>
  )
}

const Page2: React.FC = () => {
  return (
    <>
      <ScreenHelmet title="Page 2" />
      Page 2
    </>
  )
}

export default App
