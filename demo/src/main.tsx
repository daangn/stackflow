import "normalize.css";
import "@seed-design/stylesheet/global.css";
import "@stackflow/plugin-basic-ui/index.css";
import "react-lazy-load-image-component/src/effects/opacity.css";
import "./styles/index.css";

import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);
