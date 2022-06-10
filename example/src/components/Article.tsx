import { ActivityComponentType, useActivity } from "@stackflow/react";
import React from "react";

import { useFlow } from "../stackflow";

const Article: ActivityComponentType<{
  articleId: string;
  referrer?: string;
}> = ({ articleId }) => {
  const activity = useActivity();
  const { push, pop, replace } = useFlow();

  return (
    <div>
      name: Article, articleId: {articleId}, state: {activity.transitionState}
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
      <button
        type="button"
        onClick={() => {
          replace("Article", {
            articleId: "4567",
          });
        }}
      >
        Replace to 4567
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
