import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useEffect, useRef, useState } from "react";

import * as css from "./AppBar.css";
import * as appScreenCss from "./AppScreen.css";
import { IconBack } from "./assets";

interface AppBarProps {
  theme: "android" | "cupertino";
  title?: string;
}
const AppBar: React.FC<AppBarProps> = ({ theme, title }) => {
  const appBarRef = useRef<HTMLDivElement>(null);
  const appBarCenterRef = useRef<HTMLDivElement>(null);

  const [centerMainWidth, setCenterMainWidth] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    if (theme !== "cupertino") {
      return () => {};
    }

    const $appBar = appBarRef.current;
    const $appBarCenter = appBarCenterRef.current;

    if (!$appBar || !$appBarCenter) {
      return () => {};
    }

    const onResize = () => {
      const screenWidth = $appBar.clientWidth;

      const leftWidth = $appBarCenter.offsetLeft;
      const centerWidth = $appBarCenter.clientWidth;
      const rightWidth = screenWidth - leftWidth - centerWidth;

      const sideMargin = Math.max(leftWidth, rightWidth);

      setCenterMainWidth(screenWidth - 2 * sideMargin);
    };

    onResize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      ref={appBarRef}
      className={css.appBar}
      style={assignInlineVars({
        [appScreenCss.vars.appBar.center.mainWidth]: `${centerMainWidth}px`,
      })}
    >
      <div className={css.appBarLeft}>
        <div className={css.appBarBackButton}>
          <IconBack />
        </div>
      </div>
      <div ref={appBarCenterRef} className={css.appBarCenter}>
        <div className={css.appBarCenterMain({ theme })}>
          <div className={css.appBarCenterMainText}>{title}</div>
        </div>
      </div>
      <div className={css.appBarRight}>right</div>
    </div>
  );
};

export default AppBar;
