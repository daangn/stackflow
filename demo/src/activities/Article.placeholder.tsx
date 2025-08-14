import { useActivityParams } from "@stackflow/react/future";
import Layout from "../components/Layout";
import LoadingSpinner from "../components/LoadingSpinner";

import * as css from "./Article.placeholder.css";

const ArticlePlaceholder = () => {
  const { title } = useActivityParams<"Article">();

  return (
    <Layout appBar={{ title }}>
      <div className={css.container}>
        <LoadingSpinner />
      </div>
    </Layout>
  );
};

export default ArticlePlaceholder;