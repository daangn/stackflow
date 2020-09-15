import './App.css'

import React from "react";
import { Navigator, Screen, Link, Helmet } from '@daangn/karrotframe/lib/navigator'
import { useScreenContext } from '@daangn/karrotframe/lib/navigator/contexts/ScreenContext'

function App() {
  return (
    <div>
      <h1>karrotframe</h1>
      <div className='container'>
        <Navigator
        environment='Cupertino'
        animationDuration={350}
        onClose={() => {
          window.alert('close!!')
        }}>
          <Screen path='/'>
            <Helmet title='홈' />
            <Link to='/me'>to_me</Link>
            <Link to='/why'>to_why</Link>
            <div>hello, world</div>
          </Screen>
          <Screen path='/me'>
            <Helmet title='나' />
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
      </div>
    </div>
  );
}

const Why: React.FC = () => {
  const screen = useScreenContext()

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    screen.setNavbar({
      title: e.target.value,
    })
  }
  return (
    <div>
      <input type='text' onChange={onChange}></input>
      <Link to='/me'>to_me</Link>
    </div>
  )
}

export default App;
