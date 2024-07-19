import type { ActivityComponentType } from "@stackflow/react";
import { useLoaderData } from "@stackflow/react/future";

import IconBell from "../assets/IconBell";
import IconExpandMore from "../assets/IconExpandMore";
import IconSearch from "../assets/IconSearch";
import IconSettings from "../assets/IconSettings";
import BottomTab from "../components/BottomTab";
import FeedCard from "../components/FeedCard";
import Layout from "../components/Layout";
import * as css from "./Main.css";

const Main: ActivityComponentType = () => {
  const { cards } = useLoaderData<{
    cards: Array<{
      articleId: string;
      price: number;
      title: string;
      region: string;
      daysAgo: number;
    }>;
  }>();

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
      <IconSettings />
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
