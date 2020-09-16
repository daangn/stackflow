import './App.css'

import React, { useState } from "react";
import { Navigator, Screen, Link, Helmet } from '@daangn/karrotframe/lib/navigator'
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
          <Helmet title='홈' />
          <Link to='/me'>to_me</Link>
          <Link to='/why'>to_why</Link>
          <div>hello, world</div>
        </Screen>
        <Screen path='/me'>
          {/* <Helmet title='나' /> */}
          <Link to='/why'>to_why</Link>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
          <div>me</div>
        </Screen>
        <Screen path='/why'>
          <Why></Why>
        </Screen>
      </Navigator>
  );
}

const Why: React.FC = () => {
  const [title, setTitle] = useState('')

  const onChange = (e: any) => {
    setTitle(e.target.value)
  }

  return (
    <div>
      <Helmet
        title={title}
      />
      <input type='text' onChange={onChange}></input>
      <Link to='/me'>to_me</Link>
    </div>
  )
}

export default App;
