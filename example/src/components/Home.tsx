import { AppScreen } from "@stackflow/basic-ui";
import { ActivityComponentType, useActivity } from "@stackflow/react";
import React from "react";

import { useFlow } from "../stackflow";

const MemoizationTest = React.memo(() => {
  useFlow();
  return <div>Bottom!</div>;
});

const Home: ActivityComponentType = () => {
  const { push, pop } = useFlow();
  const activity = useActivity();

  return (
    <AppScreen theme="cupertino">
      <div>
        name: Home, state: {activity.transitionState} <MemoizationTest />
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
    </AppScreen>
  );
};

export default Home;
