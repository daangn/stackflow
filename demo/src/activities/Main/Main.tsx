import type { ActivityComponentType } from "@stackflow/react/future";
import { useLoaderData } from "@stackflow/react/future";

import IconBell from "../../assets/IconBell";
import IconExpandMore from "../../assets/IconExpandMore";
import IconSearch from "../../assets/IconSearch";
import BottomTab from "../../components/BottomTab";
import FeedCard from "../../components/FeedCard";
import Layout from "../../components/Layout";
import * as css from "./Main.css";
import type { mainLoader } from "./Main.loader";

declare module "@stackflow/config" {
  interface Register {
    Main: {};
  }
}

const Main: ActivityComponentType<"Main"> = () => {
  const { cards } = useLoaderData<typeof mainLoader>();

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
