import { type ActivityComponentType, lazy } from "@stackflow/react/future";
import ArticleLayout from "./Article.layout";
import ArticleLoading from "./Article.loading";

export const Article: ActivityComponentType<"Article"> = {
  content: lazy(() => import("./Article.content")),
  layout: ArticleLayout,
  loading: ArticleLoading,
};
