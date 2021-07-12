import './App.css'

import React from 'react'

import { Navigator, Screen } from 'karrotframe'

import PageHome from './components/_pages/PageHome'
import PageScreenHelmet from './components/_pages/PageScreenHelmet'
import PagePush from './components/_pages/PagePush'
import PagePop from './components/_pages/PagePop'
import PageReplace from './components/_pages/PageReplace'
import PageUseParams from './components/_pages/PageUseParams'
import PageUseQueryParams from './components/_pages/PageUseQueryParams'

function App() {
  let h = (
    <Navigator
      theme="Cupertino"
      onClose={() => {
        window.alert('Close button clicked!')
      }}
    >
      <Screen path="/" component={PageHome} />
      <Screen path="/screenHelmet" component={PageScreenHelmet} />
      <Screen path="/push" component={PagePush} />
      <Screen path="/pop" component={PagePop} />
      <Screen path="/replace" component={PageReplace} />
      <Screen path="/useParams" component={PageUseParams} />
      <Screen path="/useQueryParams" component={PageUseQueryParams} />
      {/* <Screen path="/page3" component={Page3} />
      <Screen path="/page/:id/params_page" component={Page4} />
      <Screen path="/page5" component={Page5} /> */}
    </Navigator>
  )
  return h
}

export default App
