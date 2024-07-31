import type { ActivityComponentType } from "@stackflow/solid";
import { useActivityParams } from "@stackflow/solid";
import { For, createMemo } from "solid-js";

import ArticleCard from "../components/ArticleCard";
import ArticleProfile from "../components/ArticleProfile";
import Layout from "../components/Layout";
import * as css from "./Article.css";

const recommenderCard = [
  {
    articleId: "25140667",
    price: 41,
    title: "Ran",
  },
  {
    articleId: "60547101",
    price: 24,
    title: "Rest",
  },
  {
    articleId: "34751776",
    price: 42,
    title: "Those",
  },
  {
    articleId: "04114554",
    price: 12,
    title: "Beauty",
  },
  {
    articleId: "81339443",
    price: 3,
    title: "Mighty",
  },
  {
    articleId: "44738871",
    price: 1,
    title: "Afternoon",
  },
  {
    articleId: "57388513",
    price: 31,
    title: "Brown",
  },
  {
    articleId: "60883443",
    price: 49,
    title: "Musical",
  },
  {
    articleId: "00932094",
    price: 26,
    title: "Occasionally",
  },
  {
    articleId: "10749683",
    price: 35,
    title: "Having",
  },
];

export interface ArticleParams {
  articleId: string;
  title: string;
}

const Article: ActivityComponentType<ArticleParams> = () => {
  const activityParams = useActivityParams<{
    articleId: string;
    title: string;
  }>();
  const imageUrl = createMemo(
    () => `https://picsum.photos/800/800/?id=${activityParams()?.articleId}`,
  );

  return (
    <Layout appBar={{}}>
      <div class={css.container}>
        <div class={css.image}>
          <div class={css.imageInner}>
            <img
              src={imageUrl()}
              alt={activityParams()?.title}
              width="100%"
              height="100%"
            />
          </div>
        </div>
        <ArticleProfile />
        <div class={css.content}>
          <div class={css.title}>{activityParams()?.title}</div>
          <div class={css.subtitle}>Baby & Kids ∙ 3 days ago</div>
          <div class={css.body}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean
            elementum sit sem ullamcorper urna, lacinia eu tortor, mattis.
            Venenatis ut cursus amet in.
          </div>
          <div class={css.subtitle}>1 chats ∙ 2 favorites ∙ 212 views</div>
        </div>
        <div class={css.section}>
          <div class={css.sectionTitle}>Other Items by Emila </div>
          <div class={css.recommenderGrid}>
            <For each={recommenderCard}>
              {(card) => <ArticleCard {...card} />}
            </For>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Article;
