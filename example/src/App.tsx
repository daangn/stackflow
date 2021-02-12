import './App.css'

import React from 'react'

import { Navigator, Screen } from 'karrotframe'

import Home from './components/Home'
import Page2 from './components/Page2'
import Page3 from './components/Page3'
import Page4 from './components/Page4'
import Page5 from './components/Page5'

function App() {
  let h = (
    <Navigator
      theme="Android"
      onClose={() => {
        window.alert('닫기 버튼이 눌렸습니다')
      }}
    >
      <Screen path="/" component={Home} />
      <Screen path="/page2" component={Page2} />
      <Screen path="/page3" component={Page3} />
      <Screen path="/page/:id/params_page" component={Page4} />
      <Screen path="/page5" component={Page5} />
    </Navigator>
  )
  return h
}

export default App
