import './App.css'

import React from "react";
import { Navigator, Screen, Link } from '@daangn/karrotframe/lib/navigator'
import { useScreenContext } from '@daangn/karrotframe/lib/navigator/contexts/ScreenContext'

function App() {
  return (
    <div>
      <h1>karrotframe</h1>
      <div className='container'>
        <Navigator
        environment='Cupertino'
        onClose={() => {
          window.alert('close!!')
        }}>
          <Screen path='/'>
            <Link to='/me'>to_me</Link>
            <div>hello, world</div>
          </Screen>
          <Screen path='/me'>
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
      <input type='text' onChange={onChange}></input>
    </div>
  )
}

export default App;
