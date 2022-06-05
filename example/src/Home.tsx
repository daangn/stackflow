import {
  ActivityComponentType,
  useActivity,
  useActivityParams,
} from "@stackflow/react";
import React from "react";

import { useFlow } from "./stackflow";

const Home: ActivityComponentType = () => {
  const { push, pop } = useFlow();
  const activity = useActivity();

  return (
    <div>
      name: Home, activityId: {activity.id}, state: {activity.transitionState}{" "}
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
          push("Article", {
            articleId: "123",
            referrer: "home",
          });
        }}
      >
        Article
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

export default Home;
