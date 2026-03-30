import { structuredActivityComponent } from "@stackflow/react/future";
import ArticleLayout from "./Article.layout";
import ArticleLoading from "./Article.loading";

declare module "@stackflow/config" {
  interface Register {
    Article: {
      articleId: number;
      title?: string;
    };
  }
}

export const Article = structuredActivityComponent<"Article">({
  content: () => import("./Article.content"),
  layout: ArticleLayout,
  loading: ArticleLoading,
});
