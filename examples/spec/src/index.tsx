/// <reference types="react/next" />
/// <reference types="react-dom/next" />

import '@karrotframe/navigator/lib/index.css'
import '@karrotframe/tabs/index.css'
import './index.css'
import './shims'

import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'
import * as serviceWorker from './serviceWorker'

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
