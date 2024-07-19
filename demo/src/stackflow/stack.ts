import { stack } from "@stackflow/react/future";
import Article from "../activities/Article";
import Main from "../activities/Main";
import { config } from "./stackflow.config";

export const { Stack } = stack({
  config,
  components: {
    Main,
    Article,
  },
  plugins: [],
});
