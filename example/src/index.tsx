import "normalize.css";
import "@stackflow/basic-ui/index.css";

import React from "react";
import ReactDOM from "react-dom/client";
import ReactDOMServer from "react-dom/server";

import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// eslint-disable-next-line no-console
console.log(
  "Server-side Rendering Test",
  ReactDOMServer.renderToString(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  ),
);
