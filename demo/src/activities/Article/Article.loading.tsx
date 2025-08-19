import LoadingSpinner from "../../components/LoadingSpinner";

import * as css from "./Article.loading.css";

const ArticleLoading = () => {
  return (
    <div className={css.container}>
      <LoadingSpinner />
    </div>
  );
};
ArticleLoading.displayName = "ArticleLoading";

export default ArticleLoading;
