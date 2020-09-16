import './App.css'

import React from "react";
import {
  Navigator,
  Screen,
} from '@daangn/karrotframe'
import Bridge from '@daangn/webview-bridge'
import Home from './components/Home';
import Page2 from './components/Page2';
import Page3 from './components/Page3';

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
        <Screen path='/page2'>
          <Page2 />
        </Screen>
        <Screen path='/page3'>
          <Page3 />
        </Screen>
      </Navigator>
  );
}

export default App;
