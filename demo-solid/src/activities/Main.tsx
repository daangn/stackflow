import type { ActivityComponentType } from "@stackflow/solid/future";
import { useLoaderData } from "@stackflow/solid/future";
import { For } from "solid-js";

import IconBell from "../assets/IconBell";
import IconExpandMore from "../assets/IconExpandMore";
import IconSearch from "../assets/IconSearch";
import IconSettings from "../assets/IconSettings";
import BottomTab from "../components/BottomTab";
import FeedCard from "../components/FeedCard";
import Layout from "../components/Layout";
import * as css from "./Main.css";
import type { mainLoader } from "./Main.loader";

declare module "@stackflow/config" {
  interface Register {
    Main: {};
  }
}

const Main: ActivityComponentType<"Main"> = () => {
  const data = useLoaderData<typeof mainLoader>();
  const appBarLeft = () => (
    <div class={css.appBarLeft}>
      Woolston
      <div class={css.appBarLeftIcon}>
        <IconExpandMore />
      </div>
    </div>
  );

  const appBarRight = () => (
    <div class={css.appBarRight}>
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
      <div class={css.wrapper}>
        <div class={css.scrollable}>
          <For each={data().cards}>{(card) => <FeedCard {...card} />}</For>
        </div>
        <div class={css.bottom}>
          <BottomTab />
        </div>
      </div>
    </Layout>
  );
};

export default Main;
