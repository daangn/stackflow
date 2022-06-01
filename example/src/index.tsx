import React from "react";
import ReactDOM from "react-dom/client";
import ReactDOMServer from "react-dom/server";

import { Stack } from "./stackflow";

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(<Stack initialActivity="Hello" />);

// eslint-disable-next-line no-console
console.log(
  "SSR Test",
  ReactDOMServer.renderToString(<Stack initialActivity="Hello" />),
);
