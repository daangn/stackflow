import React from "react";

import IconChatting from "../assets/IconChatting";
import IconHome from "../assets/IconHome";
import IconMenu from "../assets/IconMenu";
import IconProfile from "../assets/IconProfile";
import IconSell from "../assets/IconSell";
import * as css from "./BottomTab.css";

const BottomTab: React.FC = () => (
  <div className={css.container}>
    <button type="button" className={css.button}>
      <div className={css.buttonIcon}>
        <IconHome />
      </div>
      <div className={css.buttonLabel}>Home</div>
    </button>
    <button type="button" className={css.button}>
      <div className={css.buttonIcon}>
        <IconMenu />
      </div>
      <div className={css.buttonLabel}>Categories</div>
    </button>
    <button type="button" className={css.button}>
      <div className={css.buttonIcon}>
        <IconSell />
      </div>
      <div className={css.buttonLabel}>Sell</div>
    </button>
    <button type="button" className={css.button}>
      <div className={css.buttonIcon}>
        <IconChatting />
      </div>
      <div className={css.buttonLabel}>Chats</div>
    </button>
    <button type="button" className={css.button}>
      <div className={css.buttonIcon}>
        <IconProfile />
      </div>
      <div className={css.buttonLabel}>My</div>
    </button>
  </div>
);

export default BottomTab;
