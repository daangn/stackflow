import {
  type ActivityComponentType,
  useActivityParams,
  useLoaderData,
} from "@stackflow/react/future";
import { LazyLoadImage } from "react-lazy-load-image-component";
import ArticleCard from "../../components/ArticleCard";
import ArticleProfile from "../../components/ArticleProfile";
import Layout from "../../components/Layout";
import * as css from "./Article.css";
import type { articleLoader } from "./Article.loader";

declare module "@stackflow/config" {
  interface Register {
    Article: {
      articleId: number;
      title?: string;
    };
  }
}

const Article: ActivityComponentType<"Article"> = ({ params }) => {
  const { title } = useActivityParams<"Article">();
  const { imageUrl, recommenderCards } = useLoaderData<typeof articleLoader>();

  return (
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
          {recommenderCards.map((card) => (
            <ArticleCard key={card.articleId} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
};

Article.displayName = "Article";

export default Article;
