import { browser } from "wxt/browser";
import { defineBackground } from "wxt/sandbox";

export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });
});
