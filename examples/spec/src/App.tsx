import './App.css'

import React from 'react'

import { Navigator, Screen } from '@karrotframe/navigator'

import Page404 from './components/_pages/Page404'
import PageHome from './components/_pages/PageHome'
import PagePop from './components/_pages/PagePop'
import PagePullToRefresh from './components/_pages/PagePullToRefresh'
import PagePush from './components/_pages/PagePush'
import PageReplace from './components/_pages/PageReplace'
import PageReplaceInUseEffect from './components/_pages/PageReplaceInUseEffect'
import PageScreenHelmet from './components/_pages/PageScreenHelmet'
import PageTabs from './components/_pages/PageTabs'
import PageUseParams from './components/_pages/PageUseParams'
import PageUseQueryParams from './components/_pages/PageUseQueryParams'

const App: React.FC = () => {
  return (
    <Navigator
      theme="Cupertino"
      onDepthChange={(depth) => {
        console.log(depth)
      }}
      onClose={() => {
        window.alert('Close button clicked!')
      }}
    >
      <Screen path="/" component={PageHome} />
      <Screen path="/screenHelmet" component={PageScreenHelmet} />
      <Screen path="/push" component={PagePush} />
      <Screen path="/pop" component={PagePop} />
      <Screen path="/replace" component={PageReplace} />
      <Screen path="/replaceInUseEffect" component={PageReplaceInUseEffect} />
      <Screen path="/useParams/:param" component={PageUseParams} />
      <Screen path="/useQueryParams" component={PageUseQueryParams} />
      <Screen path="/tabs" component={PageTabs} />
      <Screen path="/pulltorefresh" component={PagePullToRefresh} />
      <Screen path="*" component={Page404} />
    </Navigator>
  )
}

export default App
