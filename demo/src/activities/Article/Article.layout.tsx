import { layout } from "@stackflow/react/future";
import Layout from "../../components/Layout";

const ArticleLayout = layout<"Article">(({ params: { title }, children }) => {
  return <Layout appBar={{ title }}>{children}</Layout>;
});

export default ArticleLayout;
