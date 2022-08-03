import type { ActivityComponentType } from "@stackflow/react";
import React from "react";

import IconBell from "../assets/IconBell";
import IconExpandMore from "../assets/IconExpandMore";
import IconSearch from "../assets/IconSearch";
import IconSettings from "../assets/IconSettings";
import BottomTab from "../components/BottomTab";
import FeedCard from "../components/FeedCard";
import Layout from "../components/Layout";
import * as css from "./Main.css";

const cards = [
  {
    articleId: "02542470",
    price: 41,
    title: "Master",
    region: "Nagevan",
    daysAgo: 4,
  },
  {
    articleId: "11257089",
    price: 24,
    title: "Wild",
    region: "Inguima",
    daysAgo: 4,
  },
  {
    articleId: "08407137",
    price: 42,
    title: "Universe",
    region: "Litenego",
    daysAgo: 4,
  },
  {
    articleId: "32979422",
    price: 12,
    title: "Private",
    region: "Umumtaw",
    daysAgo: 6,
  },
  {
    articleId: "37998208",
    price: 3,
    title: "Harbor",
    region: "Gubdidgi",
    daysAgo: 3,
  },
  {
    articleId: "01695878",
    price: 1,
    title: "Valuable",
    region: "Jumjelewu",
    daysAgo: 1,
  },
  {
    articleId: "09792471",
    price: 31,
    title: "Also",
    region: "Salhega",
    daysAgo: 1,
  },
  {
    articleId: "23939055",
    price: 49,
    title: "Ever",
    region: "Jaifuup",
    daysAgo: 9,
  },
  {
    articleId: "94689745",
    price: 26,
    title: "Production",
    region: "Idcipwel",
    daysAgo: 3,
  },
  {
    articleId: "49322156",
    price: 35,
    title: "Chest",
    region: "Ajapaktar",
    daysAgo: 7,
  },
];

const Main: ActivityComponentType = () => {
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
        appendLeft: appBarLeft,
        appendRight: appBarRight,
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

export default Main;
