import "normalize.css";
import "@seed-design/stylesheet/global.css";
import "@stackflow/plugin-basic-ui/index.css";
import "./styles/index.css";

import { render } from "solid-js/web";

import App from "./App";

render(() => <App />, document.getElementById("root")!);
