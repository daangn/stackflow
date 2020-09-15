import React from "react";
import { SwipeRouter, PageRoute } from "@daangn/react-swiper-webview";
import { createHashHistory } from "history";
import "./App.css";
import { useBridgePop } from "@daangn/react-webview-bridge";
import RootPage from "./pages";
import DisabledPage from "./pages/disabled";
import Test2Page from "./pages/test2";
import IdPage from "./pages/id";

const history = createHashHistory();

function App() {
  const { pop } = useBridgePop();
  return (
    <SwipeRouter history={history} onLastPagePop={pop}>
      <PageRoute path="/" exact component={RootPage} />
      <PageRoute exact path="/disabled" render={() => <DisabledPage />} />
      <PageRoute exact path="/test2">
        <Test2Page />
      </PageRoute>
      <PageRoute exact path="/id/:id" component={IdPage} />
    </SwipeRouter>
  );
}

export default App;
