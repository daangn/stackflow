import "normalize.css";
import "@stackflow/seed-design/index.css";

import React from "react";
import ReactDOM from "react-dom/client";
import ReactDOMServer from "react-dom/server";

import { Stack } from "./stackflow";

const root = ReactDOM.createRoot(document.getElementById("root")!);

const url = new URL(window.location.href);

root.render(
  <Stack
    fallbackActivityName="Home"
    context={{ req: { path: url.pathname + url.search } }}
  />,
);

// eslint-disable-next-line no-console
console.log(
  "SSR Test",
  ReactDOMServer.renderToString(
    <Stack
      fallbackActivityName="Home"
      context={{ req: { path: url.pathname + url.search } }}
    />,
  ),
);
