import { useActivityParams } from "@stackflow/react/future";
import type { ReactNode } from "react";
import Layout from "../../components/Layout";

function ArticleLayout({ children }: { children: ReactNode }) {
  const { title } = useActivityParams<"Article">();

  return <Layout appBar={{ title }}>{children}</Layout>;
}
ArticleLayout.displayName = "ArticleLayout";

export default ArticleLayout;
