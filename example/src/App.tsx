import './App.css'

import React from "react";
import { Navigator, Screen, Link } from '@daangn/karrotframe/lib/navigator'

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
            <Link to='/?hello=world'>to_root</Link>
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
            <div>why</div>
          </Screen>
        </Navigator>
      </div>
    </div>
  );
}

export default App;
