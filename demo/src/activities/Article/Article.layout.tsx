import { useActivityParams } from "@stackflow/react/future";
import Layout from "../../components/Layout";

export function ArticleLayout({ children }: { children: React.ReactNode }) {
  const { title } = useActivityParams<"Article">();

  return <Layout appBar={{ title }}>{children}</Layout>;
}
