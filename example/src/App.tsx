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

  const onPushClick = async () => {
    const data = await push('/something')
    console.log(data)
  }

  return (
    <div>
      <Helmet
        title='홈'
      />
      home
      <button onClick={onPushClick}>push</button>
    </div>
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
