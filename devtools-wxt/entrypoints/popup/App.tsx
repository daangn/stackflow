import Logo from "/logo.svg";
import "./App.css";
import pRetry from "p-retry";
import { Suspense, use } from "react";
import { browser } from "wxt/browser";

const checkPromise = pRetry(async () => {
  // check the devtools plugin is initialized
  const [val, err] = await browser.devtools.inspectedWindow.eval(
    "window.__STACKFLOW_DEVTOOLS__",
  );

  if (val !== undefined) {
    return val;
  }

  throw err;
})
  .then(() => {
    browser.devtools.panels.create(
      "Stackflow",
      "icon/128.png",
      "devtools-panel.html",
    );
  })
  .catch(() => undefined); // ignore error

function DevtoolsStatus() {
  const stack = use(checkPromise);

  return stack ? (
    <>
      <div className="card">
        <p>"This page is built with Stackflow. ✅</p>
      </div>
      <p className="guide">
        Open the developer tools, and "Stackflow" tab will appear to the right.
      </p>
    </>
  ) : (
    <CheckingOrFailed />
  );
}

function CheckingOrFailed() {
  return (
    <>
      <div className="card">
        <p>This page doesn’t appear to be using Stackflow.</p>
      </div>
      <p className="guide">
        If this seems wrong, please check whether the devtools plugin is
        enabled.
      </p>
    </>
  );
}

function App() {
  return (
    <>
      <div>
        <a href="https://stackflow.so" target="_blank" rel="noreferrer">
          <img src={Logo} className="logo" alt="Stackflow logo" />
        </a>
      </div>
      <Suspense fallback={<CheckingOrFailed />}>
        <DevtoolsStatus />
      </Suspense>
    </>
  );
}

export default App;
