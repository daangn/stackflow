import { loading } from "@stackflow/react/future";
import LoadingSpinner from "../../components/LoadingSpinner";

import * as css from "./Article.loading.css";

const ArticleLoading = loading<"Article">(() => {
  return (
    <div className={css.container}>
      <LoadingSpinner />
    </div>
  );
});

export default ArticleLoading;
