import type { ActivityComponentType } from "@stackflow/react/future";
import { useLoader } from "@stackflow/react/future";
import IconBell from "../../assets/IconBell";
import IconExpandMore from "../../assets/IconExpandMore";
import IconSearch from "../../assets/IconSearch";
import BottomTab from "../../components/BottomTab";
import FeedCard from "../../components/FeedCard";
import Layout from "../../components/Layout";
import * as css from "./Main.css";
import { mainLoader } from "./Main.loader";

declare module "@stackflow/config" {
  interface Register {
    Main: {};
  }
}

const Main: ActivityComponentType<"Main"> = () => {
  const {
    data: { cards },
    invalidate,
  } = useLoader({ loaderFn: mainLoader });

  const appBarLeft = () => (
    <div className={css.appBarLeft}>
      Woolston
      <div className={css.appBarLeftIcon}>
        <IconExpandMore />
      </div>
    </div>
  );

  const appBarRight = () => (
    <div className={css.appBarRight}>
      <IconSearch />
      <IconBell />
    </div>
  );

  return (
    <Layout
      appBar={{
        renderLeft: appBarLeft,
        renderRight: appBarRight,
      }}
    >
      <div className={css.wrapper}>
        <div className={css.scrollable}>
          <button type="button" onClick={invalidate}>
            Invalidate
          </button>
          {cards.map((card) => (
            <FeedCard key={card.articleId} {...card} />
          ))}
        </div>
        <div className={css.bottom}>
          <BottomTab />
        </div>
      </div>
    </Layout>
  );
};

Main.displayName = "Main";

export default Main;
