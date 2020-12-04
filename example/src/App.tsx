import './App.css'

import React from 'react'
import { HashRouter, MemoryRouter } from 'react-router-dom'

import { Navigator, Screen } from '@daangn/karrotframe'
import Bridge from '@daangn/webview-bridge'

import Home from './components/Home'
import Page2 from './components/Page2'
import Page3 from './components/Page3'
import Page4 from './components/Page4'
import Page5 from './components/Page5'

const bridge = new Bridge()

function App() {
  const environment = (() => {
    switch (bridge.environment) {
      case 'Web':
        return 'Android' as const
      default:
        return bridge.environment
    }
  })()


  let h = (
    <Navigator
      theme={environment}
      useCustomRouter
      onClose={() => {
        bridge.router.close()
      }}
      >
        <Screen path='/' component={Home} />
        <Screen path='/page2' component={Page2} />
        <Screen path='/page3' component={Page3} />
        <Screen path='/page/:id/params_page' component={Page4} />
        <Screen path='/page5' component={Page5} />
      </Navigator>
  )

  if (bridge.environment === 'Cupertino') {
    h = <MemoryRouter>{h}</MemoryRouter>
  } else {
    h = <HashRouter>{h}</HashRouter>
  }

  return h
}

export default App;
