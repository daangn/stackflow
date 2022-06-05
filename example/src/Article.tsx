import { ActivityComponentType } from "@stackflow/react";
import React from "react";

import { useFlow } from "./stackflow";

const Article: ActivityComponentType<{
  articleId: string;
  referrer?: string;
}> = ({ articleId }) => {
  const { push, pop } = useFlow();
  return (
    <div>
      name: Article, articleId: {articleId}
      <button
        type="button"
        onClick={() => {
          push("Home", {});
        }}
      >
        Home
      </button>
      <button
        type="button"
        onClick={() => {
          pop();
        }}
      >
        Go Back
      </button>
    </div>
  );
};

export default Article;
