import pRetry from "p-retry";
import { browser } from "wxt/browser";

pRetry(async () => {
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
  .catch(() => {
    browser.action.setIcon({
      path: "/icon/128-mono.png",
    });
  }); // ignore error
