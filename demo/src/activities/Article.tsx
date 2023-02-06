import type { ActivityComponentType } from "@stackflow/react";
import { useActivityParams } from "@stackflow/react";
import { LazyLoadImage } from "react-lazy-load-image-component";

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
  const { articleId, title } = useActivityParams<{
    articleId: string;
    title: string;
  }>();
  const imageUrl = `https://picsum.photos/800/800/?id=${articleId}`;

  return (
    <Layout appBar={{}}>
      <div className={css.container}>
        <div className={css.image}>
          <div className={css.imageInner}>
            <LazyLoadImage
              src={imageUrl}
              effect="opacity"
              width="100%"
              height="100%"
            />
          </div>
        </div>
        <ArticleProfile />
        <div className={css.content}>
          <div className={css.title}>{title}</div>
          <div className={css.subtitle}>Baby & Kids ∙ 3 days ago</div>
          <div className={css.body}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean
            elementum sit sem ullamcorper urna, lacinia eu tortor, mattis.
            Venenatis ut cursus amet in.
          </div>
          <div className={css.subtitle}>1 chats ∙ 2 favorites ∙ 212 views</div>
        </div>
        <div className={css.section}>
          <div className={css.sectionTitle}>Other Items by Emila </div>
          <div className={css.recommenderGrid}>
            {recommenderCard.map((card) => (
              <ArticleCard key={card.articleId} {...card} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

Article.displayName = "Article";

export default Article;
