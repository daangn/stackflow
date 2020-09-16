import './App.css'

import React, { useState } from "react";
import {
  Link,
  Navigator,
  Screen,
  ScreenHelmet,
  useNavigator,
  useParams,
} from '@daangn/karrotframe'
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
        <Screen path='/:form'>
          <Form />
        </Screen>
        <Screen path='/:hello'>
          <div>
            <Link to='/form'>
              왜 무한루프 도는거지???
            </Link>
          </div>
        </Screen>
      </Navigator>
  );
}

const Home: React.FC = () => {
  const { push } = useNavigator()
  const [title, setTitle] = useState('홈')

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  return (
    <div>
      <ScreenHelmet
        title={title}
      />
      home
      <input type='text' onChange={onChange} value={title} />
      <HomeButtons />
    </div>
  )
}

const HomeButtons: React.FC = () => {
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
  const params = useParams()

  const onPopClick = () => {
    pop(1, {
      hello: 'world',
    })
  }

  return (
    <div>
      <ScreenHelmet
        title='폼'
      />
      form...
      <button onClick={onPopClick}>pop</button>
    </div>
  )
}

export default App;
