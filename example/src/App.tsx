import './App.css'

import React, { useState } from "react";
import { Navigator, Screen, Link, Helmet, useNavigator } from '@daangn/karrotframe/lib/navigator'
import Bridge from '@daangn/webview-bridge'

const bridge = new Bridge()

function App() {
  return (
    <Navigator
      environment={bridge.environment}
      animationDuration={350}
      onClose={() => {
        bridge.router.close()
      }}>
        <Screen path='/'>
          <Home />
        </Screen>
        <Screen path='/something'>
          <div>
            <Link to='/form'>
              왜 무한루프 도는거지???
            </Link>
          </div>
        </Screen>
        <Screen path='/form'>
          <Form />
        </Screen>
      </Navigator>
  );
}

const Home: React.FC = () => {
  const { push } = useNavigator()

  return (
    <div>
      <Helmet
        title='홈'
      />
      home
      <HomeButtons />
    </div>
  )
}

const HomeButtons: React.FC = () => {
  // TODO: useNavigator랑 Helmet이 한 컴포넌트에 있으면 무한루프 발생
  const { push } = useNavigator()

  const onPushClick = async () => {
    const data = await push('/something')
    console.log(data)
  }

  return (
    <button onClick={onPushClick}>push</button>
  )
}

const Form: React.FC = () => {
  const { pop } = useNavigator()

  const onPopClick = () => {
    pop(2, {
      hello: 'world',
    })
  }

  return (
    <div>
      form...
      <button onClick={onPopClick}>pop</button>
    </div>
  )
}

export default App;
