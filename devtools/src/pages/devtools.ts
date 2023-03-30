let panelCreated = false;

const interval = setInterval(() => {
  if (panelCreated) {
    return;
  }

  // check the devtools plugin is initialized
  chrome.devtools.inspectedWindow.eval(
    "window.__STACKFLOW_DEVTOOLS__",
    (result) => {
      if (result) {
        panelCreated = true;
        clearInterval(interval);

        chrome.devtools.panels.create(
          "Stackflow",
          "/vite.svg",
          "../../index.html",
          function (panel) {
            // code invoked on panel creation
          },
        );
      }
    },
  );
}, 1000);

export {};
