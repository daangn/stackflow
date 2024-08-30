import {
  type ActivityComponentType,
  useActivityParams,
  useLoaderData,
} from "@stackflow/solid/future";
import { For } from "solid-js";

import ArticleCard from "../components/ArticleCard";
import ArticleProfile from "../components/ArticleProfile";
import Layout from "../components/Layout";
import * as css from "./Article.css";
import type { articleLoader } from "./Article.loader";

declare module "@stackflow/config" {
  interface Register {
    Article: {
      articleId: string;
      title?: string;
    };
  }
}

const Article: ActivityComponentType<"Article"> = () => {
  const activityParams = useActivityParams<"Article">();
  const data = useLoaderData<typeof articleLoader>();

  return (
    <Layout appBar={{}}>
      <div class={css.container}>
        <div class={css.image}>
          <div class={css.imageInner}>
            <img
              src={data().imageUrl}
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
            <For each={data().recommenderCards}>
              {(card) => <ArticleCard {...card} />}
            </For>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Article;
