import type { Component } from "solid-js";
import IconChatting from "../assets/IconChatting";
import IconHome from "../assets/IconHome";
import IconMenu from "../assets/IconMenu";
import IconProfile from "../assets/IconProfile";
import IconSell from "../assets/IconSell";
import * as css from "./BottomTab.css";

const BottomTab: Component = () => (
  <div class={css.container}>
    <button type="button" class={css.button}>
      <div class={css.buttonIcon}>
        <IconHome />
      </div>
      <div class={css.buttonLabel}>Home</div>
    </button>
    <button type="button" class={css.button}>
      <div class={css.buttonIcon}>
        <IconMenu />
      </div>
      <div class={css.buttonLabel}>Categories</div>
    </button>
    <button type="button" class={css.button}>
      <div class={css.buttonIcon}>
        <IconSell />
      </div>
      <div class={css.buttonLabel}>Sell</div>
    </button>
    <button type="button" class={css.button}>
      <div class={css.buttonIcon}>
        <IconChatting />
      </div>
      <div class={css.buttonLabel}>Chats</div>
    </button>
    <button type="button" class={css.button}>
      <div class={css.buttonIcon}>
        <IconProfile />
      </div>
      <div class={css.buttonLabel}>My</div>
    </button>
  </div>
);

export default BottomTab;
